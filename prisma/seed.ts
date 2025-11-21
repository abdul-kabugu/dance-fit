import { faker } from '@faker-js/faker';
import {
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
            walletAddress: faker.finance.bitcoinAddress(),
          },
        },
      },
      include: { organizer: true },
    });

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
            walletAddress: faker.finance.bitcoinAddress(),
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
        onboardingCompleted: faker.number.int({ min: 0, max: 100 }) > 25,
      },
    });
    attendees.push(attendee);
  }

  return attendees;
}

function buildTicketTypes(
  startDate: Date,
): Prisma.TicketTypeCreateWithoutEventInput[] {
  const labels = [
    'Full Pass',
    'VIP Immersion',
    'Social Pass',
    'Workshop Day',
    'Performer Badge',
  ];

  const options = faker.helpers.arrayElements(labels, {
    min: 2,
    max: 3,
  });

  return options.map((label) => {
    const priceCents = faker.number.int({ min: 60, max: 250 }) * 100;
    const earlyBird = faker.datatype.boolean();
    const discountMultiplier = faker.number.float({ min: 0.75, max: 0.9 });
    const earlyBirdPriceCents = earlyBird
      ? Math.round(priceCents * discountMultiplier)
      : undefined;

    const salesStart = new Date(
      startDate.getTime() -
        faker.number.int({ min: 30, max: 90 }) * 24 * 60 * 60 * 1000,
    );
    const salesEnd = new Date(
      startDate.getTime() -
        faker.number.int({ min: 2, max: 7 }) * 24 * 60 * 60 * 1000,
    );

    const earlyBirdEndsAt =
      earlyBird && earlyBirdPriceCents
        ? new Date(
            startDate.getTime() -
              faker.number.int({ min: 10, max: 25 }) * 24 * 60 * 60 * 1000,
          )
        : undefined;

    const visible = faker.number.int({ min: 0, max: 100 }) > 5;

    return {
      name: label,
      description: faker.lorem.sentence(),
      priceCents,
      currency: 'USD',
      isEarlyBird: earlyBird,
      earlyBirdPriceCents,
      earlyBirdEndsAt,
      quantityTotal: faker.number.int({ min: 60, max: 220 }),
      salesStart,
      salesEnd,
      visible,
      isBchDiscounted: faker.datatype.boolean(),
    };
  });
}

function randomEventTitle() {
  return `${faker.helpers.arrayElement(eventTitleAdjectives)} ${faker.helpers.arrayElement(
    eventTitleNouns,
  )}`;
}

