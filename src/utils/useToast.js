import { useState, useCallback, useRef } from "react";

let _id = 0;

/**
 * useToast()
 * Returns { toasts, showToast, ToastContainer }
 *
 * showToast(message, type?)   type: "ok" | "error" | ""
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    // Add exit class first, then remove after animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    timers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, 220);
  }, []);

  const showToast = useCallback(
    (message, type = "") => {
      const id = ++_id;
      setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
      timers.current[id] = setTimeout(() => removeToast(id), 3000);
    },
    [removeToast]
  );

  return { toasts, showToast, removeToast };
}
