# =========================================
# Stage 1 - Build aplikasi React (Vite)
# =========================================
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

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

COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# sec: SEC-MED-04 — jalankan nginx sebagai non-root user
# Sesuaikan kepemilikan file agar user nginx bisa membaca static assets
# dan menulis ke direktori tmp/pid yang dibutuhkan nginx
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

CMD ["/entrypoint.sh"]