import { beforeEach, describe, expect, it } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/axios';

let seen: InternalAxiosRequestConfig | undefined;
apiClient.defaults.adapter = async (config) => {
  seen = config;
  return { data: { success: true, data: 'ok' }, status: 200, statusText: 'OK', headers: {}, config };
};

beforeEach(() => { seen = undefined; localStorage.clear(); });

describe('apiClient request interceptor', () => {
  it('attaches the stored bearer token', async () => {
    localStorage.setItem('auth_token', 'tok123');
    await apiClient.get('/api/v1/users/me');
    expect(seen?.headers.get('Authorization')).toBe('Bearer tok123');
  });
  it('JSON bodies keep the JSON content type', async () => {
    await apiClient.put('/api/v1/common/profile', { name: 'A' });
    expect(String(seen?.headers.get('Content-Type'))).toContain('application/json');
  });
  it('FormData uploads drop the JSON content type so the browser sets the multipart boundary', async () => {
    const fd = new FormData();
    fd.append('file', new Blob(['x'], { type: 'image/png' }), 'a.png');
    await apiClient.post('/api/v1/common/profile/avatar', fd);
    expect(seen?.data).toBeInstanceOf(FormData);
    expect(String(seen?.headers.get('Content-Type') ?? '')).not.toContain('application/json');
  });
  it('rejects wrapped API errors ({ success: false })', async () => {
    apiClient.defaults.adapter = async (config) => ({
      data: { success: false, message: 'USER_404 - 404 - Not found' }, status: 200, statusText: 'OK', headers: {}, config,
    });
    await expect(apiClient.get('/x')).rejects.toThrow('USER_404 - 404 - Not found');
  });
});
