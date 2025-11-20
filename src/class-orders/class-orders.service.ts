import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import {
  ClassAccount,
  ClassAccountOperator,
  ClassGroupOrder,
  ClassGroupOrderItem,
  Student,
  User,
} from '../entities';
import { CreateClassGroupOrderDto } from './dto/create-class-group-order.dto';

@Injectable()
export class ClassOrdersService {
  constructor(
    @InjectRepository(ClassAccount)
    private readonly classAccountsRepository: Repository<ClassAccount>,
    @InjectRepository(ClassAccountOperator)
    private readonly classAccountOperatorsRepository: Repository<ClassAccountOperator>,
    @InjectRepository(ClassGroupOrder)
    private readonly classGroupOrdersRepository: Repository<ClassGroupOrder>,
    @InjectRepository(ClassGroupOrderItem)
    private readonly classGroupOrderItemsRepository: Repository<ClassGroupOrderItem>,
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
    private readonly accountsService: AccountsService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createGroupOrder(
    operatorUserId: number,
    dto: CreateClassGroupOrderDto,
    requestIp?: string,
  ) {
    const classAccount = await this.classAccountsRepository.findOne({
      where: { id: dto.classAccountId },
      relations: ['classroom'],
    });
    if (!classAccount || classAccount.enabled !== 1) {
      throw new NotFoundException('Class account unavailable');
    }

    const operatorExists = await this.classAccountOperatorsRepository.findOne({
      where: { classAccount: { id: classAccount.id }, user: { id: operatorUserId } },
      relations: ['user'],
    });
    if (!operatorExists) {
      throw new ForbiddenException('You are not allowed to operate this class account');
    }

    if (classAccount.allowedIp && requestIp && classAccount.allowedIp !== requestIp) {
      throw new ForbiddenException('IP address is not allowed for this operation');
    }

    const studentLimit = classAccount.maxStudentsPerOrder;
    const amountLimit = Number(classAccount.maxAmountPerOrder);
    const totalAmount = dto.items.reduce((sum, item) => sum + Number(item.amount), 0);
    if (dto.items.length > studentLimit || totalAmount > amountLimit) {
      throw new BadRequestException('CLASS_ORDER_LIMIT_EXCEEDED');
    }

    const validations = await Promise.all(
      dto.items.map(async (item) => {
        const student = await this.studentsRepository.findOne({
          where: { id: item.studentId },
          relations: ['classroom', 'personalAccount', 'user'],
        });
        if (!student) {
          return { status: 'failed', reason: 'STUDENT_NOT_FOUND', item, student: null } as const;
        }
        if (student.classroom.id !== classAccount.classroom.id) {
          return { status: 'failed', reason: 'NOT_SAME_CLASS', item, student } as const;
        }
        if (!student.personalAccount) {
          return { status: 'failed', reason: 'NO_PERSONAL_ACCOUNT', item, student } as const;
        }
        return { status: 'ok', student, item } as const;
      }),
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = this.classGroupOrdersRepository.create({
        classAccount,
        operator: { id: operatorUserId } as User,
        orderTime: new Date(),
        studentCount: dto.items.length,
        totalAmount: '0',
        status: 'created',
        remark: dto.remark,
      });
      const savedOrder = await queryRunner.manager.save(order);

      let successCount = 0;
      let successAmount = 0;
      const itemResults: { id: number; status: string; failReason?: string }[] = [];

      for (const result of validations) {
        if (result.status !== 'ok') {
          const record = this.classGroupOrderItemsRepository.create({
            groupOrder: savedOrder,
            student: result.student ?? ({ id: result.item.studentId } as Student),
            personalAccount: result.student?.personalAccount ?? ({ id: 0 } as any),
            amount: result.item.amount.toFixed(2),
            status: 'failed',
            failReason: result.reason,
            productId: result.item.productId,
          });
          const savedItem = await queryRunner.manager.save(record);
          itemResults.push({ id: savedItem.id, status: 'failed', failReason: result.reason });
          continue;
        }

        const consumeResult = await this.accountsService.consume(
          result.student.personalAccount!.id,
          Number(result.item.amount),
          { type: 'CLASS_GROUP_ORDER', id: savedOrder.id },
          operatorUserId,
        );

        if (consumeResult.success) {
          const record = this.classGroupOrderItemsRepository.create({
            groupOrder: savedOrder,
            student: result.student,
            personalAccount: result.student.personalAccount!,
            amount: result.item.amount.toFixed(2),
            status: 'success',
            productId: result.item.productId,
            transaction: { id: consumeResult.transactionId! } as any,
          });
          const savedItem = await queryRunner.manager.save(record);
          successCount += 1;
          successAmount += Number(result.item.amount);
          itemResults.push({ id: savedItem.id, status: 'success' });
        } else {
          const record = this.classGroupOrderItemsRepository.create({
            groupOrder: savedOrder,
            student: result.student,
            personalAccount: result.student.personalAccount!,
            amount: result.item.amount.toFixed(2),
            status: 'failed',
            productId: result.item.productId,
            failReason: consumeResult.errorCode ?? consumeResult.errorMessage,
          });
          const savedItem = await queryRunner.manager.save(record);
          itemResults.push({ id: savedItem.id, status: 'failed', failReason: consumeResult.errorCode });
        }
      }

      savedOrder.totalAmount = successAmount.toFixed(2);
      savedOrder.status = successCount === dto.items.length ? 'success' : successCount > 0 ? 'partially_success' : 'canceled';
      savedOrder.studentCount = dto.items.length;
      await queryRunner.manager.save(savedOrder);

      await queryRunner.commitTransaction();
      return {
        groupOrderId: savedOrder.id,
        status: savedOrder.status,
        summary: {
          studentCount: dto.items.length,
          successCount,
          failCount: dto.items.length - successCount,
          totalAmount: savedOrder.totalAmount,
        },
        items: itemResults,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
