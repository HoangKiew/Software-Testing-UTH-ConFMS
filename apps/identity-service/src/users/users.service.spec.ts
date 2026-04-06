/**
 * Unit Tests – UsersService
 * Class: UsersService
 * File: apps/identity-service/src/users/users.service.ts
 * Methodology: Boundary Value Analysis (BVA)
 *
 * BVA Coverage Plan:
 * ┌──────────────────────────────┬──────────────────────────────────────────────────────────────┐
 * │ Function                     │ Biên được kiểm thử                                           │
 * ├──────────────────────────────┼──────────────────────────────────────────────────────────────┤
 * │ findByEmail                  │ email tồn tại vs không tồn tại (biên tồn tại/không)          │
 * │ findById                     │ id hợp lệ (Min=1) vs không tồn tại                          │
 * │ markEmailVerified            │ isVerified: false→true (biên chuyển state)                  │
 * │ createUserWithRole           │ email mới (biên valid), email đã có (biên invalid)           │
 * │                              │ role hợp lệ vs role không tồn tại                            │
 * │ changePassword               │ oldPassword khớp chính xác (biên Min của bcrypt compare)    │
 * │                              │ oldPassword sai 1 ký tự (biên ngoài)                        │
 * │ verifyResetCode              │ expiresAt = now+1ms (biên hợp lệ Min)                       │
 * │                              │ expiresAt = now-1ms (biên hết hạn Max+1)                    │
 * │                              │ code đúng vs sai (biên match/no-match)                      │
 * │ deleteUser (force=true)      │ deletedAt=null (biên valid), deletedAt≠null (biên invalid)  │
 * │ updateUserRoles              │ role hợp lệ vs không hợp lệ                                 │
 * │ findAll                      │ 0 user (biên Min), 1 user (biên Min+1), nhiều (Nominal)     │
 * │ forgotPassword               │ email tồn tại vs email không tồn tại (silent ignore)        │
 * │ resetPassword                │ token valid, token hết hạn (biên thời gian chính xác)       │
 * └──────────────────────────────┴──────────────────────────────────────────────────────────────┘
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
  // BVA-1  findByEmail
  // Input: email (string)
  // Biên:
  //   email tồn tại và active (biên valid - trả về user)
  //   email không tồn tại (biên invalid - trả về null)
  //   email tồn tại nhưng bị xóa mềm (ngoài biên - trả về null)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: findByEmail', () => {
    it('[BVA-Exist] email tồn tại và active → trả về user', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ email: 'test@example.com' }));
      const r = await service.findByEmail('test@example.com');
      expect(r?.email).toBe('test@example.com');
    });

    it('[BVA-NotExist] email không tồn tại → trả về null', async () => {
      // Đây là biên ngoài: email ngay ngoài tập hợp hợp lệ
      usersRepo.findOne.mockResolvedValue(null);
      const r = await service.findByEmail('ghost@example.com');
      expect(r).toBeNull();
    });

    it('[BVA-SoftDeleted] email của user đã bị xóa mềm → trả về null (không lấy deleted)', async () => {
      // findByEmail dùng deletedAt: IsNull() → không trả về user đã xóa
      usersRepo.findOne.mockResolvedValue(null); // soft-deleted user không matches
      const r = await service.findByEmail('deleted@example.com');
      expect(r).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-2  findById
  // Input: id (số nguyên)
  // Biên:
  //   id = 1 (Min - giá trị nhỏ nhất hợp lệ về mặt logic)
  //   id = Int.MAX (Max - không burst, trả về null nếu không có)
  //   id tồn tại → trả về user
  //   id không tồn tại → trả về null
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: findById', () => {
    it('[BVA-Id-Min] id = 1 (biên dưới hợp lệ nhỏ nhất) → trả về user', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ id: 1 }));
      const r = await service.findById(1);
      expect(r?.id).toBe(1);
    });

    it('[BVA-Id-NotExist] id không tồn tại → trả về null', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      expect(await service.findById(999999)).toBeNull();
    });

    it('[BVA-Id-Nominal] id bình thường (5) → trả về user đúng', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ id: 5 }));
      const r = await service.findById(5);
      expect(r?.id).toBe(5);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-3  markEmailVerified
  // Input: userId
  // Biên trạng thái isVerified:
  //   isVerified = false (biên đầu vào hợp lệ - chưa xác minh)
  //   isVerified = true sau khi save (biên đầu ra mong đợi)
  //   userId không tồn tại (ngoài biên → NotFoundException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: markEmailVerified', () => {
    it('[BVA-State-False-to-True] isVerified: false → true (chuyển biên trạng thái)', async () => {
      // Đây là biên chuyển state: false (biên dưới) → true (biên trên)
      usersRepo.findOne.mockResolvedValue(makeUser({ isVerified: false }));
      usersRepo.save.mockResolvedValue(makeUser({ isVerified: true }));
      const r = await service.markEmailVerified(1);
      expect(r.isVerified).toBe(true);
    });

    it('[BVA-UserId-NotExist] userId không tồn tại → NotFoundException', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.markEmailVerified(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-4  createUserWithRole
  // Biên email:
  //   email mới chưa tồn tại (biên valid Min của constraint uniqueness)
  //   email đã tồn tại (biên invalid - vượt qua biên uniqueness)
  // Biên role:
  //   role tồn tại trong DB (biên valid)
  //   role không tồn tại (biên invalid - NotFoundException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: createUserWithRole', () => {
    const params = { email: 'new@example.com', password: 'Pass1!', fullName: 'New User', roleName: 'AUTHOR' };

    it('[BVA-Email-New] email mới chưa tồn tại (biên uniqueness hợp lệ) → tạo thành công', async () => {
      usersRepo.findOne.mockResolvedValue(null);       // email chưa có
      roleRepo.findOne.mockResolvedValue(makeRole());
      usersRepo.create.mockReturnValue(makeUser(params));
      usersRepo.save.mockResolvedValue(makeUser({ ...params, id: 2 }));
      const r = await service.createUserWithRole(params);
      expect(r.email).toBe(params.email);
      expect(emailSvc.sendAccountCreatedNotification).toHaveBeenCalled();
    });

    it('[BVA-Email-Duplicate] email đã tồn tại (biên uniqueness vượt) → BadRequestException', async () => {
      // Biên: ngay khi email đã có → reject ngay
      usersRepo.findOne.mockResolvedValue(makeUser());
      await expect(service.createUserWithRole(params)).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Role-Valid] role hợp lệ tồn tại trong DB → tạo thành công', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue(makeRole(RoleName.CHAIR));
      usersRepo.create.mockReturnValue(makeUser());
      usersRepo.save.mockResolvedValue(makeUser());
      const r = await service.createUserWithRole({ ...params, roleName: 'CHAIR' });
      expect(r).toBeDefined();
    });

    it('[BVA-Role-NotExist] role không tồn tại (biên ngoài tập hợp roles) → BadRequestException', async () => {
      // role = null là biên ngoài valid set
      usersRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue(null);
      await expect(service.createUserWithRole(params)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-5  changePassword
  // Input: oldPassword (string phải khớp chính xác với hash)
  // Biên bcrypt.compare:
  //   oldPassword KHỚP CHÍNH XÁC (biên valid) → đổi được
  //   oldPassword sai 1 ký tự (biên ngoài Min+1 của sai số) → UnauthorizedException
  //   oldPassword hoàn toàn khác (ngoài biên xa) → UnauthorizedException
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: changePassword', () => {
    it('[BVA-Password-Exact-Match] oldPassword khớp chính xác (biên Min valid) → đổi thành công', async () => {
      const correctPwd = 'OldPass1!';
      const hashed = await bcrypt.hash(correctPwd, 10);
      usersRepo.findOne.mockResolvedValue(makeUser({ password: hashed }));
      usersRepo.save.mockResolvedValue(makeUser());
      await expect(
        service.changePassword(1, { oldPassword: correctPwd, newPassword: 'NewPass1!' }),
      ).resolves.toBeUndefined();
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('[BVA-Password-OneChar-Off] oldPassword sai 1 ký tự cuối (ngay ngoài biên) → UnauthorizedException', async () => {
      // BVA điển hình: "OldPass1!" vs "OldPass1." - sai 1 ký tự = ngay ngoài biên match
      const correctPwd = 'OldPass1!';
      const hashed = await bcrypt.hash(correctPwd, 10);
      usersRepo.findOne.mockResolvedValue(makeUser({ password: hashed }));
      await expect(
        service.changePassword(1, { oldPassword: 'OldPass1.', newPassword: 'NewPass1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('[BVA-Password-WrongCompletely] oldPassword hoàn toàn khác (ngoài biên xa) → UnauthorizedException', async () => {
      const hashed = await bcrypt.hash('CorrectPassword', 10);
      usersRepo.findOne.mockResolvedValue(makeUser({ password: hashed }));
      await expect(
        service.changePassword(1, { oldPassword: 'WrongPassword', newPassword: 'New1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('[BVA-UserId-NotExist] userId không tồn tại → NotFoundException', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(
        service.changePassword(999, { oldPassword: 'Old', newPassword: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-6  verifyResetCode
  // Input: email, code; điều kiện: expiresAt vs now
  // Biên thời gian (rất quan trọng trong BVA):
  //   expiresAt = now + 1ms (biên Min valid - vừa chưa hết hạn)
  //   expiresAt = now - 1ms (biên Min invalid - vừa hết hạn)
  //   expiresAt = now + 15 phút (Nominal - còn hạn dài)
  // Biên code:
  //   code khớp (valid)
  //   code không khớp → trả về false (không tìm thấy token)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: verifyResetCode', () => {
    it('[BVA-Expire-JustValid] expiresAt = now+1ms (biên dưới hợp lệ về thời gian) → true', async () => {
      // Biên chính xác BVA: còn hạn chỉ 1ms
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue({
        token: '123456', used: false,
        expiresAt: new Date(Date.now() + 1), // +1ms: biên Min valid
      });
      expect(await service.verifyResetCode('test@example.com', '123456')).toBe(true);
    });

    it('[BVA-Expire-JustExpired] expiresAt = now-1ms (biên vừa hết hạn - ngoài biên) → false', async () => {
      // Biên chính xác BVA: hết hạn chỉ 1ms trước
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue({
        token: '123456', used: false,
        expiresAt: new Date(Date.now() - 1), // -1ms: biên vừa hết hạn
      });
      expect(await service.verifyResetCode('test@example.com', '123456')).toBe(false);
    });

    it('[BVA-Expire-Nominal] expiresAt = now+15 phút (Nominal) → true', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue({
        token: '123456', used: false,
        expiresAt: new Date(Date.now() + 15 * 60_000),
      });
      expect(await service.verifyResetCode('test@example.com', '123456')).toBe(true);
    });

    it('[BVA-Code-NoMatch] code không tìm thấy trong DB (biên không match) → false', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue(null); // không tìm thấy token
      expect(await service.verifyResetCode('test@example.com', '000000')).toBe(false);
    });

    it('[BVA-User-NotExist] user không tồn tại → NotFoundException', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.verifyResetCode('ghost@example.com', '123456'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-7  deleteUser (force=true)
  // Biên deletedAt:
  //   deletedAt = null (biên hợp lệ - chưa xóa → được xóa)
  //   deletedAt ≠ null (biên invalid - đã xóa rồi → BadRequestException)
  // Biên isActive:
  //   isActive = true (biên valid trước khi xóa)
  //   isActive = false sau khi xóa (verify biên kết quả)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: deleteUser (force=true)', () => {
    it('[BVA-DeletedAt-Null] deletedAt = null (biên hợp lệ Min) → xóa mềm thành công', async () => {
      // Biên: đúng biên hợp lệ là deletedAt IS NULL
      usersRepo.findOne.mockResolvedValue(makeUser({ deletedAt: null }));
      usersRepo.save.mockResolvedValue(makeUser({ deletedAt: new Date(), isActive: false }));
      await expect(service.deleteUser(1, undefined, true)).resolves.toBeUndefined();
      expect(usersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('[BVA-DeletedAt-NotNull] deletedAt ≠ null (biên invalid - đã xóa) → BadRequestException', async () => {
      // Biên: ngay khi deletedAt có giá trị → invalid
      usersRepo.findOne.mockResolvedValue(makeUser({ deletedAt: new Date() }));
      await expect(service.deleteUser(1, undefined, true)).rejects.toThrow(BadRequestException);
    });

    it('[BVA-UserId-NotExist] userId không tồn tại → NotFoundException', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteUser(999, undefined, true)).rejects.toThrow(NotFoundException);
    });

    it('[BVA-IsActive-After-Delete] sau khi xóa: isActive phải là false (verify biên kết quả)', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ deletedAt: null, isActive: true }));
      usersRepo.save.mockImplementation((u) => Promise.resolve(u));
      await service.deleteUser(1, undefined, true);
      // Verify rằng save được gọi với isActive=false
      const savedArg = (usersRepo.save as jest.Mock).mock.calls[0][0];
      expect(savedArg.isActive).toBe(false);
      expect(savedArg.deletedAt).not.toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-8  updateUserRoles
  // Biên role:
  //   role tồn tại (AUTHOR - biên Min valid)
  //   role tồn tại (CHAIR - Nominal)
  //   role không tồn tại ('GHOST' - ngoài biên enum)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: updateUserRoles', () => {
    it('[BVA-Role-Author] role AUTHOR (biên Min valid trong enum) → cập nhật thành công', async () => {
      const authorRole = makeRole(RoleName.AUTHOR);
      usersRepo.findOne.mockResolvedValue(makeUser({ roles: [] }));
      roleRepo.findOne.mockResolvedValue(authorRole);
      usersRepo.save.mockResolvedValue(makeUser({ roles: [authorRole] }));
      await service.updateUserRoles(1, 'AUTHOR');
      expect(usersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ roles: [authorRole] }),
      );
    });

    it('[BVA-Role-Chair] role CHAIR (Nominal trong enum) → cập nhật thành công', async () => {
      const chairRole = makeRole(RoleName.CHAIR);
      usersRepo.findOne.mockResolvedValue(makeUser({ roles: [] }));
      roleRepo.findOne.mockResolvedValue(chairRole);
      usersRepo.save.mockResolvedValue(makeUser({ roles: [chairRole] }));
      await service.updateUserRoles(1, 'CHAIR');
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('[BVA-Role-NotExist] role không tồn tại (ngoài enum) → BadRequestException', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      roleRepo.findOne.mockResolvedValue(null); // 'GHOST' không phải enum value hợp lệ
      await expect(service.updateUserRoles(1, 'GHOST')).rejects.toThrow(BadRequestException);
    });

    it('[BVA-UserId-NotExist] userId không tồn tại → NotFoundException', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.updateUserRoles(999, 'CHAIR')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-9  findAll
  // Biên số lượng:
  //   0 user (biên Min - danh sách rỗng)
  //   1 user (biên Min+1 - đúng 1 phần tử)
  //   nhiều user (Nominal)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: findAll', () => {
    it('[BVA-Count-0] 0 user (biên Min - danh sách rỗng) → trả []', async () => {
      usersRepo.find.mockResolvedValue([]);
      const r = await service.findAll();
      expect(r).toEqual([]);
      expect(r).toHaveLength(0);
    });

    it('[BVA-Count-1] đúng 1 user (biên Min+1) → trả array 1 phần tử', async () => {
      usersRepo.find.mockResolvedValue([makeUser()]);
      const r = await service.findAll();
      expect(r).toHaveLength(1);
    });

    it('[BVA-Count-Nominal] nhiều user (Nominal) → trả đúng số lượng', async () => {
      usersRepo.find.mockResolvedValue([makeUser(), makeUser({ id: 2 }), makeUser({ id: 3 })]);
      const r = await service.findAll();
      expect(r).toHaveLength(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-10  forgotPassword
  // Biên email:
  //   email tồn tại → gửi email (biên valid)
  //   email không tồn tại → silent return (không throw - biên valid đặc biệt)
  // Biên email service:
  //   gửi email thành công (biên valid)
  //   gửi email lỗi (biên invalid - BadRequestException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: forgotPassword', () => {
    it('[BVA-Email-Exist] email tồn tại → gửi email reset (biên valid)', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.create.mockReturnValue({ token: '123456', userId: 1 });
      pwdResetRepo.save.mockResolvedValue({});
      await expect(service.forgotPassword('test@example.com')).resolves.toBeUndefined();
      expect(emailSvc.sendPasswordResetCode).toHaveBeenCalled();
    });

    it('[BVA-Email-NotExist] email không tồn tại (biên tồn tại) → return undefined silent', async () => {
      // Đây là biên đặc biệt: hàm trả về sớm mà không throw
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.forgotPassword('ghost@example.com')).resolves.toBeUndefined();
      expect(emailSvc.sendPasswordResetCode).not.toHaveBeenCalled();
    });

    it('[BVA-EmailService-Error] email service lỗi → BadRequestException', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.create.mockReturnValue({});
      pwdResetRepo.save.mockResolvedValue({});
      emailSvc.sendPasswordResetCode.mockRejectedValue(new Error('SMTP connection refused'));
      await expect(service.forgotPassword('test@example.com')).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-11  getResetCodeByEmail
  // Biên thời gian expiresAt (tương tự verifyResetCode nhưng throw thay vì return false):
  //   expiresAt = now+1ms (biên Min valid) → trả thông tin token
  //   expiresAt = now-1ms (biên Max invalid) → UnauthorizedException
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getResetCodeByEmail', () => {
    it('[BVA-Token-JustValid] token hợp lệ với expiresAt = now+1ms (biên Min hợp lệ) → trả info', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue({
        token: '654321', used: false,
        expiresAt: new Date(Date.now() + 1), // biên Min valid
        createdAt: new Date(),
      });
      const r = await service.getResetCodeByEmail('test@example.com');
      expect(r.email).toBe('test@example.com');
    });

    it('[BVA-Token-JustExpired] token hết hạn tại now-1ms (biên Max invalid) → UnauthorizedException', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue({
        token: '654321', used: false,
        expiresAt: new Date(Date.now() - 1), // biên vừa hết hạn
        createdAt: new Date(),
      });
      await expect(service.getResetCodeByEmail('test@example.com')).rejects.toThrow(UnauthorizedException);
    });

    it('[BVA-User-NotExist] user không tồn tại → NotFoundException', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getResetCodeByEmail('ghost@example.com')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-12  resetPassword
  // Biên token:
  //   token valid + chưa hết hạn → đổi mật khẩu thành công
  //   token không tồn tại → UnauthorizedException
  //   token hết hạn tại now-1ms (biên ngoài) → UnauthorizedException
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: resetPassword', () => {
    it('[BVA-Token-Valid] token hợp lệ còn hạn (Nominal) → đặt lại mật khẩu thành công', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue({
        token: '123456', used: false,
        expiresAt: new Date(Date.now() + 10 * 60_000),
      });
      pwdResetRepo.save.mockResolvedValue({});
      usersRepo.save.mockResolvedValue(makeUser());
      await expect(service.resetPassword('test@example.com', '123456', 'NewPass1!')).resolves.toBeUndefined();
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('[BVA-Token-JustExpired] token hết hạn tại now-1ms (biên ngoài) → UnauthorizedException', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue({
        token: '123456', used: false,
        expiresAt: new Date(Date.now() - 1), // biên vừa hết hạn
      });
      await expect(service.resetPassword('test@example.com', '123456', 'NewPass!')).rejects.toThrow(UnauthorizedException);
    });

    it('[BVA-Token-NotExist] token không tồn tại (biên không match) → UnauthorizedException', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      pwdResetRepo.findOne.mockResolvedValue(null);
      await expect(service.resetPassword('test@example.com', '000000', 'NewPass!')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-13  getProfile
  // Biên:
  //   userId tồn tại → trả về profile
  //   userId không tồn tại → NotFoundException
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getProfile', () => {
    it('[BVA-Id-Exist] userId hợp lệ → trả về profile user', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ id: 1 }));
      const r = await service.getProfile(1);
      expect(r.id).toBe(1);
    });

    it('[BVA-Id-NotExist] userId không tồn tại (ngoài biên) → NotFoundException', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-14  createUser (with roles)
  // Biên danh sách roles:
  //   roles = [] (biên Min - 0 phần tử, không cần role check)
  //   roles = [1 role] (biên Min+1 - đúng 1 role)
  //   roles = nhiều roles (Nominal)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: createUser', () => {
    it('[BVA-Roles-Empty] roles = [] (biên Min - danh sách rỗng) → tạo user không có role', async () => {
      const newParams = {
        email: 'noRole@example.com',
        password: 'Password1!',
        fullName: 'No Role User',
        roles: [],
      };
      usersRepo.create.mockReturnValue(makeUser(newParams));
      usersRepo.save.mockResolvedValue(makeUser({ ...newParams, id: 100 }));
      usersRepo.findOne.mockResolvedValue(makeUser({ ...newParams, id: 100 }));
      const r = await service.createUser(newParams);
      expect(r.email).toBe('noRole@example.com');
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('[BVA-Roles-One] roles = [1 role] (biên Min+1) → tạo user với 1 role', async () => {
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
      expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { id: roleToAssign.id } });
    });
  });
});
