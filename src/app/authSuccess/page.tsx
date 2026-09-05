'use client';

import { useEffect } from 'react';

export default function AuthSuccessPage() {
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, window.location.origin);
    }
    window.close();
  }, []);
  return null;
}