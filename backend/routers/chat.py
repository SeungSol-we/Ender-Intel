"""
AI 비서 채팅 라우터
/api/chat/text - 텍스트 입력 처리 (응답 텍스트만 반환)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse

import ai_handler

router = APIRouter()


# ──────────────────────────────────────────────
# 요청/응답 모델
# ──────────────────────────────────────────────
class TextRequest(BaseModel):
    """텍스트 입력 요청"""
    text: str


class ChatResponse(BaseModel):
    """채팅 응답"""
    user_text: str
    text_reply: str


# ──────────────────────────────────────────────
# 텍스트 입력 엔드포인트
# ──────────────────────────────────────────────
@router.post("/text", response_model=ChatResponse, summary="텍스트 명령 처리")
async def chat_text(body: TextRequest):
    """
    텍스트 명령을 받아 AI 처리 후 응답을 반환합니다.

    **요청:**
    - text: 사용자 입력 텍스트

    **응답:**
    - user_text: 사용자 입력 텍스트
    - text_reply: GPT-4o-mini 응답 텍스트
    
    **기능:**
    - GPT-4o-mini Function Calling으로 의도 판단
    - 필요 시 큐브 LED 제어 또는 모터 제어
    """
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="텍스트가 비어있습니다.")

    try:
        print(f"📨 텍스트 요청 수신: {body.text}")
        result = await ai_handler.handle_text_input(body.text)
        return JSONResponse(content=result)

    except Exception as e:
        print(f"❌ 텍스트 처리 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"처리 오류: {str(e)}")