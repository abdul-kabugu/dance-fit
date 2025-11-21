import { NextRequest, NextResponse } from 'next/server';

import { put } from '@vercel/blob';

import { ApiError, handleApiError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new ApiError(400, 'No file provided for upload.');
    }

    const filename =
      formData.get('filename')?.toString() ??
      `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

    const blob = await put(`uploads/${filename}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (error) {
    return handleApiError(error);
  }
}
