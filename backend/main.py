from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import init_db
from backend.routers import (
    admin,
    auth,
    classes,
    profile,
    solutions,
    tasks,
    variants,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await init_db()
    yield


app = FastAPI(title="ExamMath API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://exammath.ru",
        "https://www.exammath.ru",
        "http://localhost:3000",
        "http://192.168.1.83:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(solutions.router)
app.include_router(variants.router)
app.include_router(admin.router)
app.include_router(profile.router)
app.include_router(classes.router)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
