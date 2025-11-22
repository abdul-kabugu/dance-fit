import { NextRequest } from 'next/server';

import { UserRole } from '@prisma/client';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { createEncryptedBchWallet } from '@/lib/server/bch-wallets';
import prisma from '@/lib/prisma';
import { onboardingSchema } from '@/lib/validators';

export async function GET() {
  try {
    const user = await requireUser();
    return respond({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = onboardingSchema.parse(body);
    const user = await requireUser();

    const roleMap: Record<typeof payload.role, UserRole> = {
      organizer: UserRole.ORGANIZER,
      artist: UserRole.ARTIST,
      attendee: UserRole.ATTENDEE,
    };

    const shouldCreateOrganizerWallet =
      payload.role === 'organizer' &&
      (!user.organizer?.bchXpub ||
        !user.organizer?.bchSeedEnc ||
        !user.organizer?.bchXprivEnc);
    const shouldCreateArtistWallet =
      payload.role === 'artist' &&
      (!user.artist?.bchXpub ||
        !user.artist?.bchSeedEnc ||
        !user.artist?.bchXprivEnc);

    const organizerWalletData = shouldCreateOrganizerWallet
      ? createEncryptedBchWallet()
      : null;
    const artistWalletData = shouldCreateArtistWallet
      ? createEncryptedBchWallet()
      : null;

    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          name: payload.name,
          bio: payload.bio,
          avatarUrl: payload.avatarUrl ?? user.avatarUrl,
          role: roleMap[payload.role],
          onboardingCompleted: true,
        },
      });

      if (payload.role === 'organizer') {
        const organizerData = payload.organizer ?? {};
        await tx.organizer.upsert({
          where: { userId: user.id },
          update: { ...organizerData, ...(organizerWalletData ?? {}) },
          create: {
            userId: user.id,
            ...organizerData,
            ...(organizerWalletData ?? {}),
          },
        });
      }

      if (payload.role === 'artist') {
        const artistData = payload.artist ?? {};
        await tx.artist.upsert({
          where: { userId: user.id },
          update: { ...artistData, ...(artistWalletData ?? {}) },
          create: {
            userId: user.id,
            ...artistData,
            ...(artistWalletData ?? {}),
          },
        });
      }

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          organizer: true,
          artist: true,
        },
      });
    });

    if (!updatedUser) {
      throw new ApiError(500, 'Unable to update user profile.');
    }

    return respond({ user: updatedUser });
  } catch (error) {
    return handleApiError(error);
  }
}
