FROM node:20-alpine

ENV NODE_OPTIONS=--experimental-global-webcrypto

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build identity-service
EXPOSE 3001
CMD ["node", "dist/apps/identity-service/main"]