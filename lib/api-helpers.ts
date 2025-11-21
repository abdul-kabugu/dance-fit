import { NextResponse } from 'next/server';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function respond<T>(data: T, init: ResponseInit = {}) {
  return NextResponse.json(data, {
    status: init.status ?? 200,
    headers: init.headers,
  });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status },
    );
  }

  console.error('[API] Unhandled error', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 },
  );
}

export function assertCondition(
  condition: unknown,
  status: number,
  message: string,
  details?: unknown,
) {
  if (!condition) {
    throw new ApiError(status, message, details);
  }
}
