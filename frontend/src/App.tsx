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

interface WatchItem {
  symbol: string;
  price: string;
  change: string;
  sentiment: 'bullish' | 'neutral' | 'bearish';
  note: string;
}

interface EventItem {
  title: string;
  date: string;
  impact: '높음' | '중간' | '낮음';
  tag: string;
}

interface PlaybookItem {
  title: string;
  description: string;
  actions: string[];
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
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingMemoContent, setEditingMemoContent] = useState('');
  const [todoTitle, setTodoTitle] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState('');
  const [prompt, setPrompt] = useState('오늘 시장 점검과 주요 할 일을 정리해줘');
  const [chatResponse, setChatResponse] = useState<ChatResponse | null>(null);
  const [showThinking, setShowThinking] = useState(true);
  const [loading, setLoading] = useState(false);

  const watchlist: WatchItem[] = [
    {
      symbol: 'NVDA',
      price: '$945.2',
      change: '+2.1%',
      sentiment: 'bullish',
      note: '데이터센터 수요 견조, AI GPU 출하 추적 필요',
    },
    {
      symbol: 'AAPL',
      price: '$196.3',
      change: '-0.4%',
      sentiment: 'neutral',
      note: 'Vision Pro 판매 모멘텀 재확인, 서비스 매출 성장',
    },
    {
      symbol: 'TSLA',
      price: '$185.7',
      change: '+3.5%',
      sentiment: 'bullish',
      note: 'FSD 구독 출시 루머, 마진 반등 여부 체크',
    },
    {
      symbol: 'MSFT',
      price: '$412.8',
      change: '+0.6%',
      sentiment: 'neutral',
      note: 'Copilot 확산 속도 모니터링, Azure 성장률 가이던스',
    },
  ];

  const events: EventItem[] = [
    { title: '미국 CPI 발표', date: '04.15 (월) 21:30', impact: '높음', tag: '매크로' },
    { title: 'TSLA 실적 콜', date: '04.18 (목) 06:00', impact: '높음', tag: '실적' },
    { title: 'NVIDIA GTC 키노트', date: '04.25 (목) 03:00', impact: '중간', tag: '이벤트' },
    { title: '한국 수출입 통계', date: '04.30 (화) 09:00', impact: '낮음', tag: '매크로' },
  ];

  const playbooks: PlaybookItem[] = [
    {
      title: '🚀 AI 반도체 로드맵',
      description: 'NVDA/AMD/GG 관련 메모를 읽고 1주일 플랜 제안',
      actions: ['메모 요약 → 리스크/트리거 도출', '주요 이벤트 캘린더링', '할 일 자동 생성'],
    },
    {
      title: '⚡ 속보 대응 봇',
      description: '속보 + 트위터 키워드 수집 후 영향도 파악',
      actions: ['긍/부정 스코어링', '주요 종목 영향도 표', '매수/매도 체크리스트'],
    },
    {
      title: '📈 기술적 분석 프로브',
      description: '심볼 입력 → RSI/MACD/거래량 돌파 알림 템플릿 생성',
      actions: ['지표 스냅샷', '조건 충족 시 할 일 생성', '백테스트 TODO 목록'],
    },
  ];

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

  const startEditMemo = (memo: Memo) => {
    setEditingMemoId(memo.id);
    setEditingMemoContent(memo.content);
  };

  const saveMemo = async () => {
    if (!selectedId || !editingMemoId || !editingMemoContent.trim()) return;
    const updated = await request<Memo>(`/sessions/${selectedId}/memos/${editingMemoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content: editingMemoContent.trim() }),
    });
    setMemos((prev) => prev.map((memo) => (memo.id === updated.id ? updated : memo)));
    setEditingMemoId(null);
    setEditingMemoContent('');
  };

  const deleteMemo = async (memoId: string) => {
    if (!selectedId) return;
    await request<void>(`/sessions/${selectedId}/memos/${memoId}`, { method: 'DELETE' });
    setMemos((prev) => prev.filter((memo) => memo.id !== memoId));
    if (editingMemoId === memoId) {
      setEditingMemoId(null);
      setEditingMemoContent('');
    }
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

  const startEditTodo = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingTodoTitle(todo.title);
  };

  const saveTodo = async () => {
    if (!selectedId || !editingTodoId || !editingTodoTitle.trim()) return;
    const updated = await request<Todo>(`/sessions/${selectedId}/todos/${editingTodoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: editingTodoTitle.trim(), done: todos.find((t) => t.id === editingTodoId)?.done }),
    });
    setTodos((prev) => prev.map((todo) => (todo.id === updated.id ? updated : todo)));
    setEditingTodoId(null);
    setEditingTodoTitle('');
  };

  const deleteTodo = async (todoId: string) => {
    if (!selectedId) return;
    await request<void>(`/sessions/${selectedId}/todos/${todoId}`, { method: 'DELETE' });
    setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
    if (editingTodoId === todoId) {
      setEditingTodoId(null);
      setEditingTodoTitle('');
    }
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
    <div className="page">
      <div className="container">
        <header className="hero">
          <div>
            <p className="kicker">NSTA · NotionLike Stock Trading AI</p>
            <h1 className="hero-title">내 투자 공간을 한눈에: 세션·메모·할 일·AI</h1>
            <p className="hero-lead">
              생성형 AI와 메모/할 일을 엮어, 주식 인사이트를 쌓는 개인 대시보드입니다. 내가 보는 종목, 이벤트,
              에이전트 플레이북을 한 화면에서 관리하세요.
            </p>
            <div className="hero-actions">
              <div className="badge">🚀 FastAPI + Vite 인메모리 프로토타입</div>
              <div className="badge badge-ghost">🧠 GPT 연동/Agent는 다음 스텝</div>
            </div>
          </div>
          <div className="hero-panel">
            <div className="hero-panel-title">오늘의 빠른 체크</div>
            <div className="panel-row">
              <div>
                <div className="panel-label">세션</div>
                <div className="panel-value">{sessions.length}</div>
              </div>
              <div>
                <div className="panel-label">메모</div>
                <div className="panel-value">{memos.length}</div>
              </div>
              <div>
                <div className="panel-label">할 일</div>
                <div className="panel-value">{todos.length}</div>
              </div>
            </div>
            <div className="panel-footer">세션을 선택하면 연결된 메모와 할 일을 불러옵니다.</div>
          </div>
        </header>

        <section className="grid grid-3" style={{ marginBottom: 18 }}>
          <div className="card fill">
            <div className="card-title-row">
              <h2 className="section-title">세션 관리</h2>
              <span className="pill">포트폴리오 단위로 관리</span>
            </div>
            <p className="subtext">전략별 세션을 만들고 선택하세요. 각 세션에 메모·할 일이 연결됩니다.</p>
            <div className="input-row column">
              <input
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="예: 2025 1Q AI 반도체 전략"
              />
              <button className="primary-button" onClick={addSession}>
                세션 추가
              </button>
            </div>
            <div className="input-row column">
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
            {selectedSession ? <div className="info-line">선택된 세션: {selectedSession.title}</div> : null}
          </div>

          <div className="card fill">
            <div className="card-title-row">
              <h2 className="section-title">메모 작성</h2>
              <span className="pill pill-blue">정보 축적</span>
            </div>
            <p className="subtext">뉴스 요약, 논리, 리스크, 트리거 등을 자유롭게 적어두세요.</p>
            <div className="stack">
              <textarea
                value={memoContent}
                onChange={(e) => setMemoContent(e.target.value)}
                placeholder="예: NVDA GTC 신제품 발표 기대. 수요/CapEx 가이던스 확인 필요"
              />
              <button className="primary-button" onClick={addMemo} disabled={!selectedId}>
                메모 추가
              </button>
            </div>
          </div>

          <div className="card fill">
            <div className="card-title-row">
              <h2 className="section-title">할 일 만들기</h2>
              <span className="pill pill-green">실행</span>
            </div>
            <p className="subtext">실적 콜 리마인더, 체크리스트, 리뷰 등 실행 항목을 적습니다.</p>
            <div className="stack">
              <input
                value={todoTitle}
                onChange={(e) => setTodoTitle(e.target.value)}
                placeholder="예: TSLA 실적 콜 요약 후 메모에 반영"
              />
              <button className="secondary-button" onClick={addTodo} disabled={!selectedId}>
                할 일 추가
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-2" style={{ marginBottom: 18 }}>
          <div className="card fill">
            <div className="card-title-row">
              <h2 className="section-title">메모 보드</h2>
              <span className="pill">세션 연동</span>
            </div>
            {memos.length === 0 ? (
              <p className="subtext">세션을 선택하고 메모를 추가하면 여기에 쌓입니다.</p>
            ) : (
              <div className="list-grid">
                {memos.map((memo) => (
                  <div key={memo.id} className="list-card">
                    <div className="list-label">메모</div>
                    {editingMemoId === memo.id ? (
                      <textarea
                        className="inline-textarea"
                        value={editingMemoContent}
                        onChange={(e) => setEditingMemoContent(e.target.value)}
                      />
                    ) : (
                      <div>{memo.content}</div>
                    )}
                    <div className="inline-actions">
                      {editingMemoId === memo.id ? (
                        <>
                          <button className="chip" onClick={saveMemo}>
                            저장
                          </button>
                          <button
                            className="chip chip-ghost"
                            onClick={() => {
                              setEditingMemoId(null);
                              setEditingMemoContent('');
                            }}
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="chip" onClick={() => startEditMemo(memo)}>
                            수정
                          </button>
                          <button className="chip chip-ghost" onClick={() => deleteMemo(memo.id)}>
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card fill">
            <div className="card-title-row">
              <h2 className="section-title">할 일 진행 상황</h2>
              <span className="pill pill-green">진행중</span>
            </div>
            {todos.length === 0 ? (
              <p className="subtext">진행 중인 할 일이 없습니다.</p>
            ) : (
              <div className="list-grid">
                {todos.map((todo) => (
                  <div key={todo.id} className="list-card todo-card">
                    <div className="list-label">할 일</div>
                    {editingTodoId === todo.id ? (
                      <input
                        className="inline-input"
                        value={editingTodoTitle}
                        onChange={(e) => setEditingTodoTitle(e.target.value)}
                      />
                    ) : (
                      <div className={todo.done ? 'todo-done' : ''}>{todo.title}</div>
                    )}
                    <div className="inline-actions">
                      <button className="chip" onClick={() => toggleTodo(todo.id)}>
                        {todo.done ? '되돌리기' : '완료'}
                      </button>
                      {editingTodoId === todo.id ? (
                        <>
                          <button className="chip" onClick={saveTodo}>
                            저장
                          </button>
                          <button
                            className="chip chip-ghost"
                            onClick={() => {
                              setEditingTodoId(null);
                              setEditingTodoTitle('');
                            }}
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="chip" onClick={() => startEditTodo(todo)}>
                            제목 수정
                          </button>
                          <button className="chip chip-ghost" onClick={() => deleteTodo(todo.id)}>
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid chat-layout" style={{ marginBottom: 18 }}>
          <div className="card">
            <div className="card-title-row">
              <h2 className="section-title">Assistant 대화</h2>
              <span className="pill pill-blue">목업</span>
            </div>
            <p className="subtext">
              프롬프트를 보내면 &lt;think&gt;와 실제 답변을 분리해 보여줍니다. 추후 GPT/Agent로 교체하세요.
            </p>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="chat-textarea" />
            <div className="input-row">
              <button className="primary-button" onClick={sendChat} disabled={loading}>
                {loading ? '생각 중...' : '대화 보내기'}
              </button>
              <span className="subtext" style={{ margin: 0 }}>
                세션 연결: {selectedSession ? selectedSession.title : '없음'}
              </span>
            </div>
          </div>

          <div className="card">
            <div className="card-title-row">
              <h2 className="section-title">응답 미리보기</h2>
              <span className="pill">UI 미리보기</span>
            </div>
            {chatResponse ? (
              <div className="chat-preview">
                <div className="subtext with-toggle">
                  <span>Thinking</span>
                  <button className="chip chip-ghost" onClick={() => setShowThinking((prev) => !prev)}>
                    {showThinking ? '숨기기' : '보기'}
                  </button>
                </div>
                {showThinking ? (
                  <div className="code-block" style={{ marginBottom: 12 }}>
                    {chatResponse.thinking}
                  </div>
                ) : null}
                <div className="subtext">Reply</div>
                <div className="reply-block">
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

        <section className="grid grid-3" style={{ marginBottom: 18 }}>
          <div className="card fill">
            <div className="card-title-row">
              <h2 className="section-title">주요 관찰 종목</h2>
              <span className="pill pill-blue">Watch</span>
            </div>
            <div className="watch-grid">
              {watchlist.map((item) => (
                <div key={item.symbol} className="watch-card">
                  <div className="watch-header">
                    <div className="watch-symbol">{item.symbol}</div>
                    <div className={`badge chip-${item.sentiment}`}>{item.change}</div>
                  </div>
                  <div className="watch-price">{item.price}</div>
                  <div className="watch-note">{item.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card fill">
            <div className="card-title-row">
              <h2 className="section-title">캘린더 & 이벤트</h2>
              <span className="pill">중요도</span>
            </div>
            <div className="timeline">
              {events.map((event) => (
                <div key={event.title} className="timeline-row">
                  <div className="timeline-date">{event.date}</div>
                  <div className="timeline-body">
                    <div className="timeline-title">{event.title}</div>
                    <div className="timeline-meta">
                      <span className={`impact impact-${event.impact}`}>{event.impact}</span>
                      <span className="timeline-tag">{event.tag}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card fill">
            <div className="card-title-row">
              <h2 className="section-title">Agent 플레이북</h2>
              <span className="pill pill-green">다음 단계</span>
            </div>
            <div className="playbook-list">
              {playbooks.map((play) => (
                <div key={play.title} className="play-card">
                  <div className="play-title">{play.title}</div>
                  <div className="play-desc">{play.description}</div>
                  <ul>
                    {play.actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginBottom: 36 }}>
          <div className="card-title-row">
            <h2 className="section-title">로컬 실행 가이드</h2>
            <span className="pill">Backend / Frontend</span>
          </div>
          <p className="subtext">두 터미널에서 각각 실행하면 됩니다.</p>
          <div className="code-block">
            <div>cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000</div>
            <div style={{ marginTop: 6 }}>cd frontend && npm install && npm run dev -- --host</div>
          </div>
        </section>
      </div>
    </div>
  );
}
