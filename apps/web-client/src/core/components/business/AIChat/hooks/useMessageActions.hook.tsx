import { useCallback } from "react";
import { type ItemType } from "@ant-design/x/es/actions/interface";
import { Actions } from "@ant-design/x";

export const useMessageActions = () => {
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error("Failed to copy text:", error);
      return false;
    }
  }, []);

  const getMessageActions = useCallback(
    (content: string): ItemType[] => {
      return [
        {
          key: "copy",
          label: "复制",
          actionRender: () => {
            return <Actions.Copy text={content} />;
          },
        },
      ];
    },
    [copyToClipboard],
  );

  return { copyToClipboard, getMessageActions };
};
