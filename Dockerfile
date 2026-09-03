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

# baseURL sekarang relatif ke origin — nginx yang handle proxy ke BE.
# Tidak ada lagi VITE_API_KEY di sini.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN bun run build

# =========================================
# Stage 2 - Serve hasil build pakai nginx
# =========================================
FROM nginx:1.27-alpine AS runner

# gettext menyediakan envsubst — dipakai entrypoint untuk substitusi
# variabel ke nginx.conf.template saat container start
RUN apk add --no-cache gettext

COPY --from=builder /app/dist /usr/share/nginx/html

# Salin template (bukan .conf langsung) — akan diproses entrypoint.sh
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

# Entrypoint menjalankan envsubst lalu start nginx
CMD ["/entrypoint.sh"]