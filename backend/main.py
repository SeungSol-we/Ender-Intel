"""
밸런싱 큐브 AI 비서 - FastAPI 백엔드 메인
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from routers import chat, manual


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시 오디오 응답 저장 디렉토리 생성
    os.makedirs("static/audio", exist_ok=True)
    print("✅ 밸런싱 큐브 서버 시작")
    yield
    print("🛑 밸런싱 큐브 서버 종료")


app = FastAPI(
    title="밸런싱 큐브 AI 비서",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 설정 (React Native 앱에서 접근 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 앱 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TTS 오디오 파일 정적 서빙
app.mount("/static", StaticFiles(directory="static"), name="static")

# 라우터 등록
app.include_router(chat.router, prefix="/api/chat", tags=["AI 비서"])
app.include_router(manual.router, prefix="/api/manual", tags=["수동 제어"])


@app.get("/")
async def root():
    return {"status": "ok", "message": "밸런싱 큐브 AI 비서 서버 작동 중"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}