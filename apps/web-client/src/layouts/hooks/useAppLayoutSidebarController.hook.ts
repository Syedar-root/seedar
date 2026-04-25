import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";

const DEFAULT_SIDEBAR_PERCENT = 30;
const MIN_SIDEBAR_PERCENT = 0;
const MAX_SIDEBAR_PERCENT = 50;
const SIDEBAR_ANIMATION_MS = 320;
const SIDEBAR_MOUNT_DELAY_MS = 40;
const EPSILON = 0.1;

interface UseAppLayoutSidebarControllerReturn {
  sidebarPanelRef: RefObject<PanelImperativeHandle | null>;
  isSidebarContentVisible: boolean;
  isSidebarContentMounted: boolean;
  recordSidebarWidth: (panelSize: PanelSize) => void;
}

/**
 * Controls sidebar behavior for AppLayout.
 *
 * Responsibilities:
 * 1. Run panel width animation via react-resizable-panels imperative API.
 * 2. Remember and restore last user-resized sidebar width.
 * 3. Delay sidebar content mount so the main area can render first.
 */
export const useAppLayoutSidebarController = (
  isSeeMindOn: boolean,
): UseAppLayoutSidebarControllerReturn => {
  const sidebarPanelRef = useRef<PanelImperativeHandle | null>(null);
  const lastSidebarWidthRef = useRef(DEFAULT_SIDEBAR_PERCENT);
  const animationFrameRef = useRef<number | null>(null);
  const animationStartAtRef = useRef<number | null>(null);
  const openRafOneRef = useRef<number | null>(null);
  const openRafTwoRef = useRef<number | null>(null);
  const mountDelayTimerRef = useRef<number | null>(null);
  const mountRafOneRef = useRef<number | null>(null);
  const mountRafTwoRef = useRef<number | null>(null);
  const isProgrammaticResizeRef = useRef(false);
  const [isSidebarContentVisible, setIsSidebarContentVisible] = useState(false);
  const [isSidebarContentMounted, setIsSidebarContentMounted] = useState(false);

  /** Clamp sidebar width to the supported range. */
  const clampSidebarPercent = useCallback(
    (value: number) =>
      Math.min(MAX_SIDEBAR_PERCENT, Math.max(MIN_SIDEBAR_PERCENT, value)),
    [],
  );

  /** Stop active width animation and reset animation flags. */
  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    animationStartAtRef.current = null;
    isProgrammaticResizeRef.current = false;
  }, []);

  /** Clear delayed mount timers/frames to avoid stale callbacks. */
  const clearSidebarMountSchedule = useCallback(() => {
    if (mountDelayTimerRef.current !== null) {
      window.clearTimeout(mountDelayTimerRef.current);
      mountDelayTimerRef.current = null;
    }

    if (mountRafOneRef.current !== null) {
      window.cancelAnimationFrame(mountRafOneRef.current);
      mountRafOneRef.current = null;
    }

    if (mountRafTwoRef.current !== null) {
      window.cancelAnimationFrame(mountRafTwoRef.current);
      mountRafTwoRef.current = null;
    }
  }, []);

  /** Clear delayed open frames used to let main render first. */
  const clearSidebarOpenSchedule = useCallback(() => {
    if (openRafOneRef.current !== null) {
      window.cancelAnimationFrame(openRafOneRef.current);
      openRafOneRef.current = null;
    }

    if (openRafTwoRef.current !== null) {
      window.cancelAnimationFrame(openRafTwoRef.current);
      openRafTwoRef.current = null;
    }
  }, []);

  /**
   * Mount sidebar content slightly later and then fade it in.
   * This separates heavy content render from panel width animation.
   */
  const scheduleSidebarContentMount = useCallback(() => {
    clearSidebarMountSchedule();

    mountDelayTimerRef.current = window.setTimeout(() => {
      setIsSidebarContentMounted(true);

      mountRafOneRef.current = window.requestAnimationFrame(() => {
        mountRafTwoRef.current = window.requestAnimationFrame(() => {
          setIsSidebarContentVisible(true);
        });
      });
    }, SIDEBAR_MOUNT_DELAY_MS);
  }, [clearSidebarMountSchedule]);

  /**
   * Animate sidebar width using requestAnimationFrame and panel.resize.
   * We mark this as programmatic resize so drag-width persistence is not polluted.
   */
  const animateSidebarWidth = useCallback(
    (fromPercent: number, toPercent: number, onDone?: () => void) => {
      const panel = sidebarPanelRef.current;
      if (!panel) {
        return;
      }

      stopAnimation();

      const from = clampSidebarPercent(fromPercent);
      const to = clampSidebarPercent(toPercent);

      if (Math.abs(from - to) < EPSILON) {
        panel.resize(`${to}%`);
        onDone?.();
        return;
      }

      isProgrammaticResizeRef.current = true;
      const step = (timestamp: number) => {
        if (animationStartAtRef.current === null) {
          animationStartAtRef.current = timestamp;
        }

        const elapsed = timestamp - animationStartAtRef.current;
        const progress = Math.min(1, elapsed / SIDEBAR_ANIMATION_MS);
        const easedProgress = 1 - (1 - progress) ** 3;
        const next = from + (to - from) * easedProgress;

        panel.resize(`${clampSidebarPercent(next)}%`);

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(step);
          return;
        }

        panel.resize(`${to}%`);
        stopAnimation();
        onDone?.();
      };

      animationFrameRef.current = window.requestAnimationFrame(step);
    },
    [clampSidebarPercent, stopAnimation],
  );

  /**
   * Open sidebar only after two paint frames so main has priority to settle.
   */
  const openSidebarAfterMainPaint = useCallback(() => {
    const panel = sidebarPanelRef.current;
    if (!panel) {
      return;
    }

    const target = clampSidebarPercent(lastSidebarWidthRef.current);

    panel.expand();
    panel.resize("0%");
    animateSidebarWidth(0, target);
    scheduleSidebarContentMount();
  }, [animateSidebarWidth, clampSidebarPercent, scheduleSidebarContentMount]);

  /** Cleanup all timers/frames when hook owner unmounts. */
  useEffect(() => {
    return () => {
      stopAnimation();
      clearSidebarMountSchedule();
      clearSidebarOpenSchedule();
    };
  }, [clearSidebarMountSchedule, clearSidebarOpenSchedule, stopAnimation]);

  /**
   * Central open/close flow.
   * - open: hide/unmount content -> wait main paint -> expand panel -> mount content
   * - close: hide/unmount content immediately -> collapse panel
   */
  useEffect(() => {
    const panel = sidebarPanelRef.current;
    if (!panel) {
      return;
    }

    stopAnimation();
    clearSidebarMountSchedule();
    clearSidebarOpenSchedule();

    if (isSeeMindOn) {
      setIsSidebarContentVisible(false);
      setIsSidebarContentMounted(false);

      openRafOneRef.current = window.requestAnimationFrame(() => {
        openRafTwoRef.current = window.requestAnimationFrame(() => {
          openSidebarAfterMainPaint();
        });
      });
      return;
    }

    if (!panel.isCollapsed()) {
      const current = clampSidebarPercent(panel.getSize().asPercentage);
      if (current > EPSILON) {
        lastSidebarWidthRef.current = current;
      }

      setIsSidebarContentVisible(false);
      setIsSidebarContentMounted(false);
      animateSidebarWidth(current, 0, () => {
        panel.collapse();
      });
      return;
    }

    setIsSidebarContentVisible(false);
    setIsSidebarContentMounted(false);
  }, [
    animateSidebarWidth,
    clampSidebarPercent,
    clearSidebarMountSchedule,
    clearSidebarOpenSchedule,
    isSeeMindOn,
    openSidebarAfterMainPaint,
    stopAnimation,
  ]);

  /** Persist width only for user drag actions, not scripted animation. */
  const recordSidebarWidth = useCallback(
    (panelSize: PanelSize) => {
      const panel = sidebarPanelRef.current;
      if (
        panel &&
        !panel.isCollapsed() &&
        isSeeMindOn &&
        !isProgrammaticResizeRef.current
      ) {
        const next = clampSidebarPercent(panelSize.asPercentage);
        if (next > EPSILON) {
          lastSidebarWidthRef.current = next;
        }
      }
    },
    [clampSidebarPercent, isSeeMindOn],
  );

  return {
    sidebarPanelRef,
    isSidebarContentVisible,
    isSidebarContentMounted,
    recordSidebarWidth,
  };
};
