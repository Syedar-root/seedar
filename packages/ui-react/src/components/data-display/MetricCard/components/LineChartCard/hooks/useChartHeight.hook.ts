import { useState, useEffect, useRef } from "react";

export function useChartHeight(): {
  containerRef: React.RefObject<HTMLDivElement>;
  chartHeight: string | number;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState<string | number>("100%");

  useEffect(() => {
    if (!containerRef.current) return;

    const updateChartHeight = () => {
      if (!containerRef.current) {
        return;
      }

      // clientHeight includes the element's vertical padding,
      // so the chart side matches the rendered height of the left section.
      setChartHeight(containerRef.current.clientHeight);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          updateChartHeight();
        }
      }
    });

    updateChartHeight();
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { containerRef, chartHeight };
}
