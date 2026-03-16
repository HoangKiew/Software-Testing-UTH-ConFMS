# Stage 1: Build with Node
FROM node:20-alpine AS build

ENV NODE_OPTIONS=--experimental-global-webcrypto

WORKDIR /app

COPY client/package*.json ./
RUN npm install --legacy-peer-deps

COPY client/ .

# VITE_API_BASE_URL is a build-time variable (baked into JS bundle)
# Option A: browser calls directly to localhost:3000
ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
