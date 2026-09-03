#!/bin/sh
set -e

# Validasi: pastikan semua env var wajib tersedia sebelum nginx start
: "${API_KEY:?ERROR: API_KEY environment variable wajib diset}"
: "${BACKEND_HOST:?ERROR: BACKEND_HOST environment variable wajib diset}"
: "${BACKEND_PORT:?ERROR: BACKEND_PORT environment variable wajib diset}"

# Substitusi placeholder di nginx.conf.template → nginx.conf
# Hanya ganti 3 variabel ini — variabel nginx ($host, $uri, dll) dibiarkan
envsubst '${API_KEY} ${BACKEND_HOST} ${BACKEND_PORT}' \
    < /etc/nginx/conf.d/default.conf.template \
    > /etc/nginx/conf.d/default.conf

echo "[entrypoint] nginx.conf generated, starting nginx..."

exec nginx -g "daemon off;"