# Review Service – UTH Conference Management System - Version 1

## 1. Chức năng chính đã xây dựng

### 1.1. Các chức năng nghiệp vụ

* Tạo review cho bài báo
* Lưu điểm và nhận xét của reviewer
* Lấy danh sách review theo bài báo (submission)
* Lấy danh sách review theo reviewer
* Health check để kiểm tra trạng thái service

### 1.2. Các API đã triển khai

| Method | Endpoint                      | Mô tả                      |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/api/reviews/health`         | Kiểm tra service hoạt động |
| POST   | `/api/reviews`                | Tạo review mới             |
| GET    | `/api/reviews/submission/:id` | Lấy review theo submission |
| GET    | `/api/reviews/reviewer/:id`   | Lấy review theo reviewer   |

---

## 2. Cấu trúc thư mục Review Service

```
apps/review-service
├── Dockerfile
├── .env
├── tsconfig.app.json
└── src
    ├── main.ts
    ├── review-service.module.ts
    ├── review-service.controller.ts
    ├── review-service.service.ts
    └── review
        ├── review.entity.ts
        └── dto
            └── create-review.dto.ts
```

### Giải thích ngắn gọn

* `main.ts`: Entry point của service
* `module.ts`: Module gốc, cấu hình DB và dependency
* `controller.ts`: Định nghĩa API
* `service.ts`: Xử lý nghiệp vụ
* `entity.ts`: Mapping với bảng database
* `dto`: Chuẩn hóa dữ liệu nhận từ frontend

---

## 3. Database Design

### 3.1 Database riêng

Review Service sử dụng database riêng: **db_review**

### 3.2 Bảng reviews

| Cột          | Kiểu      | Ý nghĩa         |
| ------------ | --------- | --------------- |
| id           | UUID      | Khóa chính      |
| submissionId | string    | ID bài báo      |
| reviewerId   | string    | ID người review |
| score        | number    | Điểm đánh giá   |
| comment      | text      | Nhận xét        |
| createdAt    | timestamp | Thời gian tạo   |

---

## 4. Cấu hình môi trường

### File `.env` (chạy local)

```env
PORT=3004
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE=db_review
JWT_SECRET=bi_mat_khong_duoc_bat_mi_2025
```

Khi chạy bằng Docker, các biến môi trường được cấu hình trong `docker-compose.yml`.

---

## 5. Chạy hệ thống bằng Docker

### 5.1 Yêu cầu

* Docker Desktop
* Docker Compose

### 5.2 Khởi động hệ thống

```bash
docker compose up --build
```

### 5.3 Kiểm tra container

```bash
docker ps
```

---

## 6. Test API bằng Postman

### 6.1 Health Check

```
GET http://localhost:3004/api/reviews/health
```

Kết quả mong đợi:

```json
{ "status": "ok", "service": "review-service" }
```

---

### 6.2 Tạo review

```
POST http://localhost:3004/api/reviews
```

Body (JSON):

```json
{
  "submissionId": "sub-001",
  "reviewerId": "user-123",
  "score": 9,
  "comment": "Bài viết tốt"
}
```

---

### 6.3 Lấy review theo submission

```
GET http://localhost:3004/api/reviews/submission/sub-001
```

---

### 6.4 Lấy review theo reviewer

```
GET http://localhost:3004/api/reviews/reviewer/user-123
```

---

**Tác giả:** Huỳnh Lê Bảo
