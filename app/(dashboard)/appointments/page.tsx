'use client';

import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/authStore';

const AppointmentCalendar = dynamic(() => import('@/components/calendar/AppointmentCalendar'), { ssr: false });

export default function AppointmentsPage() {
  const { token } = useAuthStore();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Afspraken</h1>
        <a
          href="/appointments/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nieuwe afspraak
        </a>
      </div>

      <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow">
        <AppointmentCalendar token={token} />
      </div>
    </div>
  );
}
