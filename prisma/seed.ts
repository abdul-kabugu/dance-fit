import { faker } from '@faker-js/faker';
import {
  CashbackStatus,
  CheckoutStatus,
  EventCategory,
  EventStatus,
  EventType,
  LocationType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
  TicketStatus,
  TicketType,
  User,
  UserRole,
} from '@prisma/client';

import { generateReference, slugify } from '../lib/strings';

type OrganizerWithProfile = Prisma.UserGetPayload<{
  include: { organizer: true };
}>;

type ArtistWithProfile = Prisma.UserGetPayload<{
  include: { artist: true };
}>;

type EventWithTickets = Prisma.EventGetPayload<{
  include: { ticketTypes: true };
}>;

faker.seed(2025);

const prisma = new PrismaClient();

const organizerWallets: Record<string, { bchXpub: string; cursor: number }> =
  {};

const danceStylePool = [
  'Bachata',
  'Salsa',
  'Kizomba',
  'Zouk',
  'Urban Kiz',
  'Afro',
  'Tango',
  'Latin Fusion',
  'Reggaeton',
];

const cityPool = [
  {
    city: 'New York',
    country: 'United States',
    venue: 'Midtown Dance Loft',
    address: '134 W 29th St',
    timezone: 'America/New_York',
  },
  {
    city: 'Los Angeles',
    country: 'United States',
    venue: 'Silverlake Movement Studio',
    address: '4122 Sunset Blvd',
    timezone: 'America/Los_Angeles',
  },
  {
    city: 'Miami',
    country: 'United States',
    venue: 'South Beach Rhythm House',
    address: '945 Collins Ave',
    timezone: 'America/New_York',
  },
  {
    city: 'Austin',
    country: 'United States',
    venue: 'Eastside Social Club',
    address: '1806 E 6th St',
    timezone: 'America/Chicago',
  },
  {
    city: 'Chicago',
    country: 'United States',
    venue: 'Lakeview Dance Collective',
    address: '2857 N Southport Ave',
    timezone: 'America/Chicago',
  },
  {
    city: 'San Juan',
    country: 'Puerto Rico',
    venue: 'Condado Cultural Center',
    address: '1052 Ashford Ave',
    timezone: 'America/Puerto_Rico',
  },
  {
    city: 'Toronto',
    country: 'Canada',
    venue: 'Harbourfront Movement Hub',
    address: '231 Queens Quay W',
    timezone: 'America/Toronto',
  },
  {
    city: 'Madrid',
    country: 'Spain',
    venue: 'La Latina Dance Factory',
    address: 'C. de la Cebada, 9',
    timezone: 'Europe/Madrid',
  },
];

const eventTitleAdjectives = [
  'Moonlight',
  'Electric',
  'Velvet',
  'Sundown',
  'Neon',
  'Golden',
  'Midnight',
  'Island',
  'Soulful',
];

const eventTitleNouns = [
  'Social',
  'Sessions',
  'Weekender',
  'Experience',
  'Immersion',
  'Gathering',
  'Fiesta',
  'Exchange',
  'Intensive',
];

function truncate(text: string, max = 140) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).trim()}...`;
}

function createSocialLinks(handle: string) {
  const safeHandle = handle.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return {
    instagram: `https://instagram.com/${safeHandle}`,
    tiktok: `https://www.tiktok.com/@${safeHandle}`,
    youtube: `https://youtube.com/${safeHandle}`,
    facebook: `https://facebook.com/${safeHandle}`,
    whatsapp: `https://wa.me/${faker.number.int({ min: 17860000000, max: 17869999999 })}`,
    website: `https://${faker.internet.domainName()}`,
  };
}

function randomPhone() {
  return faker.phone.number('+1 ###-###-####');
}

function randomXpub() {
  return `xpub${faker.string.alphanumeric({ length: 96, casing: 'lower' })}`;
}

function randomEncrypted(label: string) {
  return `${label}_${faker.string.hexadecimal({
    length: 64,
    casing: 'lower',
    prefix: '',
  })}`;
}

function generateBchAddress() {
  return `bitcoincash:q${faker.string.alphanumeric({ length: 38, casing: 'lower' })}`;
}

function usdToSats(totalCents: number) {
  const usd = totalCents / 100;
  const rate = faker.number.float({ min: 240, max: 310, fractionDigits: 2 });
  return Math.max(1, Math.round((usd / rate) * 1e8));
}

