'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import type { AppointmentDecrypted } from '@/lib/types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { token } = useAuthStore();
  const [appointment, setAppointment] = useState<AppointmentDecrypted | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    fetch(`/api/appointments/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAppointment(data.data);
      })
      .finally(() => setLoading(false));
  }, [token, id]);

  const handleMarkCompleted = async () => {
    if (!confirm('Afspraak als voltooid markeren?')) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      const data = await res.json();
      if (data.success) {
        setAppointment(data.data);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Afspraak annuleren?')) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const data = await res.json();
      if (data.success) router.push('/appointments');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8">Laden...</div>;
  if (!appointment) return <div className="p-8">Afspraak niet gevonden.</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/appointments"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Terug naar afspraken
        </Link>
        {appointment.status === 'scheduled' && (
          <div className="flex gap-2">
            <button
              onClick={handleMarkCompleted}
              disabled={updating}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {updating ? '...' : 'Markeer als voltooid'}
            </button>
            <button
              onClick={handleCancel}
              disabled={updating}
              className="rounded-md border border-red-300 dark:border-red-700 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              Annuleren
            </button>
          </div>
        )}
      </div>

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        {appointment.appointmentType?.name || 'Afspraak'}
      </h1>

      <div className="rounded-lg bg-white dark:bg-gray-800 shadow">
        <dl className="divide-y divide-gray-200 dark:divide-gray-700">
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  appointment.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : appointment.status === 'cancelled'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {appointment.status === 'completed'
                  ? 'Voltooid'
                  : appointment.status === 'cancelled'
                  ? 'Geannuleerd'
                  : 'Gepland'}
              </span>
            </dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Datum & tijd</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">
              {format(new Date(appointment.startTime), 'EEEE d MMMM yyyy, HH:mm', { locale: nl })} –{' '}
              {format(new Date(appointment.endTime), 'HH:mm', { locale: nl })}
            </dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">
              {appointment.appointmentType?.name} ({appointment.appointmentType?.durationMinutes} min, €
              {appointment.appointmentType?.price})
            </dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Klant(en)</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">
              {appointment.clientIds.length} klant(en) – IDs: {appointment.clientIds.join(', ')}
            </dd>
          </div>
          {appointment.notes && (
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Opmerkingen</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 whitespace-pre-wrap">
                {appointment.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
