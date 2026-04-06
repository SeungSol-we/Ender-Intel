###테스트용!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

# mock_esp32.py
# ESP32 역할을 하는 가짜 서버 - 컴퓨터에서 테스트용
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/led", methods=["POST"])
def led():
    data = request.json
    print(f"💡 LED 명령 수신: state={data.get('state')}, color={data.get('color')}")
    return jsonify({"status": "ok"})

@app.route("/motor", methods=["POST"])
def motor():
    data = request.json
    print(f"⚙️  모터 명령 수신: command={data.get('command')}")
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)