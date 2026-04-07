import { Outlet } from "react-router-dom";
import { GlobalNavigation } from "@/core/components/business/GlobalNavigation";
import AIChatPreview from "@/core/components/business/AIChat";
import { useAppStore } from "@/core/store";
import styles from "./AppLayout.module.scss";

const AppLayout = () => {
  const isSeeMindOn = useAppStore((state) => state.isSeeMindOn);

  return (
    <div className={styles.layout}>
      <GlobalNavigation />
      <div className={styles.content}>
        <main className={styles.main}>
          <Outlet />
        </main>
        <aside
          className={`${styles.sidebar} ${isSeeMindOn ? styles.sidebarOpen : styles.sidebarClose}`}
        >
          <div className={styles.sidebarInner}>
            <AIChatPreview />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AppLayout;
