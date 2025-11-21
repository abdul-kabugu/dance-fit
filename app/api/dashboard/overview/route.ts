import type { NextRequest } from 'next/server';

import {
  EventStatus,
  PaymentMethod,
  PaymentStatus,
  TicketStatus,
} from '@prisma/client';

import { handleApiError, respond } from '@/lib/api-helpers';
import { requireOrganizerContext } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { analyticsQuerySchema } from '@/lib/validators';

function getRangeStart(range: '30d' | '90d' | '365d') {
  const now = new Date();
  const start = new Date(now);
  if (range === '30d') start.setMonth(now.getMonth() - 1);
  if (range === '90d') start.setMonth(now.getMonth() - 3);
  if (range === '365d') start.setFullYear(now.getFullYear() - 1);
  return start;
}

function buildMonthlySeries<T extends { createdAt: Date }>(
  items: T[],
  valueAccessor: (item: T) => number,
) {
  const buckets = new Map<string, number>();
  for (const item of items) {
    const key = `${item.createdAt.getFullYear()}-${String(
      item.createdAt.getMonth() + 1,
    ).padStart(2, '0')}`;
    buckets.set(key, (buckets.get(key) ?? 0) + valueAccessor(item));
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([key, total]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        label: new Date(year, month - 1, 1).toLocaleString('en-US', {
          month: 'short',
        }),
        value: total,
      };
    });
}

export async function GET(request: NextRequest) {
  try {
    const params = analyticsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const rangeStart = getRangeStart(params.range);
    const { organizer } = await requireOrganizerContext();

    const [
      payments,
      totalTickets,
      eventsCount,
      tickets,
      recentSales,
      upcomingEvents,
    ] =
      await Promise.all([
        prisma.payment.findMany({
          where: {
            organizerId: organizer.id,
            status: PaymentStatus.COMPLETED,
            createdAt: { gte: rangeStart },
          },
        }),
        prisma.ticket.count({
          where: {
            organizerId: organizer.id,
            status: TicketStatus.CONFIRMED,
          },
        }),
        prisma.event.count({ where: { organizerId: organizer.id } }),
        prisma.ticket.findMany({
          where: {
            organizerId: organizer.id,
            status: TicketStatus.CONFIRMED,
            createdAt: { gte: rangeStart },
          },
        }),
        prisma.ticket.findMany({
          where: {
            organizerId: organizer.id,
          },
          include: {
            ticketType: true,
            event: true,
            payment: {
              include: {
                organizer: {
                  include: { user: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.event.findMany({
          where: {
            organizerId: organizer.id,
            status: EventStatus.PUBLISHED,
            startDateTime: { gte: new Date() },
          },
          orderBy: { startDateTime: 'asc' },
          take: 5,
          select: {
            id: true,
            slug: true,
            title: true,
            startDateTime: true,
            endDateTime: true,
            venueName: true,
            city: true,
            country: true,
          },
        }),
      ]);

    const totalRevenueCents = payments.reduce(
      (acc, payment) => acc + payment.amountCents,
      0,
    );

    const bchPayments = payments.filter(
      (payment) => payment.method === PaymentMethod.BCH,
    ).length;
    const paymentCount = payments.length;

    const revenueSeries = buildMonthlySeries(payments, (p) => p.amountCents);
    const ticketsSeries = buildMonthlySeries(tickets, () => 1);

    return respond({
      stats: {
        totalRevenueCents,
        totalTickets,
        bchPaymentShare: paymentCount
          ? bchPayments / paymentCount
          : 0,
        eventsCount,
      },
      revenueSeries,
      ticketsSeries,
      recentSales,
      upcomingEvents,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
