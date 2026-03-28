/**
 * Unit Tests – UsersService
 * Class: UsersService
 * File: apps/identity-service/src/users/users.service.ts
 * Methodology: Normal (N) | Boundary (B) | Abnormal (A)
 * Benchmark: 30 TC/KLOC | LOC analysed: 196 | TC written: 22
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role, RoleName } from './entities/role.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity';
import { EmailService } from '../common/services/email.service';
import { SubmissionClientService } from '../integrations/submission-client.service';
import { ReviewClientService } from '../integrations/review-client.service';
import { DataSource } from 'typeorm';

// ─── Mock Factories ────────────────────────────────────────────────────────────
const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

// ─── Data Helpers ───────────────────────────────────────────────────────────────
const makeUser = (o: Partial<User> = {}): User =>
  ({ id: 1, email: 'test@example.com', password: 'hashed', fullName: 'Test User',
     isVerified: false, isActive: true, deletedAt: null, roles: [], ...o }) as User;

const makeRole = (name: RoleName = RoleName.AUTHOR): Role => ({ id: 10, name }) as Role;

// ─── Test Suite ─────────────────────────────────────────────────────────────────
describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: ReturnType<typeof mockRepo>;
  let roleRepo:  ReturnType<typeof mockRepo>;
  let pwdResetRepo: ReturnType<typeof mockRepo>;
  let emailSvc: { sendAccountCreatedNotification: jest.Mock; sendPasswordResetCode: jest.Mock };
  let submissionClient: { countSubmissionsByAuthorId: jest.Mock };
  let reviewClient: { getReviewerActivityStats: jest.Mock };

  beforeEach(async () => {
    emailSvc = {
      sendAccountCreatedNotification: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetCode: jest.fn().mockResolvedValue(undefined),
    };
    submissionClient = { countSubmissionsByAuthorId: jest.fn() };
    reviewClient     = { getReviewerActivityStats: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User),                  useFactory: mockRepo },
        { provide: getRepositoryToken(Role),                  useFactory: mockRepo },
        { provide: getRepositoryToken(PasswordResetToken),    useFactory: mockRepo },
        { provide: getRepositoryToken(EmailVerificationToken),useFactory: mockRepo },
        { provide: DataSource,               useValue: {} },
        { provide: EmailService,             useValue: emailSvc },
        { provide: SubmissionClientService,  useValue: submissionClient },
        { provide: ReviewClientService,      useValue: reviewClient },
      ],
    }).compile();

    service     = module.get<UsersService>(UsersService);
    usersRepo   = module.get(getRepositoryToken(User));
    roleRepo    = module.get(getRepositoryToken(Role));
    pwdResetRepo= module.get(getRepositoryToken(PasswordResetToken));
  });

  it('should be defined', () => expect(service).toBeDefined());

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-1  findByEmail  (LOC ~12) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findByEmail', () => {
    it('[Normal] trả về user khi tìm thấy email', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      const r = await service.findByEmail('test@example.com');
      expect(r?.email).toBe('test@example.com');
    });

    it('[Abnormal] trả về null khi không tìm thấy email', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const r = await service.findByEmail('ghost@example.com');
      expect(r).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-2  findById  (LOC ~12) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findById', () => {
    it('[Normal] trả về user khi tìm thấy ID', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ id: 5 }));
      const r = await service.findById(5);
      expect(r?.id).toBe(5);
    });

    it('[Abnormal] trả về null khi ID không tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      expect(await service.findById(999)).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-3  markEmailVerified  (LOC ~8) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('markEmailVerified', () => {
    it('[Normal] cập nhật isVerified = true', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ isVerified: false }));
      usersRepo.save.mockResolvedValue(makeUser({ isVerified: true }));
      const r = await service.markEmailVerified(1);
      expect(r.isVerified).toBe(true);
    });

    it('[Abnormal] ném NotFoundException khi user không tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.markEmailVerified(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-4  createUserWithRole  (LOC ~43) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('createUserWithRole', () => {
    const params = { email: 'new@example.com', password: 'Pass1!', fullName: 'New User', roleName: 'AUTHOR' };

    it('[Normal] tạo user thành công với role hợp lệ', async () => {
      usersRepo.findOne.mockResolvedValue(null);       // email chưa tồn tại
      roleRepo.findOne.mockResolvedValue(makeRole());
      usersRepo.create.mockReturnValue(makeUser(params));
      usersRepo.save.mockResolvedValue(makeUser({ ...params, id: 2 }));
      const r = await service.createUserWithRole(params);
      expect(r.email).toBe(params.email);
      expect(emailSvc.sendAccountCreatedNotification).toHaveBeenCalled();
    });

    it('[Abnormal] ném BadRequestException khi email đã tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser()); // email đã có
      await expect(service.createUserWithRole(params)).rejects.toThrow(BadRequestException);
    });

    it('[Abnormal] ném BadRequestException khi role không tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue(null); // role không có
      await expect(service.createUserWithRole(params)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-5  changePassword  (LOC ~22) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('changePassword', () => {
    it('[Normal] đổi mật khẩu thành công khi mật khẩu cũ đúng', async () => {
      const hashed = await bcrypt.hash('OldPass1!', 10);
      usersRepo.findOne.mockResolvedValue(makeUser({ password: hashed }));
      usersRepo.save.mockResolvedValue(makeUser());
      await expect(
        service.changePassword(1, { oldPassword: 'OldPass1!', newPassword: 'NewPass1!' }),
      ).resolves.toBeUndefined();
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('[Abnormal] ném UnauthorizedException khi mật khẩu cũ sai', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ password: await bcrypt.hash('Correct', 10) }));
      await expect(
        service.changePassword(1, { oldPassword: 'Wrong', newPassword: 'New1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('[Abnormal] ném NotFoundException khi user không tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(
        service.changePassword(999, { oldPassword: 'Old', newPassword: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-6  verifyResetCode  (LOC ~25) → 4 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('verifyResetCode', () => {
    it('[Normal] trả về true khi code hợp lệ và chưa hết hạn', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue({ token: '123456', used: false,
        expiresAt: new Date(Date.now() + 5 * 60_000) });
      expect(await service.verifyResetCode('test@example.com', '123456')).toBe(true);
    });

    it('[Boundary] trả về false khi code hết hạn đúng tại ngưỡng (expiresAt = now)', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue({ token: '123456', used: false,
        expiresAt: new Date(Date.now() - 1) }); // vừa hết hạn
      expect(await service.verifyResetCode('test@example.com', '123456')).toBe(false);
    });

    it('[Abnormal] trả về false khi code sai', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue(null);
      expect(await service.verifyResetCode('test@example.com', '000000')).toBe(false);
    });

    it('[Abnormal] ném NotFoundException khi user không tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.verifyResetCode('ghost@example.com', '123456'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-7  deleteUser (force=true)  (LOC ~60) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('deleteUser (force=true)', () => {
    it('[Normal] xóa mềm user thành công', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ deletedAt: null }));
      usersRepo.save.mockResolvedValue(makeUser({ deletedAt: new Date(), isActive: false }));
      await expect(service.deleteUser(1, undefined, true)).resolves.toBeUndefined();
      expect(usersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('[Abnormal] ném NotFoundException khi user không tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteUser(999, undefined, true)).rejects.toThrow(NotFoundException);
    });

    it('[Abnormal] ném BadRequestException khi user đã bị xóa trước đó', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ deletedAt: new Date() }));
      await expect(service.deleteUser(1, undefined, true)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-8  updateUserRoles  (LOC ~14) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('updateUserRoles', () => {
    it('[Normal] cập nhật role mới thành công', async () => {
      const newRole = makeRole(RoleName.CHAIR);
      usersRepo.findOne.mockResolvedValue(makeUser({ roles: [] }));
      roleRepo.findOne.mockResolvedValue(newRole);
      usersRepo.save.mockResolvedValue(makeUser({ roles: [newRole] }));
      await service.updateUserRoles(1, 'CHAIR');
      expect(usersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ roles: [newRole] }),
      );
    });

    it('[Abnormal] ném NotFoundException khi user không tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.updateUserRoles(999, 'CHAIR')).rejects.toThrow(NotFoundException);
    });

    it('[Abnormal] ném BadRequestException khi role không tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      roleRepo.findOne.mockResolvedValue(null);
      await expect(service.updateUserRoles(1, 'GHOST')).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-9  findAll  (LOC ~12) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAll', () => {
    it('[Normal] trả về danh sách tất cả user đang active', async () => {
      usersRepo.find.mockResolvedValue([makeUser(), makeUser({ id: 2 })]);
      const r = await service.findAll();
      expect(r).toHaveLength(2);
    });

    it('[Boundary] trả về mảng rỗng khi không có user nào', async () => {
      usersRepo.find.mockResolvedValue([]);
      const r = await service.findAll();
      expect(r).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-10  findByEmailIncludingDeleted  (LOC ~8) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findByEmailIncludingDeleted', () => {
    it('[Normal] trả về user kể cả đã bị xóa mềm', async () => {
      const deletedUser = makeUser({ deletedAt: new Date(), isActive: false });
      usersRepo.findOne.mockResolvedValue(deletedUser);
      const r = await service.findByEmailIncludingDeleted('test@example.com');
      expect(r?.deletedAt).not.toBeNull();
    });

    it('[Abnormal] trả về null khi email không tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      expect(await service.findByEmailIncludingDeleted('ghost@example.com')).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-11  getProfile  (LOC ~8) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getProfile', () => {
    it('[Normal] trả về profile user khi tìm thấy', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ id: 1 }));
      const r = await service.getProfile(1);
      expect(r.id).toBe(1);
    });

    it('[Abnormal] ném NotFoundException khi user không tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-12  forgotPassword  (LOC ~25) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('forgotPassword', () => {
    it('[Normal] gửi email reset password thành công khi tìm thấy user', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.create.mockReturnValue({ token: '123456', userId: 1 });
      pwdResetRepo.save.mockResolvedValue({});
      await expect(service.forgotPassword('test@example.com')).resolves.toBeUndefined();
      expect(emailSvc.sendPasswordResetCode).toHaveBeenCalled();
    });

    it('[Boundary] không làm gì (không throw) khi email không tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.forgotPassword('ghost@example.com')).resolves.toBeUndefined();
      expect(emailSvc.sendPasswordResetCode).not.toHaveBeenCalled();
    });

    it('[Abnormal] ném BadRequestException khi email service lỗi', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.create.mockReturnValue({});
      pwdResetRepo.save.mockResolvedValue({});
      emailSvc.sendPasswordResetCode.mockRejectedValue(new Error('SMTP error'));
      await expect(service.forgotPassword('test@example.com')).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-13  getResetCodeByEmail  (LOC ~28) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getResetCodeByEmail', () => {
    it('[Normal] trả về thông tin token khi hợp lệ', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      const tokenExp = new Date(Date.now() + 10 * 60_000);
      pwdResetRepo.findOne.mockResolvedValue({ token: '123456', used: false, expiresAt: tokenExp, createdAt: new Date() });
      const r = await service.getResetCodeByEmail('test@example.com');
      expect(r.email).toBe('test@example.com');
    });

    it('[Abnormal] ném NotFoundException khi user không tồn tại', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getResetCodeByEmail('ghost@example.com')).rejects.toThrow(NotFoundException);
    });

    it('[Abnormal] ném UnauthorizedException khi token đã hết hạn', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue({ token: '123456', used: false, expiresAt: new Date(Date.now() - 1000), createdAt: new Date() });
      await expect(service.getResetCodeByEmail('test@example.com')).rejects.toThrow(UnauthorizedException);
    });
  });
  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-14  resetPassword  (LOC ~34) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('resetPassword', () => {
    const validToken = { token: '123456', used: false, expiresAt: new Date(Date.now() + 10 * 60_000) };

    it('[Normal] đặt lại mật khẩu thành công với code hợp lệ', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue(validToken);
      pwdResetRepo.save.mockResolvedValue({ ...validToken, used: true });
      usersRepo.save.mockResolvedValue(makeUser());
      await expect(service.resetPassword('test@example.com', '123456', 'NewPass1!')).resolves.toBeUndefined();
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('[Abnormal] ném UnauthorizedException khi code không hợp lệ', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue(null); // code không tồn tại
      await expect(service.resetPassword('test@example.com', '000000', 'NewPass!')).rejects.toThrow(UnauthorizedException);
    });

    it('[Abnormal] ném UnauthorizedException khi code đã hết hạn', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue({ token: '123456', used: false, expiresAt: new Date(Date.now() - 1000) });
      await expect(service.resetPassword('test@example.com', '123456', 'NewPass!')).rejects.toThrow(UnauthorizedException);
    });
  }); // end resetPassword

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-15  createUser (with roles)  (LOC ~55) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('createUser', () => {
    it('[Normal] tạo user thành công kèm roles từ repository', async () => {
      const roleToAssign = makeRole(RoleName.CHAIR);
      roleRepo.findOne.mockResolvedValue(roleToAssign);
      
      const newParams = {
        email: 'admin@example.com',
        password: 'Password1!',
        fullName: 'Admin User',
        roles: [roleToAssign],
      };
      
      usersRepo.create.mockReturnValue(makeUser(newParams));
      usersRepo.save.mockResolvedValue(makeUser({ ...newParams, id: 99 }));
      usersRepo.findOne.mockResolvedValue(makeUser({ ...newParams, id: 99 }));
      
      const r = await service.createUser(newParams);
      expect(r.email).toBe('admin@example.com');
      expect(usersRepo.save).toHaveBeenCalled();
      expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { id: roleToAssign.id } });
    });

    it('[Normal] tạo user thành công không kèm roles', async () => {
      const newParams = {
        email: 'user@example.com',
        password: 'Password1!',
        fullName: 'Normal User',
        roles: [],
      };
      
      usersRepo.create.mockReturnValue(makeUser(newParams));
      usersRepo.save.mockResolvedValue(makeUser({ ...newParams, id: 100 }));
      usersRepo.findOne.mockResolvedValue(makeUser({ ...newParams, id: 100 }));
      
      const r = await service.createUser(newParams);
      expect(r.email).toBe('user@example.com');
      expect(usersRepo.save).toHaveBeenCalled();
    });
  });
});

