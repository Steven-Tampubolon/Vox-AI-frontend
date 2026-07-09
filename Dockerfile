# =========================================
# Stage 1 - Build aplikasi React (Vite)
# =========================================
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy manifest dulu supaya layer cache tidak invalid saat source berubah
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy seluruh source
COPY . .

# Vite meng-inject env VITE_* saat BUILD TIME (bukan runtime),
# jadi nilai ini akan "dibakar" ke dalam file JS hasil build.
ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN bun run build

# =========================================
# Stage 2 - Serve hasil build pakai nginx
# =========================================
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]