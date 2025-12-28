# **REVIEW-SERVICE**
## **1. Tổng quan vai trò trong Review Service**
**Review Service** chịu trách nhiệm quản lý toàn bộ quá trình phản biện bài báo khoa học.\
Các vai trò chính liên quan gồm:

- **Reviewer** (Người phản biện)
- **Chair** (Chủ tịch hội nghị)
## **2. Chức năng chi tiết theo từng vai trò**
### **2.1. Reviewer (Người phản biện/người đánh giá bài báo)**
#### ***a. Nhận bài báo được phân công***
- Mỗi bài báo có thể được phân công cho **nhiều reviewer** (A, B, C…)
- Reviewer **chỉ xem được** các bài báo mà mình được phân công
- Danh tính tác giả **không được tiết lộ**.
#### ***b. Đọc bài báo***
- Reviewer có thể **xem hoặc tải về** bài báo
- **Không xem được đánh giá** của reviewer khác cho đến khi giai đoạn thảo luận được mở
#### ***c. Đánh giá bài báo (Review Submission)***
Reviewer gửi **một bản đánh giá** cho mỗi bài báo, bao gồm

**- Điểm số theo tiêu chí (Scoring Criteria)**

Ví dụ:

• Tính độc đáo

• Chất lượng kỹ thuật

• Tính rõ ràng

• Tính phù hợp

• Điểm tổng thể

Các tiêu chí này **có thể cấu hình** theo từng hội nghị.

**- Nhận xét cho tác giả (Public / Author-visible)**

- Nội dung góp ý, nhận xét dành cho tác giả
- **Ẩn danh reviewer**
- Tác giả chỉ thấy nội dung nhận xét, **không biết người phản biện là a**

**- Nhận xét nội bộ cho Chair**

- Nhận xét mang tính nội bộ
- Không hiển thị cho tác giả
#### ***e. Thảo luận nội bộ (Reviewer Discussion)***
- Các reviewer của **cùng một bài báo** có thể
  - Trao đổi ý kiến
  - Phản biện lẫn nhau
  - Làm rõ quan điểm

Đặc điểm:

- Chỉ **reviewer và chair** được xem
- **Không hiển thị cho tác giả**
#### ***f. Chỉnh sửa đánh giá (nếu còn deadline)***
- Reviewer được phép chỉnh sửa điểm số và nhận xét trước hạn chót
- Hệ thống lưu lại lịch sử chỉnh sửa (audit trail)
### **2.2. Chair (Chủ tịch hội nghị)**
Chair là **người đưa ra quyết định cuối cùng** cho mỗi bài báo.
#### ***a. Xem tổng hợp phản biện***
- Xem:
  - Tất cả đánh giá (review) của các bài báo do từng reviewer đánh giá
  - Xem điểm trung bình và sự khác biệt giữa các đánh giá
  - Chênh lệch quan điểm
- Xem nhận xét nội bộ
#### ***b. Tham gia thảo luận nội bộ***
- Trao đổi với reviewer 
- Không lộ danh tính tác giả
#### ***c. Ra quyết định cho mỗi bài***
Quyết định gồm:

- Accept
- Reject

Hệ thống sẽ lưu lại quyết định này.
#### ***d. Gửi thông báo kết quả cho tác giả***
**- Bulk email**

- Gửi email hàng loạt cho nhiều bài báo
- Gửi cùng lúc đến tất cả tác giả
- Thông báo kết quả cùng lúc đến tất cả tác giả

**- Anonymized feedback**

- Nội dung gửi bao gồm:
- Kết quả bài báo do các reviewer và chair đánh giá
  - Nhận xét dành cho tác giả
  - Không hiển thị tên reviewer
  - Có thể gộp nhiều review

\- Mục đích:

- Giữ bí mật reviewer
- Đảm bảo tính khách quan
## **Lưu ý về Author (Tác giả)**
Author **KHÔNG thuộc review-service**, nhưng là consumer của kết quả.

**Author chỉ có thể:**

- Xem:
  - Quyết định (Accept/Reject)
  - Nhận xét đã ẩn danh
  - Được xem điểm
- Không:
  - Xem thảo luận nội bộ
  - Biết reviewer là ai
# **KIỂM TRA XEM REVIEW-SERVICE CÓ ĐANG CHẠY KHÔNG**
## **1. Chạy review-service**
docker-compose up --build
## **2. API Reviewer health**
\- Dùng để kiểm tra xem review-service hoạt động không.

