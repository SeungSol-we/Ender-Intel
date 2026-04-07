"""
AI 핸들러
Whisper(STT), GPT-4o-mini(Function Calling), TTS 연동 및
하드웨어 제어 판단 로직을 담당합니다.
"""
import os
import uuid
import json
from pathlib import Path
from openai import AsyncOpenAI
from dotenv import load_dotenv

import esp32_client

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
TTS_VOICE = os.getenv("TTS_VOICE", "nova")
AUDIO_DIR = Path("static/audio")


# ──────────────────────────────────────────────
# OpenAI Function Calling 도구 명세
# ──────────────────────────────────────────────
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "control_light",
            "description": (
                "큐브의 LED 조명을 켜거나 끕니다. "
                "사용자가 조명, 불, LED 관련 명령을 내릴 때 호출하세요."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["ON", "OFF"],
                        "description": "조명 상태: ON(켜기) 또는 OFF(끄기)",
                    },
                    "color": {
                        "type": "string",
                        "enum": ["RED", "BLUE", "GREEN", "WHITE", "YELLOW", "PURPLE", "CYAN", "ORANGE"],
                        "description": "LED 색상. action이 ON일 때만 유효합니다.",
                    },
                },
                "required": ["action"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "control_cube",
            "description": (
                "큐브를 회전시키거나 정지시킵니다. "
                "사용자가 큐브 돌리기, 회전, 멈추기 등을 요청할 때 호출하세요."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["SPIN_LEFT", "SPIN_RIGHT", "STOP"],
                        "description": "큐브 동작: 왼쪽 회전, 오른쪽 회전, 정지",
                    },
                },
                "required": ["action"],
            },
        },
    },
]

SYSTEM_PROMPT = """
너는 '밸런싱 큐브'라는 스마트 디바이스의 AI 비서야.
사용자의 명령에 따라 큐브의 LED 조명과 모터를 제어할 수 있어.
하드웨어 제어가 필요한 경우 반드시 제공된 함수(tool)를 호출해야 해.
일반 질문에는 친절하고 간결하게 한국어로 답변해줘.
답변은 TTS로 읽힐 예정이니까 자연스러운 구어체로 말해줘.
"""


# ──────────────────────────────────────────────
# 1단계: STT (음성 -> 텍스트)
# ──────────────────────────────────────────────
async def transcribe_audio(audio_path: str) -> str:
    suffix = Path(audio_path).suffix.lstrip(".")
    print(f"🔍 audio_path: {audio_path}, suffix: '{suffix}'")
    
    mime_map = {
        "m4a": "audio/mp4",
        "mp4": "audio/mp4",
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "ogg": "audio/ogg",
        "webm": "audio/webm",
        "flac": "audio/flac",
    }
    mime = mime_map.get(suffix, "audio/mpeg")
    print(f"🔍 mime: {mime}, filename: audio.{suffix}")

    try:
        with open(audio_path, "rb") as audio_file:
            transcription = await client.audio.transcriptions.create(
                model="whisper-1",
                file=(f"audio.{suffix}", audio_file, mime),
                language="ko",
            )
        return transcription.text
    except Exception as e:
        print(f"❌ Whisper 오류 상세: {repr(e)}")
        raise


# ──────────────────────────────────────────────
# 2단계: GPT Function Calling + 하드웨어 실행
# ──────────────────────────────────────────────
async def _execute_tool_call(tool_name: str, tool_args: dict) -> str:
    """GPT가 결정한 함수 호출을 실제로 실행하고 결과를 반환합니다."""
    if tool_name == "control_light":
        action = tool_args.get("action", "OFF")
        color = tool_args.get("color", "WHITE")
        result = await esp32_client.send_led_command(action, color)
        return json.dumps(result, ensure_ascii=False)

    elif tool_name == "control_cube":
        action = tool_args.get("action", "STOP")
        result = await esp32_client.send_motor_command(action)
        return json.dumps(result, ensure_ascii=False)

    return json.dumps({"success": False, "message": f"알 수 없는 함수: {tool_name}"})


async def process_with_gpt(user_text: str) -> str:
    """
    GPT-4o-mini로 사용자 텍스트를 처리합니다.
    Function Calling이 발생하면 하드웨어를 제어하고
    최종 자연어 응답을 반환합니다.
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_text},
    ]

    # 1차 GPT 호출 - 함수 호출 여부 판단
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=TOOLS,
        tool_choice="auto",
    )

    assistant_message = response.choices[0].message

    # Function Calling이 없는 경우 (일반 대화)
    if not assistant_message.tool_calls:
        return assistant_message.content or "죄송해요, 답변을 생성하지 못했어요."

    # Function Calling 처리
    messages.append(assistant_message)  # GPT 응답을 대화 히스토리에 추가

    for tool_call in assistant_message.tool_calls:
        tool_name = tool_call.function.name
        tool_args = json.loads(tool_call.function.arguments)

        print(f"🔧 함수 호출: {tool_name}({tool_args})")
        tool_result = await _execute_tool_call(tool_name, tool_args)
        print(f"   결과: {tool_result}")

        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": tool_result,
        })

    # 2차 GPT 호출 - 실행 결과를 바탕으로 최종 응답 생성
    final_response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
    )

    return final_response.choices[0].message.content or "명령을 처리했어요."


# ──────────────────────────────────────────────
# 3단계: TTS (텍스트 -> 음성)
# ──────────────────────────────────────────────
async def text_to_speech(text: str) -> str:
    """
    텍스트를 TTS로 변환하고 오디오 파일 경로를 반환합니다.

    Returns:
        정적 파일 URL 경로 (예: "static/audio/abc123.mp3")
    """
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.mp3"
    file_path = AUDIO_DIR / filename

    response = await client.audio.speech.create(
        model="tts-1",
        voice=TTS_VOICE,
        input=text,
    )

    # 파일로 저장
    response.stream_to_file(str(file_path))

    return f"static/audio/{filename}"


# ──────────────────────────────────────────────
# 통합 파이프라인
# ──────────────────────────────────────────────
async def handle_audio_input(audio_path: str, server_base_url: str) -> dict:
    """
    오디오 입력 전체 파이프라인: STT -> GPT -> TTS

    Returns:
        {
            "user_text": str,     # Whisper 변환 결과
            "text_reply": str,    # GPT 응답 텍스트
            "audio_url": str,     # TTS 오디오 URL (절대 경로)
        }
    """
    # 1. STT
    user_text = await transcribe_audio(audio_path)
    print(f"🎤 STT 결과: {user_text}")

    # 2. GPT + 하드웨어 제어
    text_reply = await process_with_gpt(user_text)
    print(f"🤖 GPT 응답: {text_reply}")

    # 3. TTS
    audio_relative_path = await text_to_speech(text_reply)
    audio_url = f"{server_base_url}/{audio_relative_path}"

    return {
        "user_text": user_text,
        "text_reply": text_reply,
        "audio_url": audio_url,
    }


async def handle_text_input(user_text: str, server_base_url: str) -> dict:
    """
    텍스트 입력 파이프라인: GPT -> TTS

    Returns:
        {
            "user_text": str,
            "text_reply": str,
            "audio_url": str,
        }
    """
    text_reply = await process_with_gpt(user_text)
    print(f"🤖 GPT 응답: {text_reply}")

    audio_relative_path = await text_to_speech(text_reply)
    audio_url = f"{server_base_url}/{audio_relative_path}"

    return {
        "user_text": user_text,
        "text_reply": text_reply,
        "audio_url": audio_url,
    }