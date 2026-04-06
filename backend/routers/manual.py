"""
수동 제어 라우터
/api/manual/light - 조명 직접 제어
/api/manual/cube  - 큐브 회전 직접 제어
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Literal

import esp32_client

router = APIRouter()


class LightRequest(BaseModel):
    action: Literal["ON", "OFF"]
    color: Literal["RED", "BLUE", "GREEN", "WHITE", "YELLOW", "PURPLE", "CYAN", "ORANGE"] = "WHITE"

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"action": "ON", "color": "RED"},
                {"action": "OFF"},
            ]
        }
    }


class CubeRequest(BaseModel):
    action: Literal["SPIN_LEFT", "SPIN_RIGHT", "STOP"]

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"action": "SPIN_LEFT"},
                {"action": "STOP"},
            ]
        }
    }


class ControlResponse(BaseModel):
    success: bool
    message: str


@router.post("/light", response_model=ControlResponse, summary="조명 수동 제어")
async def manual_light(body: LightRequest):
    """
    앱의 수동 버튼으로 LED 조명을 직접 제어합니다.

    - **action**: ON(켜기) / OFF(끄기)
    - **color**: 색상 선택 (ON일 때만 유효, 기본값: WHITE)
    """
    result = await esp32_client.send_led_command(body.action, body.color)

    if not result["success"]:
        # ESP32 연결 실패여도 500보다는 503(서비스 불가)이 적절
        raise HTTPException(status_code=503, detail=result["message"])

    return JSONResponse(content=result)


@router.post("/cube", response_model=ControlResponse, summary="큐브 수동 제어")
async def manual_cube(body: CubeRequest):
    """
    앱의 수동 버튼으로 큐브 모터를 직접 제어합니다.

    - **action**: SPIN_LEFT / SPIN_RIGHT / STOP
    """
    result = await esp32_client.send_motor_command(body.action)

    if not result["success"]:
        raise HTTPException(status_code=503, detail=result["message"])

    return JSONResponse(content=result)