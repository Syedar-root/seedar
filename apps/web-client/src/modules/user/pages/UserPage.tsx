import { useCallback, useEffect, useMemo } from 'react';
import { useUserStore } from '../store/userStore';
import { Chart, ListTable, SeedarDashboard } from '#pkg/seedar/ui-react';
import styles from './UserPage.module.scss';
import { useExecuteQuery } from '#pkg/seedar/ui-react';

const UserPage = () => {
  const header = useMemo(() => {
    return (
      <div className={styles.header}>
        <h2>用户管理</h2>
        <SeedarDashboard.AddPanelTrigger>
          <button className={styles.addPanel}>添加面板</button>
        </SeedarDashboard.AddPanelTrigger>
      </div>
    );
  }, []);
  const panelHeaderExtra = useCallback((panelId: string) => {
    return (
      <SeedarDashboard.RemovePanelTrigger panelId={panelId}>
        <button className={styles.removePanel}>删除面板</button>
      </SeedarDashboard.RemovePanelTrigger>
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

export default UserPage;
