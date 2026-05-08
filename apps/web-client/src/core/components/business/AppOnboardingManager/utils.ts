export const HIDDEN_ACTION_STYLE = { display: "none" } as const;

export const DEFAULT_WAIT_TIMEOUT_MS = 8000;

export const waitForTarget = (
  selector: string,
  timeoutMs: number = DEFAULT_WAIT_TIMEOUT_MS,
) => {
  return new Promise<HTMLElement>((resolve, reject) => {
    const immediate = document.querySelector(selector);
    if (immediate instanceof HTMLElement) {
      resolve(immediate);
      return;
    }

    const root = document.body;
    if (!root) {
      reject(new Error("waitForTarget：document.body 尚未就绪"));
      return;
    }

    let isDone = false;
    let timeoutId: number | undefined;
    const observer = new MutationObserver(() => {
      if (isDone) {
        return;
      }

      const node = document.querySelector(selector);
      if (!(node instanceof HTMLElement)) {
        return;
      }

      isDone = true;
      observer.disconnect();
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      resolve(node);
    });

    observer.observe(root, { childList: true, subtree: true });

    timeoutId = window.setTimeout(() => {
      if (isDone) {
        return;
      }
      isDone = true;
      observer.disconnect();
      reject(new Error(`waitForTarget 超时：${selector}`));
    }, timeoutMs);
  });
};

export const matchByClosest = (
  eventTarget: EventTarget | null,
  selector: string,
) => {
  if (!(eventTarget instanceof Element)) {
    return null;
  }
  return eventTarget.closest(selector);
};
