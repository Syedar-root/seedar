import { useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { Chart, ListTable, GridContainer } from '#pkg/seedar/ui-react';
import styles from './UserPage.module.scss';
import { useExecuteQuery } from '#pkg/seedar/ui-react';

const UserPage = () => {
  const { users, isLoading, fetchUsers, setCurrentUser } = useUserStore();

  const { data, isPending: queryIsLoading, error, mutate } = useExecuteQuery();

  useEffect(() => {
    mutate(6);
  }, [mutate]);

  const mockData = {
    vchartProps: {
      spec: {
        type: 'bar' as const,
        data: [
          {
            id: 'userData',
            values: [
              { month: '一月', activeUsers: 120, newUsers: 45 },
              { month: '二月', activeUsers: 150, newUsers: 60 },
              { month: '三月', activeUsers: 180, newUsers: 75 },
              { month: '四月', activeUsers: 200, newUsers: 85 },
              { month: '五月', activeUsers: 220, newUsers: 95 },
              { month: '六月', activeUsers: 250, newUsers: 110 },
            ],
          },
        ],
        xField: 'month',
        yField: ['activeUsers', 'newUsers'],
        seriesField: 'type',
        axes: [
          {
            orient: 'left' as const,
            type: 'linear' as const,
            title: { visible: true, text: '用户数量' },
          },
          {
            orient: 'bottom' as const,
            type: 'band' as const,
            title: { visible: true, text: '月份' },
          },
        ],
        legends: {
          visible: true,
        },
        title: {
          visible: true,
          text: '用户统计趋势图',
          style: {
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
      },
    },
  };

  return (
    <div className={styles.container}>
      <h2>用户管理</h2>
      {/* <Chart vchartProps={mockData.vchartProps} />
      <ListTable queryId={6} /> */}
      <GridContainer />
    </div>
  );
};

export default UserPage;
