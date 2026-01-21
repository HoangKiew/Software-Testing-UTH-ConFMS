FROM node:20-alpine
ENV NODE_OPTIONS=--experimental-global-webcrypto
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build review-service
EXPOSE 3004
CMD ["node", "dist/apps/review-service/main"]










