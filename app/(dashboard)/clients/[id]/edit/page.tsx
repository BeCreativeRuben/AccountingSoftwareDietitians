'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { InsuranceCompany } from '@/lib/types';

const INSURANCE_OPTIONS: { value: InsuranceCompany; label: string }[] = [
  { value: 'Christelijke' as InsuranceCompany, label: 'Christelijke Mutualiteit' },
  { value: 'Liberale' as InsuranceCompany, label: 'Liberale Mutualiteit' },
  { value: 'Solidaris' as InsuranceCompany, label: 'Solidaris' },
  { value: 'Helan' as InsuranceCompany, label: 'Helan' },
  { value: 'Vlaams/Neutraal' as InsuranceCompany, label: 'Vlaams en Neutraal Ziekenfonds' },
];

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    insuranceCompany: 'Christelijke' as InsuranceCompany,
    insuranceNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (!token || !id) return;
    fetch(`/api/clients/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const c = data.data;
          setForm({
            name: c.name || '',
            email: c.email || '',
            phone: c.phone || '',
            dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth).toISOString().slice(0, 10) : '',
            insuranceCompany: c.insuranceCompany || 'Christelijke',
            insuranceNumber: c.insuranceNumber || '',
            notes: c.notes || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [token, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Naam is verplicht');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          insuranceCompany: form.insuranceCompany,
          insuranceNumber: form.insuranceNumber.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) router.push(`/clients/${id}`);
      else setError(data.error || 'Opslaan mislukt');
    } catch {
      setError('Er is een fout opgetreden');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Laden...</div>;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/clients/${id}`}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Terug naar klant
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Klant bewerken</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Naam *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefoon</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Geboortedatum</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Verzekering *</label>
          <select
            value={form.insuranceCompany}
            onChange={(e) => setForm((f) => ({ ...f, insuranceCompany: e.target.value as InsuranceCompany }))}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
          >
            {INSURANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Verzekeringsnummer</label>
          <input
            type="text"
            value={form.insuranceNumber}
            onChange={(e) => setForm((f) => ({ ...f, insuranceNumber: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opmerkingen</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
          <Link
            href={`/clients/${id}`}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </Link>
        </div>
      </form>
    </div>
  );
}
