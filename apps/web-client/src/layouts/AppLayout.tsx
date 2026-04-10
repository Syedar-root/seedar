import { Outlet } from "react-router-dom";
import { Group, Panel, Separator } from "react-resizable-panels";
import { GlobalNavigation } from "@/core/components/business/GlobalNavigation";
import AIChatPreview from "@/core/components/business/AIChat";
import { useAppStore } from "@/core/store";
import styles from "./AppLayout.module.scss";
import type { AppLayoutProps } from "./types";
import { CSSTransition } from "react-transition-group";
import { useRef } from "react";
import "./anime.css";

const AppLayout = (_props: AppLayoutProps) => {
  const isSeeMindOn = useAppStore((state) => state.isSeeMindOn);

  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <div className={styles.layout}>
      <GlobalNavigation />
      <div className={styles.content}>
        <Group orientation="horizontal">
          <Panel minSize={"50%"} defaultSize={70} style={{ flex: 1 }}>
            <main className={styles.main}>
              <Outlet />
            </main>
          </Panel>

          {isSeeMindOn && (
            <Separator
              className={styles.resizeHandle}
              style={{
                opacity: isSeeMindOn ? 1 : 0,
                pointerEvents: isSeeMindOn ? "auto" : "none",
              }}
            />
          )}

          <CSSTransition
            in={isSeeMindOn}
            timeout={500}
            classNames="sidebarTransition"
            nodeRef={nodeRef}
          >
            <Panel
              minSize={0}
              defaultSize={isSeeMindOn ? 30 : 0}
              style={{
                width: isSeeMindOn ? "auto" : "0px",
              }}
              elementRef={nodeRef}
            >
              <aside className={styles.sidebar}>
                <AIChatPreview />
              </aside>
            </Panel>
          </CSSTransition>
        </Group>
      </div>
    </div>
  );
};

export default AppLayout;
