import { Outlet } from "react-router-dom";
import { Group, Panel, Separator } from "react-resizable-panels";
import { GlobalNavigation } from "@/core/components/business/GlobalNavigation";
import AIChatPreview from "@/core/components/business/AIChat";
import { useAppStore } from "@/core/store";
import styles from "./AppLayout.module.scss";
import type { AppLayoutProps } from "./types";

const AppLayout = (_props: AppLayoutProps) => {
  const isSeeMindOn = useAppStore((state) => state.isSeeMindOn);

  return (
    <div className={styles.layout}>
      <GlobalNavigation />
      <div className={styles.content}>
        <Group orientation="horizontal">
          <Panel minSize={"25%"} defaultSize={isSeeMindOn ? "70%" : "100%"}>
            <main className={styles.main}>
              <Outlet />
            </main>
          </Panel>
          {isSeeMindOn && (
            <>
              <Separator className={styles.resizeHandle} />
              <Panel defaultSize="30%">
                <aside className={styles.sidebar}>
                  <div className={styles.sidebarInner}>
                    <AIChatPreview />
                  </div>
                </aside>
              </Panel>
            </>
          )}
        </Group>
      </div>
    </div>
  );
};

export default AppLayout;