\- Mở postman:

\+ Chọn GET

\+ Nhập <http://localhost:3004/api/health>

\+ Body: Không có

\+ Header: Không có

\+ Nhấn send và xem kết quả:

{

`    `"status": "Review service is up",

`    `"message": "Review Service is running",

`    `"timestamp": "2025-12-27T13:53:27.971Z"

}
# **TEST CÁC API NGHIỆP VỤ CỦA REVIEWER (NGƯỜI ĐÁNH GIÁ BÀI BÁO) TRONG REVIEW-SERVICE BẰNG POSTMAN**
## **1. API Reviewer register**
\- Mở postman:

\+ Chọn: POST

\+ Body: Không có

\+ Header: Không có

\+ Nhập <http://localhost:3001/api/auth/register>

\+ Body:

{ 

`    `"email": "reviewer@test.com", 

`    `"password": "password123", 

`    `"fullName": "Reviewer Test", 

`    `"role": "reviewer" 

}

\+ Nhấn send và xem kết quả:

{

`    `"user": {

`        `"id": "15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08",

`        `"email": "reviewer@test.com",

`        `"fullName": "Reviewer Test",

`        `"role": "reviewer",

`        `"isActive": true,

`        `"createdAt": "2025-12-28T07:04:51.433Z",

`        `"updatedAt": "2025-12-28T07:04:51.433Z"

`    `},

`    `"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNWZiOGYyMi1hN2M0LTQ5MjItOWJmYy0wYjg4ZTBlZTJkMDgiLCJlbWFpbCI6InJldmlld2VyQHRlc3QuY29tIiwicm9sZSI6InJldmlld2VyIiwiaWF0IjoxNzY2OTA1NDkxLCJleHAiOjE3NjY5MDYzOTF9.n\_5dpe4lTTJQSG-s905YkeNRVRPbFpOfkRJ5-iAAKJA",

`    `"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNWZiOGYyMi1hN2M0LTQ5MjItOWJmYy0wYjg4ZTBlZTJkMDgiLCJlbWFpbCI6InJldmlld2VyQHRlc3QuY29tIiwiaWF0IjoxNzY2OTA1NDkxLCJleHAiOjE3Njc1MTAyOTF9.wVG9p4YLnYsKp78edSjyAITWKzWqpqj2fvoghP5zCsA",

`    `"expiresIn": "15m",

`    `"refreshExpiresIn": "7d"

}
## **2. API Reveiwer login**
\- Mở postman:

\+ Chọn: POST

\+ Nhập <http://localhost:3001/api/auth/login>

\+ Body:

{ 

`    `"email": "reviewer@test.com", 

`    `"password": "password123" 

}

\+ Header: Không có

\+ Nhấn send và xem kết quả:

{

`    `"user": {

`        `"id": "15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08",

`        `"email": "reviewer@test.com",

`        `"fullName": "Reviewer Test",

`        `"role": "reviewer",

`        `"isActive": true,

`        `"createdAt": "2025-12-28T07:04:51.433Z",

`        `"updatedAt": "2025-12-28T07:04:51.433Z"

`    `},

`    `"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNWZiOGYyMi1hN2M0LTQ5MjItOWJmYy0wYjg4ZTBlZTJkMDgiLCJlbWFpbCI6InJldmlld2VyQHRlc3QuY29tIiwicm9sZSI6InJldmlld2VyIiwiaWF0IjoxNzY2OTA1NTkyLCJleHAiOjE3NjY5MDY0OTJ9.cmWitBvZy5XSHp4TW8ieO6k5tIHIbVrTwqsfEkDVJ3M",

`    `"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNWZiOGYyMi1hN2M0LTQ5MjItOWJmYy0wYjg4ZTBlZTJkMDgiLCJlbWFpbCI6InJldmlld2VyQHRlc3QuY29tIiwiaWF0IjoxNzY2OTA1NTkyLCJleHAiOjE3Njc1MTAzOTJ9.MxPQy-l6Ffo4J8Dyw92e1fH1TsTOHaTy\_cIvnZezz90",

`    `"expiresIn": "15m",

`    `"refreshExpiresIn": "7d"

}
## **3. API Reviewer xem bài được phân công**
**a. Chèn dữ liệu vô bảng assignments**

