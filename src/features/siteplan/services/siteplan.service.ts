import { mockSitePlans } from '@/mock/siteplan/siteplans';
import type { SitePlan } from '../types';

export const SitePlanService = {
  getAll: async (): Promise<SitePlan[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockSitePlans]), 400);
    });
  },
  getById: async (id: string): Promise<SitePlan | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockSitePlans.find(sp => sp.id === id || sp.approvalNo === id)), 300);
    });
  }
};
