import { useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { Chart } from '#pkg/seedar/ui-react';
import styles from './UserPage.module.scss';
import { useExecuteQuery } from '#pkg/seedar/ui-react';

const UserPage = () => {
  const { users, isLoading, fetchUsers, setCurrentUser } = useUserStore();

  const { data, isLoading: queryIsLoading, error, mutate } = useExecuteQuery();

  useEffect(() => {
    mutate(6);
  }, [mutate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserClick = (user: {
    id: string;
    name: string;
    email: string;
  }) => {
    setCurrentUser(user);
    console.log('Current user:', user);
  };

  const mockData = {
    vchartProps: {
      spec: {
        type: 'bar',
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
            orient: 'left',
            type: 'linear',
            title: { visible: true, text: '用户数量' },
          },
          {
            orient: 'bottom',
            type: 'band',
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
      {isLoading ? (
        <p>加载中...</p>
      ) : (
        <ul className={styles.userList}>
          {users.map((user) => (
            <li
              key={user.id}
              className={styles.userItem}
              onClick={() => handleUserClick(user)}
            >
              <span className={styles.name}>{user.name}</span>
              <span className={styles.email}>{user.email}</span>
            </li>
          ))}
        </ul>
      )}
      <Chart vchartProps={mockData.vchartProps} />
    </div>
  );
};

export default UserPage;
