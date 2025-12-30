# Identity Service - UTH ConfMS

### Bước 1: Khởi động Docker

```bash
# Từ thư mục root của project
docker-compose up 
```

Kiểm tra database đã chạy:
```bash
docker-compose ps
```

### Bước 2: Cấu hình Environment Variables

Tạo file `.env.local` trong `apps/identity-service/`:
```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE=db_identity
JWT_ACCESS_SECRET=jZE6YIUoP_j7SOTLPWgS8kSfX5g4dlOmPMWJVNLMOyg-SMoqXiMRkR0ocJQEGr9HVUjonNIlZNwHzduFfOCJOQ
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=PC25gncs8WDMMcZUOD7WA4gY-DjgfWKMZlWoQXkpm6JLunnZOEVKl8o_k6BQNBedrDEESOmdW5J160gJy7ZPJQ
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
```
### Chạy test các API
```bash
  http://localhost:3001/api/docs
```

### Roles:
- `ADMIN` - Quản trị viên (role mặc định khi đăng ký, có quyền tạo user với các role khác)
- `CHAIR` - Chủ tịch hội nghị
- `AUTHOR` - Tác giả
- `REVIEWER` - Người đánh giá
- `PC_MEMBER` - Thành viên ban chương trình
# Tạo database
docker exec uth_postgres psql -U admin -d postgres -c "CREATE DATABASE db_identity;"
