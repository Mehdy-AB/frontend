'use client';

import { useEffect } from 'react';
import { tokenManager } from '@/api/auth/tokenManager';

export default function TokenManagerInitializer() {
  useEffect(() => {
    // Initialize TokenManager on app startup to warm the in-memory cache
    tokenManager.init().catch((error) => {
      console.warn('Failed to initialize TokenManager:', error);
    });
  }, []);

  // This component doesn't render anything
  return null;
}
