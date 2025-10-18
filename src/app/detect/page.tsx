// app/detect/page.tsx - Server Component (no 'use client')
import { getTestByCode } from '@/lib/db'; // Supabase functions
import { Spinner } from '@/components/ui/spinner';
import { analyzeEmails } from '../action'; // Your analysis function
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

interface DetectPageProps {
  searchParams: Promise<{ code?: string }>; // Async in Next.js 14+
}

export default async function DetectPage({ searchParams }: DetectPageProps) {
  const resolvedParams = await searchParams; // Await to unwrap
  const code = resolvedParams.code;

  // If no code, redirect to home
  if (!code) {
    redirect('/');
  }

  // For server component, you can start analysis directly or show loading
  // But for polling, better to have a client component for real-time updates
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <DetectContent code={code} />
    </div>
  );
}

// Separate client component for polling/interactivity
async function DetectContent({ code }: { code: string }) {
  // Server-side initial data fetch (optional)
  // const initialTest = await getTestByCode(code).catch(() => null);

  return (
    <Suspense fallback={<Spinner />}>
      <DetectClient initialCode={code} />
    </Suspense>
  );
}

// Client Component for polling (wrapped in Suspense)
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

function DetectClient({ initialCode }: { initialCode: string }) {
  const searchParams = useSearchParams(); // Now safe inside Suspense
  const router = useRouter();
  const code = searchParams.get('code') || initialCode;
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 min
  const [results, setResults] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!code) {
      router.push('/');
      return;
    }

    let interval: NodeJS.Timeout;
    let timer: NodeJS.Timeout;

    // Start polling every 30s
    const poll = async () => {
      try {
        const result = await analyzeEmails(code);
        if (result.success && Array.isArray(result.results) && result.results.length > 0) {
          setResults(result.results);
          setProgress(100);
          setIsComplete(true);
          toast.success('Analysis complete!');
          // Redirect to report after 2s
          setTimeout(() => router.push(`/report?code=${code}`), 2000);
          clearInterval(interval);
          return;
        }
      } catch (error) {
        console.error('Polling error:', error);
        toast.error('Check failed, retrying...');
      }

      // Update progress (simulate 20% per check)
      setProgress(prev => Math.min(prev + 25, 80));
    };

    interval = setInterval(poll, 30000); // Every 30s
    poll(); // Initial check

    // Timer countdown
    timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          clearInterval(timer);
          toast.error('Timeout - Try resending emails.');
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [code, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!code || isComplete) {
    return <Spinner />;
  }

  return (
    <div className="text-center max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Scanning Inboxes</h1>
      <p className="mb-4">Test Code: <strong>{code}</strong></p>
      
      <Spinner />
      
      <div className="mt-6">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-600">Progress: {Math.round(progress)}%</p>
      </div>

      {results.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Partial Results:</h3>
          <ul className="text-sm space-y-1">
            {results.map((r, i) => (
              <li key={i} className={`p-2 rounded ${r === 'Error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {['Gmail', 'Outlook', 'Zoho', 'Proton'][i] || `Inbox ${i+1}`}: {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button 
        onClick={() => router.push('/')} 
        className="mt-6 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Cancel & Go Home
      </button>
    </div>
  );
}
