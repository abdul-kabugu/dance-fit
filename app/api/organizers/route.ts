import { NextRequest } from 'next/server';

import { UserRole } from '@prisma/client';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { organizerProfileSchema } from '@/lib/validators';

export async function GET() {
  try {
    const user = await requireUser();
    const organizer = await prisma.organizer.findUnique({
      where: { userId: user.id },
    });

    if (!organizer) {
      throw new ApiError(404, 'Organizer profile not found.');
    }

    return respond({ organizer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = organizerProfileSchema.partial().parse(body);
    const user = await requireUser();

    const organizer = await prisma.organizer.upsert({
      where: { userId: user.id },
      update: { ...payload },
      create: { userId: user.id, ...payload },
    });

    if (user.role !== UserRole.ORGANIZER) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.ORGANIZER },
      });
    }

    return respond({ organizer });
  } catch (error) {
    return handleApiError(error);
  }
}
