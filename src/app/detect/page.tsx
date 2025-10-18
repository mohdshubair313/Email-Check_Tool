// Server Component
import { Suspense } from 'react';
import DetectClient from '@/components/DetectClient';

export default async function DetectPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  const code = params?.code;

  if (!code) {
    // Optionally, use notFound() or redirect('/')
    return null;
  }

  return (
    <div className="container">
      <Suspense fallback={<div>Loading ...</div>}>
        <DetectClient code={code} />
      </Suspense>
    </div>
  );
}
