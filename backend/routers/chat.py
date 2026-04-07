"""
AI 비서 채팅 라우터
/api/chat/audio - 음성 입력 처리
/api/chat/text  - 텍스트 입력 처리
"""
import os
import aiofiles
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from pathlib import Path  # 이거 추가
from pydantic import BaseModel

import ai_handler

router = APIRouter()


class TextRequest(BaseModel):
    text: str


class ChatResponse(BaseModel):
    user_text: str
    text_reply: str
    audio_url: str


def _get_base_url(request: Request) -> str:
    """현재 서버의 base URL을 반환합니다 (TTS 오디오 URL 생성용)."""
    return str(request.base_url).rstrip("/")


@router.post("/audio", response_model=ChatResponse, summary="음성 명령 처리")
async def chat_audio(request: Request, file: UploadFile = File(...)):
    """
    앱에서 녹음한 오디오 파일을 받아 AI 처리 후 응답을 반환합니다.

    - **STT**: Whisper로 텍스트 변환
    - **AI 처리**: GPT-4o-mini Function Calling
    - **하드웨어 제어**: 필요 시 ESP32로 명령 전송
    - **TTS**: 응답 텍스트를 음성으로 변환
    """
    # 오디오 파일 임시 저장
# 기존 temp_path 줄을 아래로 교체
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
        temp_path = tmp.name
    
    try:
        async with aiofiles.open(temp_path, "wb") as f:
            content = await file.read()
            await f.write(content)

        base_url = _get_base_url(request)
        result = await ai_handler.handle_audio_input(temp_path, base_url)
        return JSONResponse(content=result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"오디오 처리 오류: {str(e)}")
    finally:
        # 임시 파일 정리
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/text", response_model=ChatResponse, summary="텍스트 명령 처리")
async def chat_text(request: Request, body: TextRequest):
    """
    텍스트 명령을 받아 AI 처리 후 응답을 반환합니다.

    - **AI 처리**: GPT-4o-mini Function Calling
    - **하드웨어 제어**: 필요 시 ESP32로 명령 전송
    - **TTS**: 응답 텍스트를 음성으로 변환
    """
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="텍스트가 비어있습니다.")

    try:
        base_url = _get_base_url(request)
        result = await ai_handler.handle_text_input(body.text, base_url)
        return JSONResponse(content=result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"텍스트 처리 오류: {str(e)}")