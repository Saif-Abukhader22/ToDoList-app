import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

type Todo = { id: number; title: string; done: boolean };
type Filter = "all" | "active" | "done";

export default function Home() {
  // data
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");

  // ui
  const [dark, setDark] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const { logout } = useAuth();
  const nav = useNavigate();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Persist/apply theme
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  // Fetch todos on mount
  useEffect(() => {
    api.get<Todo[]>("/todos")
      .then((res) => setTodos(res.data))
      .catch((err) => {
        console.error("Failed to fetch todos", err);
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          nav("/login", { replace: true });
        }
      });
  }, [nav]);

  // CRUD
  const addTodo = () => {
    const title = newTitle.trim();
    if (!title) return;

    api.post<Todo>("/todos", { title, done: false })
      .then((res) => {
        setTodos((prev) => [...prev, res.data]);
        setNewTitle("");
      })
      .catch((err) => console.error("Failed to add todo", err));
  };

  const toggleTodo = (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const updated = { ...todo, done: !todo.done };

    api.patch<Todo>(`/todos/${id}`, updated)
      .then((res) => setTodos((prev) => prev.map((t) => (t.id === id ? res.data : t))))
      .catch((err) => console.error("Failed to update todo", err));
  };

  const deleteTodo = (id: number) => {
    api.delete(`/todos/${id}`)
      .then(() => setTodos((prev) => prev.filter((t) => t.id !== id)))
      .catch((err) => console.error("Failed to delete todo", err));
  };

  const clearCompleted = () => {
    const completed = todos.filter((t) => t.done);
    setTodos((prev) => prev.filter((t) => !t.done));
    completed.forEach((t) => deleteTodo(t.id));
  };

  // Filtering + stats
  const filtered = useMemo(() => {
    let list = todos;
    if (filter === "active") list = list.filter((t) => !t.done);
    if (filter === "done") list = list.filter((t) => t.done);
    return list;
  }, [todos, filter]);

  const stats = useMemo(() => {
    const total = todos.length;
    const done = todos.filter((t) => t.done).length;
    return { total, done, remaining: total - done };
  }, [todos]);

  // 🔹 Call AI backend
  const askAI = async () => {
    setAiLoading(true);
    setAiSuggestion("");
    try {
      const { data } = await api.post("/ai/chat", {
        messages: [
          { role: "system", content: "You are a helpful task assistant." },
          { role: "user", content: "Suggest 3 tasks I should do today." }
        ]
      });
      setAiSuggestion(data.message);
    } catch (err) {
      console.error("AI request failed", err);
      setAiSuggestion("Error: Could not get AI response.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900
                    dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">

      {/* Sidebar + Main */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside
          id="sidebar"
          className={`${sidebarOpen ? "block" : "hidden"} lg:block lg:sticky lg:top-0 lg:h-screen lg:self-start`}
        >
          <div className="p-4 lg:p-6">
            <div className="card p-4">
              <div className="mb-4 hidden lg:flex items-center justify-between">
                <div className="font-semibold text-xl">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">To-Do</span>
                </div>
              </div>
              <button onClick={askAI} className="btn btn-primary w-full mb-4">
                {aiLoading ? "Thinking..." : "✨ Ask AI for tasks"}
              </button>
              {aiSuggestion && (
                <div className="card mt-2 p-3 text-sm whitespace-pre-wrap">
                  {aiSuggestion}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="px-4 pb-12 pt-6 lg:px-8">
          <div className="card p-5">
            {/* Create */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Add a new task…"
                className="input"
                onKeyDown={(e) => e.key === "Enter" && addTodo()}
              />
              <button onClick={addTodo} className="btn btn-primary">Add</button>
            </div>

            {/* List */}
            <ul className="mt-4 space-y-2">
              {filtered.map((todo) => (
                <li key={todo.id} className="group flex items-center justify-between rounded-xl border p-2">
                  <label className="flex w-full items-center gap-3">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => toggleTodo(todo.id)}
                      className="checkbox"
                    />
                    <span className={todo.done ? "line-through" : ""}>{todo.title}</span>
                  </label>
                  <button onClick={() => deleteTodo(todo.id)} className="text-red-600">Delete</button>
                </li>
              ))}
            </ul>
          </div>

          <footer className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            © 2025 All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}
