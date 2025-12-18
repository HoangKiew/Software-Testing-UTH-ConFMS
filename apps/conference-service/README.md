```markdown
# Conference Service - UTH ConfMS

Conference Service là microservice chịu trách nhiệm quản lý hội nghị và bài nộp trong hệ thống **UTH ConfMS** (Hệ thống Quản lý Bài báo Hội nghị Khoa học UTH).

## Yêu cầu trước khi chạy

- PostgreSQL đang chạy qua Docker (container `uth-database`)
- Identity Service đã chạy và hoạt động (để xác thực JWT và quản lý role)

## Bước 1: Khởi động Database

```bash
# Từ thư mục root của project
docker-compose down -v          # (Tùy chọn) Reset sạch dữ liệu cũ nếu cần
docker-compose up -d postgres   # Khởi động PostgreSQL
```

Kiểm tra container đang chạy:
```bash
docker ps
```
→ Thấy container `uth-database` trạng thái **Up**

## Bước 2: Tạo Database

```bash
docker exec -it uth-database psql -U admin -d postgres -c "CREATE DATABASE db_conference;"
```

> Nếu báo `already exists` → tốt, database đã sẵn sàng.

## Bước 3: Cấu hình Environment Variables

Tạo file `.env` hoặc `.env.local` trong thư mục `apps/conference-service/`:
```env
NODE_ENV=development
PORT=3002

# Database Config (local dev - kết nối tới PostgreSQL trong Docker)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE=db_conference

# JWT Secret (phải giống hệt identity-service)
JWT_ACCESS_SECRET=jZE6YIUoP_j7SOTLPWgS8kSfX5g4dlOmPMWJVNLMOyg-SMoqXiMRkR0ocJQEGr9HVUjonNIlZNwHzduFfOCJOQ
```

## Bước 4: Khởi động Service

```bash
# Từ thư mục root của project
npm run start:dev conference-service
```

→ Service chạy tại: **http://localhost:3002/api**

Khi khởi động thành công, TypeORM sẽ tự động tạo 2 bảng:
- `conferences`
- `submissions`

## 📝 Test với Postman

### Base URL cho Conference Service
```
http://localhost:3002/api
```

### Base URL cho Identity Service (để đăng ký/đăng nhập)
```
http://localhost:3001/api
```

### Header bắt buộc cho các request bảo vệ

| Key           | Value                                      | Ghi chú                           |
|---------------|--------------------------------------------|-----------------------------------|
| Authorization | Bearer {accessToken}                       | Bắt buộc cho mọi API cần xác thực |
| Content-Type  | application/json                           | Bắt buộc khi gửi body JSON        |

> Lấy `accessToken` từ Identity Service (xem phần Đăng nhập dưới đây)

### 1. Đăng ký tài khoản mới (Identity Service)

**Endpoint:** `POST http://localhost:3001/api/auth/register`

**Header:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "admin@uth.edu.vn",
  "password": "Admin123!",
  "fullName": "Quản trị viên UTH"
}
```

→ User này tự động nhận role **ADMIN**

### 2. Đăng nhập để lấy accessToken (Identity Service)

**Endpoint:** `POST http://localhost:3001/api/auth/login`

**Header:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "admin@uth.edu.vn",
  "password": "Admin123!"
}
```

→ Response sẽ trả về `accessToken` và `refreshToken`. **Copy accessToken** để dùng cho các request tiếp theo.

### 3. Gán role CHAIR cho user (nếu cần tạo hội nghị)

**Endpoint:** `PATCH http://localhost:3001/api/users/{userId}/roles`

**Header:**
```
Authorization: Bearer {accessToken của ADMIN}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "roles": ["ADMIN", "CHAIR"]
}
```

### 4. Tạo hội nghị mới (Yêu cầu role **CHAIR**)

**Endpoint:** `POST http://localhost:3002/api/conferences`

**Header:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Hội nghị Khoa học Công nghệ UTH 2026",
  "acronym": "UTHConf2026",
  "description": "Hội nghị nghiên cứu khoa học thường niên của Đại học UTH",
  "startDate": "2026-06-15",
  "endDate": "2026-06-17",
  "topics": [
    "Trí tuệ nhân tạo",
    "Khoa học dữ liệu",
    "An ninh mạng",
    "Công nghệ sinh học"
  ],
  "deadlines": {
    "submission": "2026-03-01T23:59:59",
    "review": "2026-04-15T23:59:59",
    "cameraReady": "2026-05-15T23:59:59"
  }
}
```

### 5. Lấy danh sách hội nghị

**Endpoint:** `GET http://localhost:3002/api/conferences`

