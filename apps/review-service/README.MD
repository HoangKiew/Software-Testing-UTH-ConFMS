
# **CÁC CHỨC NĂNG CỦA REVIEW-SERVICE**
# **HƯỚNG DẪN TẠO TẠI KHOẢN CHO REVIEWER VÀ CHAIR**
## **1. Kết nối giao diện đồ họa cơ sở dữ liệu (tùy chọn)**
\- Nếu dùng phần mềm Dbeaver Community thì làm các bước sau:

\+ Chọn Database -> New Databases connection -> PostgreSQL

\+ Điền thông tin kết nối đến db\_identiy:

- Host: localhost
- Port: 5435
- Database: db\_identity
- User name: admin
- Password: admin123
- Click "Test Connection" → nếu ok click "Finish"

\+ Điền thông tin kết nối đến db\_review:

- Host: localhost
- Port: 5435
- Database: db\_review
- User name: admin
- Password: admin123
- Click "Test Connection" → nếu ok click "Finish".
## **2. Reset dữ liệu (nếu muốn chạy lại service một cách sạch sẽ)**
docker-compose down -v --remove-orphans
## **3. Kiểm tra (bỏ qua cũng được)**
sleep 2; docker exec -i uth-database psql -U admin -d db\_identity -c "SELECT count(\*) FROM users;"
## **4. Chạy service** 
\# from workspace root (d:\uth-confms)

docker-compose up --build -d

\# check status