\- Dùng pgadmin hoặc Dbeaver để kết nối tới db\_review

\- Lưu ý khi chèn dữ liệu vào cột reviewerId:

\+ Giá trị của cột này là id của reviewer lúc đăng nhập ở trên:

"id": "15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08",

\+ Copy 15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08 rồi chèn vô câu lệnh SQL

**INSERT** **INTO** assignments (

`  `"submissionId",

`  `"reviewerId",

`  `"conferenceId",

`  `"assignedBy",

`  `"deadline",

`  `"status"

) **VALUES**

('sub-001', '15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08', 'conf-001', 'chair-001', '2026-01-01 23:59:59', 'pending'),

('sub-002', '15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08', 'conf-001', 'chair-001', '2026-01-10 23:59:59', 'pending'),

('sub-003', 'another-reviewer-id', 'conf-001', 'chair-001', '2026-01-05 23:59:59', 'pending');

**b. Test API** 

\- Mở postman:

\+ Chọn: GET

\+ Nhập: <http://localhost:3004/api/reviewer/assignments>

\+ Body: không có

\+ Header:

- + Key: Authorization
- + Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

[

`    `{

`        `"assignmentId": 1,

`        `"submissionId": "sub-001",

`        `"conferenceId": "conf-001",

`        `"title": "Không tải được thông tin bài báo",

`        `"abstract": "",

`        `"status": "pending",

`        `"deadline": "2026-01-01T23:59:59.000Z",

`        `"canAct": true

`    `},

`    `{

`        `"assignmentId": 2,

`        `"submissionId": "sub-002",

`        `"conferenceId": "conf-001",

`        `"title": "Không tải được thông tin bài báo",

`        `"abstract": "",

`        `"status": "pending",

`        `"deadline": "2026-01-10T23:59:59.000Z",

`        `"canAct": true

`    `}

]
## **4. API Reviewer chấp nhận hoặc từ chối nhiệm vụ**
\- Mở postman:

\+ Chọn: POST

\+ Nhập:

- Chấp nhận: http://localhost:3004/api /reviewer/assignments/:id/accept
- Từ chối: http://localhost:3004/api /reviewer/assignments/:id/reject
- Ví dụ: <http://localhost:3004/api/reviewer/assignments/1/accept>

\+ Body: không có

\+ Header:

- + Key: Authorization
- + Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

{

`    `"id": 1,

`    `"submissionId": "sub-001",

`    `"reviewerId": "15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08",

`    `"conferenceId": "conf-001",

`    `"assignedBy": "chair-001",

`    `"deadline": "2026-01-01T23:59:59.000Z",

`    `"status": "accepted",

`    `"createdAt": "2025-12-28T14:07:57.298Z"

}
## **5. API Reviewer xem bài được phân công và tải về**
\- Mở postman:

\+ Chọn: GET

\+ Nhập: http://localhost:3004/api/reviewer/assignments/:id/paper

- Ví dụ: <http://localhost:3004/api/reviewer/assignments/1/paper>

\+ Body: không có

\+ Header:

- Key: Authorization
- Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

{

`    `"message": "Không thể lấy file từ submission-service",

`    `"error": "Not Found",

`    `"statusCode": 404

}

Lỗi 404 từ submission-service → bình thường vì submission-service chưa có endpoint /submissions/:id/file → tạm thời chấp nhận, sau này fix khi submission-service sẵn sàng.
## **6. API Reviewer đánh giá bài báo**
\- Mở postman:

\+ Chọn: POST

\+ Nhập: http://localhost:3004/api/reviewer/assignments/:id/review

- <a name="_hlk217821489"></a>Ví dụ: <http://localhost:3004/api/reviewer/assignments/1/review>

\+ Body:

<a name="_hlk217821582"></a>{

`  `"originality": 8,

`  `"technicalQuality": 7,

`  `"clarity": 9,

`  `"relevance": 6,

`  `"overall": 15,

`  `"publicComment": "Bài báo hay, cần cải thiện phần kết luận",

`  `"privateComment": "Nội bộ: Có thể accept"

}

\+ Header:

- Key: Authorization
- Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

