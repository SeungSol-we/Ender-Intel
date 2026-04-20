"""
AI 핸들러
GPT-4o-mini(Function Calling) 연동 및
하드웨어 제어 판단 로직을 담당합니다.

TTS, STT, 음성 파일 생성은 제거됨
"""
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

import esp32_client

load_dotenv()

client = AsyncOpenAI()


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
"""


# ──────────────────────────────────────────────
# GPT Function Calling + 하드웨어 실행
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

    return json.dumps({"success": False, "message": f"알 수 없는 함수: {tool_name}"}, ensure_ascii=False)


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

    print(f"📝 사용자 입력: {user_text}")

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
        reply = assistant_message.content or "죄송해요, 답변을 생성하지 못했어요."
        print(f"💬 GPT 응답 (함수 호출 없음): {reply}")
        return reply

    # Function Calling 처리
    messages.append(assistant_message)

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

    reply = final_response.choices[0].message.content or "명령을 처리했어요."
    print(f"✅ GPT 최종 응답: {reply}")
    return reply


# ──────────────────────────────────────────────
# 텍스트 입력 처리
# ──────────────────────────────────────────────
async def handle_text_input(user_text: str) -> dict:
    """
    텍스트 입력을 받아 GPT 처리 후 응답 텍스트만 반환합니다.

    Args:
        user_text: 사용자 입력 텍스트

    Returns:
        {
            "user_text": str,      # 사용자 입력
            "text_reply": str,     # GPT 응답 텍스트
        }
    """
    text_reply = await process_with_gpt(user_text)

    return {
        "user_text": user_text,
        "text_reply": text_reply,
    }