docker-compose ps
## **5. Truy cập Swagger UI Identity service**
\- Identity: [http://localhost:3001/api/docs](vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)
## **6. Tạo tại khoản admin**
\- POST http://localhost:3001/api/auth/register

\- Body 

{

`  `"email": "admin@example.com",

`  `"password": "123456",

`  `"fullName": "Admin User"

}
## **7. Gửi mã kích hoạt tài khoản tới email**
\- Copy câu lệnh này và chạy trong terminal vs code, nơi chưa thư mục gốc (Ví dụ: d:\uth-confms)

Invoke-RestMethod -Method Get -Uri "http://localhost:3001/api/auth/get-verification-token?email=admin@example.com"

\- Kết quả mong đợi:

{ "message": "Đã gửi mã kích hoạt tài khoản tới email (tồn tại)" }
## **8. Lấy mã xác minh từ cơ sở dữ liệu**
\- Copy câu lệnh này và chạy trong terminal vs code, nơi chưa thư mục gốc (Ví dụ: d:\uth-confms)

docker exec -i uth-database psql -U admin -d db\_identity -t -c "SELECT token FROM email\_verification\_tokens WHERE user\_id=(SELECT id FROM users WHERE email='<admin@example.com>') ORDER BY created\_at DESC LIMIT 1;"

\- Kết quả trả về sẽ là một mã số dạng số, ví dụ: 269759


## **9. Xác minh mã vừa trả về ở bước số 8**
\- Copy câu lệnh này và chạy trong terminal vs code, nơi chưa thư mục gốc (Ví dụ: d:\uth-confms)

\# Copy mã vừa trả về và dán vô token:

Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/api/auth/verify-email' -Body (ConvertTo-Json @{ token='269759' }) -ContentType 'application/json'

\- Kết quả mong đợi:

{ "message": "Xác minh email thành công" }
## **10. Đăng nhập tài khoản vừa xác minh thành công**
\- POST http://localhost:3001/api/auth/login

\- Body:

{

`  `"email": "admin@example.com",

`  `"password": "123456"

}

\- Đăng nhập thành công thì copy accessToken và paste vào Authorize
## **11. Tạo REVIEWER và CHAIR (do Quản trị viên thực hiện)**
\- POST http://localhost:3001/api/users/create

\# Tạo reviewer

\- Body:

{

`  `"email": "reviewer@example.com",

`  `"password": "password123",

`  `"fullName": "Nguyễn Văn Reviewer",

`  `"role": "REVIEWER"

}


\# Tạo chair

{

`  `"email": "chair@example.com",

`  `"password": "password123",

`  `"fullName": "Nguyễn Văn Chair",

`  `"role": "CHAIR"

}
## **12. Xác minh tài khoản REVIEWER và CHAIR**
\- Copy câu lệnh này và chạy trong terminal vs code, nơi chưa thư mục gốc (Ví dụ: d:\uth-confms)

docker exec -i uth-database psql -U admin -d db\_identity -c "UPDATE users SET is\_verified = true WHERE email IN ('reviewer@example.com','chair@example.com');"

\- Kết quả: UPDATE 2
## **13. Đăng nhập tài khoản REVIEWER và CHAIR**
\- POST http://localhost:3001/api/auth/login

\- Body:

{

`  `"email": "reviewer@example.com",

`  `"password": " password123"

}

\+ Chair tương tự như vậy

\- Đăng nhập thành công thì copy accessToken của Reviewer 
## **14. Truy cập Swagger UI Review service**
\- Review: [http://localhost:3004/api/docs](vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)

\- Paste accessToken của reviewer vừa đăng nhập thành công bên identity-service vào Authorize của review-service

## **15. Kiểm tra vai trò của REVIEWER và CHAIR trong review-service**
\- GET http://localhost:3004/api/profile

\- Nhấn try it out -> Excute và cho kết quả:

{

`  `"message": "Bạn đã đăng nhập thành công vào Review Service!",

`  `"user": {

`    `"sub": 2,

`    `"email": "r1@example.com",

`    `"fullName": "r1",

`    `"roles": [

`      `"REVIEWER"

`    `],

`    `"iat": 1767191910,

`    `"exp": 1767193710

`  `}

}
# **APIs REVIEWER**
\- Đăng nhập tài khoản reviewer ở identity-service và cpoy mã accessToke sau đó paste vào authorize ở review-service và sau đó test các api nghiệp vụ của reviewer

\- Mẫu dữ liệu chèn vào bảng assginments:

**INSERT** **INTO** assignments (

`    `"submissionId", 

`    `"reviewerId", 

`    `"conferenceId", 

`    `"assignedBy", 

`    `"deadline", 

`    `"acceptDeadline", 

`    `"reviewDeadline", 

`    `"status"

)

**VALUES** 

('sub-01', 2, 'conf-2025', 'chair1', '2026-01-15 23:59:00+07', '2026-01-05 23:59:00+07', '2026-01-15 23:59:00+07', 'pending'),

('sub-02', 2, 'conf-2025', 'chair1', '2026-01-15 23:59:00+07', '2026-01-05 23:59:00+07', '2026-01-15 23:59:00+07', 'pending'),

('sub-02', 3, 'conf-2025', 'chair1', '2026-01-15 23:59:00+07', '2026-01-05 23:59:00+07', '2026-01-15 23:59:00+07', 'pending'),

('sub-03', 4, 'conf-2025', 'chair1', '2026-01-15 23:59:00+07', '2026-01-05 23:59:00+07', '2026-01-15 23:59:00+07', 'pending'),

('sub-04', 4, 'conf-2025', 'chair1', '2026-01-15 23:59:00+07', '2026-01-05 23:59:00+07', '2026-01-15 23:59:00+07', 'pending'),

('sub-05', 5, 'conf-2025', 'chair1', '2026-01-15 23:59:00+07', '2026-01-05 23:59:00+07', '2026-01-15 23:59:00+07', 'pending'),

('sub-06', 6, 'conf-2025', 'chair1', '2026-01-15 23:59:00+07', '2026-01-05 23:59:00+07', '2026-01-15 23:59:00+07', 'pending');
## **1. REVIEWER NHẬN BÀI ĐƯỢC PHÂN CÔNG**
\- GET <http://localhost:3004/api/reviewer/assignments>

\- Kết quả:

[

`  `{

`    `"id": 1,

`    `"submissionId": "sub-01",

`    `"reviewerId": 2,

`    `"conferenceId": "conf-2025",

`    `"assignedBy": "chair1",

`    `"deadline": "2026-01-15T16:59:00.000Z",

`    `"acceptDeadline": "2026-01-05T16:59:00.000Z",

`    `"reviewDeadline": "2026-01-15T16:59:00.000Z",

`    `"status": "pending",

`    `"assignedAt": "2025-12-31T14:47:42.788Z"

`  `},

`  `{

`    `"id": 2,

`    `"submissionId": "sub-02",

`    `"reviewerId": 2,

`    `"conferenceId": "conf-2025",

`    `"assignedBy": "chair1",

`    `"deadline": "2026-01-15T16:59:00.000Z",

`    `"acceptDeadline": "2026-01-05T16:59:00.000Z",

`    `"reviewDeadline": "2026-01-15T16:59:00.000Z",

`    `"status": "pending",

`    `"assignedAt": "2025-12-31T14:47:42.788Z"

`  `}

]
## **2. REVIWER CHẤP NHẬN HOẶC TỪ CHỐI NHIỆM VỤ**
\- POST http://localhost:3004/api/reviewer/assignments/{id}/accept

\- POST http://localhost:3004/api/reviewer/assignments/{id}/reject

\- Giả sử: http://localhost:3004/api/reviewer/assignments/2/accept

\- Kết quả:

{

`  `"id": 2,

`  `"submissionId": "sub-02",

`  `"reviewerId": 2,

`  `"conferenceId": "conf-2025",

`  `"assignedBy": "chair1",

`  `"deadline": "2026-01-15T16:59:00.000Z",

`  `"acceptDeadline": "2026-01-05T16:59:00.000Z",

`  `"reviewDeadline": "2026-01-15T16:59:00.000Z",

`  `"status": "accepted",

`  `"assignedAt": "2025-12-31T14:47:42.788Z"

}
## **3. REVIEWER XEM VÀ TẢI BÀI MÌNH ĐƯỢC PHÂN CÔNG VỀ**
\- GET http://localhost:3004/api/reviewer/assignments/{id}/paper
## **4. REVIEWER ĐÁNH GIÁ BÀI ĐƯỢC PHÂN CÔNG**
\- POST http://localhost:3004/ /api/reviewer/assignments/{id}/review

\- id: 2

\- Body:

{

`  `"score": 8,

`  `"publicComment": "Bài viết có nội dung chuyên sâu, phương pháp nêu rõ và hợp lý.",

`  `"privateComment": "Cần bổ sung dẫn chứng tại mục Kết quả."

}
## **5. REVIEWER XEM BÀI MÌNH VỪA ĐÁNH GIÁ**
\- GET http://localhost:3004/api/reviewer/assignments/{id}/review

{

`  `"id": "a98ef85f-19c3-4828-b2dc-672a4329abe3",

`  `"assignmentId": 2,

`  `"reviewerId": 2,

`  `"score": 8,

`  `"publicComment": "Bài viết có nội dung chuyên sâu, phương pháp nêu rõ và hợp lý.",

`  `"privateComment": "Cần bổ sung dẫn chứng tại mục Kết quả.",

`  `"isFinal": false,

`  `"createdAt": "2025-12-31T14:55:03.473Z",

`  `"updatedAt": "2025-12-31T14:55:03.473Z",

`  `"histories": []

}
## **6. REVIEWER CHỈNH SỬA ĐÁNH GIÁ**
\- PATCH http://localhost:3004/api/reviewer/assignments/{id}/review

\- id: 2

\- Body:

{

`  `"score": 9,

`  `"publicComment": "Đã cập nhật: phần kết luận rõ ràng hơn, đề xuất chấp nhận.",

`  `"privateComment": "Sửa chi tiết ở trang 5."

}
## **7. REVIEWER NỘP KẾT QUẢ BÀI MÌNH VỪA ĐÁNH GIÁ**
\- POST [http://localhost:3004/api/reviewer/assignments/{id}/submit-final](http://localhost:3004/api/reviewer/assignments/%7bid%7d/submit-final)

\- id: 2

\- Kết quả:

{

`  `"success": true,

`  `"review": {

`    `"id": "a98ef85f-19c3-4828-b2dc-672a4329abe3",

`    `"assignmentId": 2,

`    `"reviewerId": 2,

`    `"score": 9,

`    `"publicComment": "Đã cập nhật: phần kết luận rõ ràng hơn, đề xuất chấp nhận.",

`    `"privateComment": "Sửa chi tiết ở trang 5.",

`    `"isFinal": true,

`    `"createdAt": "2025-12-31T14:55:03.473Z",

`    `"updatedAt": "2025-12-31T14:59:29.582Z"

`  `},

`  `"assignment": {

`    `"id": 2,

`    `"submissionId": "sub-02",

`    `"reviewerId": 2,

`    `"conferenceId": "conf-2025",

`    `"assignedBy": "chair1",

`    `"deadline": "2026-01-15T16:59:00.000Z",

`    `"acceptDeadline": "2026-01-05T16:59:00.000Z",

`    `"reviewDeadline": "2026-01-15T16:59:00.000Z",

`    `"status": "completed",

`    `"assignedAt": "2025-12-31T14:47:42.788Z"

`  `}

}
## **8. REVIEWER THẢO LUẬN NỘI BỘ VỀ BÀI MÀ MÌNH ĐÁNH GIÁ**
\- Những reviewer nào được phân công đánh giá cùng một bài, và họ cùng chấp nhận đánh giá bài đó thì sẽ thảo luận nội bộ với nhau về bài này được

\- POST http://localhost:3004/api/reviewer/discussion/{submissionId}

\- submissionId: 2

\- Body:

{

"content": "Tôi thấy phương pháp ở mục 3 cần làm rõ thêm về biến kiểm soát."

}

\- Kết quả:

{

`  `"id": "6d4bc3e1-d510-44de-bda3-95b683ae189e",

`  `"submissionId": "sub-02",

`  `"senderId": 2,

`  `"content": "Tôi thấy phương pháp ở mục 3 cần làm rõ thêm về biến kiểm soát.",

`  `"createdAt": "2025-12-31T15:02:26.038Z"

}
## **9. REVIEWER XEM THẢO LUẬN NỘI BỘ VỀ BÀI MÀ MÌNH ĐÁNH GIÁ**
\- GET http://localhost:3004/api/reviewer/discussion/{submissionId}
# **APIs CHAIR**
## **1. CHAIR XEM TỔNG HỢP ĐÁNH GIÁ CỦA CÁC REVIEWER**
\- GET [http://localhost:3004/api/chair/submissions/{submissionId}/summary](http://localhost:3004/api/chair/submissions/%7bsubmissionId%7d/summary)

{

`  `"submissionId": "sub-02",

`  `"assignments": [

`    `{

`      `"id": 3,

`      `"submissionId": "sub-02",

`      `"reviewerId": 3,

`      `"conferenceId": "conf-2025",

`      `"assignedBy": "chair1",

`      `"deadline": "2026-01-15T16:59:00.000Z",

`      `"acceptDeadline": "2026-01-05T16:59:00.000Z",

`      `"reviewDeadline": "2026-01-15T16:59:00.000Z",

`      `"status": "pending",

`      `"assignedAt": "2025-12-31T14:47:42.788Z"

`    `},

`    `{

`      `"id": 2,

`      `"submissionId": "sub-02",

`      `"reviewerId": 2,

`      `"conferenceId": "conf-2025",

`      `"assignedBy": "chair1",

`      `"deadline": "2026-01-15T16:59:00.000Z",

`      `"acceptDeadline": "2026-01-05T16:59:00.000Z",

`      `"reviewDeadline": "2026-01-15T16:59:00.000Z",

`      `"status": "completed",

`      `"assignedAt": "2025-12-31T14:47:42.788Z"

`    `}

`  `],

`  `"reviews": [

`    `{

`      `"id": "a98ef85f-19c3-4828-b2dc-672a4329abe3",

`      `"assignmentId": 2,

`      `"reviewerId": 2,

`      `"score": 9,

`      `"publicComment": "Đã cập nhật: phần kết luận rõ ràng hơn, đề xuất chấp nhận.",

`      `"privateComment": "Sửa chi tiết ở trang 5.",

`      `"isFinal": true,

`      `"createdAt": "2025-12-31T14:55:03.473Z",

`      `"updatedAt": "2025-12-31T14:59:29.582Z"

`    `}

`  `],

`  `"discussions": [

`    `{

`      `"id": "6d4bc3e1-d510-44de-bda3-95b683ae189e",

`      `"submissionId": "sub-02",

`      `"senderId": 2,

`      `"content": "Tôi thấy phương pháp ở mục 3 cần làm rõ thêm về biến kiểm soát.",

`      `"createdAt": "2025-12-31T15:02:26.038Z"

`    `}

`  `],

`  `"decision": null

}
## **2. CHAIR RA QUYẾT ĐỊNH CHẤP NHẬN HOẶC TỪ CHỐI BÀI ĐÁNH GIÁ**
\- POST [http://localhost:3004/api/chair/submissions/{submissionId}/decision](http://localhost:3004/api/chair/submissions/%7bsubmissionId%7d/decision)

\- submissionId: sub-02

\- Body:

{

`  `"decision": "accepted",

`  `"note": "Bài viết đạt chất lượng chuyên môn rất tốt sau khi đã sửa đổi theo góp ý của Reviewer."

}

\- Kết quả:

{

`  `"id": "3df3d331-1dff-4f88-a318-b9e8dd91953c",

`  `"submissionId": "sub-02",

`  `"chairId": 7,

`  `"decision": "accepted",

`  `"note": "Bài viết đạt chất lượng chuyên môn rất tốt sau khi đã sửa đổi theo góp ý của Reviewer.",

`  `"createdAt": "2025-12-31T15:11:28.903Z",

`  `"updatedAt": "2025-12-31T15:11:28.903Z"

}
## **3. CHAIR XEM NHỮNG BÀI MÌNH ĐÃ QUYẾT ĐỊNH** 
GET http://localhost:3004/api/chair/submissions/{submissionId}/decision
## **4. CHAIR CHỈNH SỬA QUYẾT ĐỊNH**
PATCH http://localhost:3004/api/chair/submissions/{submissionId}/decision
## **5. CHAIR XÓA QUYẾT ĐỊNH**
DELETE http://localhost:3004/api/chair/submissions/{submissionId}/decision