{

`    `"id": "6a3fa0b5-3a3e-47c8-9a7f-5800f22e7abf",

`    `"assignmentId": 1,

`    `"reviewerId": "15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08",

`    `"originality": 8,

`    `"technicalQuality": 7,

`    `"clarity": 9,

`    `"relevance": 6,

`    `"overall": 15,

`    `"publicComment": "Bài báo hay, cần cải thiện phần kết luận",

`    `"privateComment": "Nội bộ: Có thể accept",

`    `"isFinal": true,

`    `"createdAt": "2025-12-28T07:12:50.243Z",

`    `"updatedAt": "2025-12-28T07:12:50.243Z"

}
## <a name="_hlk217821598"></a>**7. API Reviewer xem bài báo đã đánh giá** 
\- Mở postman:

\+ Chọn: GET

\+ Nhập: http://localhost:3004/api/reviewer/assignments/:id/review

- Ví dụ: <http://localhost:3004/api/reviewer/assignments/1/review>

\+ Body: Không có

\+ Header:

- Key: Authorization
- Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

{

`    `"id": "6a3fa0b5-3a3e-47c8-9a7f-5800f22e7abf",

`    `"assignmentId": 1,

`    `"reviewerId": "15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08",

`    `"originality": 8,

`    `"technicalQuality": 7,

`    `"clarity": 9,

`    `"relevance": 6,

`    `"overall": 15,

`    `"publicComment": "Bài báo hay, cần cải thiện phần kết luận",

`    `"privateComment": "Nội bộ: Có thể accept",

`    `"isFinal": true,

`    `"createdAt": "2025-12-28T07:12:50.243Z",

`    `"updatedAt": "2025-12-28T07:12:50.243Z",

`    `"histories": []

}

## **8. API Reviewer chỉnh sửa đánh giá** 
\- Mở postman:

\+ Chọn: PATCH

\+ Nhập: http://localhost:3004/api/reviewer/assignments/:id/review

- Ví dụ: <http://localhost:3004/api/reviewer/assignments/1/review>

\+ Body:

{

`  `"overall": 18,

`  `"publicComment": "Cập nhật: Bài báo xuất sắc, khuyến nghị accept",

`  `"privateComment": "Nội bộ: Strongly accept"

}

\+ Header:

- Key: Authorization
- Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

{

`    `"id": "6a3fa0b5-3a3e-47c8-9a7f-5800f22e7abf",

`    `"assignmentId": 1,

`    `"reviewerId": "15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08",

`    `"originality": 8,

`    `"technicalQuality": 7,

`    `"clarity": 9,

`    `"relevance": 6,

`    `"overall": 18,

`    `"publicComment": "Cập nhật: Bài báo xuất sắc, khuyến nghị accept",

`    `"privateComment": "Nội bộ: Strongly accept",

`    `"isFinal": true,

`    `"createdAt": "2025-12-28T07:12:50.243Z",

`    `"updatedAt": "2025-12-28T07:20:44.465Z"

}
## **9. API Reviewer thảo luận nội bộ**
\- Mở postman:

\+ Chọn: POST

\+ Nhập: http://localhost:3004/api/reviewer/ discussion/:submissionId

- Ví dụ: <http://localhost:3004/api/reviewer/discussion/sub-001>

\+ Body:

{

`  `"content": "Test discussion thành công!"

}

\+ Header:

- Key: Authorization
- Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

{

`    `"id": "2d615d59-0a44-417d-857d-2ab3d01708e4",

`    `"submissionId": "sub-001",

`    `"senderId": "15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08",

`    `"content": "Test discussion thành công!",

`    `"createdAt": "2025-12-28T07:36:02.002Z"

}
## **10. API Reviewer xem toàn bộ thảo luận**
\- Mở postman:

\+ Chọn: GET

\+ Nhập: http://localhost:3004/api/reviewer/ discussion/:submissionId

- Ví dụ: <http://localhost:3004/api/reviewer/discussion/sub-001>

\+ Body: Không có

\+ Header:

- Key: Authorization
- Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

[

`    `{

`        `"id": "2d615d59-0a44-417d-857d-2ab3d01708e4",

`        `"submissionId": "sub-001",

`        `"senderId": "15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08",

`        `"content": "Test discussion thành công!",

`        `"createdAt": "2025-12-28T07:36:02.002Z"

`    `}

]
# **TEST CÁC API NGHIỆP VỤ CỦA CHAIR (CHỦ TỊCH HỘI NGHỊ) TRONG REVIEW-SERVICE BẰNG POSTMAN**
## **1. API Chair register**
\- Mở postman:

