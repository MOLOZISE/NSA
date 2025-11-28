# NSTA (NotionLike Stock Trading AI)

주식 정보와 메모/할 일을 묶어 AI 보조와 함께 쓰는 개인용 투자 워크스페이스를 위한 초기 스캐폴딩입니다.

## 구성
- **backend**: FastAPI 기반, 인메모리 세션/메모/할 일/챗 엔드포인트 제공
- **frontend**: Vite + React(Typescript) SPA, 세션 선택/메모/할 일/챗 UI 제공

## 실행 방법
1. 백엔드
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
2. 프론트엔드
   ```bash
   cd frontend
   npm install
   npm run dev -- --host
   ```

## 다음 확장 아이디어
- SQLite/Prisma/SQLModel로 영속화
- 실시간 주가·뉴스 API 연동 후 Agent 분석 연결
- GPT 응답의 `<think>` 블록 파싱 및 토글 UI
- 기술적 지표(RSI, MACD) 시각화와 백테스트 모듈