function computeDiscount(ticketType: TicketType, method: PaymentMethod) {
  if (method === PaymentMethod.BCH && ticketType.isBchDiscounted) {
    return Math.round(ticketType.priceCents * 0.1);
  }
  return 0;
}

function randomEventTitle() {
  return `${faker.helpers.arrayElement(eventTitleAdjectives)} ${faker.helpers.arrayElement(eventTitleNouns)}`;
}

async function resetDatabase() {
  await prisma.nftTicket.deleteMany();
  await prisma.cashback.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.checkoutSession.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.artistOnEvent.deleteMany();
  await prisma.event.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.organizer.deleteMany();
  await prisma.user.deleteMany();
}

async function createOrganizers(count: number) {
  const organizers: OrganizerWithProfile[] = [];

  for (let i = 0; i < count; i += 1) {
    const name = faker.person.fullName();
    const handle = faker.internet.username();
    const socialLinks = createSocialLinks(handle);
    const xpub = randomXpub();

    const organizer = await prisma.user.create({
      data: {
        clerkId: `clerk_org_${faker.string.nanoid(18)}`,
        email: faker.internet.email({
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' '),
        }),
        name,
        avatarUrl: faker.image.avatar(),
        bio: faker.person.bio(),
        role: UserRole.ORGANIZER,
        onboardingCompleted: true,
        organizer: {
          create: {
            studioName: `${faker.company.buzzAdjective()} ${faker.company.buzzNoun()} Dance`,
            ...socialLinks,
            walletAddress: generateBchAddress(),
            bchXpub: xpub,
            bchXprivEnc: randomEncrypted('xprv'),
            bchSeedEnc: randomEncrypted('seed'),
            nextIndex: 0,
          },
        },
      },
      include: { organizer: true },
    });

    if (!organizer.organizer) {
      throw new Error('Organizer profile missing');
    }

    organizerWallets[organizer.organizer.id] = { bchXpub: xpub, cursor: 0 };
    organizers.push(organizer);
  }

  return organizers;
}

async function createArtists(count: number) {
  const artists: ArtistWithProfile[] = [];

  for (let i = 0; i < count; i += 1) {
    const name = faker.person.fullName();
    const handle = faker.internet.username();
    const socialLinks = createSocialLinks(handle);
    const danceStyles = faker.helpers.arrayElements(danceStylePool, {
      min: 1,
      max: 3,
    });

    const artist = await prisma.user.create({
      data: {
        clerkId: `clerk_artist_${faker.string.nanoid(18)}`,
        email: faker.internet.email({
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' '),
        }),
        name,
        avatarUrl: faker.image.avatar(),
        bio: faker.person.bio(),
        role: UserRole.ARTIST,
        onboardingCompleted: true,
        artist: {
          create: {
            ...socialLinks,
            danceStyles,
            walletAddress: generateBchAddress(),
            bchXpub: randomXpub(),
            bchXprivEnc: randomEncrypted('xprv'),
            bchSeedEnc: randomEncrypted('seed'),
            nextIndex: faker.number.int({ min: 0, max: 10 }),
          },
        },
      },
      include: { artist: true },
    });

    artists.push(artist);
  }

  return artists;
}

async function createAttendees(count: number) {
  const attendees: User[] = [];

  for (let i = 0; i < count; i += 1) {
    const name = faker.person.fullName();
    const attendee = await prisma.user.create({
      data: {
        clerkId: `clerk_attendee_${faker.string.nanoid(20)}`,
        email: faker.internet.email({
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' '),
        }),
        name,
        avatarUrl: faker.image.avatar(),
        bio: faker.person.bio(),
        role: UserRole.ATTENDEE,
        onboardingCompleted: faker.datatype.boolean(),
      },
    });
    attendees.push(attendee);
  }

  return attendees;
}

