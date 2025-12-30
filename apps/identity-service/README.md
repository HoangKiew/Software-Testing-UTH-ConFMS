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

Tạo file `.env` trong `apps/identity-service/`:
DB_HOST=localhost
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=

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
