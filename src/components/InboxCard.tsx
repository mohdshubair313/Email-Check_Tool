'use client';

import { useState } from 'react';
import { MailSearch } from 'lucide-react';

interface InboxCardProps {
  provider: string;
  email: string;
}

export default function InboxCard({ provider, email }: InboxCardProps) {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <MailSearch className="h-12 w-12 text-blue-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-center">{provider} Test</h3>
      <p className="text-sm text-gray-600 text-center mt-2">{email}</p>
      <button
        onClick={copyEmail}
        className="mt-4 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
      >
        {copied ? 'Copied!' : 'Copy Email'}
      </button>
    </div>
  );
}
