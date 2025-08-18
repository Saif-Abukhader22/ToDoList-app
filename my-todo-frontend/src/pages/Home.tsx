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

  // ai
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

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
          // token missing/expired → force relogin
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

  // AI Call
  const askAI = async () => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await api.post<{ message: string }>("/ai/chat", {
        messages: [
          { role: "system", content: "You are a helpful assistant for a todo app." },
          { role: "user", content: "Suggest 3 productive tasks for me today." },
        ],
      });
      setAiResponse(res.data.message);
    } catch (err) {
      console.error("AI error", err);
      setAiResponse("Something went wrong talking to AI.");
    } finally {
      setAiLoading(false);
    }
  };

  // filtering + stats
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900
                    dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur
                      dark:border-slate-800 dark:bg-slate-900/80">
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="btn btn-muted"
          aria-expanded={sidebarOpen}
          aria-controls="sidebar"
        >
          {sidebarOpen ? "Close" : "Menu"}
        </button>
        <h1 className="text-lg font-semibold">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">To-Do</span> List
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setDark((d) => !d)} className="btn btn-muted">
            {dark ? "Light" : "Dark"}
          </button>
          <button
            onClick={() => { logout(); nav("/login", { replace: true }); }}
            className="btn btn-muted"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Shell: sidebar + main */}
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
                <div className="flex gap-2">
                  <button onClick={() => setDark((d) => !d)} className="btn btn-muted">
                    {dark ? "🌙" : "☀️"}
                  </button>
                  <button
                    onClick={() => { logout(); nav("/login", { replace: true }); }}
                    className="btn btn-muted"
                  >
                    Logout
                  </button>
                </div>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => setFilter("all")}
                  className={`w-full rounded-xl px-3 py-2 text-left transition ${
                    filter === "all" ? "bg-blue-600 text-white dark:bg-blue-500" : "hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  All tasks
                </button>
                <button
                  onClick={() => setFilter("active")}
                  className={`w-full rounded-xl px-3 py-2 text-left transition ${
                    filter === "active" ? "bg-blue-600 text-white dark:bg-blue-500" : "hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter("done")}
                  className={`w-full rounded-xl px-3 py-2 text-left transition ${
                    filter === "done" ? "bg-blue-600 text-white dark:bg-blue-500" : "hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Completed
                </button>
              </nav>

              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="card p-3">
                  <div className="text-xs opacity-70">Total</div>
                  <div className="text-lg font-semibold">{stats.total}</div>
                </div>
                <div className="card p-3">
                  <div className="text-xs opacity-70">Done</div>
                  <div className="text-lg font-semibold">{stats.done}</div>
                </div>
                <div className="card p-3">
                  <div className="text-xs opacity-70">Left</div>
                  <div className="text-lg font-semibold">{stats.remaining}</div>
                </div>
              </div>

              <button onClick={clearCompleted} className="btn btn-muted mt-6 w-full">
                Clear completed
              </button>

              {/* AI button */}
              <button onClick={askAI} className="btn btn-accent mt-3 w-full">
                {aiLoading ? "Thinking…" : "Ask AI"}
              </button>
              {aiResponse && (
                <div className="mt-3 p-3 text-sm rounded bg-slate-100 dark:bg-slate-800">
                  {aiResponse}
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

            <div className="mt-4 text-sm opacity-70">
              Showing: <span className="badge capitalize">{filter}</span>
            </div>

            {/* List */}
            <ul className="mt-4 space-y-2">
              {filtered.map((todo) => (
                <li
                  key={todo.id}
                  className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition hover:shadow
                             dark:border-slate-700 dark:bg-slate-900"
                >
                  <label className="flex w-full items-center gap-3">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => toggleTodo(todo.id)}
                      className="checkbox"
                    />
                    <span className={todo.done ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-100"}>
                      {todo.title}
                    </span>
                  </label>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="ml-3 rounded-lg px-2 py-1 text-sm font-semibold text-red-600 opacity-0 transition group-hover:opacity-100 hover:bg-red-50
                               dark:text-red-400 dark:hover:bg-red-900/20"
                    aria-label="Delete"
                  >
                    Delete
                  </button>
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
