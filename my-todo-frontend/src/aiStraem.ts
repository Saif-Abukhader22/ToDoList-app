// src/aiStream.ts
export async function askAIStream(baseURL: string, prompt: string, onChunk: (t: string)=>void) {
  const res = await fetch(`${baseURL}/ai/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    // split SSE frames
    for (const line of buf.split("\n\n")) {
      if (!line.startsWith("data:")) continue;
      const chunk = line.slice(5).trim();
      if (chunk === "[DONE]") return;
      onChunk(chunk);
    }
    buf = "";
  }
}
