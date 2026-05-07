import React from "react";
import styles from "./panelEditorErrorBoundary.module.scss";

interface PanelEditorErrorBoundaryProps {
  children: React.ReactNode;
}

interface PanelEditorErrorBoundaryState {
  hasError: boolean;
}

export class PanelEditorErrorBoundary extends React.Component<
  PanelEditorErrorBoundaryProps,
  PanelEditorErrorBoundaryState
> {
  state: PanelEditorErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): PanelEditorErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error("[PanelEditorErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.fallback} role="alert" aria-live="polite">
          <div className={styles.title}>配置面板渲染异常</div>
          <div className={styles.desc}>
            已阻止页面崩溃。请切换图表类型或刷新后重试。
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
