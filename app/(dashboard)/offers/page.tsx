'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OffersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/loyalty');
  }, [router]);
  return <div className="flex items-center justify-center h-64 text-slate-500">Redirecting to Offers...</div>;
}
