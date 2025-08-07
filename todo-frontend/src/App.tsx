import { useEffect, useState } from "react";
import './App.css'
import axios from "axios";

type Todo = {
  id: number;
  title: string;
  done: boolean; 
};

//main component
function App() {
  // [ currentValue, functionToUpdateValue ]
  const [todos, setTodos] = useState<Todo[]>([
// empty list of type Todo

  ]);

  const [newTitle, setNewTitle] = useState(""); 
  // const [nextId, setNextId] = useState(1);  // 🔁 No longer needed


  const addTodo = () => {
    if (newTitle.trim() === "") return;
  
    const newTodo = {
      title: newTitle,
      done: false
    };
  
    axios.post("http://127.0.0.1:8000/todos", newTodo)
      .then((res) => {
        // Add the todo returned from backend (it includes the auto-generated ID)
        setTodos([...todos, res.data]);
        setNewTitle("");
      })
      .catch((err) => console.error("Failed to add todo", err));
  };
  

  const toggleTODo = (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
  
    const updatedTodo = { ...todo, done: !todo.done };
      
    axios.patch(`http://127.0.0.1:8000/todos/${id}`, updatedTodo)
      .then((res) => {
        setTodos((prev) =>
          prev.map((t) => (t.id === id ? res.data : t))
        );
      })
      .catch((err) => console.error("Failed to update todo", err));
  };
  
  
  const deleteTodo = (id: number) => {
    axios.delete(`http://127.0.0.1:8000/todos/${id}`)
      .then(() => {
        setTodos((prev) => prev.filter((t) => t.id !== id));
      })
      .catch((err) => console.error("Failed to delete todo", err));
  };
  

  // runs when component loads
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/todos")
      .then((res) => setTodos(res.data))
      .catch((err) => console.error("Failed to fetch todos", err));
  }, []);

  // "Here's the UI I want you to display."
  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">To-Do List</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Enter a task"
          className="flex-1 border rounded px-3 py-1"
        />
        <button
          onClick={addTodo}
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="p-2 bg-gray-100 rounded shadow-sm flex justify-between items-center"
          >
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTODo(todo.id)}
              />
              <span className={todo.done ? "line-through text-gray-500" : ""}>
                {todo.title}
              </span>
            </label>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
