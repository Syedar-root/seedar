import { useCallback, useMemo, useState } from "react";
import { SeedarDashboard } from "#pkg/seedar/ui-react";
import styles from "./styles/dashboard.module.scss";
import { ExternalLink, Trash2, Edit, Eye } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Empty } from "@/core/components/ui/Empty";
import { DashboardAside } from "../components/aside";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"edit" | "view">("view");

  const handlePanelClick = useCallback(
    (panelId: string) => {
      navigate(`/panel/${panelId}`);
    },
    [navigate],
  );

  const handleCreatePanelClick = useCallback(() => {
    navigate("/panel");
  }, [navigate]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "edit" ? "view" : "edit"));
  }, []);

  const header = useMemo(() => {
    return (
      <div className={styles.header}>
        <button
          className={styles.modeToggle}
          onClick={toggleMode}
          title={mode === "edit" ? "切换到浏览模式" : "切换到编辑模式"}
        >
          {mode === "edit" ? <Eye size={16} /> : <Edit size={16} />}
          <span>{mode === "edit" ? "浏览模式" : "编辑模式"}</span>
        </button>
        {mode === "edit" && (
          <div className={styles.headerActions}>
            <SeedarDashboard.AddPanelTrigger>
              <button className={styles.addPanel}>添加已有面板</button>
            </SeedarDashboard.AddPanelTrigger>
            <button
              className={styles.createPanel}
              onClick={handleCreatePanelClick}
            >
              新建面板
            </button>
          </div>
        )}
      </div>
    );
  }, [handleCreatePanelClick, mode, toggleMode]);

  const panelHeaderExtra = useCallback(
    (panelId: string) => {
      return (
        <div className={styles.panelHeaderExtra}>
          <ExternalLink size={16} onClick={() => handlePanelClick(panelId)} />
          {mode === "edit" && (
            <SeedarDashboard.RemovePanelTrigger panelId={panelId}>
              <Trash2 size={16} color="#fa2929" />
            </SeedarDashboard.RemovePanelTrigger>
          )}
        </div>
      );
    },
    [handlePanelClick, mode],
  );

  const { dashboardId } = useParams();

  return (
    <div className={styles.container}>
      <DashboardAside />
      <main>
        {dashboardId ? (
          <SeedarDashboard
            autoUpdate={true}
            dashboardId={dashboardId}
            mode={mode}
            header={header}
            panelHeaderExtra={panelHeaderExtra}
          ></SeedarDashboard>
        ) : (
          <Empty size="fill" description="请选择一个看板" />
        )}
      </main>
    </div>
  );
};
