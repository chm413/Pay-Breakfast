import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { generateKeyPairSync, privateDecrypt, constants as cryptoConstants } from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer, { Transporter } from 'nodemailer';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { getJwtSecret } from '../common/jwt.util';
import { EmailVerificationCode } from '../entities/email-verification-code.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private rsaPublicKey!: string;
  private rsaPrivateKey!: string;
  private jwtSecret = getJwtSecret();
  private mailer?: Transporter;
  private recentVerified = new Map<number, number>();
  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeCode(code: string | number | undefined | null) {
    return String(code ?? '').trim();
  }

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRolesRepository: Repository<UserRole>,
    @InjectRepository(EmailVerificationCode)
    private readonly emailCodesRepository: Repository<EmailVerificationCode>,
  ) {}

  async onModuleInit() {
    this.prepareRsaKeys();
    await this.ensureMailer();
    await this.ensureAdminUser();
  }

  getPublicKey(): string {
    return this.rsaPublicKey;
  }

  private prepareRsaKeys() {
    const envPublic = process.env.RSA_PUBLIC_KEY;
    const envPrivate = process.env.RSA_PRIVATE_KEY;

    if (envPublic && envPrivate) {
      this.rsaPublicKey = envPublic;
      this.rsaPrivateKey = envPrivate;
      this.logger.log('Loaded RSA key pair from environment variables');
      return;
    }

    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    this.rsaPublicKey = envPublic || publicKey;
    this.rsaPrivateKey = envPrivate || privateKey;
    this.logger.warn('RSA key pair not provided via env, generated ephemeral keys for this runtime.');
    this.logger.log(`RSA public key (share with frontend):\n${this.rsaPublicKey}`);
  }

  private async ensureMailer() {
    if (!process.env.SMTP_HOST) {
      this.logger.warn('SMTP_HOST not provided. Password reset emails will be logged to console.');
      return;
    }
    this.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE?.toLowerCase() !== 'false',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
    try {
      await this.mailer.verify();
      this.logger.log('SMTP transport verified and ready.');
    } catch (error) {
      this.logger.error('Failed to verify SMTP configuration', error as Error);
      this.mailer = undefined;
    }
  }

  private async ensureAdminUser() {
    let superAdminRole = await this.rolesRepository.findOne({ where: { code: 'SUPER_ADMIN' } });
    if (!superAdminRole) {
      superAdminRole = this.rolesRepository.create({ code: 'SUPER_ADMIN', name: '超级管理员' });
      await this.rolesRepository.save(superAdminRole);
    }

    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    let adminUser = await this.usersRepository.findOne({ where: { username: adminUsername }, relations: ['roles', 'roles.role'] });
    if (!adminUser) {
      const randomPassword = this.generateRandomPassword();
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      adminUser = this.usersRepository.create({
        username: adminUsername,
        realName: '系统管理员',
        passwordHash,
        status: 1,
        email: process.env.ADMIN_EMAIL,
      });
      const saved = await this.usersRepository.save(adminUser);
      const link = this.userRolesRepository.create({ user: saved, role: superAdminRole });
      await this.userRolesRepository.save(link);
      this.logger.warn(`超级管理员已初始化：${adminUsername} / ${randomPassword} （请及时登录后修改）`);
    }
  }

  private generateRandomPassword(length = 16) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*';
    return Array.from({ length })
      .map(() => alphabet.charAt(Math.floor(Math.random() * alphabet.length)))
      .join('');
  }

  markRecentVerification(userId: number) {
    const expiresAt = Date.now() + 15 * 60 * 1000;
    this.recentVerified.set(userId, expiresAt);
  }

  hasRecentVerification(userId: number) {
    const expiresAt = this.recentVerified.get(userId);
    if (!expiresAt) return false;
    if (expiresAt < Date.now()) {
      this.recentVerified.delete(userId);
      return false;
    }
    return true;
  }

  async recheckPassword(userId: number, password: string, encrypted?: boolean) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || user.status !== 1) {
      throw new UnauthorizedException('账号不存在或已被禁用');
    }
    const plaintext = this.decryptIfNeeded(password, encrypted);
    const match = await bcrypt.compare(plaintext, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('密码校验失败');
    }
    this.markRecentVerification(user.id);
    return { success: true };
  }

  private decryptIfNeeded(content: string, encrypted?: boolean): string {
    if (!encrypted) return content;
    try {
      const decrypted = privateDecrypt(
        {
          key: this.rsaPrivateKey,
          padding: cryptoConstants.RSA_PKCS1_PADDING,
        },
        Buffer.from(content, 'base64'),
      );
      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('RSA decrypt failed', error as Error);
      throw new BadRequestException('Invalid encrypted payload');
    }
  }

  private async buildUserInfo(user: User) {
    const roles = (user.roles || []).map((r) => r.role.code);
    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      roles,
    };
  }

  async login(dto: LoginDto) {
    const password = this.decryptIfNeeded(dto.password, dto.encrypted);
    const user = await this.usersRepository.findOne({ where: { username: dto.username }, relations: ['roles', 'roles.role'] });
    if (!user || user.status !== 1) {
      throw new UnauthorizedException('账号不存在或已被禁用');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('账号或密码错误');
    }

    this.markRecentVerification(user.id);
    const userInfo = await this.buildUserInfo(user);
    const accessToken = jwt.sign(userInfo, this.jwtSecret, { expiresIn: '2h' });
    return { accessToken, userInfo };
  }

  async register(dto: RegisterDto) {
    const password = this.decryptIfNeeded(dto.password, dto.encrypted);
    const normalizedEmail = this.normalizeEmail(dto.email);
    const normalizedCode = this.normalizeCode(dto.code);
    const exists = await this.usersRepository.findOne({ where: { username: dto.username } });
    if (exists) {
      throw new BadRequestException('用户名已存在');
    }

    const emailExists = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    if (emailExists) {
      throw new BadRequestException('邮箱已注册');
    }

    await this.verifyEmailCode(normalizedEmail, 'REGISTER', normalizedCode);

    let studentRole = await this.rolesRepository.findOne({ where: { code: 'STUDENT' } });
    if (!studentRole) {
      studentRole = await this.rolesRepository.save(this.rolesRepository.create({ code: 'STUDENT', name: '学生' }));
    }

    const user = this.usersRepository.create({
      username: dto.username,
      realName: dto.realName,
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      status: 1,
    });
    const saved = await this.usersRepository.save(user);
    const link = this.userRolesRepository.create({ user: saved, role: studentRole });
    await this.userRolesRepository.save(link);
    const userInfo = await this.buildUserInfo({ ...saved, roles: [link] } as User);
    const accessToken = jwt.sign(userInfo, this.jwtSecret, { expiresIn: '2h' });
    return { accessToken, userInfo };
  }

  private async dispatchEmail(to: string, subject: string, text: string) {
    if (this.mailer) {
      await this.mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com',
        to,
        subject,
        text,
      });
      return;
    }
    this.logger.warn(`SMTP 未配置，邮件内容将输出到日志：To=${to}, Subject=${subject}, Body=${text}`);
  }

  async requestReset(email: string, purpose: 'RESET_PWD' | 'REGISTER' = 'RESET_PWD') {
    return this.issueEmailCode(email, purpose);
  }

  async requestRegisterCode(email: string, purpose: 'REGISTER' | 'RESET_PWD' = 'REGISTER') {
    return this.issueEmailCode(email, purpose ?? 'REGISTER');
  }

  async resetPassword(dto: ResetPasswordDto) {
    const normalizedEmail = this.normalizeEmail(dto.email);
    await this.verifyEmailCode(normalizedEmail, 'RESET_PWD', dto.code);

    const user = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      throw new BadRequestException('账号不存在');
    }
    const newPassword = this.decryptIfNeeded(dto.newPassword, dto.encrypted);
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);
    return { success: true };
  }

  private async issueEmailCode(email: string, purpose: 'REGISTER' | 'RESET_PWD') {
    const normalizedEmail = this.normalizeEmail(email);
    if (purpose === 'REGISTER') {
      const existingUser = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
      if (existingUser) {
        throw new BadRequestException('邮箱已注册，请直接登录或找回密码');
      }
    }

    if (purpose === 'RESET_PWD') {
      const user = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
      if (!user) {
        return { success: true };
      }
    }

    const recent = await this.emailCodesRepository.findOne({
      where: { email: normalizedEmail, purpose },
      order: { createdAt: 'DESC' },
    });
    if (recent && recent.createdAt.getTime() > Date.now() - 60 * 1000 && !recent.usedAt) {
      throw new BadRequestException('请求过于频繁，请稍后再试');
    }

    await this.emailCodesRepository.update(
      { email: normalizedEmail, purpose, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const code = this.generateNumericCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.emailCodesRepository.save(
      this.emailCodesRepository.create({
        email: normalizedEmail,
        code,
        purpose,
        expiresAt,
        attemptCount: 0,
        usedAt: null,
      }),
    );

    const subject = purpose === 'REGISTER' ? '注册验证码' : '密码重置验证码';
    const body = `您的验证码为：${code}，10 分钟内有效。`;
    await this.dispatchEmail(normalizedEmail, subject, body);
    return { success: true, expiresAt };
  }

  private generateNumericCode(length = 6) {
    return Array.from({ length })
      .map(() => Math.floor(Math.random() * 10))
      .join('');
  }

  private async verifyEmailCode(email: string, purpose: 'REGISTER' | 'RESET_PWD', code: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const record = await this.emailCodesRepository.findOne({
      where: { email: normalizedEmail, purpose, usedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      this.logger.debug(`verify code failed: email=${normalizedEmail} purpose=${purpose}`);
      throw new BadRequestException('验证码错误或已过期');
    }

    const normalizedInput = this.normalizeCode(code);
    if (this.normalizeCode(record.code) !== normalizedInput) {
      const attemptCount = (record.attemptCount ?? 0) + 1;
      await this.emailCodesRepository.update(record.id, {
        attemptCount,
        usedAt: attemptCount >= 5 ? new Date() : record.usedAt,
      });
      this.logger.debug(`verify code failed: email=${normalizedEmail} purpose=${purpose}`);
      throw new BadRequestException('验证码错误或已过期');
    }

    await this.emailCodesRepository.update(record.id, { usedAt: new Date() });
  }
}
