import { Outlet } from "react-router-dom";
import { Group, Panel, Separator } from "react-resizable-panels";
import { GlobalNavigation } from "@/core/components/business/GlobalNavigation";
import AIChatPreview from "@/core/components/business/AIChat";
import { AppOnboardingManager } from "@/core/components/business/AppOnboardingManager";
import { useAppStore } from "@/core/store";
import styles from "./AppLayout.module.scss";
import type { AppLayoutProps } from "./types";
import { useAppLayoutSidebarController } from "./hooks";

const AppLayout = (_props: AppLayoutProps) => {
  const isSeeMindOn = useAppStore((state) => state.isSeeMindOn);
  const isWindowFullscreen = useAppStore((state) => state.isWindowFullscreen);
  const {
    sidebarPanelRef,
    isSidebarContentVisible,
    isSidebarContentMounted,
    recordSidebarWidth,
  } = useAppLayoutSidebarController(isSeeMindOn);

  return (
    <div className={styles.layout}>
      {!isWindowFullscreen && <GlobalNavigation />}
      <div className={styles.content}>
        <Group orientation="horizontal">
          <Panel
            minSize={"50%"}
            defaultSize={isSeeMindOn ? "70%" : "100%"}
            style={{ flex: 1 }}
          >
            <main className={styles.main}>
              <Outlet />
            </main>
          </Panel>

          <Separator
            className={styles.resizeHandle}
            disabled={!isSeeMindOn}
            style={{
              opacity: isSeeMindOn ? 1 : 0,
              pointerEvents: isSeeMindOn ? "auto" : "none",
            }}
          />

          <Panel
            id="app-sidebar"
            collapsible={true}
            collapsedSize={0}
            className={styles.sidebarPanel}
            defaultSize={isSeeMindOn ? "30%" : "0%"}
            minSize={"0%"}
            panelRef={sidebarPanelRef}
            onResize={recordSidebarWidth}
          >
            <aside
              className={`${styles.sidebar} ${
                isSidebarContentVisible
                  ? styles.sidebarVisible
                  : styles.sidebarHidden
              }`}
            >
              {isSidebarContentMounted ? <AIChatPreview /> : null}
            </aside>
          </Panel>
        </Group>
      </div>
      <AppOnboardingManager />
    </div>
  );
};

export default AppLayout;
