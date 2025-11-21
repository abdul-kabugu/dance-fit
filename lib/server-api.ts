import { cookies } from 'next/headers';

import type {
  CheckoutSessionDetail,
  EventDetail,
  PaymentSessionDetail,
} from '@/lib/event-types';

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
  .trim()
  .replace(/\/$/, '');

async function serverApiFetch<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const response = await fetch(`${appUrl}${path}`, {
    cache: 'no-store',
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function getEventByIdentifier(
  identifier: string,
): Promise<EventDetail | null> {
  const data = await serverApiFetch<{ event?: EventDetail }>(
    `/api/events/${encodeURIComponent(identifier)}`,
  );
  return data?.event ?? null;
}

function buildQuery(query?: Record<string, string | undefined>) {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listEvents(query?: Record<string, string | undefined>) {
  const data = await serverApiFetch<{ events?: EventDetail[] }>(
    `/api/events${buildQuery(query)}`,
  );
  return data?.events ?? [];
}

export async function getCheckoutSession(
  sessionId: string,
): Promise<CheckoutSessionDetail | null> {
  const data = await serverApiFetch<{ session?: CheckoutSessionDetail }>(
    `/api/checkout/sessions/${encodeURIComponent(sessionId)}`,
  );
  return data?.session ?? null;
}

export async function getPaymentSession(
  sessionId: string,
): Promise<PaymentSessionDetail | null> {
  const data = await serverApiFetch<{ session?: PaymentSessionDetail }>(
    `/api/payments/sessions/${encodeURIComponent(sessionId)}`,
  );
  return data?.session ?? null;
}
