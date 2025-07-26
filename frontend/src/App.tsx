// App.tsx 예제
import { useEffect, useState } from 'react'
import { pingServer } from './api/ping'

export default function App() {
  const [message, setMessage] = useState("...")

  useEffect(() => {
    pingServer().then(res => setMessage(res.message))
  }, [])

  return <div className="text-xl">백엔드 응답: {message}</div>
}
