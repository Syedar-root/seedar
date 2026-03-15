import { useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { Chart, ListTable, SeedarDashboard } from '#pkg/seedar/ui-react';
import styles from './UserPage.module.scss';
import { useExecuteQuery } from '#pkg/seedar/ui-react';

const UserPage = () => {
  return (
    <div className={styles.container}>
      <h2>用户管理</h2>
      {/* <Chart vchartProps={mockData.vchartProps} />
      <ListTable queryId={6} /> */}
      <SeedarDashboard dashboardId="c6a83ac6-06ea-405d-a67e-d10a89450e3f" />
    </div>
  );
};

export default UserPage;
