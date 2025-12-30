# 📝 Submission Service - UTH Conference Management System

Dịch vụ quản lý nộp bài báo khoa học trong hệ thống UTH-ConfMS. Hỗ trợ upload file lên Supabase Storage, quản lý phiên bản tự động, và tích hợp với Conference Service và Review Service.

---
## .env đã được để trong .env.example.txt

## 📊 Implementation Status

### ✅ Completed Features (10/11)

#### Core CRUD Operations:
- ✅ **Upload bài báo** (PDF/Word/ZIP, max 10MB)
- ✅ **Sửa metadata** (title, abstract, authors) trước deadline
- ✅ **Rút bài nộp** (withdraw) trước deadline
- ✅ **Xem chi tiết submission** (get by ID)
- ✅ **Liệt kê submissions** (của user hoặc theo conference)
- ✅ **Pagination & Filtering** (CHAIR) - Phân trang, lọc, tìm kiếm, sắp xếp **[NEW!]**

#### Advanced Features:
- ✅ **Upload camera-ready** (PDF only, max 15MB) - Bản final sau khi accept
- ✅ **Update status** (CHAIR only) - Accept/Reject submissions
- ✅ **Quản lý version** tự động (1-99: submissions, >= 100: camera-ready)
- ✅ **Kiểm tra deadline** tự động (tích hợp Conference Service)

#### Technical Features:
- ✅ **JWT Authentication** - Bảo mật với role-based access
- ✅ **Supabase Storage** - Lưu file trên cloud
- ✅ **Audit trail** - Ghi log mọi thao tác
- ✅ **Database schema** - TypeORM với auto-sync
- ✅ **Database indexes** - Tối ưu query performance **[NEW!]**
- ✅ **Swagger UI** - API documentation tự động **[NEW!]**
- ✅ **Authors parsing** - Parse và lưu thông tin tác giả **[FIXED!]**

### ❌ Pending Features (1/11)

- ❌ **View anonymized reviews** - Xem reviews ẩn danh sau khi review xong
  - **Lý do:** Phụ thuộc vào Review Service (chưa implement)
  - **API cần:** `GET /api/submissions/:id/reviews`
  - **Dependencies:** Review Service phải có API `GET /reviews/submission/:id`

### 🔮 Future Enhancements (Optional)

- ⚪ **Filter by review results** - Lọc submissions theo kết quả review (cần Review Service)
- ⚪ **Export to CSV/Excel** - Export danh sách submissions
- ⚪ **Bulk operations** - Accept/Reject nhiều papers cùng lúc
- ⚪ **Statistics dashboard** - Thống kê submissions theo status, conference
- ⚪ **Email notifications** - Gửi email khi status thay đổi
- ⚪ **AI spell/grammar check** - Kiểm tra chính tả cho title/abstract (optional theo đề tài)
- ⚪ **AI keyword suggestions** - Gợi ý keywords tự động (optional theo đề tài)

---

## 🎯 Tính năng chính (Summary)

- ✅ **Upload bài báo** (PDF/Word/ZIP, max 10MB)
- ✅ **Upload camera-ready** (PDF, max 15MB) - Bản final sau accept
- ✅ **Sửa metadata** (title, abstract, authors) trước deadline
- ✅ **Rút bài nộp** (withdraw) trước deadline
- ✅ **Quản lý version** tự động (v1, v2, v3...)
- ✅ **Kiểm tra deadline** tự động
- ✅ **Audit trail** - ghi log mọi thao tác
- ✅ **Role-based access** - AUTHOR, CHAIR

---

## 📦 Cài đặt

### 1. Tạo Database

```bash
docker exec -it uth-database psql -U admin -d postgres -c "CREATE DATABASE db_submission;"
```

### 2. Cấu hình Environment (.env)

Tạo file `.env` trong `apps/submission-service/`:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE=db_submission

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET_NAME=submission

# JWT (phải giống Identity Service)
JWT_ACCESS_SECRET=your-jwt-secret

# Service URLs
CONFERENCE_SERVICE_URL=http://conference-service:3002/api
REVIEW_SERVICE_URL=http://review-service:3004/api
```

### 3. Khởi động Service

```bash
# Development
npm run start:dev submission-service

