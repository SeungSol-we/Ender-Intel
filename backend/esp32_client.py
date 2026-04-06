"""
ESP32 HTTP 클라이언트
라즈베리 파이 -> ESP32 방향의 제어 신호 전송을 담당합니다.
"""
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

ESP32_IP = os.getenv("ESP32_IP_ADDRESS", "192.168.1.100")
ESP32_BASE_URL = f"http://{ESP32_IP}"
TIMEOUT = 5.0  # ESP32 응답 타임아웃 (초)

# 색상 이름 -> HEX 매핑
COLOR_MAP: dict[str, str] = {
    "RED":    "#FF0000",
    "GREEN":  "#00FF00",
    "BLUE":   "#0000FF",
    "WHITE":  "#FFFFFF",
    "YELLOW": "#FFFF00",
    "PURPLE": "#800080",
    "CYAN":   "#00FFFF",
    "ORANGE": "#FF8C00",
}

# 큐브 동작 -> ESP32 command 매핑
CUBE_COMMAND_MAP: dict[str, str] = {
    "SPIN_LEFT":  "SPIN_LEFT",
    "SPIN_RIGHT": "SPIN_RIGHT",
    "STOP":       "STOP",
}


async def send_led_command(state: str, color: str = "WHITE") -> dict:
    """
    LED 제어 명령을 ESP32로 전송합니다.

    Args:
        state: "ON" 또는 "OFF"
        color: 색상 이름 (예: "RED", "BLUE"). state가 "ON"일 때만 유효.

    Returns:
        {"success": bool, "message": str}
    """
    hex_color = COLOR_MAP.get(color.upper(), "#FFFFFF") if state == "ON" else "#000000"
    payload = {"state": state, "color": hex_color}

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(f"{ESP32_BASE_URL}/led", json=payload)
            response.raise_for_status()
            return {"success": True, "message": f"LED {state} 명령 전송 성공 (색상: {color})"}
    except httpx.ConnectError:
        return {"success": False, "message": f"ESP32({ESP32_IP}) 연결 실패 - IP를 확인하세요."}
    except httpx.TimeoutException:
        return {"success": False, "message": "ESP32 응답 타임아웃"}
    except httpx.HTTPStatusError as e:
        return {"success": False, "message": f"ESP32 오류 응답: {e.response.status_code}"}
    except Exception as e:
        return {"success": False, "message": f"알 수 없는 오류: {str(e)}"}


async def send_motor_command(command: str) -> dict:
    """
    모터(큐브 회전) 제어 명령을 ESP32로 전송합니다.

    Args:
        command: "SPIN_LEFT", "SPIN_RIGHT", "STOP" 중 하나

    Returns:
        {"success": bool, "message": str}
    """
    esp32_command = CUBE_COMMAND_MAP.get(command.upper(), "STOP")
    payload = {"command": esp32_command}

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(f"{ESP32_BASE_URL}/motor", json=payload)
            response.raise_for_status()
            return {"success": True, "message": f"모터 명령 '{esp32_command}' 전송 성공"}
    except httpx.ConnectError:
        return {"success": False, "message": f"ESP32({ESP32_IP}) 연결 실패 - IP를 확인하세요."}
    except httpx.TimeoutException:
        return {"success": False, "message": "ESP32 응답 타임아웃"}
    except httpx.HTTPStatusError as e:
        return {"success": False, "message": f"ESP32 오류 응답: {e.response.status_code}"}
    except Exception as e:
        return {"success": False, "message": f"알 수 없는 오류: {str(e)}"}