### 6. Lấy chi tiết một hội nghị

**Endpoint:** `GET http://localhost:3002/api/conferences/{conferenceId}`

### 7. Cập nhật hội nghị (Yêu cầu role **CHAIR**)

**Endpoint:** `PATCH http://localhost:3002/api/conferences/{conferenceId}`

**Body (raw JSON):**
```json
{
  "description": "Mô tả hội nghị đã được cập nhật"
}
```

### 8. Xóa hội nghị (soft delete - Yêu cầu role **CHAIR**)

**Endpoint:** `DELETE http://localhost:3002/api/conferences/{conferenceId}`

### 9. Cập nhật topics (Yêu cầu role **CHAIR**)

**Endpoint:** `PATCH http://localhost:3002/api/conferences/{conferenceId}/topics`

**Body (raw JSON):**
```json
{
  "topics": ["AI mới", "Blockchain"]
}
```

### 10. Cập nhật deadlines (Yêu cầu role **CHAIR**)

**Endpoint:** `PATCH http://localhost:3002/api/conferences/{conferenceId}/deadlines`

**Body (raw JSON):**
```json
{
  "submission": "2026-03-15T23:59:59"
}
```

### 11. Thay đổi trạng thái hội nghị (Yêu cầu role **CHAIR**)

**Endpoint:** `PATCH http://localhost:3002/api/conferences/{conferenceId}/status`

**Body (raw JSON):**
```json
{
  "status": "open_for_submission"
}
```

> Các trạng thái hợp lệ: `draft`, `open_for_submission`, `submission_closed`, `under_review`, `review_completed`, `decision_made`, `camera_ready`, `finalized`, `archived`

### 12. Đăng ký tài khoản tác giả (AUTHOR)

**Endpoint:** `POST http://localhost:3001/api/auth/register`

**Body (raw JSON):**
```json
{
  "email": "author1@uth.edu.vn",
  "password": "Author123!",
  "fullName": "Nguyễn Văn A"
}
```

→ Tự động nhận role **AUTHOR**

### 13. Nộp bài báo (Yêu cầu role **AUTHOR**)

**Endpoint:** `POST http://localhost:3002/api/submissions`

**Header:**
```
Authorization: Bearer {accessToken của AUTHOR}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "conferenceId": "{conferenceId}",
  "title": "Ứng dụng Trí tuệ nhân tạo trong Y khoa",
  "abstract": "Nghiên cứu này đề xuất mô hình deep learning...",
  "keywords": "AI, deep learning, y tế",
  "authors": [3]
}
```
> **Không truyền field `status`** → hệ thống tự động set thành `submitted`

### 14. Lấy danh sách bài nộp theo hội nghị

**Endpoint:** `GET http://localhost:3002/api/submissions/conference/{conferenceId}`

### 15. Lấy chi tiết bài nộp

**Endpoint:** `GET http://localhost:3002/api/submissions/{submissionId}`

### 16. Cập nhật bài nộp (Yêu cầu role **AUTHOR**)

**Endpoint:** `PATCH http://localhost:3002/api/submissions/{submissionId}`

### 17. Xóa bài nộp (Yêu cầu role **AUTHOR**)

**Endpoint:** `DELETE http://localhost:3002/api/submissions/{submissionId}`

## Roles liên quan đến Conference Service

| Role          | Mô tả                                      | Quyền chính                                |
|---------------|--------------------------------------------|--------------------------------------------|
| `ADMIN`       | Quản trị viên hệ thống                     | Có quyền cao nhất, có thể gán role         |
| `CHAIR`       | Chủ tịch hội nghị                          | Tạo, quản lý, thay đổi trạng thái hội nghị |
| `AUTHOR`      | Tác giả bài báo                            | Nộp, cập nhật, xóa bài nộp                 |
| `REVIEWER`    | Người đánh giá                             | (Sẽ implement sau)                         |
| `PC_MEMBER`   | Thành viên ban chương trình                | (Sẽ implement sau)                         |

## Kiểm tra bảng dữ liệu (nếu cần)

```bash
docker exec -it uth-database psql -U admin -d db_conference -c "\dt"
```

→ Thấy 2 bảng: `conferences` và `submissions`

## Cron tự động

Hệ thống có cron job chạy hàng ngày lúc 00:00 để kiểm tra deadline submission → tự động chuyển trạng thái hội nghị sang `submission_closed` nếu hết hạn.

**UTH-ConfMS Conference Service đã sẵn sàng hoạt động!**  
Bạn có thể bắt đầu tạo hội nghị, mở nộp bài và nhận bài báo từ tác giả ngay lập tức.
```