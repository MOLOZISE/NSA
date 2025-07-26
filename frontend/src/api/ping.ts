// frontend/src/api/ping.ts
export async function pingServer() {
  const res = await fetch("http://localhost:8000/api/ping");
  return res.json();
}