function buildTicketTypes(
  startDate: Date,
): Prisma.TicketTypeCreateWithoutEventInput[] {
  const labels = ['Full Pass', 'VIP Immersion', 'Social Pass', 'Workshop Day'];
  const selected = faker.helpers.arrayElements(labels, { min: 2, max: 3 });

  return selected.map((label) => {
    const priceCents = faker.number.int({ min: 80, max: 320 }) * 100;
    const earlyBird = faker.datatype.boolean();
    const earlyDiscount = faker.number.float({
      min: 0.7,
      max: 0.9,
      fractionDigits: 2,
    });
    const earlyBirdPriceCents = earlyBird
      ? Math.round(priceCents * earlyDiscount)
      : undefined;
    const salesStart = faker.date.recent({ days: 60, refDate: startDate });
    const salesEnd = new Date(
      startDate.getTime() - faker.number.int({ min: 2, max: 7 }) * 86_400_000,
    );
    const earlyBirdEndsAt =
      earlyBird && earlyBirdPriceCents
        ? new Date(
            startDate.getTime() -
              faker.number.int({ min: 10, max: 25 }) * 86_400_000,
          )
        : undefined;

    return {
      name: label,
      description: faker.lorem.sentence(),
      priceCents,
      currency: 'USD',
      isEarlyBird: earlyBird,
      earlyBirdPriceCents,
      earlyBirdEndsAt,
      quantityTotal: faker.number.int({ min: 80, max: 250 }),
      salesStart,
      salesEnd,
      visible: faker.datatype.boolean({ probability: 0.92 }),
      isBchDiscounted: faker.datatype.boolean(),
    };
  });
}

async function createEvents(
  organizers: OrganizerWithProfile[],
  artists: ArtistWithProfile[],
) {
  const categories = Object.values(EventCategory);
  const types = Object.values(EventType);
  const locationTypes = Object.values(LocationType);
  const events: EventWithTickets[] = [];

  for (const organizer of organizers) {
    const organizerProfileId = organizer.organizer?.id;
    if (!organizerProfileId) {
      throw new Error(`Organizer profile missing for ${organizer.id}`);
    }

    const eventCount = faker.number.int({ min: 2, max: 4 });

    for (let i = 0; i < eventCount; i += 1) {
      const location = faker.helpers.arrayElement(cityPool);
      const startDateTime = faker.date.soon({ days: 120 });
      const endDateTime = new Date(
        startDateTime.getTime() +
          faker.number.int({ min: 3, max: 8 }) * 3_600_000,
      );
      const title = randomEventTitle();
      const slug =
        `${slugify(title)}-${faker.string.alphanumeric({ length: 4 })}`.toLowerCase();
      const status = faker.helpers.arrayElement([
        EventStatus.PUBLISHED,
        EventStatus.PUBLISHED,
        EventStatus.DRAFT,
        EventStatus.ARCHIVED,
      ]);
      const locationType = faker.helpers.arrayElement(locationTypes);

      const eventArtists = faker.helpers.arrayElements(artists, {
        min: 1,
        max: Math.min(4, artists.length),
      });

      const event = await prisma.event.create({
        data: {
          slug,
          organizerId: organizerProfileId,
          title,
          summary: truncate(faker.lorem.sentences(2)),
          description: faker.lorem.paragraphs(3, '\n\n'),
          goodToKnow: [
            'Doors open 30 minutes before the first workshop.',
            'Bring dance shoes, BCH wallet, and hydration.',
            faker.helpers.arrayElement([
              'Professional photo booth available.',
              'BCH payments eligible for cashback.',
              'Live DJs all night long.',
            ]),
          ].join('\n'),
          bannerUrl: faker.image.urlPicsumPhotos({ width: 1600, height: 900 }),
          category: faker.helpers.arrayElement(categories),
          type: faker.helpers.arrayElement(types),
          status,
          isPublic: status !== EventStatus.DRAFT || faker.datatype.boolean(),
          allowPrivateAccess: faker.datatype.boolean(),
          publishAt:
            status === EventStatus.DRAFT
              ? null
              : faker.date.recent({ days: 30 }),
          locationType,
          venueName:
            locationType === LocationType.VENUE ? location.venue : null,
          addressLine1:
            locationType === LocationType.VENUE ? location.address : null,
          city: location.city,
          country: location.country,
          onlineUrl:
            locationType === LocationType.ONLINE
              ? `https://dancefit.live/${slug}`
              : null,
          timezone: location.timezone,
          startDateTime,
          endDateTime,
          ticketTypes: {
            create: buildTicketTypes(startDateTime),
          },
          artists: {
            create: eventArtists.map((artistRecord) => {
              if (!artistRecord.artist) {
                throw new Error(
                  `Artist profile missing for ${artistRecord.id}`,
                );
              }
              return {
                artist: { connect: { id: artistRecord.artist.id } },
                role: faker.helpers.arrayElement([
                  'Instructor',
                  'Performer',
                  'DJ',
                  'Guest',
                ]),
              };
            }),
          },
        },
        include: { ticketTypes: true },
      });

      events.push(event);
    }
  }

  return events;
}

function pickAttendee(attendees: User[]) {
  return faker.helpers.arrayElement(attendees);
}

