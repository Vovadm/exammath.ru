#!/bin/bash
set -e

echo "Ожидание БД..."
python -c "
import asyncio
import sys
from sqlalchemy import text

async def wait_for_db():
    from backend.database import engine

    for i in range(30):
        try:
            async with engine.begin() as conn:
                await conn.execute(text('SELECT 1'))
            print('БД доступна!')
            return True
        except Exception as e:
            print(f'Попытка {i+1}/30: {e}')
            await asyncio.sleep(2)
    print('Не удалось подключиться к БД')
    sys.exit(1)

asyncio.run(wait_for_db())
"

echo "Инициализация БД и импорт данных..."
python -m backend.import_json /app/fipi_questions.json

echo "Запуск сервера..."
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
