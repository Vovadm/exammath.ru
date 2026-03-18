#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Установка конфигурации Nginx..."
sudo ln -sf "$SCRIPT_DIR/exammath.conf" /etc/nginx/sites-available/exammath
sudo ln -sf /etc/nginx/sites-available/exammath /etc/nginx/sites-enabled/exammath

echo "Тестирование конфигурации..."
sudo nginx -t

echo "Перезапуск Nginx..."
sudo systemctl restart nginx

echo "Nginx конфиг успешно установлен и перезапущен!"