# Production (Docker)
docker-compose up --build submission-service
```

Service chạy tại: `http://localhost:3003/api`

---

## 🔐 Hướng dẫn sử dụng

### Bước 1: Tạo tài khoản AUTHOR

#### 1.1. Đăng ký ADMIN

```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "admin@uth.vn",
  "password": "Admin123!",
  "fullName": "Quản trị viên"
}
```

#### 1.2. Đăng nhập ADMIN

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@uth.vn",
  "password": "Admin123!"
}
```

→ Lưu lại `accessToken`

#### 1.3. ADMIN tạo tài khoản AUTHOR

```http
POST http://localhost:3001/api/users/create
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "author@uth.vn",
  "password": "Author123!",
  "fullName": "Nguyễn Văn A",
  "role": "AUTHOR"
}
```

#### 1.4. Đăng nhập AUTHOR

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "author@uth.vn",
  "password": "Author123!"
}
```

→ Lưu lại `accessToken` để dùng cho các bước tiếp theo

---

### Bước 2: Sử dụng API

## 📋 API Endpoints

### 1. Upload bài nộp

```http
POST /submissions/upload
Authorization: Bearer {author_token}
Content-Type: multipart/form-data

Form Data:
- file: [PDF/Word/ZIP file, max 10MB]
- conferenceId: 1
- title: "Ứng dụng Deep Learning trong nhận diện khuôn mặt"
- abstract: "Bài báo trình bày..."
- authors: [{"name":"Nguyễn Văn A","email":"author@uth.vn","affiliation":"UTH"}]
```

**Response:**
```json
{
  "status": "success",
  "message": "Đã lưu bài nộp và file phiên bản v1 thành công",
  "data": {
    "submissionId": 1,
    "fileId": 1,
    "version": 1,
    "url": "https://...supabase.co/.../papers/1/v1.pdf"
  }
}
```

### 2. Lấy danh sách bài nộp của tôi

```http
GET /submissions/user/me
Authorization: Bearer {author_token}
```

### 3. Lấy chi tiết bài nộp

```http
GET /submissions/:id
Authorization: Bearer {author_token}
```

### 4. Sửa metadata bài nộp

```http
PATCH /submissions/:id
Authorization: Bearer {author_token}
Content-Type: application/json

{
  "title": "Tiêu đề mới",
  "abstract": "Tóm tắt mới",
  "authors": [
    {
      "name": "Nguyễn Văn A",
      "email": "author@uth.vn",
      "affiliation": "UTH"
    }
  ]
}
```

**Lưu ý:**
- Chỉ sửa được **trước deadline**
- Không sửa được nếu đã **ACCEPTED** hoặc **WITHDRAWN**
- Các trường đều **optional**

### 5. Rút bài nộp

```http
DELETE /submissions/:id
Authorization: Bearer {author_token}
```

**Lưu ý:**
- Chỉ rút được bài của mình
- Không rút được nếu đã **ACCEPTED**

### 6. Upload Camera-Ready (Bản cuối cùng)

**Khi nào dùng:** Sau khi paper được ACCEPTED, author upload bản final để xuất bản.

```http
POST /submissions/:id/camera-ready
Authorization: Bearer {author_token}
Content-Type: multipart/form-data

Form Data:
- file: [PDF file only, max 15MB]
```

**Response:**
```json
{
  "status": "success",
  "message": "Đã upload camera-ready version 1 thành công",
  "data": {
    "submissionId": 1,
    "fileId": 5,
    "version": 101,
    "url": "https://.../papers/1/camera-ready/camera_ready_v1.pdf",
    "submittedAt": "2025-12-27T12:00:00Z"
  }
}
```

**Lưu ý:**
- Chỉ upload được khi status = **ACCEPTED**
- Chỉ chấp nhận file **PDF**
- Version >= 100 (để phân biệt với submission files)
- Lưu riêng folder `camera-ready/`
- Có thể upload nhiều lần (v1, v2, v3...)

### 7. Cập nhật trạng thái (CHAIR only)

