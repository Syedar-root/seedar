import { useCallback, useEffect, useRef } from "react";

interface UseAutoScrollOptions {
  threshold?: number;
  maxScrollAmount?: number;
  minScrollAmount?: number;
  interval?: number;
}

export const useAutoScroll = (options: UseAutoScrollOptions = {}) => {
  const {
    threshold = 150,
    maxScrollAmount = 20,
    minScrollAmount = 5,
    interval = 50,
  } = options;

  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);

  const findScrollViewport = useCallback((container: HTMLElement) => {
    const viewport = container.closest(
      "[data-scroll-area-viewport]",
    ) as HTMLDivElement;
    if (viewport) {
      scrollViewportRef.current = viewport;
    }
  }, []);

  const autoScrollIfNeeded = useCallback(() => {
    if (!scrollViewportRef.current || !mousePositionRef.current) return;

    const viewport = scrollViewportRef.current;
    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const rect = viewport.getBoundingClientRect();

    const mouseY = mousePositionRef.current.y;
    const distanceToBottom = rect.bottom - mouseY;

    if (distanceToBottom < threshold && distanceToBottom > 0) {
      const scrollAmount = Math.max(
        minScrollAmount,
        maxScrollAmount * (1 - distanceToBottom / threshold),
      );
      viewport.scrollTop = Math.min(
        scrollTop + scrollAmount,
        scrollHeight - clientHeight,
      );
    }
  }, [threshold, maxScrollAmount, minScrollAmount]);

  const start = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
    scrollIntervalRef.current = setInterval(() => {
      autoScrollIfNeeded();
    }, interval);
  }, [autoScrollIfNeeded, interval]);

  const stop = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    document.addEventListener("mousemove", handleMouseMove, true);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
    };
  }, []);

  return {
    findScrollViewport,
    start,
    stop,
  };
};
