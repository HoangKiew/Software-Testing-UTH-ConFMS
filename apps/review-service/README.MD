# Hướng dẫn nhanh kiểm thử review-service

Yêu cầu chung
- Đặt header Authorization: Bearer <access_token> (token từ identity-service, role REVIEWER).

Endpoints chính (tóm tắt)
- GET /api/reviewer/assignments — danh sách phân công
- POST /api/reviewer/assignments/{id}/accept — chấp nhận phân công
- POST /api/reviewer/assignments/{id}/reject — từ chối phân công
- GET /api/reviewer/assignments/{id}/paper — tải file (response trả base64)
- POST /api/reviewer/assignments/{id}/review — tạo review
- PATCH /api/reviewer/assignments/{id}/review — cập nhật review (lưu lịch sử)
- POST /api/reviewer/assignments/{id}/submit-final — nộp final (yêu cầu review có `score` và `publicComment`); idempotent
- GET /api/reviewer/discussion/{submissionId} — xem thảo luận nội bộ
- POST /api/reviewer/discussion/{submissionId} — gửi tin (body: `{ "content": "..." }`)

Mẫu body nhanh để copy vào Swagger
- Tạo / cập nhật review:
```
{
	"score": 8,
	"publicComment": "Nội dung tốt, đề xuất chấp nhận.",
	"privateComment": "Cần chỉnh format bảng 2."
}
```
- Gửi thảo luận nội bộ:
```
{ "content": "Cần kiểm tra lại phần thống kê." }
```

Ghi chú ngắn
- Không gửi `isFinal` khi tạo/cập nhật review — chỉ dùng `submit-final` để finalize.
- Kiểm tra `acceptDeadline` / `reviewDeadline` trong dữ liệu `assignments` để test hành vi quá hạn.
- Nếu file không trả về ở `/paper`, kiểm tra biến môi trường `SUBMISSION_SERVICE_URL` và endpoint file của submission-service.


