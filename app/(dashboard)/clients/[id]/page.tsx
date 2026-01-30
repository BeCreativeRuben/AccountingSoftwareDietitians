'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import type { ClientDecrypted } from '@/lib/types';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { token } = useAuthStore();
  const [client, setClient] = useState<ClientDecrypted | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    fetch(`/api/clients/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setClient(data.data);
      })
      .finally(() => setLoading(false));
  }, [token, id]);

  const handleDelete = async () => {
    if (!confirm('Weet je zeker dat je deze klant wilt verwijderen?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) router.push('/clients');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-8">Laden...</div>;
  if (!client) return <div className="p-8">Klant niet gevonden.</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/clients"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Terug naar klanten
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/clients/${id}/edit`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Bewerken
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            {deleting ? 'Verwijderen...' : 'Verwijderen'}
          </button>
        </div>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{client.name}</h1>

      <div className="rounded-lg bg-white dark:bg-gray-800 shadow">
        <dl className="divide-y divide-gray-200 dark:divide-gray-700">
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">E-mail</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">{client.email || '-'}</dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefoon</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">{client.phone || '-'}</dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Geboortedatum</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">
              {client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString('nl-BE') : '-'}
            </dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Verzekering</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">{client.insuranceCompany}</dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Verzekeringsnummer</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">{client.insuranceNumber || '-'}</dd>
          </div>
          {client.medicalConditions?.length ? (
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Medische aandoeningen (Solidaris)</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">
                {client.medicalConditions.join(', ')}
              </dd>
            </div>
          ) : null}
          {client.notes ? (
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Opmerkingen</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 whitespace-pre-wrap">{client.notes}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
