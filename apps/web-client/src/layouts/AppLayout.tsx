import { Outlet } from 'react-router-dom';
import { GlobalNavigation } from '@/core/components/ui/GlobalNavigation';
import styles from './AppLayout.module.scss';

const AppLayout = () => {
  return (
    <div className={styles.layout}>
      <GlobalNavigation />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