\+ Chọn: POST

\+ Body: Không có

\+ Header: Không có

\+ Nhập <http://localhost:3001/api/auth/register>

\+ Body:

{

`  `"email": "chair@test.com",

`  `"password": "password123",

`  `"fullName": "Chair Test",

`  `"role": "chair"

}

\+ Nhấn send và xem kết quả:

{

`    `"user": {

`        `"id": "5766f09d-13d0-4236-bd68-9569392c93cc",

`        `"email": "chair@test.com",

`        `"fullName": "Chair Test",

`        `"role": "chair",

`        `"isActive": true,

`        `"createdAt": "2025-12-28T08:05:34.631Z",

`        `"updatedAt": "2025-12-28T08:05:34.631Z"

`    `},

`    `"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzY2ZjA5ZC0xM2QwLTQyMzYtYmQ2OC05NTY5MzkyYzkzY2MiLCJlbWFpbCI6ImNoYWlyQHRlc3QuY29tIiwicm9sZSI6ImNoYWlyIiwiaWF0IjoxNzY2OTA5MTM0LCJleHAiOjE3NjY5MTAwMzR9.zo4fg1BMj5FLW0lo0FfENwZyeBhk46XzEZX4yQq1ztY",

`    `"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzY2ZjA5ZC0xM2QwLTQyMzYtYmQ2OC05NTY5MzkyYzkzY2MiLCJlbWFpbCI6ImNoYWlyQHRlc3QuY29tIiwiaWF0IjoxNzY2OTA5MTM0LCJleHAiOjE3Njc1MTM5MzR9.Xxp-HT2wIOmPy4LZDNLlQ0pb4XE1NSyQDp5Pipr--so",

`    `"expiresIn": "15m",

`    `"refreshExpiresIn": "7d"

}

## **2. API Chair login**
\- Mở postman:

\+ Chọn: POST

\+ Body: Không có

\+ Header: Không có

\+ Nhập <http://localhost:3001/api/auth/register>

\+ Body:

{

`  `"email": "chair@test.com",

`  `"password": "password123"

}

\+ Nhấn send và xem kết quả:

{

`    `"user": {

`        `"id": "5766f09d-13d0-4236-bd68-9569392c93cc",

`        `"email": "chair@test.com",

`        `"fullName": "Chair Test",

`        `"role": "chair",

`        `"isActive": true,

`        `"createdAt": "2025-12-28T08:05:34.631Z",

`        `"updatedAt": "2025-12-28T08:05:34.631Z"

`    `},

`    `"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzY2ZjA5ZC0xM2QwLTQyMzYtYmQ2OC05NTY5MzkyYzkzY2MiLCJlbWFpbCI6ImNoYWlyQHRlc3QuY29tIiwicm9sZSI6ImNoYWlyIiwiaWF0IjoxNzY2OTA5Mjk4LCJleHAiOjE3NjY5MTAxOTh9.L41g\_sSKW9oekciG7aaz3rL4U5YppRX6bFzCJfgghQQ",

`    `"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzY2ZjA5ZC0xM2QwLTQyMzYtYmQ2OC05NTY5MzkyYzkzY2MiLCJlbWFpbCI6ImNoYWlyQHRlc3QuY29tIiwiaWF0IjoxNzY2OTA5Mjk4LCJleHAiOjE3Njc1MTQwOTh9.1z7cxpEjLGYR60fNmWZTcgVuHsJhorxM\_ndr3mF6kfI",

`    `"expiresIn": "15m",

`    `"refreshExpiresIn": "7d"

}
## **3. API Chair xem tổng hợp phản biện**
\- Mở postman:

\+ Chọn: GET

\+ Nhập: http://localhost:3004/api/chair/submissions/:submissionId/reviews

- Ví dụ: <http://localhost:3004/api/chair/submissions/sub-001/reviews> 

\+ Body: Không có

\+ Header:

- Key: Authorization
- Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