```http
PATCH /submissions/:id/status
Authorization: Bearer {chair_token}
Content-Type: application/json

{
  "status": "ACCEPTED",
  "comment": "Great paper!"
}
```

**Statuses:**
- `SUBMITTED` - Vừa nộp
- `UNDER_REVIEW` - Đang review
- `ACCEPTED` - Chấp nhận
- `REJECTED` - Từ chối
- `WITHDRAWN` - Đã rút

---

## 🧪 Test với Postman

### Import Collection

1. Mở Postman
2. Click **Import**
3. Chọn file `UTH-ConfMS-Submission.postman_collection.json`
4. Collection sẽ tự động cấu hình variables

### Thứ tự test

1. **Setup - Identity Service**
   - Register ADMIN
   - Login ADMIN (auto-save token)
   - Create AUTHOR Account
   - Login AUTHOR (auto-save token)

2. **Submit Paper** (auto-save submissionId)
3. **Get My Submissions**
4. **Get Submission by ID**
5. **Update Submission Metadata**
6. **Withdraw Submission**

---

## 🗄️ Database Schema

### Bảng: `submission`
- `id` - Primary key
- `title` - Tiêu đề bài báo
- `abstract` - Tóm tắt
- `conference_id` - ID hội nghị
- `created_by` - ID tác giả
- `status` - SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED, WITHDRAWN
- `created_at`, `updated_at`, `withdrawn_at`
- `camera_ready_submitted_at` - Thời điểm upload camera-ready

### Bảng: `submission_file`
- `id` - Primary key
- `submission_id` - Foreign key
- `file_path` - URL file trên Supabase
- `version` - Phiên bản:
  - 1-99: Submission files (v1, v2, v3...)
  - >= 100: Camera-ready files (101, 102, 103...)
- `uploaded_at`

### Bảng: `submission_author`
- `id` - Primary key
- `submission_id` - Foreign key
- `name` - Tên tác giả
- `email` - Email
- `affiliation` - Đơn vị công tác

### Bảng: `audit_trail`
- `id` - Primary key
- `action` - CREATE, UPDATE, UPLOAD, WITHDRAW
- `entity_type` - SUBMISSION, FILE
- `entity_id` - ID của entity
- `actor_id` - ID người thực hiện
- `details` - Chi tiết JSON
- `created_at`

---

## 🛠️ Kiểm tra Database

```bash
# Truy cập Postgres
docker exec -it uth-database psql -U admin -d db_submission

# Xem danh sách bài nộp
SELECT * FROM submission;

# Xem files đã upload
SELECT * FROM submission_file;

# Xem audit logs
SELECT * FROM audit_trail ORDER BY created_at DESC LIMIT 10;

# Thoát
\q
```

---

## ⚠️ Troubleshooting

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| **Unauthorized** | Token sai hoặc hết hạn | Đăng nhập lại và lấy token mới |
| **Lỗi Cloud Storage** | Supabase credentials sai | Kiểm tra `.env` |
| **File too large** | File > 10MB (submission) hoặc > 15MB (camera-ready) | Nén file hoặc giảm kích thước |
| **Invalid file type** | File không đúng định dạng | Submission: PDF/Word/ZIP, Camera-ready: chỉ PDF |
| **Deadline đã qua** | Hội nghị đã đóng nộp bài | Không thể nộp/sửa sau deadline |
| **Không thể sửa bài đã accept** | Bài đã ACCEPTED | Không thể sửa metadata sau khi accept |
| **Chỉ upload camera-ready cho bài ACCEPTED** | Status không phải ACCEPTED | Chỉ upload camera-ready sau khi paper được accept |
| **updateDto is undefined** | Dùng form-data thay vì JSON cho PATCH | Dùng `Content-Type: application/json` cho PATCH |

---

## 📊 API Summary

| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| POST | `/submissions/upload` | AUTHOR | Upload bài nộp mới |
| GET | `/submissions/user/me` | AUTHOR | Danh sách bài của tôi |
| GET | `/submissions/:id` | AUTHOR/CHAIR | Chi tiết bài nộp |
| PATCH | `/submissions/:id` | AUTHOR | Sửa metadata |
| DELETE | `/submissions/:id` | AUTHOR | Rút bài nộp |
| POST | `/submissions/:id/camera-ready` | AUTHOR | Upload bản final (sau ACCEPT) |
| PATCH | `/submissions/:id/status` | CHAIR | Cập nhật trạng thái |
| GET | `/submissions/conference/:conferenceId` | CHAIR | Lấy submissions theo conference |

