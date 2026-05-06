interface QueuedTask<T> {
  reject: (reason?: unknown) => void;
  resolve: (value: T) => void;
  task: () => Promise<T>;
}

export const createRequestQueue = (concurrency: number) => {
  const maxConcurrency = Math.max(1, concurrency);
  const queue: QueuedTask<unknown>[] = [];
  let activeCount = 0;

  const runNext = () => {
    if (activeCount >= maxConcurrency) {
      return;
    }

    const nextTask = queue.shift();
    if (!nextTask) {
      return;
    }

    activeCount += 1;
    nextTask
      .task()
      .then(nextTask.resolve)
      .catch(nextTask.reject)
      .finally(() => {
        activeCount -= 1;
        runNext();
      });
  };

  return <T>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      queue.push({
        resolve: resolve as (value: unknown) => void,
        reject,
        task: task as () => Promise<unknown>,
      });
      runNext();
    });
};
