# 📚 Submission Service - API Endpoints Documentation

## 🎯 Overview

Submission Service cung cấp 10 API endpoints để quản lý submissions (bài nộp) trong hệ thống hội nghị khoa học.

**Base URL:** `http://localhost:3003/api`  
**Authentication:** JWT Bearer Token (required for all endpoints)  
**Swagger UI:** http://localhost:3003/api/docs

---

## 📋 Danh sách Endpoints

### **1. 🟢 POST `/submissions/upload`** - Upload Bài Báo Mới

**Mục đích:** Author upload paper lần đầu tiên cho conference

**Quyền:** AUTHOR, CHAIR, ADMIN

**Input (multipart/form-data):**
```
file: PDF/Word/ZIP file (max 10MB)
conferenceId: number (ID của conference)
title: string (Tiêu đề bài báo)
abstract: string (Tóm tắt)
authors: JSON string (Danh sách tác giả)
```

**Example:**
```json
{
  "conferenceId": 1,
  "title": "Deep Learning for Face Recognition",
  "abstract": "This paper presents...",
  "authors": "[{\"name\":\"John Doe\",\"email\":\"john@uth.vn\",\"affiliation\":\"UTH\"}]"
}
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
    "url": "https://.../papers/1/v1.pdf"
  }
}
```

**Validation:**
- ✅ File size ≤ 10MB
- ✅ File type: PDF, Word, ZIP
- ✅ Trong deadline (check với Conference Service)
- ✅ User phải có role AUTHOR

**Khi nào dùng:** Author muốn nộp bài cho conference

---

### **2. 🔵 GET `/submissions/user/me`** - Xem Bài Nộp Của Tôi

**Mục đích:** Lấy danh sách tất cả submissions của user hiện tại

**Quyền:** AUTHOR, CHAIR

**Input:** Không (dùng JWT token để identify user)

**Response:**
```json
[
  {
    "id": 1,
    "title": "My Paper Title",
    "status": "SUBMITTED",
    "conferenceId": 1,
    "createdAt": "2025-12-27T10:00:00Z",
    "files": [...],
    "authors": [...]
  }
]
```

**Khi nào dùng:** Author xem các bài mình đã nộp, check status

---

### **3. 🔵 GET `/submissions/user/{userId}`** - Xem Bài Nộp Của User Khác

**Mục đích:** CHAIR xem submissions của một author cụ thể

**Quyền:** CHAIR only

**Input:**
- `userId` (path parameter): ID của user cần xem

**Response:** Giống endpoint `/user/me`

**Khi nào dùng:** Chair quản lý, xem bài của từng author

---

### **4. 🔵 GET `/submissions/{id}`** - Xem Chi Tiết Submission

**Mục đích:** Xem thông tin đầy đủ của một submission

**Quyền:** AUTHOR (owner), CHAIR

**Input:**
- `id` (path parameter): Submission ID

**Response:**
```json
{
  "id": 1,
  "conferenceId": 1,
  "title": "Paper Title",
  "abstract": "Abstract text...",
  "status": "SUBMITTED",
  "createdBy": 2,
  "createdAt": "2025-12-27T10:00:00Z",
  "updatedAt": "2025-12-27T11:00:00Z",
  "files": [
    {
      "id": 1,
      "filePath": "https://.../v1.pdf",
      "version": 1,
      "uploadedAt": "2025-12-27T10:00:00Z"
    }
  ],
  "authors": [
    {
      "name": "John Doe",
      "email": "john@uth.vn",
      "affiliation": "UTH",
      "isCorresponding": true
    }
  ]
}
```

**Validation:**
- ✅ Author chỉ xem được bài của mình
- ✅ Chair xem được tất cả

**Khi nào dùng:** Xem details một bài cụ thể

---

### **5. 🟡 PATCH `/submissions/{id}`** - Sửa Metadata

**Mục đích:** Author cập nhật thông tin submission (không phải file)

**Quyền:** AUTHOR (owner only)

**Input (application/json):**
```json
{
  "title": "Updated Title",
  "abstract": "Updated abstract",
  "authors": [
    {
      "name": "Updated Name",
      "email": "updated@uth.vn",
      "affiliation": "UTH"
    }
  ]
}
```

**⚠️ Lưu ý:** 
- Content-Type phải là `application/json` (KHÔNG phải form-data!)
- Tất cả fields đều optional

**Validation:**
- ✅ Chỉ owner mới sửa được
- ✅ Phải trước deadline
- ❌ Không sửa được nếu status = ACCEPTED hoặc WITHDRAWN

**Response:**
```json
{
  "status": "success",
  "message": "Đã cập nhật bài nộp thành công"
}
```

**Khi nào dùng:** Author phát hiện lỗi chính tả, muốn cập nhật thông tin

---

### **6. 🔴 DELETE `/submissions/{id}`** - Rút Bài Nộp

**Mục đích:** Author withdraw submission (soft delete)

**Quyền:** AUTHOR (owner only)

**Input:**
- `id` (path parameter): Submission ID

