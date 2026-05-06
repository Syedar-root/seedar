import { useCallback, useEffect, useState } from "react";

interface ElementSize {
  width: number;
  height: number;
}

export const useElementSize = <TElement extends HTMLElement>() => {
  const [element, setElement] = useState<TElement | null>(null);
  const [elementSize, setElementSize] = useState<ElementSize>({
    width: 0,
    height: 0,
  });

  const elementRef = useCallback((nextElement: TElement | null) => {
    setElement(nextElement);
  }, []);

  useEffect(() => {
    if (!element) {
      return;
    }

    const updateElementSize = () => {
      setElementSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    const resizeObserver = new ResizeObserver(updateElementSize);

    updateElementSize();
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [element]);

  return {
    elementRef,
    elementSize,
  };
};
