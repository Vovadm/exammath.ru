#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERT_DIR="$SCRIPT_DIR/certs"

if [ ! -f "$CERT_DIR/exammath.pem" ] || [ ! -f "$CERT_DIR/exammath.key" ]; then
    echo "Ошибка: Файлы сертификатов не найдены в $CERT_DIR"
    exit 1
fi

sudo ln -sf "$SCRIPT_DIR/exammath.conf" /etc/nginx/sites-available/exammath
sudo ln -sf /etc/nginx/sites-available/exammath /etc/nginx/sites-enabled/exammath

sudo nginx -t
sudo systemctl restart nginx

echo "Nginx конфиг установлен и перезапущен!"