---

## 🔗 Tích hợp

- **Identity Service** (port 3001) - Authentication & Authorization
- **Conference Service** (port 3002) - Deadline checking
- **Review Service** (port 3004) - Notifications
- **Supabase Storage** - File storage

---

## 📝 Notes

- TypeORM với `synchronize: true` tự động tạo bảng khi khởi động
- **File paths trên Supabase:**
  - Submission files: `papers/{submissionId}/v{version}.{ext}`
  - Camera-ready files: `papers/{submissionId}/camera-ready/camera_ready_v{version}.pdf`
- Mọi thao tác đều được ghi audit log
- Deadline được check tự động trước mọi thao tác nộp/sửa
- Camera-ready chỉ chấp nhận PDF và có size limit 15MB (vs 10MB cho submission)

---

## ⚠️ Known Issues

### Minor Issues:
1. **Camera-ready response `submittedAt` is null** - Timestamp được lưu vào DB nhưng không trả về trong response. Không ảnh hưởng chức năng.
2. **Hot-reload sometimes fails** - Cần restart service hoặc xóa `dist` folder khi code không update.

### Workarounds:
- **Issue 1:** Query database trực tiếp để xem timestamp: `SELECT camera_ready_submitted_at FROM submission WHERE id = X;`
- **Issue 2:** Restart service: `Ctrl+C` → `npm run start:dev submission-service`

---

## 🚧 Future Work

### High Priority (Depends on other services):
1. **View Anonymized Reviews** - Cần Review Service implement API
   ```typescript
   GET /api/submissions/:id/reviews
   // Returns: anonymized reviews (hide reviewer identity)
   ```

2. **Email Notifications** - Cần Email Service
   - Notify authors when status changes
   - Notify when deadline approaching
   - Notify when camera-ready deadline

### Medium Priority (Enhancements):
1. **Batch Upload** - Upload nhiều submissions cùng lúc
2. **Version Comparison** - So sánh diff giữa các versions
3. **Advanced Search** - Search by title, abstract, keywords
4. **Statistics Dashboard** - Submission stats by conference/track

### Low Priority (Optional):
1. **AI Features** (theo đề tài):
   - Spell/grammar check for title/abstract
   - Keyword suggestions
   - Abstract polishing
2. **Export Features**:
   - Export submissions to Excel
   - Generate submission reports

---

## � Testing với Postman

### Import Postman Collection

Submission Service có sẵn Postman collection để test tất cả endpoints.

#### **Bước 1: Import Collection**

1. Mở Postman
2. Click **Import** (góc trái trên)
3. Chọn file: `apps/submission-service/UTH-ConfMS-Submission.postman_collection.json`
4. Click **Import**

#### **Bước 2: Setup Environment**

Tạo environment với các biến:

```json
{
  "base_url": "http://localhost:3003/api",
  "identity_url": "http://localhost:3001/api",
  "author_token": "",
  "chair_token": "",
  "admin_token": ""
}
```

**Cách tạo:**
1. Click **Environments** (bên trái)
2. Click **+** để tạo mới
3. Đặt tên: "UTH-ConfMS Local"
4. Thêm các variables trên
5. Click **Save**

#### **Bước 3: Lấy Tokens**

**3.1. Login Author:**
```
POST {{identity_url}}/auth/login
Body: {
  "email": "author@uth.vn",
  "password": "Author123!"
}
```
→ Copy `accessToken` → Paste vào `author_token`

**3.2. Login Chair:**
```
POST {{identity_url}}/auth/login
Body: {
  "email": "chair@uth.vn",
  "password": "Chair123!"
}
```
→ Copy `accessToken` → Paste vào `chair_token`

#### **Bước 4: Test Endpoints**

Collection có sẵn các requests:

**📁 Folder: Setup**
- ✅ Register Author
- ✅ Register Chair
- ✅ Login Author
- ✅ Login Chair

