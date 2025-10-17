interface ReportTableProps {
  results: string[];
  score: number;
  code: string;
}

export default function ReportTable({ results, score, code }: ReportTableProps) {
  const inboxes = ['Gmail', 'Outlook', 'Yahoo', 'Proton', 'Custom'];
  const getColor = (status: string) => {
    if (status === 'Inbox') return 'bg-green-100 text-green-800';
    if (status === 'Spam') return 'bg-orange-100 text-orange-800';
    if (status === 'Not Received') return 'bg-gray-100 text-gray-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Results for Code: {code}</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 p-2">Inbox</th>
            <th className="border border-gray-300 p-2">Status</th>
            <th className="border border-gray-300 p-2">Folder</th>
          </tr>
        </thead>
        <tbody>
          {inboxes.map((inbox, i) => (
            <tr key={i}>
              <td className="border border-gray-300 p-2 font-medium">{inbox}</td>
              <td className={`border border-gray-300 p-2 ${getColor(results[i])}`}>Delivered</td>
              <td className={`border border-gray-300 p-2 ${getColor(results[i])}`}>{results[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-bold">Deliverability Score: {score}%</h3>
      </div>
    </div>
  );
}
