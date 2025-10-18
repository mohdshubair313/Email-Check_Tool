import { Suspense } from 'react';
import DetectClient from '@/components/DetectClient';

export default function DetectPage({ searchParams }: { searchParams: { code?: string } }) {
  const code = searchParams.code || '';

  if (!code) {
    // On server, use redirect or notFound if needed
    return null;
  }

  return (
    <div className="container">
      <Suspense fallback={<div>Loading detect page...</div>}>
        {/* Pass code as prop if needed */}
        <DetectClient code={code} />
      </Suspense>
    </div>
  );
}
