FROM node:20-alpine

ENV NODE_OPTIONS=--experimental-global-webcrypto

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build api-gateway
EXPOSE 3000
CMD ["node", "dist/apps/api-gateway/main"]











