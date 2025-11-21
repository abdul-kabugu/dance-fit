import {
  EventCategory,
  EventType,
  LocationType,
  PaymentMethod,
} from '@prisma/client';
import { z } from 'zod';

const moneyToCents = z
  .union([z.string(), z.number()])
  .transform((value) => {
    const numeric =
      typeof value === 'number'
        ? value
        : Number.parseFloat(value.toString().replace(/[^0-9.]/g, ''));
    return Math.round(numeric * 100);
  })
  .refine((value) => value >= 0, { message: 'Price must be positive.' });

export const organizerProfileSchema = z.object({
  studioName: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  facebook: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().optional(),
  walletAddress: z.string().optional(),
});

export const artistProfileSchema = z.object({
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  facebook: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().optional(),
  walletAddress: z.string().optional(),
  danceStyles: z.array(z.string()).default([]),
});

export const onboardingSchema = z.object({
  role: z.enum(['organizer', 'artist', 'attendee']),
  name: z.string().min(1),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  organizer: organizerProfileSchema.optional(),
  artist: artistProfileSchema.optional(),
});

const ticketInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: moneyToCents,
  quantity: z.coerce.number().int().min(1),
  currency: z.string().default('USD'),
  salesStart: z.string().optional(),
  salesEnd: z.string().optional(),
  earlyBird: z.boolean().optional().default(false),
  earlyBirdPrice: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      const numeric =
        typeof value === 'number'
          ? value
          : Number.parseFloat(value.toString().replace(/[^0-9.]/g, ''));
      if (Number.isNaN(numeric)) {
        return undefined;
      }
      return Math.round(numeric * 100);
    }),
  earlyBirdEndsAt: z.string().optional(),
  displayOnPage: z.boolean().optional().default(true),
  bchDiscount: z.boolean().optional().default(false),
});

export const eventPayloadSchema = z.object({
  bannerUrl: z.string().optional(),
  title: z.string().min(3),
  summary: z.string().min(10).max(140),
  overview: z.string().optional(),
  goodToKnow: z.string().optional(),
  category: z.nativeEnum(EventCategory),
  eventType: z.enum(['single', 'recurring']).transform((value) =>
    value === 'recurring' ? EventType.RECURRING : EventType.SINGLE,
  ),
  locationType: z.nativeEnum(LocationType),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  meetingUrl: z.string().optional(),
  timezone: z.string().optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  startDateTime: z.string().optional(),
  endDateTime: z.string().optional(),
  publishPublicly: z.boolean().optional().default(true),
  allowPrivateLink: z.boolean().optional().default(false),
  publishDate: z.string().optional(),
  selectedArtists: z.array(z.string()).default([]),
  tickets: z.array(ticketInputSchema).min(1),
});

export const checkoutSessionSchema = z.object({
  eventId: z.string().min(1),
  ticketTypeId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(1).default(1),
  attendeeName: z.string().min(1),
  attendeeEmail: z.string().email(),
  attendeePhone: z.string().optional(),
});

export const checkoutSessionUpdateSchema = z.object({
  checkoutSessionId: z.string().min(1),
});

export const paymentSessionSchema = z.object({
  checkoutSessionId: z.string().min(1),
  method: z.nativeEnum(PaymentMethod),
});

export const ticketIssueSchema = z.object({
  eventId: z.string().min(1),
  ticketTypeId: z.string().min(1),
  attendeeName: z.string().min(1),
  attendeeEmail: z.string().email(),
  attendeePhone: z.string().optional(),
  referenceCode: z.string().optional(),
  paymentId: z.string().optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED'])
    .optional(),
  mintNft: z.boolean().optional().default(false),
  nftWalletAddress: z.string().optional(),
  nftTokenId: z.string().optional(),
  cashbackAmountSats: z.coerce.number().int().optional(),
});

export const bchWebhookSchema = z.object({
  checkoutSessionId: z.string().min(1),
  txHash: z.string().min(10),
  amountSats: z.coerce.number().int().positive(),
  fromAddress: z.string().min(10),
});

export const analyticsQuerySchema = z.object({
  range: z.enum(['30d', '90d', '365d']).default('30d'),
});
