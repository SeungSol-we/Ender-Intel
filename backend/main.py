"""
밸런싱 큐브 AI 비서 - FastAPI 백엔드 메인
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작
    print("✅ 밸런싱 큐브 AI 비서 서버 시작")
    yield
    # 서버 종료
    print("🛑 밸런싱 큐브 AI 비서 서버 종료")


app = FastAPI(
    title="밸런싱 큐브 AI 비서",
    version="1.0.0",
    description="텍스트 기반 음성 인식 결과 처리",
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

# 라우터 등록
app.include_router(chat.router, prefix="/api/chat", tags=["AI 비서"])


@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "밸런싱 큐브 AI 비서 서버 작동 중",
        "endpoints": {
            "chat_text": "POST /api/chat/text",
            "health_check": "GET /health"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}