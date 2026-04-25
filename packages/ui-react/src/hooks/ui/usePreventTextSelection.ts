import { useCallback } from "react";

export const usePreventTextSelection = () => {
  const enable = useCallback(() => {
    document.body.style.userSelect = "none";
  }, []);

  const disable = useCallback(() => {
    document.body.style.userSelect = "";
  }, []);

  return { enable, disable };
};
