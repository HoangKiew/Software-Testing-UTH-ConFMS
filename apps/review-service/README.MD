# Review Service – UTH Conference Management System - Version 2

## 1. Tổng quan

**Review Service** là một microservice trong hệ thống **UTH-CONFMS (Conference Management System)**, chịu trách nhiệm **duy nhất** cho nghiệp vụ **đánh giá (review) bài báo khoa học** trong quy trình hội nghị.

---

## 2. Phạm vi trách nhiệm của Review Service

Review Service thực hiện **4 nghiệp vụ cốt lõi**:

1️⃣ Ghi **điểm số** (`score`)
2️⃣ Ghi **nhận xét** (`comment`)
3️⃣ Ghi **quyết định** (`decision`)

* `accept`
* `reject`
* `revise`

4️⃣ Ghi **trạng thái đã nộp hay chưa** (`submitted`)

---

## 3. Database Design

### 3.1 Tạo database & bảng

File: `database/init-script/01-init.sql`

```sql
CREATE DATABASE db_review;

\c db_review;

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    conference_id INT NOT NULL,

    score INT CHECK (score >= 0 AND score <= 10),
    comment TEXT,

    decision VARCHAR(20)
      CHECK (decision IN ('accept', 'reject', 'revise')),

    submitted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Ý nghĩa bảng

* **reviews**
  Lưu nội dung review của reviewer: điểm, nhận xét, quyết định, trạng thái nộp.

---

## 4. API được xây dựng

### 4.1 Health Check

**Endpoint**

```
GET http://localhost:3004/api/health
```

**Mục đích**

* Kiểm tra service có đang chạy hay không

**Response**

```json
{
  "status": "ok",
  "service": "review-service"
}
```

---

### 4.2 Reviewer cập nhật đánh giá

**Endpoint**

```
PATCH /api/reviews/:id
```

**Ý nghĩa**
Reviewer cập nhật review đã được phân công:

* Chấm điểm
* Ghi nhận xét
* Chọn quyết định
* Đánh dấu đã nộp

**Request Body**

```json
{
  "score": 8,
  "comment": "Bài viết tốt, có tính mới.",
  "decision": "accept",
  "submitted": true
}
```

**Response**

```json
{
  "id": 11,
  "submission_id": 11,
  "reviewer_id": 101,
  "conference_id": 10,
  "score": 8,
  "comment": "Bài viết tốt, có tính mới.",
  "decision": "accept",
  "submitted": true,
  "created_at": "...",
  "updated_at": "..."
}
```

---

## Lưu ý:

* Trường `decision` **chỉ chấp nhận**:

  * `accept`
  * `reject`
  * `revise`

* Nếu nhập sai giá trị:

```json
{
  "statusCode": 400,
  "message": "decision must be accept | reject | revise"
}
```

## 5. Chạy & Test Service

### 5.1 Chạy hệ thống bằng Docker

```bash
docker compose up --build
```

### 5.2 Test bằng Postman

* Method: `PATCH`
* URL:

```
http://localhost:3004/api/reviews/11
```

* Body: JSON (raw)
