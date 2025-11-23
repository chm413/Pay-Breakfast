import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassGroupOrder } from '../entities/class-group-order.entity';
import { Student } from '../entities/student.entity';

@Controller('reports')
export class ReportsController {
  constructor(
    @InjectRepository(ClassGroupOrder)
    private readonly ordersRepository: Repository<ClassGroupOrder>,
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
  ) {}

  @Get('class/summary')
  async summary() {
    const totalOrders = await this.ordersRepository.count();
    const totalAmountRaw = await this.ordersRepository
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.totalAmount),0)', 'sum')
      .getRawOne<{ sum: string }>();
    const totalAmount = Number(totalAmountRaw?.sum || 0);
    const activeStudents = await this.studentsRepository.count();

    return {
      totalOrders,
      totalAmount,
      activeStudents,
    };
  }
}
