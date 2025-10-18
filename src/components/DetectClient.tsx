'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function DetectClient({ code: propCode }: { code: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code') || propCode;

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

    const poll = async () => {
      try {
        // ** IMPORTANT: Only call the server action via an API route or a client-to-server action **
        // For demo, just setProgress, fake result etc.
        setProgress((prev) => Math.min(prev + 25, 100));
        // Simulate analysis finish
        if (progress >= 100) {
          setIsComplete(true);
          setTimeout(() => router.push(`/report?code=${code}`), 2000);
          clearInterval(interval);
        }
      } catch (error) {
        toast.error('Check failed, retry...');
      }
    };

    interval = setInterval(poll, 30000);
    poll();

    timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          clearInterval(timer);
          toast.error('Timeout');
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
  }, [code, progress, router]);

  // ... UI like before (no changes)


  if (!code || isComplete) {
    return <div>Redirecting...</div>;
  }

  return (
    <div>
      <div>Test Code: {code}</div>
      <div>Progress: {progress}%</div>
      <div>Time Left: {timeLeft}s</div>
      <button onClick={() => router.push('/')} >Cancel</button>
    </div>
  );
}
