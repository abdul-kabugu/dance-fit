import { NextRequest } from 'next/server';

import { Prisma, UserRole } from '@prisma/client';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { artistProfileSchema } from '@/lib/validators';

const defaultLimit = 20;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') ?? undefined;
    const style = searchParams.get('style') ?? undefined;
    const mine = searchParams.get('mine') === 'true';
    const limit = Number.parseInt(searchParams.get('limit') ?? '', 10);

    let where: Prisma.ArtistWhereInput = {};

    if (search) {
      where = {
        ...where,
        user: { name: { contains: search, mode: 'insensitive' } },
      };
    }

    if (style) {
      where = {
        ...where,
        danceStyles: { has: style },
      };
    }

    if (mine) {
      const user = await requireUser();
      where = { ...where, userId: user.id };
    }

    const artists = await prisma.artist.findMany({
      where,
      include: {
        user: true,
        events: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                slug: true,
                startDateTime: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number.isNaN(limit) ? defaultLimit : limit,
    });

    return respond({ artists });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = artistProfileSchema.parse(body);
    const user = await requireUser();

    const artist = await prisma.artist.upsert({
      where: { userId: user.id },
      update: { ...payload },
      create: { userId: user.id, ...payload },
    });

    if (user.role !== UserRole.ARTIST) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.ARTIST },
      });
    }

    return respond({ artist }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = artistProfileSchema.partial().parse(body);
    const user = await requireUser();

    const existing = await prisma.artist.findUnique({
      where: { userId: user.id },
    });

    if (!existing) {
      throw new ApiError(404, 'Artist profile not found.');
    }

    const artist = await prisma.artist.update({
      where: { userId: user.id },
      data: { ...payload },
    });

    return respond({ artist });
  } catch (error) {
    return handleApiError(error);
  }
}
