"use client";

import { useEffect, useState } from 'react';

export function useAuthStatus() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/v1/auth/me', { credentials: 'include' });
        if (!mounted) return;
        setAuthed(res.ok);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'auth_check_failed');
        setAuthed(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  return { authed, loading, error };
}

