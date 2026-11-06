import { apiClient } from '@/lib/axios';

export const contentEngagementService = {
  like: async (contentId: number): Promise<void> => {
    await apiClient.post(`/api/v1/fan/content/items/${contentId}/like`);
  },

  unlike: async (contentId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/fan/content/items/${contentId}/like`);
  },

  save: async (contentId: number): Promise<void> => {
    await apiClient.post(`/api/v1/fan/content/items/${contentId}/save`);
  },

  unsave: async (contentId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/fan/content/items/${contentId}/save`);
  },

  likeProduct: async (productId: number): Promise<void> => {
    await apiClient.post(`/api/v1/fan/products/${productId}/like`);
  },

  unlikeProduct: async (productId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/fan/products/${productId}/like`);
  },

  saveProduct: async (productId: number): Promise<void> => {
    await apiClient.post(`/api/v1/fan/products/${productId}/save`);
  },

  unsaveProduct: async (productId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/fan/products/${productId}/save`);
  },
};
