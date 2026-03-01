#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

sudo ln -sf "$SCRIPT_DIR/exammath.conf" /etc/nginx/sites-available/exammath
sudo ln -sf /etc/nginx/sites-available/exammath /etc/nginx/sites-enabled/exammath

sudo nginx -t
sudo systemctl restart nginx

echo "Nginx конфиг установлен!"