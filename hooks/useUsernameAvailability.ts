'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/axios';
import { check } from '@/lib/validation/fields';

export type UsernameStatus = 'unchanged' | 'invalid' | 'checking' | 'available' | 'taken' | 'error';

type Result = { name: string; available: boolean | null; message: string };

const DEBOUNCE_MS = 400;

/**
 * Live username check while typing: format first (instant), then the database via
 * GET /auth/check-username (debounced; the API ignores the signed-in user's own name).
 * `canSave` is true only for the current username or one confirmed available.
 */
export function useUsernameAvailability(input: string, current: string) {
  const name = input.trim().replace(/^@/, '');
  const unchanged = name === current;
  const formatError = unchanged ? null : check.username(name);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (unchanged || formatError) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get('/api/v1/auth/check-username', { params: { username: name }, signal: ctrl.signal });
        const d = res.data?.data ?? res.data;
        setResult({ name, available: Boolean(d?.available), message: d?.message || '' });
      } catch {
        if (!ctrl.signal.aborted) setResult({ name, available: null, message: "Couldn't check availability. Try again." });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort(); // a newer keystroke wins; stale answers never land
    };
  }, [name, unchanged, formatError]);

  let status: UsernameStatus;
  let message = '';
  if (unchanged) status = 'unchanged';
  else if (formatError) [status, message] = ['invalid', formatError];
  else if (!result || result.name !== name) [status, message] = ['checking', 'Checking availability…'];
  else if (result.available === null) [status, message] = ['error', result.message];
  else if (result.available) [status, message] = ['available', `@${name} is available`];
  else [status, message] = ['taken', result.message || 'This username is already taken'];

  return { status, message, canSave: status === 'unchanged' || status === 'available' };
}
