import { api } from "./api"; 

export async function askAI(prompt: string) {
  const { data } = await api.post<{ message: string }>("/ai/chat", {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
  });
  return data.message;
}
