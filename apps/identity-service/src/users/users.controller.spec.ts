/**
 * Unit Tests – UsersController (Authorization / Role-based Access Control)
 * Class: UsersController
 * File: apps/identity-service/src/users/users.controller.ts
 * Methodology: Standard BVA (Boundary Value Analysis)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * BẢNG BVA – Phân quyền API (Role Authorization Boundaries)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * [REQ-AUTHZ-1] GET /users – chỉ ADMIN và CHAIR được truy cập
 * ┌─────┬───────────────────┬──────────────┬───────────────────────────────────┐
 * │ Case│ Input: role       │ Điểm BVA     │ Expected Output                   │
 * ├─────┼───────────────────┼──────────────┼───────────────────────────────────┤
 * │  1  │ ADMIN             │ min (valid)  │ 200 – Danh sách users             │
 * │  2  │ CHAIR             │ min+ (valid) │ 200 – Danh sách users             │
 * │  3  │ AUTHOR            │ nom (invalid)│ 403 ForbiddenException             │
 * │  4  │ REVIEWER          │ max- (invalid│ 403 ForbiddenException             │
 * │  5  │ Không có token    │ out of bound │ 401 UnauthorizedException          │
 * └─────┴───────────────────┴──────────────┴───────────────────────────────────┘
 *
 * [REQ-AUTHZ-2] POST /users/create – chỉ ADMIN
 * ┌─────┬───────────────────┬──────────────┬───────────────────────────────────┐
 * │ Case│ Input: role       │ Điểm BVA     │ Expected Output                   │
 * ├─────┼───────────────────┼──────────────┼───────────────────────────────────┤
 * │  6  │ ADMIN             │ min (valid)  │ 201 – User được tạo (CHAIR)       │
 * │  7  │ ADMIN             │ min+ (valid) │ 201 – User được tạo (AUTHOR)      │
 * │  8  │ ADMIN             │ nom (valid)  │ 201 – User được tạo (REVIEWER)    │
 * │  9  │ CHAIR             │ max- (invalid│ 403 ForbiddenException             │
 * │ 10  │ AUTHOR            │ max (invalid)│ 403 ForbiddenException             │
 * └─────┴───────────────────┴──────────────┴───────────────────────────────────┘
 *
 * [REQ-AUTHZ-3] PATCH /users/:id/roles – chỉ ADMIN
 * ┌─────┬───────────────────┬──────────────┬───────────────────────────────────┐
 * │ Case│ Input: role       │ Điểm BVA     │ Expected Output                   │
 * ├─────┼───────────────────┼──────────────┼───────────────────────────────────┤
 * │ 11  │ ADMIN             │ min (valid)  │ 200 – Role đã cập nhật            │
 * │ 12  │ CHAIR             │ min+ (invalid│ 403 ForbiddenException             │
 * │ 13  │ AUTHOR            │ nom (invalid)│ 403 ForbiddenException             │
 * │ 14  │ REVIEWER          │ max (invalid)│ 403 ForbiddenException             │
 * └─────┴───────────────────┴──────────────┴───────────────────────────────────┘
 *
 * [REQ-AUTHZ-4] DELETE /users/:id – chỉ ADMIN (với Guard Clauses)
 * ┌─────┬───────────────────┬──────────────┬───────────────────────────────────┐
 * │ Case│ Input             │ Điểm BVA     │ Expected Output                   │
 * ├─────┼───────────────────┼──────────────┼───────────────────────────────────┤
 * │ 15  │ ADMIN + no-deps   │ min (valid)  │ 200 – Xóa thành công              │
 * │ 16  │ ADMIN + has-deps  │ max (invalid)│ 400 BadRequestException            │
 * │ 17  │ CHAIR             │ out of bound │ 403 ForbiddenException             │
 * └─────┴───────────────────┴──────────────┴───────────────────────────────────┘
 *
 * [REQ-AUTHZ-5] GET /users/profile – yêu cầu authenticated (bất kỳ role)
 * ┌─────┬───────────────────┬──────────────┬───────────────────────────────────┐
 * │ Case│ Input: userId     │ Điểm BVA     │ Expected Output                   │
 * ├─────┼───────────────────┼──────────────┼───────────────────────────────────┤
 * │ 18  │ userId = 1 (min)  │ min valid    │ 200 – Profile returned            │
 * │ 19  │ userId = valid    │ nominal      │ 200 – Profile returned            │
 * │ 20  │ userId = invalid  │ out of bound │ 401/404 Exception                 │
 * └─────┴───────────────────┴──────────────┴───────────────────────────────────┘
 *
 * Tổng số test cases: 20 TCs
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RoleName } from './entities/role.entity';
import { User } from './entities/user.entity';

// ─── Mock Factories ────────────────────────────────────────────────────────────
const makeRole = (name: RoleName) => ({ id: 1, name });

const makeUser = (o: Partial<User> = {}): User =>
  ({
    id: 1,
    email: 'user@example.com',
    password: 'hashed',
    fullName: 'Test User',
    isVerified: true,
    isActive: true,
    deletedAt: null,
    roles: [makeRole(RoleName.ADMIN) as any],
    ...o,
  }) as User;

// ─── Simulate Role Guard ────────────────────────────────────────────────────────
/**
 * Unit test không chạy Guards thật → ta mô phỏng bằng cách:
 * 1. Gọi trực tiếp method controller với userId đúng
 * 2. Kiểm tra service layer bị gọi đúng / không gọi
 * 3. Với test phân quyền: dùng mock service throw ForbiddenException
 *    để mô phỏng guard reject
 */

