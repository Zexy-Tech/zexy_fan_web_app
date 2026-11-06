import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.hoisted(() => vi.fn());
vi.mock('@/lib/axios', () => ({ apiClient: { get } }));

import { useUsernameAvailability } from '@/hooks/useUsernameAvailability';

const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(450); });
const answer = (available: boolean, message = '') => ({ data: { success: true, data: { available, message } } });

beforeEach(() => { vi.useFakeTimers(); get.mockReset(); });
afterEach(() => vi.useRealTimers());

describe('useUsernameAvailability', () => {
  it('own username needs no API call and can be saved', () => {
    const { result } = renderHook(() => useUsernameAvailability('ritu.bakes', 'ritu.bakes'));
    expect(result.current).toMatchObject({ status: 'unchanged', canSave: true });
    expect(get).not.toHaveBeenCalled();
  });

  it('invalid format locks save without calling the API', () => {
    const { result } = renderHook(() => useUsernameAvailability('ab', 'me'));
    expect(result.current).toMatchObject({ status: 'invalid', canSave: false });
    expect(get).not.toHaveBeenCalled();
  });

  it('checking -> taken locks save; available unlocks it', async () => {
    get.mockResolvedValueOnce(answer(false, 'This username is already taken'));
    const { result, rerender } = renderHook(({ v }: { v: string }) => useUsernameAvailability(v, 'me'), { initialProps: { v: 'sid.plays' } });
    expect(result.current).toMatchObject({ status: 'checking', canSave: false });
    await flush();
    expect(result.current).toMatchObject({ status: 'taken', canSave: false });

    get.mockResolvedValueOnce(answer(true));
    rerender({ v: 'fresh_name' });
    expect(result.current.status).toBe('checking');
    await flush();
    expect(result.current).toMatchObject({ status: 'available', canSave: true, message: '@fresh_name is available' });
  });

  it('debounces typing: only the last value is checked', async () => {
    get.mockResolvedValue(answer(true));
    const { rerender } = renderHook(({ v }: { v: string }) => useUsernameAvailability(v, 'me'), { initialProps: { v: 'abc' } });
    rerender({ v: 'abcd' });
    rerender({ v: 'abcde' });
    await flush();
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/api/v1/auth/check-username', expect.objectContaining({ params: { username: 'abcde' } }));
  });

  it('network failure locks save with a retry message', async () => {
    get.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useUsernameAvailability('newname', 'me'));
    await flush();
    expect(result.current).toMatchObject({ status: 'error', canSave: false });
  });
});
