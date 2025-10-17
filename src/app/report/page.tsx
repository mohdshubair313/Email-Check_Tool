'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReportTable from '@/components/ReportTable';
import { sendReportEmail } from '../action';
import { Spinner } from "@/components/ui/spinner"
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function Report() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const [report, setReport] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (code) {
      // Fetch from DB via action or client fetch
      // For simplicity, assume analyzeEmails called before, use local state or API
      setReport({
        code,
        results: ['Inbox', 'Spam', 'Not Received', 'Inbox', 'Promotions'],  // From analyze
        score: 60,
      });
      setLoading(false);
    } else {
      router.push('/');
    }
  }, [code, router]);

  const handleSendEmail = async () => {
    if (!userEmail) return toast.error('Enter your email');
    setSending(true);
    const result = await sendReportEmail(code!, userEmail);
    setSending(false);
    if (result.success) {
      toast.success('Report emailed!');
    } else {
      toast.error(result.error);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Report for ${code}`, 10, 10);
    doc.text(`Score: ${report?.score}%`, 10, 20);
    // Add table logic
    doc.save(`report-${code}.pdf`);
  };

  const shareLink = `${window.location.origin}/report?code=${code}`;

  if (loading) return <Spinner className="size-6 text-blue-500" />

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Deliverability Report</h1>
        <p className="text-gray-600 mb-4">Generated on: {new Date().toLocaleString()}</p>

        <ReportTable results={report?.results || []} score={report?.score || 0} code={code!} />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigator.clipboard.writeText(shareLink)}
            className="bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
          >
            Copy Share Link
          </button>
          <div className="md:col-span-2">
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Your email"
              className="border p-2 rounded w-full md:w-1/2"
            />
            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="ml-2 bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Report to Email'}
            </button>
          </div>
        </div>

        <button onClick={handleDownloadPDF} className="mt-4 bg-purple-500 text-white p-2 rounded hover:bg-purple-600">
          Download PDF (Bonus)
        </button>

        <button onClick={() => router.push('/')} className="ml-4 bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
          New Test
        </button>
      </div>
    </div>
  );
}
