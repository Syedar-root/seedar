import { useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import styles from './UserPage.module.scss';

const UserPage = () => {
  const { users, isLoading, fetchUsers, setCurrentUser } = useUserStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserClick = (user: { id: string; name: string; email: string }) => {
    setCurrentUser(user);
    console.log('Current user:', user);
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
    </div>
  );
};

export default UserPage;
