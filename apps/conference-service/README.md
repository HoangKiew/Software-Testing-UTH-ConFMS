# Conference Service - UTH ConfMS

Conference Service là microservice chịu trách nhiệm quản lý hội nghị và bài nộp trong hệ thống **UTH ConfMS** (Hệ thống Quản lý Bài báo Hội nghị Khoa học UTH).

---

## 🔌 Postman & Test End-to-End (Tích hợp)

Phần dưới đây được tích hợp từ các file tài liệu test và Postman collection, giúp bạn **chạy toàn bộ luồng hệ thống từ đầu đến cuối chỉ với README này**.

## Kịch bản test tổng thể (End-to-End)

### Chuẩn bị môi trường

```bash
docker compose down -v
docker compose up --build -d
```

Tạo database:

```bash
docker exec -it uth-database psql -U admin -d postgres -c "CREATE DATABASE db_identity OWNER admin;"
docker exec -it uth-database psql -U admin -d postgres -c "CREATE DATABASE db_conference OWNER admin;"
```

Cấu hình Environment Variables
Tạo file .env hoặc .env.local trong thư mục apps/conference-service/:
```bash
NODE_ENV=development
PORT=3002
DB_HOST=postgres         # ← ĐÃ SỬA: Không dùng localhost nữa, dùng tên service trong Docker
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE=db_conference
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com               # Thay bằng email Gmail thật của bạn
SMTP_PASS=your-app-password                   # App Password từ Google (không dùng mật khẩu thường)
SMTP_FROM=no-reply@uth-confms.vn              # Email hiển thị khi gửi đi
OPENAI_API_KEY=sk-your-openai-key-here       # Thay bằng key thật của bạn (bắt buộc nếu dùng AI)
IDENTITY_SERVICE_URL=http://identity-service:3001/api   # Để lấy email, thông tin user
REVIEW_SERVICE_URL=http://review-service:3004/api       # Để lấy điểm đánh giá tổng hợp
JWT_ACCESS_SECRET=jZE6YIUoP_j7SOTLPWgS8kSfX5g4dlOmPMWJVNLMOyg-SMoqXiMRkR0ocJQEGr9HVUjonNIlZNwHzduFfOCJOQ


```

---

## Identity Service

### 1. Đăng ký ADMIN

`POST /auth/register`

```json
{
  "email": "admin@uth.vn",
  "password": "Admin123!",
  "fullName": "Quản trị viên hệ thống"
}
```

### 2. Đăng nhập ADMIN

`POST /auth/login`
→ Lưu `accessToken` vào biến môi trường `jwtToken`

---

## Tạo các role cần thiết (ADMIN)

Tạo các tài khoản:

* **CHAIR**: [chair@uth.vn](mailto:chair@uth.vn)
* **AUTHOR**: [author@uth.vn](mailto:author@uth.vn)
* **REVIEWER**: [reviewer1@uth.vn](mailto:reviewer1@uth.vn), [reviewer2@uth.vn](mailto:reviewer2@uth.vn), [reviewer3@uth.vn](mailto:reviewer3@uth.vn)

Endpoint:
`POST /users/create`

---

## Conference Service

### 3. Chair tạo hội nghị

`POST /conferences`

```json
{
  "name": "Hội nghị Khoa học Công nghệ UTH 2026",
  "acronym": "UTHCONF2026",
  "description": "Hội nghị thường niên về CNTT",
  "startDate": "2026-06-01",
  "endDate": "2026-06-03",
  "topics": ["Trí tuệ nhân tạo", "Machine Learning", "An ninh mạng", "IoT"],
  "deadlines": {
    "submission": "2026-04-01",
    "review": "2026-05-01",
    "cameraReady": "2026-05-20"
  }
}
```

### 4. Mở nộp bài

`PATCH /conferences/{conferenceId}/status?status=OPEN_FOR_SUBMISSION`

---

## Author nộp bài

`POST /submissions`

```json
{
  "conferenceId": "{conferenceId}",
  "title": "Ứng dụng Deep Learning trong nhận diện khuôn mặt",
  "abstract": "Bài báo trình bày mô hình deep learning...",
  "keywords": "deep learning, computer vision",
  "authors": [3]
}
```

---

## PC Member & Reviewer

### 5. Chair mời PC Member

`POST /pc-members/invite`

### 6. Reviewer chấp nhận lời mời

`PATCH /pc-members/{memberId}/accept`

### 7. Reviewer cập nhật chuyên môn

`PATCH /pc-members/{memberId}/topics`