function deriveBchAddress(organizerId: string) {
  const wallet = organizerWallets[organizerId];
  if (!wallet) {
    throw new Error(`Wallet config missing for organizer ${organizerId}`);
  }
  const index = wallet.cursor;
  wallet.cursor += 1;
  return {
    address: generateBchAddress(),
    derivationIndex: index,
  };
}

async function createCashbackRecord(
  paymentId: string,
  organizerId: string,
  baseAmount: number,
) {
  const status = faker.helpers.arrayElement([
    CashbackStatus.UNCLAIMED,
    CashbackStatus.UNCLAIMED,
    CashbackStatus.CLAIMED,
    CashbackStatus.FAILED,
  ]);
  return prisma.cashback.create({
    data: {
      paymentId,
      organizerId,
      amountSats: Math.max(
        5_000,
        Math.round(baseAmount * faker.number.float({ min: 0.05, max: 0.12 })),
      ),
      bchAddress: generateBchAddress(),
      wifEncrypted: randomEncrypted('wif'),
      status,
      fundedTxId:
        status === CashbackStatus.CLAIMED || status === CashbackStatus.FAILED
          ? faker.string.hexadecimal({
              length: 64,
              casing: 'lower',
              prefix: '',
            })
          : null,
    },
  });
}

interface OrderFlowInput {
  event: EventWithTickets;
  ticketType: TicketType;
  attendee: User;
  method: PaymentMethod;
  checkoutStatus: CheckoutStatus;
  paymentStatus?: PaymentStatus;
  includeCashback?: boolean;
  issueTicket?: boolean;
  ticketStatus?: TicketStatus;
  mintNft?: boolean;
}

async function createOrderFlow(params: OrderFlowInput) {
  const {
    event,
    ticketType,
    attendee,
    method,
    checkoutStatus,
    paymentStatus,
    includeCashback,
    issueTicket,
    ticketStatus,
    mintNft,
  } = params;

  const discountCents = computeDiscount(ticketType, method);
  const totalCents = ticketType.priceCents - discountCents;

  let paymentId: string | undefined;
  let paymentBchAddress: string | null = null;

  if (paymentStatus) {
    const paymentData = {
      eventId: event.id,
      organizerId: event.organizerId,
      method,
      status: paymentStatus,
      amountCents: totalCents,
      currency: ticketType.currency,
      provider: null as string | null,
      providerPaymentId: null as string | null,
      bchAmountSats: null as number | null,
      bchAddress: null as string | null,
      bchDerivationIndex: null as number | null,
      txHash: null as string | null,
      txId: null as string | null,
    };

    if (method === PaymentMethod.BCH) {
      const { address, derivationIndex } = deriveBchAddress(event.organizerId);
      paymentBchAddress = address;
      paymentData.bchAddress = address;
      paymentData.bchAmountSats = usdToSats(totalCents);
      paymentData.bchDerivationIndex = derivationIndex;
      if (
        paymentStatus === PaymentStatus.COMPLETED ||
        paymentStatus === PaymentStatus.REFUNDED
      ) {
        paymentData.txHash = faker.string.hexadecimal({
          length: 64,
          casing: 'lower',
          prefix: '',
        });
        paymentData.txId = faker.string.hexadecimal({
          length: 64,
          casing: 'lower',
          prefix: '',
        });
      }
    } else {
      paymentData.provider = faker.helpers.arrayElement([
        'GOOGLE_PAY',
        'APPLE_PAY',
      ]);
      paymentData.providerPaymentId = `pi_${faker.string.alphanumeric({ length: 14 }).toLowerCase()}`;
    }

    const payment = await prisma.payment.create({ data: paymentData });
    paymentId = payment.id;
    paymentBchAddress = payment.bchAddress;

    if (
      includeCashback &&
      payment.method === PaymentMethod.BCH &&
      payment.bchAmountSats
    ) {
      await createCashbackRecord(
        payment.id,
        payment.organizerId,
        payment.bchAmountSats,
      );
    }
  }

  const sessionBchAddress =
    method === PaymentMethod.BCH
      ? (paymentBchAddress ?? deriveBchAddress(event.organizerId).address)
      : null;

  const expiresAt =
    checkoutStatus === CheckoutStatus.AWAITING_PAYMENT
      ? new Date(
          Date.now() + faker.number.int({ min: 10, max: 30 }) * 60 * 1000,
        )
      : null;

  await prisma.checkoutSession.create({
    data: {
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: 1,
      attendeeName: attendee.name ?? faker.person.fullName(),
      attendeeEmail: attendee.email,
      attendeePhone: randomPhone(),
      currency: ticketType.currency,
      unitPriceCents: ticketType.priceCents,
      discountCents,
      totalCents,
      paymentMethod: method,
      status: checkoutStatus,
      paymentId: paymentId ?? null,
      bchAddress: sessionBchAddress,
      expiresAt,
    },
  });

  if (paymentId && issueTicket) {
    const finalTicketStatus =
      ticketStatus ??
      (paymentStatus === PaymentStatus.REFUNDED
        ? TicketStatus.REFUNDED
        : TicketStatus.CONFIRMED);

    const ticket = await prisma.ticket.create({
      data: {
        ticketTypeId: ticketType.id,
        eventId: event.id,
        organizerId: event.organizerId,
        attendeeName: attendee.name ?? faker.person.fullName(),
        attendeeEmail: attendee.email,
        attendeePhone: randomPhone(),
        status: finalTicketStatus,
        referenceCode: generateReference('DFIT'),
        paymentId,
      },
    });

    await prisma.ticketType.update({
      where: { id: ticketType.id },
      data: { quantitySold: { increment: 1 } },
    });

    if (mintNft) {
      await prisma.nftTicket.create({
        data: {
          ticketId: ticket.id,
          tokenId: faker.string.hexadecimal({
            length: 64,
            casing: 'lower',
            prefix: '',
          }),
          walletAddress: generateBchAddress(),
        },
      });
    }
  }
}

