# UTH - Conference Management System (ConFMS)

Merge code mới nhất của các nhánh, mỗi file đều có .env

# conference-service

NODE_ENV=development
PORT=3002
DB_HOST=postgres # ← ĐÃ SỬA: Không dùng localhost nữa, dùng tên service trong Docker
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE=db_conference
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com # Thay bằng email Gmail thật của bạn
SMTP_PASS=your-app-password # App Password từ Google (không dùng mật khẩu thường)
SMTP_FROM=no-reply@uth-confms.vn # Email hiển thị khi gửi đi
OPENAI_API_KEY=sk-your-openai-key-here # Thay bằng key thật của bạn (bắt buộc nếu dùng AI)
IDENTITY_SERVICE_URL=http://identity-service:3001/api # Để lấy email, thông tin user
REVIEW_SERVICE_URL=http://review-service:3004/api # Để lấy điểm đánh giá tổng hợp
JWT_ACCESS_SECRET=jZE6YIUoP_j7SOTLPWgS8kSfX5g4dlOmPMWJVNLMOyg-SMoqXiMRkR0ocJQEGr9HVUjonNIlZNwHzduFfOCJOQ

# identity-service

DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE=db_identity
JWT_ACCESS_SECRET=jZE6YIUoP_j7SOTLPWgS8kSfX5g4dlOmPMWJVNLMOyg-SMoqXiMRkR0ocJQEGr9HVUjonNIlZNwHzduFfOCJOQ
JWT_ACCESS_EXPIRES_IN=1800
JWT_REFRESH_SECRET=PC25gncs8WDMMcZUOD7WA4gY-DjgfWKMZlWoQXkpm6JLunnZOEVKl8o_k6BQNBedrDEESOmdW5J160gJy7ZPJQ
JWT_REFRESH_EXPIRES_IN=7d
EMAIL_USER=buivanhuy2706@gmail.com
EMAIL_PASS=swvresciaezsfiwh
PORT=3001

# submission-service

//env => submission-service
NODE_ENV=development
PORT=3003

DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE=db_submission

SUPABASE_URL=https://blrxodghcsytpqjtwnoo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJscnhvZGdoY3N5dHBxanR3bm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MjIwNzQsImV4cCI6MjA4MTQ5ODA3NH0.STJKhFgWhvV1DNqV7_RLt0KMryaQx4gSbwQZsjpaLY4
SUPABASE_BUCKET_NAME=submission
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJscnhvZGdoY3N5dHBxanR3bm9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkyMjA3NCwiZXhwIjoyMDgxNDk4MDc0fQ.3HZXyCAIShAMzE2U_fWDfYI3J6BY7R55LOI_jcItTt0
UPLOAD_DEST=./uploads
JWT_ACCESS_SECRET=jZE6YIUoP_j7SOTLPWgS8kSfX5g4dlOmPMWJVNLMOyg-SMoqXiMRkR0ocJQEGr9HVUjonNIlZNwHzduFfOCJOQ

MAX_FILE_SIZE=15728640 # 15MB

CONFERENCE_SERVICE_URL=http://localhost:3002/api
REVIEW_SERVICE_URL=http://localhost:3004/api