```json
{
  "topics": ["Trí tuệ nhân tạo", "Machine Learning"]
}
```

---

## AI Gợi ý Reviewer

`GET /assignments/suggest/{submissionId}?top=5`

→ Trả về danh sách reviewer kèm **score + reason** từ AI

---

## Phân công & Quyết định

### 8. Phân công reviewer

`POST /assignments/assign`

### 9. Ra quyết định

`POST /decisions`

```json
{
  "submissionId": "{submissionId}",
  "decision": "accept",
  "feedback": "Bài báo chất lượng tốt"
}
```

---

## Báo cáo & Proceedings

* Xuất proceedings: `GET /conferences/{id}/export-proceedings?format=pdf`
* Thống kê bài nộp: `GET /reports/conference/{id}/submission-stats`

---

## Ghi chú triển khai

### Cài package nếu gặp lỗi dependency

```bash
npm install --legacy-peer-deps
npm install pdfkit @nestjs/swagger swagger-ui-express @nestjs/axios
```

### Cron job

* Tự động đóng nộp bài khi quá deadline (00:00 mỗi ngày)

---

## Bảng tổng kết chức năng & cấu trúc Conference Service (theo source code)

### Tổng quan

Conference Service đảm nhiệm **toàn bộ nghiệp vụ hội nghị khoa học**, bao gồm:

* Quản lý hội nghị & bài nộp
* PC Member / Reviewer
* Phân công & quyết định
* Gợi ý reviewer bằng AI
* Báo cáo & audit
* Gửi email thông báo

---

### 📋 Bảng chức năng chi tiết
```text
| STT | Thư mục                        | Chức năng chính       | Mô tả nghiệp vụ                                                             |
| --- | ------------------------------ | --------------------- | --------------------------------------------------------------------------- |
| 1   | `ai/`                          | AI Service            | Xử lý logic AI, gợi ý reviewer phù hợp dựa trên topic, keywords, chuyên môn |
| 2   | `assignments/`                 | Phân công reviewer    | Gợi ý reviewer, phân công reviewer cho bài nộp                              |
| 3   | `audit/`                       | Audit & Logging       | Ghi log các hành động quan trọng (assign, decision, status change, …)       |
| 4   | `auth/`                        | Xác thực nội bộ       | Guard, kiểm tra JWT, role khi gọi Conference Service                        |
| 5   | `common/`                      | Thành phần dùng chung | Guard, decorator, enum, base response, utils                                |
| 6   | `conferences/`                 | Quản lý hội nghị      | Tạo, cập nhật, xóa, đổi trạng thái, deadline                                |
| 7   | `decisions/`                   | Quyết định bài nộp    | Accept / Reject / Feedback bài báo                                          |
| 8   | `emails/`                      | Gửi email             | Gửi mail mời reviewer, thông báo quyết định, trạng thái                     |
| 9   | `pc-members/`                  | PC Member             | Mời, chấp nhận lời mời, cập nhật chuyên môn                                 |
| 10  | `reports/`                     | Báo cáo thống kê      | Thống kê bài nộp theo trạng thái, hội nghị                                  |
| 11  | `reviews/`                     | Review bài báo        | Reviewer thực hiện đánh giá (score, comment)                                |
| 12  | `submissions/`                 | Bài nộp               | Author nộp, sửa, xóa, xem bài báo                                           |
| 13  | `users/`                       | Người dùng liên quan  | Lấy thông tin user từ Identity Service                                      |
| 14  | `conference-service.module.ts` | Module gốc            | Khai báo module, import các feature module                                  |
| 15  | `main.ts`                      | Bootstrap             | Khởi động NestJS application                                                |
```
---

### 📂 Sơ đồ thư mục Conference Service

```text
conference-service/
├── src/
│   ├── ai/                 # AI reviewer suggestion
│   ├── assignments/        # Phân công reviewer
│   ├── audit/              # Audit log
│   ├── auth/               # JWT & role guard
│   ├── common/             # Dùng chung (decorator, enum, utils)
│   ├── conferences/        # Hội nghị
│   ├── decisions/          # Quyết định bài nộp
│   ├── emails/             # Gửi email thông báo
│   ├── pc-members/         # PC Member / Reviewer
│   ├── reports/            # Báo cáo & thống kê
│   ├── reviews/            # Review bài báo
│   ├── submissions/        # Bài nộp
│   ├── users/              # Kết nối Identity Service
│   ├── conference-service.module.ts
│   └── main.ts
├── .env
├── Dockerfile
├── README.md
└── tsconfig.app.json
```



