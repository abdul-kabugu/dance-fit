//'use server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { Prisma, UserRole } from '@prisma/client';

import { ApiError } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

export type UserWithRelations = Prisma.UserGetPayload<{
  include: { organizer: true; artist: true };
}>;

type ProfileType = 'organizer' | 'artist' | 'attendee';

function resolveProfileType(role: UserRole): ProfileType {
  if (role === UserRole.ORGANIZER) return 'organizer';
  if (role === UserRole.ARTIST) return 'artist';
  return 'attendee';
}

async function getUserWithRelations(
  clerkId: string,
): Promise<UserWithRelations | null> {
  return prisma.user.findUnique({
    where: { clerkId },
    include: {
      organizer: true,
      artist: true,
    },
  });
}

async function createUserFromClerk(
  clerkId: string,
): Promise<UserWithRelations> {
  const clerkInstance = await clerkClient();
  const clerk = await clerkInstance.users.getUser(clerkId);
  if (!clerk.primaryEmailAddress?.emailAddress) {
    throw new ApiError(400, 'Unable to resolve Clerk user email.');
  }

  const fullName = [clerk.firstName, clerk.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return prisma.user.create({
    data: {
      clerkId,
      email: clerk.primaryEmailAddress.emailAddress,
      name:
        fullName || clerk.username || clerk.primaryEmailAddress.emailAddress,
      avatarUrl: clerk.imageUrl,
      role: UserRole.ATTENDEE,
      onboardingCompleted: false,
    },
    include: {
      organizer: true,
      artist: true,
    },
  });
}

export function hasCompletedProfile(user: UserWithRelations) {
  if (user.onboardingCompleted) {
    return true;
  }

  if (user.role === UserRole.ORGANIZER) {
    return Boolean(user.organizer);
  }

  if (user.role === UserRole.ARTIST) {
    return Boolean(user.artist);
  }

  return false;
}

export function buildProfileStatus(user: UserWithRelations) {
  return {
    hasProfile: hasCompletedProfile(user),
    role: user.role,
    profileType: resolveProfileType(user.role),
  };
}

type RequireUserOptions = {
  sessionId?: string;
  userId?: string;
};

export async function requireUser(
  options: RequireUserOptions = {},
): Promise<UserWithRelations> {
  const { userId } = await auth();
  let resolvedUserId = userId;

  if (!resolvedUserId && options.sessionId) {
    try {
      const clerkInstance = await clerkClient();
      const session = await clerkInstance.sessions.getSession(
        options.sessionId,
      );
      resolvedUserId = session.userId;
    } catch (error) {
      console.error('[Auth] Failed to resolve Clerk session fallback', {
        error,
      });
    }
  }

  if (!resolvedUserId) {
    throw new ApiError(401, 'Authentication required.');
  }

  let dbUser = await getUserWithRelations(resolvedUserId);
  if (!dbUser) {
    dbUser = await createUserFromClerk(resolvedUserId);
  }

  return dbUser;
}

export async function requireOrganizerContext() {
  const user = await requireUser();
  if (user.role !== UserRole.ORGANIZER || !user.organizer) {
    throw new ApiError(
      403,
      'Organizer profile not found. Complete onboarding to continue.',
    );
  }

  return { user, organizer: user.organizer };
}

export async function requireArtistContext() {
  const user = await requireUser();
  if (user.role !== UserRole.ARTIST || !user.artist) {
    throw new ApiError(
      403,
      'Artist profile not found. Complete onboarding to continue.',
    );
  }

  return { user, artist: user.artist };
}
