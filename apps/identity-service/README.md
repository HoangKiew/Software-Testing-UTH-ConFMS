# Identity Service - UTH ConfMS

### Bước 1: Khởi động Database

```bash
# Từ thư mục root của project
docker-compose up --build
docker-compose up -d postgres
```

Kiểm tra database đã chạy:
```bash
docker-compose ps
```

### Bước 2: Cấu hình Environment Variables

Tạo file `.env.local` trong `apps/identity-service/`:
```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE=db_identity
JWT_ACCESS_SECRET=jZE6YIUoP_j7SOTLPWgS8kSfX5g4dlOmPMWJVNLMOyg-SMoqXiMRkR0ocJQEGr9HVUjonNIlZNwHzduFfOCJOQ
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=PC25gncs8WDMMcZUOD7WA4gY-DjgfWKMZlWoQXkpm6JLunnZOEVKl8o_k6BQNBedrDEESOmdW5J160gJy7ZPJQ
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
```

### Bước 3: Khởi động Service

```bash
# Từ thư mục root của project
npm run start:dev identity-service
```
## 📝 Test với Postman

### Base URL
```
http://localhost:3001/api
```

### 1. Register - Đăng ký tài khoản mới

**Endpoint:** `POST /auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "buivanhuy2706@gmail.com",
  "password": "huybv123",
  "fullName": "Bui Van Huy"
}
```
### 2. Login - Đăng nhập

**Endpoint:** `POST /auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "buivanhuy2706@gmail.com",
  "password": "huybv123"
}
```

### 3. Get Profile - Lấy thông tin user

**Endpoint:** `GET /users/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

### 4. Refresh Token - Làm mới Access Token

**Endpoint:** `POST /auth/refresh-token`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
---

### 5. Logout - Đăng xuất

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Logged out"
}
```
### 6. Create User with Role - Tạo user với role tùy chỉnh (Admin only)

**Endpoint:** `POST /users/create`

**Yêu cầu:** Cần Access Token của user có role ADMIN

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "reviewer@example.com",
  "password": "password123",
  "fullName": "Reviewer User",
  "role": "REVIEWER"
}
```

### 7. Update User Roles - Cập nhật roles cho user (Admin only)

**Endpoint:** `PATCH /users/:id/roles`

**Yêu cầu:** Cần Access Token của user có role ADMIN

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "roles": ["REVIEWER", "PC_MEMBER"]
}
```

### 8. Change Password - Đổi mật khẩu

**Endpoint:** `PATCH /users/change-password`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword456"
}
```
### Authentication
- `POST /api/auth/register` - Đăng ký user mới (role mặc định: ADMIN)
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Đăng xuất (cần auth)

### Users
- `GET /api/users/profile` - Lấy thông tin user hiện tại (cần auth)
- `POST /api/users/create` - Tạo user với role tùy chỉnh (cần auth - chỉ ADMIN)
- `PATCH /api/users/:id/roles` - Cập nhật roles cho user (cần auth - chỉ ADMIN)
- `PATCH /api/users/change-password` - Đổi mật khẩu (cần auth)
- `POST /api/users/forgot-password` - Khởi tạo reset password
- `POST /api/users/reset-password` - Reset password

### Roles:
- `ADMIN` - Quản trị viên (role mặc định khi đăng ký, có quyền tạo user với các role khác)
- `CHAIR` - Chủ tịch hội nghị
- `AUTHOR` - Tác giả
- `REVIEWER` - Người đánh giá
- `PC_MEMBER` - Thành viên ban chương trình
# Tạo database
docker exec uth_postgres psql -U admin -d postgres -c "CREATE DATABASE db_identity;"
