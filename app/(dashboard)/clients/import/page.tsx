'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function ImportClientsPage() {
  const { token } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/clients/import-csv', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setResult({
          created: data.data.created.length,
          errors: data.data.errors || [],
        });
        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/clients"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Terug naar klanten
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">CSV importeren</h1>

      <div className="max-w-xl space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload een CSV-bestand met kolommen: <code className="rounded bg-gray-100 dark:bg-gray-800 px-1">name</code> (of <code className="rounded bg-gray-100 dark:bg-gray-800 px-1">naam</code>), <code className="rounded bg-gray-100 dark:bg-gray-800 px-1">email</code>, <code className="rounded bg-gray-100 dark:bg-gray-800 px-1">phone</code>, <code className="rounded bg-gray-100 dark:bg-gray-800 px-1">insurance</code> (of <code className="rounded bg-gray-100 dark:bg-gray-800 px-1">verzekering</code>), <code className="rounded bg-gray-100 dark:bg-gray-800 px-1">insuranceNumber</code>, <code className="rounded bg-gray-100 dark:bg-gray-800 px-1">notes</code>.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
          />
          <button
            type="submit"
            disabled={!file || loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Importeren...' : 'Importeren'}
          </button>
        </form>

        {result && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="font-medium text-green-600 dark:text-green-400">{result.created} klanten geïmporteerd</p>
            {result.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm text-red-600 dark:text-red-400">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
