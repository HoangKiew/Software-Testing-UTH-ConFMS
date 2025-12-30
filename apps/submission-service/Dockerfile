FROM node:18-alpine
ENV NODE_OPTIONS=--experimental-global-webcrypto
WORKDIR /app
RUN apk add --no-cache libc6-compat
# Copy file quản lý thư viện ở gốc
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn Monorepo
COPY . .

# Build đúng tên service đã khai báo trong nest-cli.json
RUN npm run build submission-service

EXPOSE 3003

# Chạy file main.js trong dist
CMD ["node", "dist/apps/submission-service/main.js"]