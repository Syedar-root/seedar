import UserPage from './pages/UserPage';
import { useUserStore } from './store/userStore';
import { userApi } from './services/userApi';

export const UserModule = {
  component: UserPage,
  store: useUserStore,
  api: userApi,
};

export default UserModule;
