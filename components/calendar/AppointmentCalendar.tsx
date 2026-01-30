'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { AppointmentDecrypted } from '@/lib/types';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { nl },
});

interface AppointmentCalendarProps {
  token: string | null;
}

export default function AppointmentCalendar({ token }: AppointmentCalendarProps) {
  const [appointments, setAppointments] = useState<AppointmentDecrypted[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      const res = await fetch(`/api/appointments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAppointments(data.data || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [token, currentDate]);

  useEffect(() => {
    setLoading(true);
    fetchAppointments();
  }, [fetchAppointments]);

  const events = appointments.map((a) => ({
    id: a.id,
    title: `${a.appointmentType?.name || 'Afspraak'} - ${a.clientIds.length} klant(en)`,
    start: new Date(a.startTime),
    end: new Date(a.endTime),
    resource: a,
  }));

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  const handleSelectEvent = (event: { resource?: AppointmentDecrypted }) => {
    if (event.resource?.id) {
      window.location.href = `/appointments/${event.resource.id}`;
    }
  };

  if (loading) {
    return <div className="flex h-[600px] items-center justify-center">Laden...</div>;
  }

  return (
    <div className="h-[600px]">
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/react-big-calendar@1.8.5/lib/css/react-big-calendar.min.css"
      />
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onNavigate={handleNavigate}
        views={['month', 'week', 'day']}
        defaultView="month"
        culture="nl"
        messages={{
          today: 'Vandaag',
          previous: 'Vorige',
          next: 'Volgende',
          month: 'Maand',
          week: 'Week',
          day: 'Dag',
          agenda: 'Agenda',
          date: 'Datum',
          time: 'Tijd',
          event: 'Afspraak',
          noEventsInRange: 'Geen afspraken in dit bereik',
        }}
        onSelectEvent={handleSelectEvent}
      />
    </div>
  );
}