**Validation:**
- ✅ Chỉ owner mới rút được
- ❌ Không rút được nếu status = ACCEPTED

**Response:**
```json
{
  "status": "success",
  "message": "Đã rút bài nộp thành công"
}
```

**Hành động:**
- Status → WITHDRAWN
- Set `withdrawn_at` timestamp
- Ghi audit log

**Khi nào dùng:** Author không muốn submit nữa, hoặc submit nhầm

---

### **7. 🔵 GET `/submissions`** - Danh Sách Với Phân Trang & Lọc ⭐ NEW!

**Mục đích:** CHAIR xem tất cả submissions với phân trang, lọc, tìm kiếm

**Quyền:** CHAIR, ADMIN only

**Query Parameters (tất cả optional):**
```
page: number (default: 1) - Số trang
limit: number (default: 10, max: 100) - Số bài/trang
status: enum - Lọc theo trạng thái (SUBMITTED, ACCEPTED, REJECTED, etc.)
conferenceId: number - Lọc theo hội nghị
createdFrom: string (ISO 8601) - Lọc từ ngày (VD: 2025-01-01)
createdTo: string (ISO 8601) - Lọc đến ngày (VD: 2025-12-31)
search: string - Tìm kiếm trong tiêu đề (không phân biệt hoa thường)
sortBy: enum - Sắp xếp theo (createdAt, updatedAt, title)
order: enum - Thứ tự (ASC, DESC)
```

**Example Request:**
```http
GET /api/submissions?page=1&limit=10&status=ACCEPTED&conferenceId=1&search=deep learning&sortBy=createdAt&order=DESC
```

**Response:**
```json
{
  "data": [
    {
      "id": 5,
      "conference_id": 1,
      "title": "Deep Learning for Face Recognition",
      "abstract": "This paper presents...",
      "status": "SUBMITTED",
      "created_by": 4,
      "created_at": "2025-12-28T07:22:12.196Z",
      "updated_at": "2025-12-28T07:22:12.196Z",
      "withdrawn_at": null,
      "camera_ready_submitted_at": null,
      "files": [
        {
          "id": 9,
          "submission_id": 5,
          "file_path": "https://...supabase.co/.../papers/5/v1.pdf",
          "version": 1,
          "uploaded_at": "2025-12-28T07:22:14.512Z"
        }
      ],
      "authors": []
    }
  ],
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

**Tính năng:**
- ✅ Phân trang với page validation (tự động giới hạn trong phạm vi hợp lệ)
- ✅ Lọc theo nhiều tiêu chí (status, conference, date range)
- ✅ Tìm kiếm không phân biệt hoa thường
- ✅ Sắp xếp linh hoạt (theo ngày, tiêu đề)
- ✅ Xử lý timezone (createdTo bao gồm cả ngày)
- ✅ Database indexes để tối ưu hiệu suất

**Use Cases:**
- Chair xem tất cả bài nộp của hội nghị với phân trang
- Lọc chỉ bài đã ACCEPTED để chuẩn bị proceedings
- Tìm kiếm bài theo từ khóa trong tiêu đề
- Xem bài nộp trong khoảng thời gian cụ thể

**Khi nào dùng:** Chair quản lý, tìm kiếm, lọc submissions

---

### **8. 🔵 GET `/submissions/conference/{conferenceId}`** - Xem Bài Theo Conference

**Mục đích:** CHAIR xem tất cả submissions của một conference

**Quyền:** CHAIR only

**Input:**
- `conferenceId` (path parameter): Conference ID

**Response:** Array of submissions

**Khi nào dùng:** Chair quản lý, review tất cả bài nộp của conference

---

### **9. 🟡 PATCH `/submissions/{id}/status`** - Cập Nhật Trạng Thái

**Mục đích:** CHAIR accept/reject paper sau khi review

**Quyền:** CHAIR only

**Input (application/json):**
```json
{
  "status": "ACCEPTED",
  "comment": "Great paper!"
}
```

**Statuses:**
- `SUBMITTED` - Vừa nộp
- `UNDER_REVIEW` - Đang review
- `ACCEPTED` - Chấp nhận ✅
- `REJECTED` - Từ chối ❌
- `WITHDRAWN` - Đã rút

**Response:**
```json
{
  "status": "success",
  "message": "Đã cập nhật trạng thái thành công"
}
```

**Khi nào dùng:** Sau khi review xong, Chair quyết định accept/reject

---

### **10. 🟢 POST `/submissions/{id}/camera-ready`** - Upload Bản Final

**Mục đích:** Author upload camera-ready version sau khi được accept

**Quyền:** AUTHOR (owner only)

**Input (multipart/form-data):**
```
file: PDF file only (max 15MB)
```

**Validation:**
- ✅ Chỉ khi status = ACCEPTED
- ✅ Chỉ chấp nhận PDF
- ✅ Max 15MB (lớn hơn submission thường)

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

**Đặc điểm:**
- Version >= 100 (để phân biệt với submission files)
- Lưu riêng folder `camera-ready/`
- Có thể upload nhiều lần (v1, v2, v3...)
- Set timestamp `camera_ready_submitted_at`

**Khi nào dùng:** Sau khi paper được accept, upload bản cuối để xuất bản proceedings

---

## 🔄 Workflow Thực Tế

### **Workflow 1: Submit Paper (Author)**
```
1. POST /upload → Nộp bài lần đầu
2. GET /user/me → Xem bài đã nộp
3. PATCH /{id} → Sửa lỗi (nếu cần, trước deadline)
4. GET /{id} → Check lại thông tin
```

### **Workflow 2: Review Process (Chair)**
```
1. GET /submissions?page=1&limit=10 → Xem tất cả bài nộp (phân trang) ⭐ NEW!
2. GET /submissions?status=SUBMITTED&conferenceId=1 → Lọc bài cần review
3. GET /{id} → Xem chi tiết từng bài
4. PATCH /{id}/status → Accept/Reject
```

### **Workflow 3: Search & Filter (Chair)** ⭐ NEW!
```
1. GET /submissions?search=deep learning → Tìm kiếm theo từ khóa
2. GET /submissions?status=ACCEPTED&conferenceId=1 → Lọc bài đã accept
3. GET /submissions?createdFrom=2025-01-01&createdTo=2025-12-31 → Lọc theo thời gian
4. GET /submissions?sortBy=title&order=ASC → Sắp xếp theo tiêu đề
```

### **Workflow 4: Camera-Ready (Author)**
```
1. GET /user/me → Check status = ACCEPTED
2. POST /{id}/camera-ready → Upload bản final
3. GET /{id} → Verify upload thành công
```

### **Workflow 5: Withdraw (Author)**
```
1. GET /user/me → Xem bài đã nộp
2. DELETE /{id} → Rút bài (nếu chưa accept)
```

---

## 🔒 Authentication & Authorization

### **Lấy JWT Token:**
```bash
# Login qua Identity Service
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"author@uth.vn","password":"Author123!"}'

