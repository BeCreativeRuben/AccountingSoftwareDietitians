'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import type { AppointmentType, ClientDecrypted } from '@/lib/types';

export default function NewAppointmentPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [clients, setClients] = useState<ClientDecrypted[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    appointmentTypeId: '',
    clientIds: [] as string[],
    startTime: '',
    startHour: '09',
    startMin: '00',
    duration: 60,
    notes: '',
  });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch('/api/appointment-types', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([typesRes, clientsRes]) => {
      if (typesRes.success) setTypes(typesRes.data || []);
      if (clientsRes.success) setClients(clientsRes.data || []);
      if (typesRes.success && typesRes.data?.length) {
        setForm((f) => ({ ...f, appointmentTypeId: typesRes.data[0].id }));
      }
    }).finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.appointmentTypeId || !form.clientIds.length || !form.startTime) {
      setError('Selecteer type, klant(en) en datum');
      return;
    }
    const start = new Date(form.startTime);
    start.setHours(parseInt(form.startHour, 10), parseInt(form.startMin, 10), 0, 0);
    const end = new Date(start.getTime() + form.duration * 60 * 1000);
    setSaving(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentTypeId: form.appointmentTypeId,
          clientIds: form.clientIds,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) router.push('/appointments');
      else setError(data.error || 'Opslaan mislukt');
    } catch {
      setError('Er is een fout opgetreden');
    } finally {
      setSaving(false);
    }
  };

  const toggleClient = (id: string) => {
    setForm((f) => ({
      ...f,
      clientIds: f.clientIds.includes(id) ? f.clientIds.filter((c) => c !== id) : [...f.clientIds, id],
    }));
  };

  if (loading) return <div className="p-8">Laden...</div>;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/appointments"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Terug naar afspraken
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Nieuwe afspraak</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type afspraak *</label>
          <select
            required
            value={form.appointmentTypeId}
            onChange={(e) => setForm((f) => ({ ...f, appointmentTypeId: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
          >
            <option value="">Selecteer type</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.durationMinutes} min, €{t.price})
              </option>
            ))}
          </select>
        </div>
        {types.length === 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Geen afspraaktypes gevonden. Voeg eerst types toe in Instellingen.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Klant(en) *</label>
          <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-gray-300 dark:border-gray-600 p-2">
            {clients.length === 0 ? (
              <p className="text-sm text-gray-500">Geen klanten. Voeg eerst klanten toe.</p>
            ) : (
              clients.map((c) => (
                <label key={c.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={form.clientIds.includes(c.id)}
                    onChange={() => toggleClient(c.id)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">{c.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Datum *</label>
            <input
              type="date"
              required
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tijd *</label>
            <div className="mt-1 flex gap-1">
              <input
                type="number"
                min="0"
                max="23"
                value={form.startHour}
                onChange={(e) => setForm((f) => ({ ...f, startHour: e.target.value.padStart(2, '0') }))}
                className="w-16 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-center text-gray-900 dark:text-white"
              />
              :
              <input
                type="number"
                min="0"
                max="59"
                value={form.startMin}
                onChange={(e) => setForm((f) => ({ ...f, startMin: e.target.value.padStart(2, '0') }))}
                className="w-16 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-center text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duur (minuten)</label>
          <input
            type="number"
            min="15"
            step="15"
            value={form.duration}
            onChange={(e) => setForm((f) => ({ ...f, duration: parseInt(e.target.value, 10) || 60 }))}
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
            disabled={saving || types.length === 0 || clients.length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
          <Link
            href="/appointments"
            className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </Link>
        </div>
      </form>
    </div>
  );
}
