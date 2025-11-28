import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

interface Session {
  id: string;
  title: string;
}

interface Memo {
  id: string;
  content: string;
}

interface Todo {
  id: string;
  title: string;
  done: boolean;
}

interface ChatPayload {
  prompt: string;
  session_id?: string;
}

interface ChatResponse {
  reply: string;
  thinking: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || '요청에 실패했습니다');
  }

  return response.json();
}

function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const reload = async () => {
    const data = await request<Session[]>('/sessions');
    setSessions(data);
    if (!selectedId && data.length > 0) {
      setSelectedId(data[0].id);
    }
  };

  const create = async (title: string) => {
    const newSession = await request<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    setSessions((prev) => [newSession, ...prev]);
    setSelectedId(newSession.id);
  };

  return { sessions, selectedId, setSelectedId, reload, create };
}

export default function App() {
  const { sessions, selectedId, setSelectedId, reload, create } = useSessions();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [sessionTitle, setSessionTitle] = useState('새 투자 세션');
  const [memoContent, setMemoContent] = useState('');
  const [todoTitle, setTodoTitle] = useState('');
  const [prompt, setPrompt] = useState('오늘 시장 점검과 주요 할 일을 정리해줘');
  const [chatResponse, setChatResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMemos([]);
      setTodos([]);
      return;
    }

    request<Memo[]>(`/sessions/${selectedId}/memos`).then(setMemos);
    request<Todo[]>(`/sessions/${selectedId}/todos`).then(setTodos);
  }, [selectedId]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedId),
    [sessions, selectedId],
  );

  const addSession = async () => {
    if (!sessionTitle.trim()) return;
    await create(sessionTitle.trim());
    setSessionTitle('새 투자 세션');
  };

  const addMemo = async () => {
    if (!selectedId || !memoContent.trim()) return;
    const newMemo = await request<Memo>(`/sessions/${selectedId}/memos`, {
      method: 'POST',
      body: JSON.stringify({ content: memoContent.trim() }),
    });
    setMemos((prev) => [newMemo, ...prev]);
    setMemoContent('');
  };

  const addTodo = async () => {
    if (!selectedId || !todoTitle.trim()) return;
    const newTodo = await request<Todo>(`/sessions/${selectedId}/todos`, {
      method: 'POST',
      body: JSON.stringify({ title: todoTitle.trim() }),
    });
    setTodos((prev) => [newTodo, ...prev]);
    setTodoTitle('');
  };

  const toggleTodo = async (todoId: string) => {
    if (!selectedId) return;
    const updated = await request<Todo>(`/sessions/${selectedId}/todos/${todoId}/toggle`, {
      method: 'POST',
    });
    setTodos((prev) => prev.map((todo) => (todo.id === todoId ? updated : todo)));
  };

  const sendChat = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const payload: ChatPayload = { prompt: prompt.trim(), session_id: selectedId };
      const data = await request<ChatResponse>('/chat', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setChatResponse(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header style={{ marginBottom: 28 }}>
        <p className="kicker">NotionLike Stock Trading AI</p>
        <h1 className="hero-title">NSTA 시작하기: 메모 · 할 일 · 대화를 한 곳에서</h1>
        <p className="hero-lead">
          메모/할 일/세션을 묶고, AI와 대화하며 투자 인사이트를 쌓아가는 초기 버전입니다. 주식 가격, 뉴스,
          에이전트 자동화는 이후 단계에서 확장하세요.
        </p>
        <div className="badge">🚀 Day 1 scaffolding: FastAPI + Vite + in-memory store</div>
      </header>

      <section className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h2 className="section-title">1) 세션 만들기</h2>
          <p className="subtext">포트폴리오/전략별로 세션을 나누고 메모·할 일을 연결합니다.</p>
          <div className="input-row">
            <input
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="예: 2025 1Q AI 반도체 전략"
            />
            <button className="primary-button" onClick={addSession}>
              세션 추가
            </button>
          </div>
          <div className="input-row">
            <select value={selectedId ?? ''} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">세션을 선택하세요</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title}
                </option>
              ))}
            </select>
            <button className="secondary-button" onClick={reload}>
              새로고침
            </button>
          </div>
          {selectedSession ? <p className="subtext">선택된 세션: {selectedSession.title}</p> : null}
        </div>

        <div className="card">
          <h2 className="section-title">2) 메모 / 할 일</h2>
          <p className="subtext">아이디어는 메모에, 실행은 할 일로. 추후 RAG/Agent 입력으로 활용됩니다.</p>

          <div className="input-row">
            <textarea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder="메모 작성 (뉴스 요약, 논리, 리스크 등)"
            />
            <button className="primary-button" onClick={addMemo} disabled={!selectedId}>
              메모 추가
            </button>
          </div>

          <div className="input-row">
            <input
              value={todoTitle}
              onChange={(e) => setTodoTitle(e.target.value)}
              placeholder="할 일 작성 (예: AAPL 실적 체크)"
            />
            <button className="secondary-button" onClick={addTodo} disabled={!selectedId}>
              할 일 추가
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h2 className="section-title">메모 목록</h2>
          {memos.length === 0 ? (
            <p className="subtext">세션을 선택하고 메모를 추가해보세요.</p>
          ) : (
            memos.map((memo) => (
              <div key={memo.id} className="list-item">
                <div style={{ fontWeight: 700, marginBottom: 4 }}>메모</div>
                <div>{memo.content}</div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h2 className="section-title">할 일 목록</h2>
          {todos.length === 0 ? (
            <p className="subtext">진행 중인 할 일이 없습니다.</p>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className={todo.done ? 'todo-done' : ''}>{todo.title}</span>
                <button className="secondary-button" onClick={() => toggleTodo(todo.id)}>
                  {todo.done ? '되돌리기' : '완료'}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h2 className="section-title">3) Assistant 대화</h2>
          <p className="subtext">현재는 목업 응답입니다. OpenAI/Anthropic 등을 연결해 생각(&lt;think&gt;)과 응답을 분리해보세요.</p>
          <div className="input-row">
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <button className="primary-button" onClick={sendChat} disabled={loading}>
            {loading ? '생각 중...' : '대화 보내기'}
          </button>
        </div>

        <div className="card">
          <h2 className="section-title">응답 미리보기</h2>
          {chatResponse ? (
            <div>
              <p className="subtext">Thinking</p>
              <div className="code-block" style={{ marginBottom: 12 }}>
                {chatResponse.thinking}
              </div>
              <p className="subtext">Reply</p>
              <div className="list-item" style={{ background: '#fff' }}>
                {chatResponse.reply.split('\n').map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </div>
          ) : (
            <p className="subtext">프롬프트를 입력하고 AI 대화를 시작하세요.</p>
          )}
        </div>
      </section>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2 className="section-title">빠른 확장 체크리스트</h2>
        <div className="quick-grid">
          {[
            '메모/할 일 SQLite 영속화 + Prisma/SQLModel',
            '주식 시세/뉴스 API 스켈레톤 추가 (Mock → 실제 연동)',
            'GPT 응답에서 <think> 블록 파싱 UI',
            'Agent: 종목 요약, 속보 영향도 평가',
            '기술적 지표 시각화 (RSI, MACD)',
            '자동화 시나리오: 뉴스→요약→할 일 생성',
          ].map((item) => (
            <div key={item} className="quick-card">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">로컬 실행 가이드</h2>
        <p className="subtext">백엔드/프론트엔드를 각각 띄워 빠르게 검증하세요.</p>
        <div className="code-block">
          <div>cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000</div>
          <div style={{ marginTop: 6 }}>cd frontend && npm install && npm run dev -- --host</div>
        </div>
      </section>
    </div>
  );
}
