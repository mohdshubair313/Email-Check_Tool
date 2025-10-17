'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Spinner } from "@/components/ui/spinner"
import { analyzeEmails } from '../action'; 
import { toast } from 'sonner';

export default function Detect() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);  // 5 min
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    if (!code) {
      router.push('/');
      return;
    }

    // Polling every 30s up to 5 min
    const interval = setInterval(async () => {
      const result = await analyzeEmails(code!);
      if (result.success) {
        setResults(result.results ?? []);
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => router.push(`/report?code=${code}`), 2000);
      }
      setTimeLeft(prev => {
        if (prev <= 30) {
          clearInterval(interval);
          toast.error('Timeout - Try resending emails.');
          router.push('/');
        }
        return prev - 30;
      });
      setProgress(prev => Math.min(prev + 20, 80));  // Incremental
    }, 30000);

    // Timer
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [code, router]);

  if (!code) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Spinner />
      <div className="mt-8 text-center">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="mt-2">Progress: {progress}%</p>
        {results.length > 0 && (
          <ul className="mt-4 space-y-1">
            {results.map((r, i) => (
              <li key={i} className="text-sm">
                {['Gmail', 'Outlook', 'Yahoo', 'Proton', 'Custom'][i]}: {r}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
