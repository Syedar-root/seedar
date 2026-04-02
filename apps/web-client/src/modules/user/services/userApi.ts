import request from '@/core/request';

export interface User {
  id: string;
  name: string;
  email: string;
}

export const userApi = {
  getUsers: () => request.get<User[]>('/users'),
  getUser: (id: string) => request.get<User>(`/users/${id}`),
  createUser: (data: Omit<User, 'id'>) => request.post<User>('/users', data),
  updateUser: (id: string, data: Partial<User>) => request.put<User>(`/users/${id}`, data),
  deleteUser: (id: string) => request.delete(`/users/${id}`),
};

export default userApi;
