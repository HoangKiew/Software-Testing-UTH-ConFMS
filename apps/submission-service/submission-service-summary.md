# 📊 Submission Service - Tổng Quan Triển Khai

**Ngày:** 30/12/2025  
**Trạng thái:** 91% Hoàn thành (10/11 tính năng)  
**Chờ:** Review Service

---

## ✅ Đã Hoàn Thành

### **Tính năng chính (10/11)**

1. ✅ **Upload bài nộp** - PDF/Word/ZIP, tối đa 10MB, tự động quản lý phiên bản
2. ✅ **Xem chi tiết bài nộp** - Thông tin đầy đủ với tác giả và files
3. ✅ **Danh sách bài nộp của tôi** - Xem bài nộp của chính mình
4. ✅ **Sửa thông tin** - Chỉnh sửa tiêu đề/tóm tắt/tác giả trước deadline
5. ✅ **Rút bài nộp** - Xóa mềm với audit trail
6. ✅ **Upload camera-ready** - Chỉ PDF, phiên bản >= 100
7. ✅ **Cập nhật trạng thái (CHAIR)** - Chấp nhận/Từ chối bài báo
8. ✅ **Xem theo hội nghị (CHAIR)** - Liệt kê tất cả bài nộp của hội nghị
9. ✅ **Xem theo tác giả (CHAIR)** - Xem bài nộp của tác giả cụ thể
10. ✅ **Phân trang & Lọc (CHAIR)** - Tìm kiếm nâng cao với bộ lọc

### **Tính năng kỹ thuật**

- ✅ Xác thực JWT với phân quyền theo vai trò
- ✅ Tích hợp Supabase Storage
- ✅ TypeORM với PostgreSQL
- ✅ Ghi log audit trail
- ✅ Database indexes để tối ưu hiệu suất
- ✅ Tài liệu Swagger UI
- ✅ Kiểm tra deadline (tích hợp Conference Service)
- ✅ Parse thông tin tác giả với mapping fields
- ✅ Xử lý timezone cho bộ lọc ngày
- ✅ Bảo vệ SQL injection

---

## 🆕 Cập Nhật Mới Nhất (30/12/2025)

### **Tính năng: Phân trang & Lọc**

**Endpoint:** `GET /api/submissions`

**Tham số truy vấn:**
- `page` (số, mặc định: 1) - Số trang
- `limit` (số, mặc định: 10, tối đa: 100) - Số bài/trang
- `status` (enum) - Lọc theo trạng thái (SUBMITTED, ACCEPTED, REJECTED, v.v.)
- `conferenceId` (số) - Lọc theo hội nghị
- `createdFrom` (ngày, ISO 8601) - Lọc từ ngày
- `createdTo` (ngày, ISO 8601) - Lọc đến ngày
- `search` (chuỗi) - Tìm kiếm trong tiêu đề
- `sortBy` (enum) - Sắp xếp theo (createdAt, updatedAt, title)
- `order` (enum) - Thứ tự (ASC, DESC)

**Phản hồi:**
```json
{
  "data": [...danh sách bài nộp],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Điểm nổi bật:**
- Xử lý timezone (createdTo bao gồm cả ngày)
- Mapping fields (camelCase ↔ snake_case)
- Validate trang (tự động giới hạn trong phạm vi hợp lệ)
- Database indexes: `status`, `conference_id`, `created_at`
- Tìm kiếm ILIKE không phân biệt hoa thường

### **Sửa lỗi: Parse thông tin tác giả**

**Vấn đề:** Danh sách tác giả luôn rỗng trong response

**Giải pháp:**
- Parse chuỗi JSON từ form-data
- Map fields: `name` → `author_name`, `isCorresponding` → `is_corresponding`
- Validate định dạng JSON

**Tác động:** Thông tin tác giả giờ được lưu và hiển thị chính xác

### **Cải tiến: Swagger UI**

- Thêm decorators cho upload file ở endpoint camera-ready
- Tài liệu API đầy đủ với ví dụ
- Test tương tác tại `http://localhost:3003/api/docs`

---

## ❌ Công Việc Còn Lại (1/11)

### **11. Xem Reviews Ẩn Danh**

**Endpoint:** `GET /api/submissions/:id/reviews`

**Chờ:** Review Service phải implement `GET /reviews/submission/:id`

**Phản hồi mong đợi:**
```json
{
  "reviews": [
    {
      "reviewerName": "Reviewer 1",
      "score": 8,
      "comment": "Bài báo tốt",
      "recommendation": "ACCEPT"
    }
  ],
  "averageScore": 7.5
}
```

**Bước tiếp theo:**
1. Đợi Review Service được implement
2. Tạo integration client
3. Implement endpoint với ẩn danh reviewer
4. Test quy trình end-to-end

---

## 🧪 Kiểm Thử

### **Swagger UI**
- URL: `http://localhost:3003/api/docs`
- Tất cả endpoints được tài liệu hóa
- Test tương tác với JWT auth
- Hỗ trợ upload file

### **Postman Collection**
- Vị trí: `apps/submission-service/UTH-ConfMS-Submission.postman_collection.json`
- Bao gồm tất cả endpoints
- Environments đã cấu hình sẵn
- Tự động lưu tokens

### **Phạm vi kiểm thử**
- ✅ Quy trình upload
- ✅ Các thao tác CRUD
- ✅ Phân quyền theo vai trò
- ✅ Phân trang & lọc
- ✅ Upload camera-ready
- ✅ Xử lý lỗi
- ⚠️ Tích hợp review (chờ Review Service)

