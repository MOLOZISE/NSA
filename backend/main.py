from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


@dataclass
class Memo:
    id: str
    content: str


@dataclass
class Todo:
    id: str
    title: str
    done: bool = False


@dataclass
class Session:
    id: str
    title: str
    memos: List[Memo] = field(default_factory=list)
    todos: List[Todo] = field(default_factory=list)


class SessionCreateRequest(BaseModel):
    title: str


class MemoCreateRequest(BaseModel):
    content: str


class TodoCreateRequest(BaseModel):
    title: str


class ChatRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    thinking: str


app = FastAPI(title="NSTA Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: Dict[str, Session] = {}


def _get_session_or_404(session_id: str) -> Session:
    session = sessions.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/sessions")
def list_sessions() -> List[Session]:
    return list(sessions.values())


@app.post("/sessions", status_code=201)
def create_session(payload: SessionCreateRequest) -> Session:
    session_id = uuid4().hex
    session = Session(id=session_id, title=payload.title)
    sessions[session_id] = session
    return session


@app.get("/sessions/{session_id}")
def get_session(session_id: str) -> Session:
    return _get_session_or_404(session_id)


@app.get("/sessions/{session_id}/memos")
def list_memos(session_id: str) -> List[Memo]:
    return _get_session_or_404(session_id).memos


@app.post("/sessions/{session_id}/memos", status_code=201)
def create_memo(session_id: str, payload: MemoCreateRequest) -> Memo:
    session = _get_session_or_404(session_id)
    memo = Memo(id=uuid4().hex, content=payload.content)
    session.memos.append(memo)
    return memo


@app.get("/sessions/{session_id}/todos")
def list_todos(session_id: str) -> List[Todo]:
    return _get_session_or_404(session_id).todos


@app.post("/sessions/{session_id}/todos", status_code=201)
def create_todo(session_id: str, payload: TodoCreateRequest) -> Todo:
    session = _get_session_or_404(session_id)
    todo = Todo(id=uuid4().hex, title=payload.title)
    session.todos.append(todo)
    return todo


@app.post("/sessions/{session_id}/todos/{todo_id}/toggle")
def toggle_todo(session_id: str, todo_id: str) -> Todo:
    session = _get_session_or_404(session_id)
    for todo in session.todos:
        if todo.id == todo_id:
            todo.done = not todo.done
            return todo
    raise HTTPException(status_code=404, detail="Todo not found")


@app.post("/chat")
def chat(payload: ChatRequest) -> ChatResponse:
    prompt_preview = payload.prompt.strip()
    preview = prompt_preview[:80] + ("..." if len(prompt_preview) > 80 else "")
    thinking = (
        "세션 맥락을 정리하고 있으며, 메모와 할 일을 검토해 투자 아이디어 초안을 만드는 중입니다. "
        "종목 검색과 뉴스 연결은 이후 단계에서 확장됩니다."
    )
    reply = (
        "안녕하세요! NSTA 초기 버전입니다. \n"
        f"- 세션 ID: {payload.session_id or '선택되지 않음'}\n"
        f"- 입력하신 메시지 미리보기: {preview}\n\n"
        "메모 추가, 할 일 만들기부터 시작해보세요. 이후 주식 가격/뉴스/에이전트를 붙일 수 있도록 "
        "백엔드와 프론트엔드를 확장해 나가면 됩니다."
    )
    return ChatResponse(reply=reply, thinking=thinking)
