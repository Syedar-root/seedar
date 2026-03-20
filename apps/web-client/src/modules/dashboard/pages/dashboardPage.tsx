import { useCallback, useMemo } from 'react';
import { SeedarDashboard } from '#pkg/seedar/ui-react';
import styles from './styles/dashboard.module.scss';
import { ExternalLink, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const header = useMemo(() => {
    return (
      <div className={styles.header}>
        <SeedarDashboard.AddPanelTrigger>
          <button className={styles.addPanel}>添加面板</button>
        </SeedarDashboard.AddPanelTrigger>
      </div>
    );
  }, []);

  const navigate = useNavigate();
  const handlePanelClick = useCallback(
    (panelId: string) => {
      navigate(`/panel/${panelId}`);
    },
    [navigate],
  );

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
  return (
    <div className={styles.container}>
      <SeedarDashboard
        autoUpdate={true}
        dashboardId="c6a83ac6-06ea-405d-a67e-d10a89450e3f"
        header={header}
        panelHeaderExtra={panelHeaderExtra}
      ></SeedarDashboard>
    </div>
  );
};
