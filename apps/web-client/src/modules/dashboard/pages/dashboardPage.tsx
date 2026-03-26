import { useCallback, useMemo } from "react";
import { SeedarDashboard } from "#pkg/seedar/ui-react";
import styles from "./styles/dashboard.module.scss";
import { ExternalLink, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Empty } from "@/core/components/ui/Empty";
import { DashboardAside } from "../components/aside";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const handlePanelClick = useCallback(
    (panelId: string) => {
      navigate(`/panel/${panelId}`);
    },
    [navigate],
  );

  const handleCreatePanelClick = useCallback(() => {
    navigate("/panel");
  }, [navigate]);

  const header = useMemo(() => {
    return (
      <div className={styles.header}>
        <SeedarDashboard.AddPanelTrigger>
          <button className={styles.addPanel}>添加已有面板</button>
        </SeedarDashboard.AddPanelTrigger>
        <button className={styles.createPanel} onClick={handleCreatePanelClick}>
          新建面板
        </button>
      </div>
    );
  }, [handleCreatePanelClick]);

  const panelHeaderExtra = useCallback((panelId: string) => {
    return (
      <div className={styles.panelHeaderExtra}>
        <ExternalLink size={16} onClick={() => handlePanelClick(panelId)} />
        <SeedarDashboard.RemovePanelTrigger panelId={panelId}>
          <Trash2 size={16} color="#fa2929" />
        </SeedarDashboard.RemovePanelTrigger>
      </div>
    );
  }, []);

  const { dashboardId } = useParams();

  return (
    <div className={styles.container}>
      <DashboardAside />
      <main>
        {dashboardId ? (
          <SeedarDashboard
            autoUpdate={true}
            dashboardId={dashboardId}
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