**📁 Folder: Submissions (Author)**
- ✅ Upload Submission
- ✅ Get My Submissions
- ✅ Get Submission by ID
- ✅ Update Metadata
- ✅ Withdraw Submission
- ✅ Upload Camera-Ready

**📁 Folder: Management (Chair)**
- ✅ Get All Submissions (Pagination)
- ✅ Get Submissions by Conference
- ✅ Update Status

**📁 Folder: Filters & Search**
- ✅ Filter by Status
- ✅ Filter by Conference
- ✅ Search by Title
- ✅ Date Range Filter
- ✅ Combined Filters

---

### 🎯 Testing Workflow

#### **Workflow 1: Submit Paper (Author)**

1. **Login Author** → Lưu token
2. **Upload Submission** → Lưu `submissionId`
3. **Get My Submissions** → Verify submission hiện trong list
4. **Update Metadata** (optional) → Sửa title/abstract
5. **Get Submission by ID** → Check details

#### **Workflow 2: Review & Accept (Chair)**

1. **Login Chair** → Lưu token
2. **Get All Submissions** → Xem tất cả submissions
3. **Filter by Conference** → Lọc theo conference
4. **Update Status** → Accept/Reject paper
5. **Get Submissions by Status** → Verify status updated

#### **Workflow 3: Camera-Ready Upload (Author)**

1. **Login Author** → Lưu token
2. **Get My Submissions** → Tìm paper đã ACCEPTED
3. **Upload Camera-Ready** → Upload PDF final
4. **Get Submission by ID** → Verify camera-ready uploaded

---

### 💡 Tips

**Auto-save tokens:**
Trong Postman, thêm script vào Login requests:

```javascript
// Tab "Tests" của Login request
pm.test("Save token", function () {
    var jsonData = pm.response.json();
    pm.environment.set("author_token", jsonData.accessToken);
});
```

**Pre-request Scripts:**
Collection đã có sẵn scripts tự động thêm Authorization header:

```javascript
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get("author_token")
});
```

**Variables:**
Dùng `{{variable}}` trong requests:
- `{{base_url}}/submissions`
- `{{author_token}}`
- `{{submissionId}}`

---

### 🐛 Troubleshooting Postman

**Lỗi 401 Unauthorized:**
- Token chưa set hoặc hết hạn (15 phút)
- → Login lại và update token

**Lỗi 403 Forbidden:**
- Dùng sai role (AUTHOR token cho CHAIR endpoint)
- → Dùng đúng token

**File upload không work:**
- Chọn "form-data" trong Body
- Key "file" phải là type "File"
- Chọn file từ máy

**Variables không work:**
- Environment chưa select
- → Click dropdown góc phải trên, chọn "UTH-ConfMS Local"

---

## �📞 Support & Contact

**Issues?** Check:
1. Troubleshooting section above
2. Terminal logs for detailed errors
3. Database state: `docker exec -it uth-database psql -U admin -d db_submission`

**Need Help?**
- Review [walkthrough.md](file:///C:/Users/ASUS/.gemini/antigravity/brain/35e94c12-59e4-4448-9d0d-8e4dd133fbf6/walkthrough.md) for complete implementation details
- Check [camera-ready-testing.md](file:///C:/Users/ASUS/.gemini/antigravity/brain/35e94c12-59e4-4448-9d0d-8e4dd133fbf6/camera-ready-testing.md) for testing guide

---

## 🎉 Completion Status

**Overall Progress:** ✅ **91% Complete** (10/11 features)

**Completed:**
- ✅ All core CRUD operations
- ✅ Camera-ready upload workflow
- ✅ Pagination & filtering (NEW!)
- ✅ Database indexes for performance
- ✅ Swagger UI documentation
- ✅ Authors parsing fixed
- ✅ Postman collection

**Pending:**
- ⚠️ View anonymized reviews (waiting for Review Service)

**Ready for:**
- ✅ Development testing
- ✅ Integration testing with Conference Service
- ✅ Demo presentation
- ✅ Swagger UI testing
- ✅ Postman testing
- ⚠️ Production (needs Review Service for complete workflow)

**Last Updated:** 2025-12-30