async function seedOrders(events: EventWithTickets[], attendees: User[]) {
  for (const event of events) {
    if (!event.ticketTypes.length) continue;
    const primary = event.ticketTypes[0];
    const secondary = event.ticketTypes[1] ?? primary;

    await createOrderFlow({
      event,
      ticketType: primary,
      attendee: pickAttendee(attendees),
      method: PaymentMethod.BCH,
      checkoutStatus: CheckoutStatus.COMPLETED,
      paymentStatus: PaymentStatus.COMPLETED,
      includeCashback: true,
      issueTicket: true,
      mintNft: true,
    });

    await createOrderFlow({
      event,
      ticketType: primary,
      attendee: pickAttendee(attendees),
      method: PaymentMethod.FIAT,
      checkoutStatus: CheckoutStatus.COMPLETED,
      paymentStatus: PaymentStatus.COMPLETED,
      issueTicket: true,
    });

    await createOrderFlow({
      event,
      ticketType: secondary,
      attendee: pickAttendee(attendees),
      method: PaymentMethod.BCH,
      checkoutStatus: CheckoutStatus.COMPLETED,
      paymentStatus: PaymentStatus.REFUNDED,
      includeCashback: true,
      issueTicket: true,
      ticketStatus: TicketStatus.REFUNDED,
    });

    await createOrderFlow({
      event,
      ticketType: primary,
      attendee: pickAttendee(attendees),
      method: PaymentMethod.BCH,
      checkoutStatus: CheckoutStatus.AWAITING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
    });

    await createOrderFlow({
      event,
      ticketType: secondary,
      attendee: pickAttendee(attendees),
      method: PaymentMethod.FIAT,
      checkoutStatus: CheckoutStatus.AWAITING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
    });

    await createOrderFlow({
      event,
      ticketType: primary,
      attendee: pickAttendee(attendees),
      method: PaymentMethod.BCH,
      checkoutStatus: CheckoutStatus.STARTED,
    });
  }
}

async function syncOrganizerWalletIndexes() {
  await Promise.all(
    Object.entries(organizerWallets).map(([organizerId, config]) =>
      prisma.organizer.update({
        where: { id: organizerId },
        data: { nextIndex: config.cursor },
      }),
    ),
  );
}

async function main() {
  console.log('Resetting database…');
  await resetDatabase();

  console.log('Creating organizers, artists, and attendees…');
  const [organizers, artists, attendees] = await Promise.all([
    createOrganizers(4),
    createArtists(6),
    createAttendees(28),
  ]);

  console.log('Creating events with ticket types and artist lineups…');
  const events = await createEvents(organizers, artists);

  console.log('Creating checkout sessions, payments, tickets, cashback…');
  await seedOrders(events, attendees);

  console.log('Updating organizer wallet cursors…');
  await syncOrganizerWalletIndexes();

  console.log(
    `Seeded ${organizers.length} organizers, ${artists.length} artists, ${attendees.length} attendees, and ${events.length} events.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
