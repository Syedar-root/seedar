import { useCallback, useMemo, useState } from "react";

const COMPLETED_VALUE = "1";

const readCompleted = (storageKey?: string) => {
  if (!storageKey || typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(storageKey) === COMPLETED_VALUE;
};

const writeCompleted = (storageKey?: string, completed?: boolean) => {
  if (!storageKey || typeof window === "undefined") {
    return;
  }

  if (completed) {
    window.localStorage.setItem(storageKey, COMPLETED_VALUE);
    return;
  }

  window.localStorage.removeItem(storageKey);
};

export interface UseAppTourOptions {
  storageKey?: string;
  autoStart?: boolean;
  initialStep?: number;
  markCompletedOnClose?: boolean;
}

export interface UseAppTourResult {
  open: boolean;
  current: number;
  isCompleted: boolean;
  start: (step?: number) => void;
  close: () => void;
  finish: () => void;
  reset: () => void;
  next: () => void;
  prev: () => void;
  setCurrent: (step: number) => void;
  setOpen: (value: boolean) => void;
}

export const useAppTour = (options: UseAppTourOptions = {}): UseAppTourResult => {
  const {
    storageKey,
    autoStart = true,
    initialStep = 0,
    markCompletedOnClose = true,
  } = options;

  const defaultCompleted = useMemo(
    () => readCompleted(storageKey),
    [storageKey],
  );

  const [isCompleted, setIsCompleted] = useState(defaultCompleted);
  const [open, setOpen] = useState(autoStart && !defaultCompleted);
  const [current, setCurrent] = useState(initialStep);

  const start = useCallback(
    (step = initialStep) => {
      setCurrent(step);
      setOpen(true);
    },
    [initialStep],
  );

  const finish = useCallback(() => {
    setOpen(false);
    setIsCompleted(true);
    writeCompleted(storageKey, true);
  }, [storageKey]);

  const close = useCallback(() => {
    if (markCompletedOnClose) {
      finish();
      return;
    }
    setOpen(false);
  }, [finish, markCompletedOnClose]);

  const reset = useCallback(() => {
    setIsCompleted(false);
    setCurrent(initialStep);
    setOpen(false);
    writeCompleted(storageKey, false);
  }, [initialStep, storageKey]);

  const next = useCallback(() => {
    setCurrent((prev) => prev + 1);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => Math.max(0, prev - 1));
  }, []);

  return {
    open,
    current,
    isCompleted,
    start,
    close,
    finish,
    reset,
    next,
    prev,
    setCurrent,
    setOpen,
  };
};

export default useAppTour;
