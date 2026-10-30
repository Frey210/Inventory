"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CircleCheck, X } from "lucide-react";

const Feedback = createContext<((message: string | null) => void) | null>(null);

export function useActionFeedback() {
  const notify = useContext(Feedback);
  if (!notify) throw new Error("ActionFeedbackProvider is required");
  return notify;
}

export function ActionFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notice, setNotice] = useState<{ message: string; key: string } | null>(
    null,
  );
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!notice || paused) return;
    const timer = window.setTimeout(() => setNotice(null), 8000);
    return () => window.clearTimeout(timer);
  }, [notice, paused]);

  const notify = useCallback((message: string | null) => {
    setPaused(false);
    setNotice(message ? { message, key: crypto.randomUUID() } : null);
  }, []);

  return (
    <Feedback.Provider value={notify}>
      {children}
      <div
        className="action-feedback-host no-print"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={notice ? "action-feedback" : undefined}
        >
          {notice && (
            <>
              <CircleCheck size={24} aria-hidden />
              <div key={notice.key}>
                <strong>Berhasil</strong>
                <p>{notice.message}</p>
              </div>
              <button
                type="button"
                className="action-feedback-close"
                aria-label="Tutup notifikasi"
                onClick={() => notify(null)}
              >
                <X size={18} aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>
    </Feedback.Provider>
  );
}
