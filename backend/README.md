# 전체 설치
pip install -r requirements.txt

## flask 설치
pip install flask

# test
cd backend
python mock_esp32.py

cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload