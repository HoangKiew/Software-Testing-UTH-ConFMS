FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build identity-service
EXPOSE 3001
CMD ["node", "dist/apps/identity-service/main"]