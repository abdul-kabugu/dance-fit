export type EventArtistAssignment = {
  artistId?: string;
  artist?: {
    id: string;
    danceStyles?: string[] | null;
    user?: {
      id?: string;
      name?: string | null;
      avatarUrl?: string | null;
    } | null;
  } | null;
};

export type EventTicketType = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  isEarlyBird?: boolean | null;
  earlyBirdPriceCents?: number | null;
  visible?: boolean | null;
};

export interface EventDetail {
  id: string;
  slug?: string | null;
  title: string;
  summary?: string | null;
  bannerUrl?: string | null;
  category?: string | null;
  description?: string | null;
  goodToKnow?: string | null;
  startDateTime?: string | null;
  endDateTime?: string | null;
  locationType: 'VENUE' | 'ONLINE' | 'TBA';
  venueName?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  country?: string | null;
  onlineUrl?: string | null;
  ticketTypes?: EventTicketType[];
  artists?: EventArtistAssignment[];
}

export type CheckoutSessionTicketType = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  isEarlyBird: boolean;
};

export interface CheckoutSessionDetail {
  id: string;
  totalCents: number;
  discountCents: number;
  currency: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string | null;
  ticketType: CheckoutSessionTicketType;
  event: EventDetail;
  payment?: {
    id: string;
    status?: string;
    txHash?: string | null;
    bchAmountSats?: number | null;
    bchAddress?: string | null;
    ticket?: {
      id: string;
      referenceCode: string;
      attendeeName: string;
      attendeeEmail: string;
      nftTicket?: {
        tokenId: string;
      } | null;
    } | null;
    cashback?: {
      amountSats: number;
      stampId: string | null;
    } | null;
  } | null;
}

export interface PaymentSessionDetail {
  id: string;
  bchAddress: string | null;
  expiresAt: string | null;
  attendeeName: string;
  attendeeEmail: string;
  ticketType: CheckoutSessionTicketType;
  event: EventDetail;
  payment?: {
    id: string;
    status: string;
    bchAmountSats: number | null;
    bchAddress: string | null;
  } | null;
}