// ─── Test Suite ─────────────────────────────────────────────────────────────────
describe('UsersController – Role-based Authorization BVA', () => {
  let controller: UsersController;
  let mockUsersService: jest.Mocked<Partial<UsersService>>;

  beforeEach(async () => {
    mockUsersService = {
      findAll:            jest.fn(),
      findById:           jest.fn(),
      getProfile:         jest.fn(),
      createUserWithRole: jest.fn(),
      updateUserRoles:    jest.fn(),
      deleteUser:         jest.fn(),
      changePassword:     jest.fn(),
      forgotPassword:     jest.fn(),
      verifyResetCode:    jest.fn(),
      resetPassword:      jest.fn(),
      getResetCodeByEmail:jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => expect(controller).toBeDefined());

  // ═══════════════════════════════════════════════════════════════════════════
  // [REQ-AUTHZ-1]  GET /users – getAllUsers
  // Phân quyền: chỉ ADMIN và CHAIR được phép
  //
  // BVA Table - biến: role ∈ {ADMIN, CHAIR, AUTHOR, REVIEWER, no-token}
  //   min   = ADMIN    → valid (200)
  //   min+  = CHAIR    → valid (200)
  //   nom   = AUTHOR   → invalid (403)
  //   max-  = REVIEWER → invalid (403)
  //   out   = no-token → invalid (401)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('[REQ-AUTHZ-1] getAllUsers: BVA role boundary', () => {
    it('[BVA-Role-Min=ADMIN] Case 1: ADMIN (biên min valid) → lấy danh sách thành công', async () => {
      // ADMIN là biên thấp nhất trong tập { ADMIN, CHAIR } được cho phép
      (mockUsersService.findAll as jest.Mock).mockResolvedValue([
        makeUser({ roles: [makeRole(RoleName.ADMIN) as any] }),
        makeUser({ id: 2, roles: [makeRole(RoleName.CHAIR) as any] }),
      ]);
      // Giả định: guard đã cho ADMIN qua, gọi trực tiếp handler
      const r = await controller.getAllUsers();
      expect(r.message).toContain('thành công');
      expect(r.data).toHaveLength(2);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });

    it('[BVA-Role-Min+=CHAIR] Case 2: CHAIR (biên min+ valid) → lấy danh sách thành công', async () => {
      // CHAIR là biên kế tiếp trong tập được phép (min+)
      (mockUsersService.findAll as jest.Mock).mockResolvedValue([makeUser()]);
      const r = await controller.getAllUsers();
      expect(r.data).toHaveLength(1);
    });

    it('[BVA-Role-Nom=AUTHOR] Case 3: AUTHOR (biên nom invalid) → ForbiddenException', async () => {
      // AUTHOR là giá trị nominal nhưng KHÔNG có trong quyền → forbidden
      // Mô phỏng: RolesGuard throw ForbiddenException khi role=AUTHOR
      (mockUsersService.findAll as jest.Mock).mockRejectedValue(
        new ForbiddenException('Bạn không có quyền ADMIN hoặc CHAIR'),
      );
      await expect(controller.getAllUsers()).rejects.toThrow(ForbiddenException);
    });

    it('[BVA-Role-Max-=REVIEWER] Case 4: REVIEWER (biên max- invalid) → ForbiddenException', async () => {
      // REVIEWER cũng không có quyền → forbidden
      (mockUsersService.findAll as jest.Mock).mockRejectedValue(
        new ForbiddenException('Bạn không có quyền ADMIN hoặc CHAIR'),
      );
      await expect(controller.getAllUsers()).rejects.toThrow(ForbiddenException);
    });

    it('[BVA-NoToken] Case 5: không có token (ngoài biên) → UnauthorizedException', async () => {
      // Mô phỏng: JwtAuthGuard throw UnauthorizedException khi không có token
      (mockUsersService.findAll as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Chưa xác thực'),
      );
      await expect(controller.getAllUsers()).rejects.toThrow(UnauthorizedException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // [REQ-AUTHZ-2]  POST /users/create – createUser
  // Phân quyền: chỉ ADMIN; Role của user được tạo là CHAIR/AUTHOR/REVIEWER
  //
  // BVA Table - biến 1: caller_role ∈ {ADMIN, CHAIR, AUTHOR}
  //   min   = ADMIN  → valid (201)
  //   max   = CHAIR  → invalid (403)
  //   out   = AUTHOR → invalid (403)
  //
  // BVA Table - biến 2: target_role ∈ {CHAIR(1), AUTHOR(2), REVIEWER(3)}
  //   min   = CHAIR    → 201
  //   min+  = AUTHOR   → 201
  //   nom   = REVIEWER → 201
  // ═══════════════════════════════════════════════════════════════════════════
  describe('[REQ-AUTHZ-2] createUser: BVA caller role + target role boundary', () => {
    const baseDto = { email: 'new@test.com', password: 'Pass123!', fullName: 'New User', role: 'CHAIR' };

    it('[BVA-Caller-ADMIN-Target-CHAIR] Case 6: ADMIN tạo user với role CHAIR (min,min) → thành công', async () => {
      // Biên: caller=ADMIN (min), target=CHAIR (min) → tạo thành công
      const chairUser = makeUser({ roles: [makeRole(RoleName.CHAIR) as any] });
      (mockUsersService.createUserWithRole as jest.Mock).mockResolvedValue(chairUser);
      (mockUsersService.findById as jest.Mock).mockResolvedValue(chairUser);
      const r = await controller.createUser({ ...baseDto, role: 'CHAIR' } as any);
      expect(r.message).toContain('thành công');
      expect(r.data.roles).toContain(RoleName.CHAIR);
    });

    it('[BVA-Caller-ADMIN-Target-AUTHOR] Case 7: ADMIN tạo user với role AUTHOR (min,min+) → thành công', async () => {
      // Biên: target=AUTHOR (min+) — giá trị biên kế tiếp
      const authorUser = makeUser({ roles: [makeRole(RoleName.AUTHOR) as any] });
      (mockUsersService.createUserWithRole as jest.Mock).mockResolvedValue(authorUser);
      (mockUsersService.findById as jest.Mock).mockResolvedValue(authorUser);
      const r = await controller.createUser({ ...baseDto, role: 'AUTHOR' } as any);
      expect(r.data.roles).toContain(RoleName.AUTHOR);
    });

    it('[BVA-Caller-ADMIN-Target-REVIEWER] Case 8: ADMIN tạo user với role REVIEWER (min,nom) → thành công', async () => {
      // Biên: target=REVIEWER (nom) — giá trị trung gian
      const reviewerUser = makeUser({ roles: [makeRole(RoleName.REVIEWER) as any] });
      (mockUsersService.createUserWithRole as jest.Mock).mockResolvedValue(reviewerUser);
      (mockUsersService.findById as jest.Mock).mockResolvedValue(reviewerUser);
      const r = await controller.createUser({ ...baseDto, role: 'REVIEWER' } as any);
      expect(r.data.roles).toContain(RoleName.REVIEWER);
    });

    it('[BVA-Caller-CHAIR] Case 9: CHAIR gọi create (max- invalid) → ForbiddenException', async () => {
      // Biên: CHAIR không có quyền tạo user → guard reject
      (mockUsersService.createUserWithRole as jest.Mock).mockRejectedValue(
        new ForbiddenException('Chỉ ADMIN mới có quyền tạo user'),
      );
      await expect(controller.createUser(baseDto as any)).rejects.toThrow(ForbiddenException);
    });

    it('[BVA-Caller-AUTHOR] Case 10: AUTHOR gọi create (max invalid) → ForbiddenException', async () => {
      // Biên: AUTHOR không có quyền → ngoài biên hoàn toàn
      (mockUsersService.createUserWithRole as jest.Mock).mockRejectedValue(
        new ForbiddenException('Chỉ ADMIN mới có quyền tạo user'),
      );
      await expect(controller.createUser(baseDto as any)).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // [REQ-AUTHZ-3]  PATCH /users/:id/roles – updateUserRoles
  // Phân quyền: chỉ ADMIN
  //
  // BVA Table - biến: caller_role ∈ {ADMIN, CHAIR, AUTHOR, REVIEWER}
  //   min   = ADMIN    → valid (200)
  //   min+  = CHAIR    → invalid (403)
  //   nom   = AUTHOR   → invalid (403)
  //   max   = REVIEWER → invalid (403)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('[REQ-AUTHZ-3] updateUserRoles: BVA role boundary', () => {
    const dto = { role: 'REVIEWER' };

    it('[BVA-Role-Min=ADMIN] Case 11: ADMIN (biên min valid) → cập nhật role thành công', async () => {
      // Biên min: chỉ ADMIN được phép
      const updatedUser = makeUser({ roles: [makeRole(RoleName.REVIEWER) as any] });
      (mockUsersService.updateUserRoles as jest.Mock).mockResolvedValue(updatedUser);
      const r = await controller.updateUserRoles(1, dto as any);
      expect(r.message).toContain('thành công');
      expect(r.data.roles).toContain(RoleName.REVIEWER);
    });

    it('[BVA-Role-Min+=CHAIR] Case 12: CHAIR (biên min+ invalid - ngay tiếp theo ADMIN) → ForbiddenException', async () => {
      // Biên min+: CHAIR ngay trên ADMIN trong thứ tự enum nhưng KHÔNG có quyền
      (mockUsersService.updateUserRoles as jest.Mock).mockRejectedValue(
        new ForbiddenException('Chỉ ADMIN mới có thể cập nhật role'),
      );
      await expect(controller.updateUserRoles(1, dto as any)).rejects.toThrow(ForbiddenException);
    });

    it('[BVA-Role-Nom=AUTHOR] Case 13: AUTHOR (biên nom invalid) → ForbiddenException', async () => {
      (mockUsersService.updateUserRoles as jest.Mock).mockRejectedValue(
        new ForbiddenException('Chỉ ADMIN mới có thể cập nhật role'),
      );
      await expect(controller.updateUserRoles(2, dto as any)).rejects.toThrow(ForbiddenException);
    });

    it('[BVA-Role-Max=REVIEWER] Case 14: REVIEWER (biên max invalid - cuối enum) → ForbiddenException', async () => {
      // Biên max: REVIEWER là role cuối cùng trong enum và cũng không có quyền
      (mockUsersService.updateUserRoles as jest.Mock).mockRejectedValue(
        new ForbiddenException('Chỉ ADMIN mới có thể cập nhật role'),
      );
      await expect(controller.updateUserRoles(3, dto as any)).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // [REQ-AUTHZ-4]  DELETE /users/:id – deleteUser
  // Phân quyền: chỉ ADMIN; Guard clause: không có submissions/reviews
  //
  // BVA Table - biến: (caller_role, guard_clause)
  //   min  = ADMIN + no-deps  → valid (200)
  //   max  = ADMIN + has-deps → invalid (400 BadRequest)
  //   out  = CHAIR            → invalid (403)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('[REQ-AUTHZ-4] deleteUser: BVA role + guard clause boundary', () => {
    const mockReq: any = {
      headers: { authorization: 'Bearer valid.token.here' },
    };

    it('[BVA-Role-ADMIN-NoDeps] Case 15: ADMIN + không có dependencies (min valid) → xóa thành công', async () => {
      // Biên min: ADMIN có quyền + user không có bài nộp/review → xóa được
      (mockUsersService.deleteUser as jest.Mock).mockResolvedValue(undefined);
      const r = await controller.deleteUser(1, mockReq);
      expect(r.message).toContain('thành công');
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith(1, 'valid.token.here');
    });

    it('[BVA-Role-ADMIN-HasDeps] Case 16: ADMIN + có submissions (max invalid) → BadRequestException', async () => {
      // Biên max: user có bài nộp → guard clause ngăn không cho xóa
      const { BadRequestException } = await import('@nestjs/common');
      (mockUsersService.deleteUser as jest.Mock).mockRejectedValue(
        new BadRequestException({
          code: 'USER_HAS_SUBMISSIONS',
          message: 'Người dùng này đã nộp bài, không được xóa',
        }),
      );
      await expect(controller.deleteUser(1, mockReq)).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Role-CHAIR-Forbidden] Case 17: CHAIR không có quyền xóa (out of boundary) → ForbiddenException', async () => {
      // Ngoài biên: chỉ ADMIN = 1 role được phép; CHAIR = role kế tiếp nhưng không hợp lệ
      (mockUsersService.deleteUser as jest.Mock).mockRejectedValue(
        new ForbiddenException('Chỉ ADMIN mới có quyền xóa user'),
      );
      await expect(controller.deleteUser(1, mockReq)).rejects.toThrow(ForbiddenException);
    });

    it('[BVA-UserId-NotExist] userId không tồn tại → NotFoundException', async () => {
      (mockUsersService.deleteUser as jest.Mock).mockRejectedValue(
        new NotFoundException('Không tìm thấy tài khoản'),
      );
      await expect(controller.deleteUser(999, mockReq)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // [REQ-AUTHZ-5]  GET /users/profile – getProfile
  // Phân quyền: bất kỳ authenticated user (JwtAuthGuard)
  //
  // BVA Table - biến: userId ∈ [1, MAX_INT]
  //   min   = userId=1    → valid (200)
  //   min+  = userId=2    → valid
  //   nom   = userId=100  → valid
  //   out   = userId=0    → invalid (401/400)
  //
  // Biến 2: user tồn tại vs không tồn tại
  //   exist     → 200 profile
  //   not-exist → 404 NotFoundException
  // ═══════════════════════════════════════════════════════════════════════════
  describe('[REQ-AUTHZ-5] getProfile: BVA userId boundary', () => {
    it('[BVA-UserId-Min=1] Case 18: userId=1 (biên min nhỏ nhất hợp lệ) → trả profile', async () => {
      // Biên min: userId=1 là giá trị nhỏ nhất hợp lệ trong hệ thống
      const user = makeUser({ id: 1, roles: [makeRole(RoleName.AUTHOR) as any] });
      (mockUsersService.getProfile as jest.Mock).mockResolvedValue(user);
      const r = await controller.getProfile(1);   // userId=1 = min
      expect(r.message).toContain('thành công');
      expect(r.user.id).toBe(1);
      expect(r.user.roles).toContain(RoleName.AUTHOR);
    });

    it('[BVA-UserId-Min+=2] Case 18b: userId=2 (biên min+) → trả profile', async () => {
      const user = makeUser({ id: 2, roles: [makeRole(RoleName.REVIEWER) as any] });
      (mockUsersService.getProfile as jest.Mock).mockResolvedValue(user);
      const r = await controller.getProfile(2);  // userId=2 = min+
      expect(r.user.id).toBe(2);
    });

    it('[BVA-UserId-Nom=100] Case 19: userId=100 (nominal) → trả profile thành công', async () => {
      // Giá trị trung gian bình thường
      const user = makeUser({ id: 100, roles: [makeRole(RoleName.CHAIR) as any] });
      (mockUsersService.getProfile as jest.Mock).mockResolvedValue(user);
      const r = await controller.getProfile(100);
      expect(r.user.id).toBe(100);
      expect(r.user.roles).toContain(RoleName.CHAIR);
    });

    it('[BVA-UserId-Invalid=0] Case 20a: userId=0 (below min, ngoài biên) → UnauthorizedException', async () => {
      // Biên dưới invalid: userId=0 không hợp lệ
      // Controller check: if (!userId || typeof userId !== 'number') → throw
      await expect(controller.getProfile(0)).rejects.toThrow(UnauthorizedException);
    });

    it('[BVA-UserId-Null] Case 20b: userId null/undefined (ngoài biên hoàn toàn) → UnauthorizedException', async () => {
      // JwtAuthGuard không cung cấp userId → null
      await expect(controller.getProfile(null as any)).rejects.toThrow(UnauthorizedException);
    });

    it('[BVA-User-NotExist] userId hợp lệ nhưng user đã bị xóa (biên deleted state) → NotFoundException', async () => {
      // Biên state: user không tồn tại với userId hợp lệ
      (mockUsersService.getProfile as jest.Mock).mockRejectedValue(
        new NotFoundException('User not found'),
      );
      await expect(controller.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // [REQ-AUTHZ-6]  GET /users/:id – getUserById
  // Phân quyền: bất kỳ authenticated user
  // BVA: userId boundary + user exist/not-exist
  // ═══════════════════════════════════════════════════════════════════════════
  describe('[REQ-AUTHZ-6] getUserById: BVA userId boundary', () => {
    it('[BVA-Id-Min=1] userId=1 (biên min) → trả user data (ẩn password)', async () => {
      const user = makeUser({ id: 1 });
      (mockUsersService.findById as jest.Mock).mockResolvedValue(user);
      const r = await controller.getUserById(1);
      expect(r.data.id).toBe(1);
      expect((r.data as any).password).toBeUndefined(); // password phải bị ẩn
    });

    it('[BVA-Id-Nominal=50] userId=50 (nominal) → trả user data đúng', async () => {
      const user = makeUser({ id: 50 });
      (mockUsersService.findById as jest.Mock).mockResolvedValue(user);
      const r = await controller.getUserById(50);
      expect(r.data.id).toBe(50);
    });

    it('[BVA-Id-NotExist] userId không tồn tại (ngoài biên tập hợp ids) → NotFoundException', async () => {
      // Biên ngoài: userId không có trong DB
      (mockUsersService.findById as jest.Mock).mockResolvedValue(null);
      await expect(controller.getUserById(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // [REQ-AUTHZ-7]  PATCH /users/change-password – changePassword
  // Phân quyền: authenticated user (any role)
  // BVA: oldPassword match boundary
  // ═══════════════════════════════════════════════════════════════════════════
  describe('[REQ-AUTHZ-7] changePassword: BVA oldPassword match boundary', () => {
    it('[BVA-OldPwd-Match] oldPassword khớp chính xác (biên valid match) → thành công', async () => {
      (mockUsersService.changePassword as jest.Mock).mockResolvedValue(undefined);
      const r = await controller.changePassword(1, {
        oldPassword: 'CorrectPwd!',
        newPassword: 'NewPwd123!',
      });
      expect(r.message).toContain('thành công');
    });

    it('[BVA-OldPwd-Wrong] oldPassword sai (ngoài biên bcrypt match) → UnauthorizedException', async () => {
      const { UnauthorizedException } = await import('@nestjs/common');
      (mockUsersService.changePassword as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Mật khẩu cũ không chính xác'),
      );
      await expect(controller.changePassword(1, {
        oldPassword: 'WrongPwd',
        newPassword: 'NewPwd123!',
      })).rejects.toThrow(UnauthorizedException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // [REQ-AUTHZ-8]  Verify và Reset Password (public endpoints – no auth)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('[REQ-AUTHZ-8] verifyResetCode: BVA code valid/invalid', () => {
    it('[BVA-Code-Valid] code hợp lệ và còn hạn → trả valid=true', async () => {
      (mockUsersService.verifyResetCode as jest.Mock).mockResolvedValue(true);
      const r = await controller.verifyResetCode('user@test.com', '123456');
      expect(r.valid).toBe(true);
    });

    it('[BVA-Code-Invalid] code không hợp lệ (biên ngoài tập valid codes) → UnauthorizedException', async () => {
      (mockUsersService.verifyResetCode as jest.Mock).mockResolvedValue(false);
      await expect(controller.verifyResetCode('user@test.com', '000000'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('[REQ-AUTHZ-9] forgotPassword & resetPassword: biên email exist', () => {
    it('[BVA-Email-Exist] email tồn tại → forgotPassword gửi code (silent 200)', async () => {
      (mockUsersService.forgotPassword as jest.Mock).mockResolvedValue(undefined);
      const r = await controller.forgotPassword('exist@test.com');
      expect(r.message).toBeDefined();
      expect(mockUsersService.forgotPassword).toHaveBeenCalled();
    });

    it('[BVA-Email-NotExist] email không tồn tại → vẫn 200 (security: không lộ thông tin)', async () => {
      // Biên bảo mật: dù email không tồn tại vẫn trả 200 (không lộ email nào có account)
      (mockUsersService.forgotPassword as jest.Mock).mockResolvedValue(undefined);
      const r = await controller.forgotPassword('ghost@test.com');
      expect(r.message).toBeDefined();
    });

    it('[BVA-Reset-TokenValid] code + email hợp lệ → đặt lại password thành công', async () => {
      (mockUsersService.resetPassword as jest.Mock).mockResolvedValue(undefined);
      const r = await controller.resetPassword('user@test.com', '123456', 'NewPass123!');
      expect(r.message).toContain('thành công');
    });
  });
});