# Copy accessToken từ response
```

### **Sử dụng Token:**
```bash
# Thêm vào header
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Trong Swagger UI:**
1. Click nút "Authorize" 🔒
2. Paste token vào ô "Value"
3. Click "Authorize"
4. Tất cả requests tự động có token!

---

## ⚠️ Common Errors

| Error | Meaning | Solution |
|-------|---------|----------|
| **401 Unauthorized** | Token không hợp lệ hoặc hết hạn | Login lại, lấy token mới |
| **403 Forbidden** | Không có quyền (role sai) | Dùng đúng user (AUTHOR/CHAIR) |
| **400 Bad Request** | Dữ liệu không hợp lệ | Check file size, type, required fields |
| **404 Not Found** | Submission không tồn tại | Check submission ID |
| **Deadline đã qua** | Conference đã đóng deadline | Không thể submit/update |
| **Chỉ upload camera-ready cho bài ACCEPTED** | Status không phải ACCEPTED | Chỉ upload sau khi được accept |

---

## 📊 Database Schema

### **submission** table:
```sql
id, conference_id, title, abstract, status,
created_by, created_at, updated_at, withdrawn_at,
camera_ready_submitted_at
```

**Indexes:** ⭐ NEW!
```sql
CREATE INDEX idx_submission_status ON submission(status);
CREATE INDEX idx_submission_conference_id ON submission(conference_id);
CREATE INDEX idx_submission_created_at ON submission(created_at);
```

### **submission_file** table:
```sql
id, submission_id, file_path, version, uploaded_at
```
**Version numbering:**
- 1-99: Regular submissions
- >= 100: Camera-ready files

### **submission_author** table:
```sql
id, submission_id, author_name, email, is_corresponding
```

---

## 🧪 Testing

### **Với Swagger UI:**
1. Truy cập: http://localhost:3003/api/docs
2. Click "Authorize" → Nhập token
3. Click endpoint → "Try it out" → Điền data → "Execute"

### **Với curl:**
```bash
# Upload submission
curl -X POST http://localhost:3003/api/submissions/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@paper.pdf" \
  -F "conferenceId=1" \
  -F "title=Test Paper"

# Get my submissions
curl http://localhost:3003/api/submissions/user/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Pagination & filtering ⭐ NEW!
curl "http://localhost:3003/api/submissions?page=1&limit=10&status=ACCEPTED" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Với Postman:**
Import collection: `UTH-ConfMS-Submission.postman_collection.json`

---

## 📝 Notes

- Tất cả endpoints đều require JWT authentication
- File uploads dùng `multipart/form-data`
- Metadata updates dùng `application/json`
- Deadline được check tự động với Conference Service
- Mọi thao tác đều ghi audit log
- Camera-ready có size limit lớn hơn (15MB vs 10MB)
- **Pagination endpoint có database indexes để tối ưu hiệu suất** ⭐ NEW!

---

**Last Updated:** 2025-12-30  
**Version:** 1.1  
**Service Port:** 3003
