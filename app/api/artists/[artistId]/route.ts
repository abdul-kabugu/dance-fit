import type { NextRequest } from 'next/server';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: { artistId: string };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params; // 🔥 FIX HERE
    const artistId = params.artistId;
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        user: true,
        events: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!artist) {
      throw new ApiError(404, 'Artist not found.');
    }

    return respond({ artist });
  } catch (error) {
    return handleApiError(error);
  }
}