{

`    `"submissionId": "sub-001",

`    `"totalReviews": 1,

`    `"averageScores": {

`        `"originality": 8,

`        `"technicalQuality": 7,

`        `"clarity": 9,

`        `"relevance": 6,

`        `"overall": 18

`    `},

`    `"variance": null,

`    `"reviews": [

`        `{

`            `"reviewerId": "15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08",

`            `"scores": {

`                `"originality": 8,

`                `"technicalQuality": 7,

`                `"clarity": 9,

`                `"relevance": 6,

`                `"overall": 18

`            `},

`            `"publicComment": "Cập nhật: Bài báo xuất sắc, khuyến nghị accept",

`            `"privateComment": "Nội bộ: Strongly accept",

`            `"submittedAt": "2025-12-28T07:12:50.243Z"

`        `}

`    `],

`    `"currentDecision": "pending",

`    `"chairComment": null

}
## **4. API Chair ra quyết định cho bài báo**
\- Mở postman:

\+ Chọn: POST

\+ Nhập: http://localhost:3004/api/chair/submissions/:submissionId/decision

- Ví dụ: <http://localhost:3004/api/chair/submissions/sub-001/decision>

\+ Body: 

{

`  `"decision": "accept",

`  `"chairComment": "Bài báo chất lượng cao, accept với minor revision"

}

\+ Header:

- Key: Authorization
- Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

{

`    `"id": "fec8f8d6-bccb-4aad-ac53-7155255285bb",

`    `"submissionId": "sub-001",

`    `"conferenceId": "conf-001",

`    `"decidedBy": "5766f09d-13d0-4236-bd68-9569392c93cc",

`    `"decision": "accept",

`    `"chairComment": "Bài báo chất lượng cao, accept với minor revision",

`    `"decidedAt": "2025-12-28T08:11:55.414Z"

}
## **5. API Chair gửi hàng loạt mail thông báo về kết quả của các bài báo**
\- Chỉ mới giả lập

\- Mở postman:

\+ Chọn: POST

\+ Nhập: http://localhost:3004/api/chair/notifications/bulk

- Ví dụ: <http://localhost:3004/api/chair/notifications/bulk>

\+ Body: 

{

`  `"submissionIds": ["sub-001", "sub-002"]

}

\+ Header:

- Key: Authorization
- Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

{

`    `"message": "Gửi thông báo thành công (mock)",

`    `"sentTo": [

`        `"sub-001",

`        `"sub-002"

`    `],

`    `"timestamp": "2025-12-28T08:13:42.545Z",

`    `"contentPreview": "Kết quả phản biện đã được gửi ẩn danh đến tác giả"

}


## **6. API Chair tham gia thảo luận nội bộ**
\- Mở postman:

\+ Chọn: POST

\+ Nhập: http://localhost:3004/api/chair/discussion/:submissionId

- Ví dụ: <http://localhost:3004/api/chair/discussion/sub-001>

\+ Body: 

{

`  `"content": "Tôi đồng ý với reviewer, cần thêm dữ liệu"

}

\+ Header:

- Key: Authorization
- Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

{

`    `"id": "f7f8dc71-ba48-4fbc-9362-20baafa23485",

`    `"submissionId": "sub-001",

`    `"senderId": "5766f09d-13d0-4236-bd68-9569392c93cc",

`    `"content": "Tôi đồng ý với reviewer, cần thêm dữ liệu",

`    `"createdAt": "2025-12-28T08:15:42.912Z"

}
## **7. API Chair xem thảo luận nội bộ**
\- Mở postman:

\+ Chọn: GET

\+ Nhập: http://localhost:3004/api/chair/discussion/:submissionId

- Ví dụ: <http://localhost:3004/api/chair/discussion/sub-001>

\+ Body: Không có

\+ Header:

- Key: Authorization
- Value: Bearer + <mã access\_token lúc đăng nhập> (Nhớ là Bearer rồi nhấn space, xong mới nhập mã mã access\_token)

\+ Nhấn send và xem kết quả:

[

`    `{

`        `"id": "2d615d59-0a44-417d-857d-2ab3d01708e4",

`        `"submissionId": "sub-001",

`        `"senderId": "15fb8f22-a7c4-4922-9bfc-0b88e0ee2d08",

`        `"content": "Test discussion thành công!",

`        `"createdAt": "2025-12-28T07:36:02.002Z"

`    `},

`    `{

`        `"id": "f7f8dc71-ba48-4fbc-9362-20baafa23485",

`        `"submissionId": "sub-001",

`        `"senderId": "5766f09d-13d0-4236-bd68-9569392c93cc",

`        `"content": "Tôi đồng ý với reviewer, cần thêm dữ liệu",

`        `"createdAt": "2025-12-28T08:15:42.912Z"

`    `}

]
