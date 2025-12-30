# UTH - Conference Management System (ConFMS)
Identity Service – Test Report
1. Authentication

✅ POST /api/auth/register

Đăng ký tài khoản mới

Gán role mặc định (ADMIN khi seed)

✅ POST /api/auth/verify-email

Xác minh email bằng token

✅ POST /api/auth/login

Đăng nhập thành công

Trả về accessToken và refreshToken

2. Authorization (JWT)

✅ Sử dụng accessToken với header:

Authorization: Bearer <accessToken>


✅ Bảo vệ các API cần đăng nhập bằng JWT Guard

3. Users Module

✅ GET /api/users/profile

Lấy thông tin user hiện tại

Kiểm tra JWT + role hợp lệ

✅ POST /api/users/create (Admin)

Tạo user mới với role tùy chỉnh

✅ PATCH /api/users/{id}/roles (Admin)

Cập nhật role cho user

✅ DELETE /api/users/{id} (Admin)

Xóa user

4. Database

✅ Kết nối PostgreSQL qua Docker

✅ Seed role mặc định (ADMIN)

✅ Lưu user, role, token đúng schema