---

## 📁 Cấu Trúc Dự Án

```
apps/submission-service/
├── src/
│   ├── main.ts                          # Entry point + cấu hình Swagger
│   ├── submission-service.module.ts     # Module chính
│   ├── submission-service.controller.ts # API endpoints
│   ├── submission-service.service.ts    # Business logic
│   ├── dtos/
│   │   ├── create-submission.dto.ts
│   │   ├── update-submission.dto.ts
│   │   ├── update-status.dto.ts
│   │   └── query-submissions.dto.ts     # MỚI: DTO phân trang
│   ├── modules/
│   │   ├── submission/entities/
│   │   │   ├── submission.entity.ts     # Có indexes
│   │   │   ├── submission-file.entity.ts
│   │   │   ├── author.entity.ts
│   │   │   └── audit-trail.entity.ts
│   │   └── integration/
│   │       ├── conference.client.ts
│   │       └── review.client.ts
│   └── auth/
│       ├── jwt-auth.guard.ts
│       ├── roles.guard.ts
│       └── roles.decorator.ts
├── .env
├── readme.md                            # Đã cập nhật với hướng dẫn Postman
├── walkthrough.md                       # Đã cập nhật với tính năng mới
└── ApiEndpoints.md
```

---

## 🚀 Triển Khai

### **Development**
```bash
npm run start:dev submission-service
```

### **Docker**
```bash
docker-compose up -d submission-service
```

### **Biến môi trường**
```env
PORT=3003
DATABASE_URL=postgresql://admin:admin123@localhost:5435/db_submission
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
SUPABASE_BUCKET_NAME=submission
JWT_ACCESS_SECRET=your-secret
CONFERENCE_SERVICE_URL=http://conference-service:3002/api
REVIEW_SERVICE_URL=http://review-service:3004/api
```

---

## 📊 Hiệu Suất

### **Database Indexes**
```sql
CREATE INDEX idx_submission_status ON submission(status);
CREATE INDEX idx_submission_conference_id ON submission(conference_id);
CREATE INDEX idx_submission_created_at ON submission(created_at);
```

### **Tối ưu truy vấn**
- Phân trang với `skip` và `take`
- Load fields có chọn lọc
- Joins hiệu quả với `leftJoinAndSelect`

---

## 🔐 Bảo Mật

- ✅ Xác thực JWT trên tất cả endpoints
- ✅ Kiểm soát truy cập theo vai trò (AUTHOR, CHAIR, ADMIN)
- ✅ Validate quyền sở hữu
- ✅ Validate loại và kích thước file
- ✅ Bảo vệ SQL injection (parameterized queries)
- ✅ Validate đầu vào với class-validator

---

## 📝 Tài Liệu

### **README.md**
- Hướng dẫn cài đặt
- Tài liệu API
- Hướng dẫn Postman
- Khắc phục sự cố

### **walkthrough.md**
- Chi tiết triển khai
- Sửa lỗi
- Hướng dẫn kiểm thử

### **ApiEndpoints.md**
- Đặc tả endpoints chi tiết
- Ví dụ request/response
- Mã lỗi

### **Swagger UI**
- Tài liệu API tương tác
- Test trực tiếp
- Định nghĩa schema

---

## 🎯 Bước Tiếp Theo

### **Ngay sau khi có Review Service**
1. Implement `GET /submissions/:id/reviews`
2. Thêm lọc theo kết quả review
3. Kiểm thử end-to-end với Review Service
4. Cập nhật tài liệu

### **Cải tiến tương lai**
1. Export submissions ra CSV/Excel
2. Thao tác hàng loạt (chấp nhận/từ chối nhiều bài)
3. Dashboard thống kê
4. Thông báo email
5. Tìm kiếm nâng cao (keywords, abstract)

---

## 👥 Bàn Giao Cho Team

### **Cho Team Review Service**

**API cần thiết:**
```http
GET /reviews/submission/:submissionId
Authorization: Bearer {token}

Response: {
  reviews: [
    {
      reviewerId: number,
      score: number,
      comment: string,
      recommendation: string,
      submittedAt: date
    }
  ],
  averageScore: number
}
```

**Điểm tích hợp:**
- File: `apps/submission-service/src/modules/integration/review.client.ts`
- Method: `getReviewsBySubmission(submissionId: number)`

### **Cho Team Frontend**

**Swagger UI:** http://localhost:3003/api/docs  
**Postman Collection:** `apps/submission-service/UTH-ConfMS-Submission.postman_collection.json`

**Endpoints chính:**
- Upload: `POST /submissions/upload`
- Danh sách (phân trang): `GET /submissions?page=1&limit=10`
- Chi tiết: `GET /submissions/:id`
- Camera-ready: `POST /submissions/:id/camera-ready`

---

## 📞 Hỗ Trợ

**Vấn đề:** Xem phần troubleshooting trong README  
**Logs:** `docker logs -f uth-confms-submission-service-1`  
**Database:** `docker exec -it uth-database psql -U admin -d db_submission`

---

## ✅ Xác Nhận

**Service:** Submission Service  
**Hoàn thành:** 91% (10/11 tính năng)  
**Trạng thái:** ✅ Sẵn sàng tích hợp với Review Service  
**Đã kiểm thử:** ✅ Swagger UI, Postman, Kiểm thử thủ công  
**Đã tài liệu hóa:** ✅ README, Walkthrough, API docs  
**Cập nhật lần cuối:** 30/12/2025
