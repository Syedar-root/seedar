import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      users: [],
      currentUser: null,
      isLoading: false,
      fetchUsers: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        set({
          users: [
            { id: '1', name: '张三', email: 'zhangsan@example.com' },
            { id: '2', name: '李四', email: 'lisi@example.com' },
            { id: '3', name: '王五', email: 'wangwu@example.com' },
          ],
          isLoading: false,
        });
      },
      setCurrentUser: (user) => set({ currentUser: user }),
    }),
    {
      name: 'user-store',
    }
  )
);

export default useUserStore;
