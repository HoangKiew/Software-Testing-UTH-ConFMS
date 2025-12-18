````markdown
# 📝 Submission Service - UTH Conference Management System

Dịch vụ xử lý nộp bài báo khoa học trong hệ thống Microservices. Hỗ trợ upload file lên Supabase Cloud với cơ chế quản lý phiên bản tự động (v1, v2, v3...) và lưu trữ thông tin vào PostgreSQL.

---

## 📦 1. Hướng dẫn cài đặt nhanh

### Bước 1: Khởi động Database

Nếu bạn mới cài lại hệ thống hoặc vừa chạy `docker-compose down -v`, hãy tạo database trước:

```bash
docker exec -it uth_postgres psql -U admin -d postgres -c "CREATE DATABASE db_submission;"
```
````

### Bước 2: Thiết lập biến môi trường (.env)

- .env ở trong .env.example.txt nha

### Bước 3: Build và Chạy Service với Docker

```bash
# Build và chạy riêng Submission Service
docker-compose up --build submission-service

```

---

## 🧪 2. Kiểm tra tính năng (Postman)

**Base URL:** `http://localhost:3003/api`

### 📤 Nộp bài báo mới hoặc Cập nhật phiên bản (POST)

- **Endpoint:** `/submissions/upload`
- **Body (form-data):**
- `file`: (Chọn file `.pdf`, `.docx`, `.zip`, `.rar`)
- `title`: Tiêu đề bài báo (Dùng để xác định bài nộp cũ hay mới)
- `createdBy`: ID người dùng (ví dụ: `123`)
- `conferenceId`: ID hội nghị (ví dụ: `1`)

- **Cơ chế:** Nếu cùng một người dùng nộp cùng một tiêu đề bài báo, hệ thống sẽ tự động tăng version (v1 -> v2 -> v3).

### 📋 Xem lịch sử nộp của User (GET)

- **Endpoint:** `/submissions/user/:userId`
- **Ví dụ:** `http://localhost:3003/api/submissions/user/123`
- **Kết quả:** Trả về danh sách bài nộp kèm tất cả các phiên bản file đã upload.

---

## 🛠️ 3. Lệnh Quản trị cho Developer (CMD)

Khi Server đang chạy, bạn có thể mở một **Terminal mới** để kiểm tra dữ liệu thực tế trong Postgres:

### Truy cập Postgres:

```bash
docker exec -it uth_postgres psql -U admin -d db_submission

```

### Các câu lệnh SQL hữu ích (Tên bảng số ít):

```sql
-- Xem danh sách bài nộp
SELECT * FROM submission;

-- Xem chi tiết các file và link Supabase
SELECT * FROM submission_file;

-- Thoát Postgres
\q

```

---

## ⚠️ 4. Xử lý lỗi thường gặp (Troubleshooting)

| Lỗi                    | Nguyên nhân                                | Cách xử lý                                                            |
| ---------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| **404 Not Found**      | Sai URL hoặc thiếu tiền tố `/api`          | Kiểm tra URL trong Postman có khớp với `@Get` trong Controller không. |
| **400 Bad Request**    | File không đúng định dạng hoặc sai tên cột | Đảm bảo file nộp là `.docx` hoặc `.pdf`. Không nộp `.pptx`.           |
| **500 Internal Error** | Database chưa tạo hoặc lỗi Supabase        | Chạy lệnh `CREATE DATABASE` ở Bước 1 và check lại Key Supabase.       |

---

**Note:** Hệ thống sử dụng TypeORM với tính năng `synchronize: true` để tự động tạo bảng khi khởi động.
