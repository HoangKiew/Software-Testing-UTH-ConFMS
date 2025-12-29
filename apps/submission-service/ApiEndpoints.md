# 📚 Submission Service - API Endpoints Documentation

## 🎯 Overview

Submission Service cung cấp 9 API endpoints để quản lý submissions (bài nộp) trong hệ thống hội nghị khoa học.

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

### **7. 🔵 GET `/submissions/conference/{conferenceId}`** - Xem Bài Theo Conference

**Mục đích:** CHAIR xem tất cả submissions của một conference

**Quyền:** CHAIR only

**Input:**
- `conferenceId` (path parameter): Conference ID

**Response:** Array of submissions

**Khi nào dùng:** Chair quản lý, review tất cả bài nộp của conference

---

### **8. 🟡 PATCH `/submissions/{id}/status`** - Cập Nhật Trạng Thái

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

### **9. 🟢 POST `/submissions/{id}/camera-ready`** - Upload Bản Final

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
1. GET /conference/{id} → Xem tất cả bài nộp
2. GET /{id} → Xem chi tiết từng bài
3. PATCH /{id}/status → Accept/Reject
```

### **Workflow 3: Camera-Ready (Author)**
```
1. GET /user/me → Check status = ACCEPTED
2. POST /{id}/camera-ready → Upload bản final
3. GET /{id} → Verify upload thành công
```

### **Workflow 4: Withdraw (Author)**
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

---

**Last Updated:** 2025-12-28  
**Version:** 1.0  
**Service Port:** 3003
