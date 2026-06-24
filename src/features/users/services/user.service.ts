import { mockUsers } from '@/mock/users/users';
import type { MockUser } from '@/mock/users/users';

export const UserService = {
  getAll: async (): Promise<MockUser[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockUsers]), 300);
    });
  }
};
