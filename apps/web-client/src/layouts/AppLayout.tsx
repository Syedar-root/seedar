import { Outlet } from 'react-router-dom';
import styles from './AppLayout.module.scss';

const AppLayout = () => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1>Seedar</h1>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
