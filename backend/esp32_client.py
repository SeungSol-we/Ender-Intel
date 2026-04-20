"""
ESP32 BLE 클라이언트 (라즈베리 파이 전용)
라파 → BLE → ESP32 방향의 제어 신호 전송을 담당합니다.

필요 패키지: pip install bleak
"""
import asyncio
import json
import os
from bleak import BleakClient, BleakScanner
from bleak.exc import BleakError
from dotenv import load_dotenv

load_dotenv()

# ──────────────────────────────────────────────
# BLE 설정 (main.cpp 의 UUID와 반드시 일치)
# ──────────────────────────────────────────────
ESP32_DEVICE_NAME = os.getenv("ESP32_DEVICE_NAME", "Ender-Intel")
CHAR_LED_UUID     = "12345678-1234-1234-1234-123456789001"
CHAR_MOTOR_UUID   = "12345678-1234-1234-1234-123456789002"

MAX_RETRIES = 3
RETRY_DELAY = 1.0
SCAN_TIMEOUT = 5.0

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


async def _find_esp32() -> str | None:
    print(f"🔍 BLE 스캔 중... ('{ESP32_DEVICE_NAME}' 탐색)")
    devices = await BleakScanner.discover(timeout=SCAN_TIMEOUT)
    for device in devices:
        if device.name and ESP32_DEVICE_NAME in device.name:
            print(f"✅ ESP32 발견: {device.name} ({device.address})")
            return device.address
    print(f"❌ '{ESP32_DEVICE_NAME}' 를 찾지 못했습니다.")
    return None


async def _send_ble_command(char_uuid: str, payload: dict) -> dict:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            address = await _find_esp32()
            if not address:
                if attempt < MAX_RETRIES:
                    print(f"   재시도 {attempt}/{MAX_RETRIES}...")
                    await asyncio.sleep(RETRY_DELAY)
                    continue
                return {"success": False, "message": "ESP32를 찾을 수 없습니다."}

            async with BleakClient(address, timeout=10.0) as client:
                if not client.is_connected:
                    raise BleakError("연결 실패")
                await client.write_gatt_char(char_uuid, data, response=False)
                print(f"✅ BLE 명령 전송 성공: {payload}")
                return {"success": True, "message": f"명령 전송 성공: {payload}"}

        except BleakError as e:
            print(f"⚠️  BLE 오류 (시도 {attempt}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY)

        except Exception as e:
            print(f"❌ 알 수 없는 오류: {e}")
            return {"success": False, "message": str(e)}

    return {"success": False, "message": f"{MAX_RETRIES}회 시도 후 실패"}


async def send_led_command(state: str, color: str = "WHITE") -> dict:
    hex_color = COLOR_MAP.get(color.upper(), "#FFFFFF") if state == "ON" else "#000000"
    payload = {"state": state, "color": hex_color}
    return await _send_ble_command(CHAR_LED_UUID, payload)


async def send_motor_command(command: str) -> dict:
    payload = {"command": command.upper()}
    return await _send_ble_command(CHAR_MOTOR_UUID, payload)