import { useState } from "react";

let toastId = 0;

export default function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "default") => {
    const id = ++toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.map(x => x.id === id ? { ...x, removing: true } : x)), 2800);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };
  return { toasts, add };
}

