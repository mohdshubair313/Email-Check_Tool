'use client';

import { useState, useTransition } from 'react';
import { generateTestCode, analyzeEmails } from '@/app/action';
import InboxCard from '@/components/InboxCard';
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';


export default function Home() {
  const [code, setCode] = useState('');
  const [emailsSent, setEmailsSent] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const inboxes = [
    { provider: 'Gmail', email: 'shubair313@gmail.com' },
    { provider: 'Outlook', email: 'shubair313@outlook.com'},
    { provider: 'Zoho', email: 'shubair313@zohomail.in' },
    { provider: 'Proton', email: 'shubair313@proton.me' },
  ];

  const handleStartTest = async () => {
    startTransition(async () => {
      const result = await generateTestCode();
      if (result.success) {
        setCode(result.code ?? '');
        toast.success('Test code generated!');
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleAnalyze = async () => {
    if (!code) return toast.error('Generate code first!');
    setAnalyzing(true);
    const result = await analyzeEmails(code);
    setAnalyzing(false);
    if (result.success) {
      toast.success('Analysis complete!');
      router.push(`/report?code=${code}`);  // Or use ID from DB
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Test Your Email Deliverability!</h1>
        <p className="text-xl text-gray-600 mb-8">Send emails to our test inboxes and see where they land: Inbox, Spam, or Promotions.</p>

        {/* Inboxes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {inboxes.map((inbox, i) => (
            <InboxCard key={i} {...inbox} />
          ))}
        </div>

        {/* Start Test */}
        {!code ? (
          <button
            onClick={handleStartTest}
            disabled={isPending}
            className="bg-blue-500 text-white px-8 py-3 cursor-pointer rounded-lg text-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
          >
            {isPending ? 'Generating...' : 'Start New Test'}
          </button>
        ) : (
          <div className="bg-yellow-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Your Test Code: {code}</h2>
            <ul className="text-left space-y-2 mb-4">
              <li>• Copy this code.</li>
              <li>• From your email, send a test to all 5 inboxes above.</li>
              <li>• Subject: "Test Email - {code}"</li>
              <li>• Body: "This is a deliverability test."</li>
              <li>• Send all now (1-2 mins).</li>
            </ul>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={emailsSent}
                onChange={(e) => setEmailsSent(e.target.checked)}
              />
              <span>I have sent the emails</span>
            </label>
            <button
              onClick={handleAnalyze}
              disabled={!emailsSent || analyzing || isPending}
              className="mt-4 bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 cursor-pointer disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Start Detection'}
            </button>
            {analyzing && <Spinner />}
          </div>
        )}
      </div>
    </div>
  );
}