async function createEvents(
  organizers: OrganizerWithProfile[],
  artists: ArtistWithProfile[],
) {
  const events: EventWithTickets[] = [];
  const categories = Object.values(EventCategory);
  const types = Object.values(EventType);
  const locationTypes = Object.values(LocationType);

  for (const organizer of organizers) {
    const eventCount = faker.number.int({ min: 2, max: 4 });

    for (let i = 0; i < eventCount; i += 1) {
      const organizerProfileId = organizer.organizer?.id;
      if (!organizerProfileId) {
        throw new Error(`Organizer profile missing for user ${organizer.id}`);
      }
      const location = faker.helpers.arrayElement(cityPool);
      const dateChoice = faker.number.int({ min: 0, max: 2 });
      const startDateTime =
        dateChoice === 0
          ? faker.date.soon({ days: 90 })
          : dateChoice === 1
            ? faker.date.recent({ days: 45 })
            : faker.date.past({ years: 1 });
      const endDateTime = new Date(
        startDateTime.getTime() +
          faker.number.int({ min: 3, max: 8 }) * 60 * 60 * 1000,
      );

      const title = randomEventTitle();
      const slug = `${slugify(title)}-${faker.string.alphanumeric({
        length: 4,
      })}`.toLowerCase();

      const locationType = faker.helpers.arrayElement(locationTypes);
      const isUpcoming = startDateTime > new Date();
      const status = isUpcoming
        ? EventStatus.PUBLISHED
        : faker.helpers.arrayElement([
            EventStatus.PUBLISHED,
            EventStatus.ARCHIVED,
            EventStatus.DRAFT,
          ]);
      const publishAt =
        status === EventStatus.PUBLISHED || status === EventStatus.ARCHIVED
          ? faker.date.past({ refDate: startDateTime, years: 0.05 })
          : null;

      const goodToKnow = [
        `Doors open at ${faker.helpers.arrayElement([
          '6:30 PM',
          '7:00 PM',
          '8:00 PM',
        ])}`,
        'Bring dance shoes and water bottle',
        'Complimentary hydration station available',
        faker.datatype.boolean()
          ? 'BCH payments eligible for cashback'
          : 'Professional photo corner all night',
      ].join('\n');

      const eventArtists = faker.helpers.arrayElements(artists, {
        min: 1,
        max: Math.min(3, artists.length),
      });

      const event = await prisma.event.create({
        data: {
          slug,
          organizerId: organizerProfileId,
          title,
          summary: truncate(faker.lorem.sentences(2)),
          description: faker.lorem.paragraphs(3, '\n\n'),
          goodToKnow,
          bannerUrl: faker.image.urlPicsumPhotos({
            width: 1600,
            height: 900,
          }),
          category: faker.helpers.arrayElement(categories),
          type: faker.helpers.arrayElement(types),
          status,
          isPublic: status !== EventStatus.DRAFT || faker.datatype.boolean(),
          allowPrivateAccess: faker.datatype.boolean(),
          publishAt,
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
                  `Artist profile missing for user ${artistRecord.id}`,
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
        include: {
          ticketTypes: true,
        },
      });

      events.push(event);
    }
  }

  return events;
}

function pickAttendee(attendees: User[]) {
  return faker.helpers.arrayElement(attendees);
}

function computeDiscount(ticketType: TicketType, method: PaymentMethod) {
  if (method === PaymentMethod.BCH && ticketType.isBchDiscounted) {
    return Math.round(ticketType.priceCents * 0.1);
  }
  return 0;
}

async function createCompletedOrder(options: {
  event: EventWithTickets;
  ticketType: TicketType;
  attendee: User;
  method: PaymentMethod;
  refunded?: boolean;
}) {
  const { event, ticketType, attendee, method, refunded } = options;
  const discountCents = computeDiscount(ticketType, method);
  const totalCents = ticketType.priceCents - discountCents;

  const payment = await prisma.payment.create({
    data: {
      eventId: event.id,
      organizerId: event.organizerId,
      method,
      status: refunded ? PaymentStatus.REFUNDED : PaymentStatus.COMPLETED,
      amountCents: totalCents,
      currency: ticketType.currency,
      bchAmountSats:
        method === PaymentMethod.BCH
          ? Math.round(totalCents * faker.number.float({ min: 30, max: 50 }))
          : null,
      bchAddress:
        method === PaymentMethod.BCH ? faker.finance.bitcoinAddress() : null,
      txHash:
        method === PaymentMethod.BCH
          ? faker.string.hexadecimal({ length: 64, casing: 'lower' })
          : null,
      provider:
        method === PaymentMethod.FIAT
          ? faker.helpers.arrayElement(['GOOGLE_PAY', 'APPLE_PAY'])
          : null,
      providerPaymentId:
        method === PaymentMethod.FIAT
          ? `pi_${faker.string.alphanumeric({ length: 14 }).toLowerCase()}`
          : null,
    },
  });

  const checkout = await prisma.checkoutSession.create({
    data: {
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: 1,
      attendeeName: attendee.name ?? faker.person.fullName(),
      attendeeEmail: attendee.email,
      //@ts-ignore
      attendeePhone: faker.phone.number('+1 ###-###-####'),
      currency: ticketType.currency,
      unitPriceCents: ticketType.priceCents,
      discountCents,
      totalCents,
      paymentMethod: method,
      status: CheckoutStatus.COMPLETED,
      paymentId: payment.id,
      bchAddress: payment.bchAddress,
      expiresAt: null,
    },
  });

  const ticket = await prisma.ticket.create({
    data: {
      ticketTypeId: ticketType.id,
      eventId: event.id,
      organizerId: event.organizerId,
      attendeeName: checkout.attendeeName,
      attendeeEmail: attendee.email,
      attendeePhone: checkout.attendeePhone,
      status: refunded ? TicketStatus.REFUNDED : TicketStatus.CONFIRMED,
      referenceCode: generateReference('TKT'),
      paymentId: payment.id,
    },
  });

  await prisma.ticketType.update({
    where: { id: ticketType.id },
    data: { quantitySold: { increment: 1 } },
  });

  if (method === PaymentMethod.BCH && !refunded) {
    if (faker.datatype.boolean()) {
      await prisma.nftTicket.create({
        data: {
          ticketId: ticket.id,
          tokenId: faker.string.hexadecimal({ length: 32 }),
          walletAddress: faker.finance.bitcoinAddress(),
        },
      });
    }
    if (faker.datatype.boolean()) {
      await prisma.cashback.create({
        data: {
          paymentId: payment.id,
          amountSats: faker.number.int({ min: 10000, max: 75000 }),
          stampId: `CS-${faker.string.alphanumeric({ length: 8 }).toUpperCase()}`,
          claimedAt: faker.datatype.boolean() ? faker.date.recent() : null,
        },
      });
    }
  }
}

async function createPendingCheckout(options: {
  event: EventWithTickets;
  ticketType: TicketType;
  attendee: User;
  method: PaymentMethod;
  attachPayment: boolean;
  status: CheckoutStatus;
}) {
  const { event, ticketType, attendee, method, attachPayment, status } =
    options;
  const discountCents = computeDiscount(ticketType, method);
  const totalCents = ticketType.priceCents - discountCents;
  let paymentId: string | undefined;

  if (attachPayment) {
    const payment = await prisma.payment.create({
      data: {
        eventId: event.id,
        organizerId: event.organizerId,
        method,
        status:
          status === CheckoutStatus.AWAITING_PAYMENT
            ? PaymentStatus.PENDING
            : PaymentStatus.FAILED,
        amountCents: totalCents,
        currency: ticketType.currency,
        bchAmountSats:
          method === PaymentMethod.BCH
            ? Math.round(totalCents * faker.number.float({ min: 25, max: 40 }))
            : null,
        bchAddress:
          method === PaymentMethod.BCH ? faker.finance.bitcoinAddress() : null,
        provider:
          method === PaymentMethod.FIAT
            ? faker.helpers.arrayElement(['GOOGLE_PAY', 'APPLE_PAY'])
            : null,
        providerPaymentId:
          method === PaymentMethod.FIAT
            ? `pi_${faker.string.alphanumeric({ length: 12 }).toLowerCase()}`
            : null,
      },
    });
    paymentId = payment.id;
  }

  await prisma.checkoutSession.create({
    data: {
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: 1,
      attendeeName: attendee.name ?? faker.person.fullName(),
      attendeeEmail: attendee.email,
      //@ts-ignore
      attendeePhone: faker.phone.number('+1 ###-###-####'),
      currency: ticketType.currency,
      unitPriceCents: ticketType.priceCents,
      discountCents,
      totalCents,
      paymentMethod: status === CheckoutStatus.STARTED ? null : method,
      status,
      paymentId,
      bchAddress:
        method === PaymentMethod.BCH && status !== CheckoutStatus.STARTED
          ? faker.finance.bitcoinAddress()
          : null,
      expiresAt:
        status === CheckoutStatus.AWAITING_PAYMENT
          ? new Date(
              Date.now() + faker.number.int({ min: 10, max: 40 }) * 60000,
            )
          : null,
    },
  });
}

async function seedCheckouts(events: EventWithTickets[], attendees: User[]) {
  for (const event of events) {
    if (!event.ticketTypes.length) continue;
    const primary = event.ticketTypes[0];
    const secondary = event.ticketTypes[1] ?? primary;

    await createCompletedOrder({
      event,
      ticketType: primary,
      attendee: pickAttendee(attendees),
      method: PaymentMethod.FIAT,
    });

    await createCompletedOrder({
      event,
      ticketType: primary,
      attendee: pickAttendee(attendees),
      method: PaymentMethod.BCH,
    });

    await createCompletedOrder({
      event,
      ticketType: secondary,
      attendee: pickAttendee(attendees),
      method: PaymentMethod.FIAT,
      refunded: true,
    });

    await createPendingCheckout({
      event,
      ticketType: primary,
      attendee: pickAttendee(attendees),
      method: PaymentMethod.BCH,
      attachPayment: false,
      status: CheckoutStatus.AWAITING_PAYMENT,
    });

    await createPendingCheckout({
      event,
      ticketType: secondary,
      attendee: pickAttendee(attendees),
      method: PaymentMethod.FIAT,
      attachPayment: true,
      status: CheckoutStatus.AWAITING_PAYMENT,
    });

    await createPendingCheckout({
      event,
      ticketType: primary,
      attendee: pickAttendee(attendees),
      method: PaymentMethod.FIAT,
      attachPayment: false,
      status: CheckoutStatus.STARTED,
    });
  }
}

async function main() {
  console.log('Resetting database…');
  await resetDatabase();

  console.log('Creating core profiles…');
  const [organizers, artists, attendees] = await Promise.all([
    createOrganizers(4),
    createArtists(6),
    createAttendees(24),
  ]);

  console.log('Creating events, tickets, and artists on events…');
  const events = await createEvents(organizers, artists);

  console.log('Creating checkout sessions, payments, and tickets…');
  await seedCheckouts(events, attendees);

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
