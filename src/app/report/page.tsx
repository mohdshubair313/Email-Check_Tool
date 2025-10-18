import { Suspense } from 'react';
import ReportTableClient from '@/components/ReportTableClient';


export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const code = params?.code ?? '';

  if (!code) {
    // Home redirect or notFound() yaha laga sakte ho
    // Optionally: throw redirect('/')
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Suspense fallback={<div>Loading report...</div>}>
        <ReportTableClient code={code} />
      </Suspense>
    </div>
  );
}
