import { cookies } from 'next/headers';

import {
  Bitcoin,
  Calendar,
  DollarSign,
  Ticket as TicketIcon,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { OverviewCards } from '@/components/overview-cards';
import { RecentSalesTable } from '@/components/recent-sales-table';
import { RevenueChart } from '@/components/revenue-chart';
import { TicketsChart } from '@/components/tickets-chart';
import { UpcomingEvents } from '@/components/upcoming-events';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export default async function OrganizerDashboard() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  /*const response = await fetch(`${baseUrl}/api/dashboard/overview`, {
    cache: 'no-store',
  });*/

  const cookieStore = await cookies(); // ✅ FIXED
  const response = await fetch(`${baseUrl}/api/dashboard/overview`, {
    cache: 'no-store',
    headers: {
      Cookie: cookieStore.toString(), // 🔥 IMPORTANT
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load dashboard data.');
  }

  const overview = await response.json();

  const overviewStats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(overview.stats.totalRevenueCents ?? 0),
      change: '',
      icon: DollarSign,
    },
    {
      title: 'Tickets Sold',
      value: (overview.stats.totalTickets ?? 0).toLocaleString(),
      change: '',
      icon: TicketIcon,
    },
    {
      title: 'BCH Payments',
      value: `${Math.round((overview.stats.bchPaymentShare ?? 0) * 100)}%`,
      change: '',
      icon: Bitcoin,
    },
    {
      title: 'Events Created',
      value: (overview.stats.eventsCount ?? 0).toLocaleString(),
      change: '',
      icon: Calendar,
    },
  ];

  const revenueData =
    overview.revenueSeries?.map((point: any) => ({
      name: point.label,
      revenue: (point.value ?? 0) / 100,
    })) ?? [];

  const ticketsData =
    overview.ticketsSeries?.map((point: any) => ({
      name: point.label,
      tickets: point.value ?? 0,
    })) ?? [];

  const recentSales =
    overview.recentSales?.map((sale: any) => ({
      name: sale.attendeeName,
      event: sale.event?.title ?? 'Event',
      paymentMethod: sale.payment?.method ?? 'BCH',
      amount: formatCurrency(sale.payment?.amountCents ?? 0),
      date: new Date(sale.createdAt).toLocaleDateString(),
      avatar: sale.payment?.organizer?.user?.avatarUrl,
      initials: sale.attendeeName
        ?.split(' ')
        .map((n: string) => n[0])
        .join(''),
    })) ?? [];

  const upcoming =
    overview.upcomingEvents?.map((event: any) => {
      const start = new Date(event.startDateTime);
      return {
        id: event.id,
        name: event.title,
        date: start.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        time: start.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        }),
        location: event.venueName ?? event.city ?? 'Location TBA',
        artists: [],
      };
    }) ?? [];

  return (
    <div className="bg-background flex min-h-screen">
      <DashboardSidebar currentPath="/dashboard" />
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 space-y-6 p-6 lg:p-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your events, revenue, and ticket sales
            </p>
          </div>

          <OverviewCards stats={overviewStats} />

          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart data={revenueData} />
            <TicketsChart data={ticketsData} />
          </div>

          <RecentSalesTable sales={recentSales} />

          <UpcomingEvents events={upcoming} />
        </main>
      </div>
    </div>
  );
}
