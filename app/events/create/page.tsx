'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { AddTicketsStep } from '@/components/event-creation/add-tickets-step';
import { EventDetailsStep } from '@/components/event-creation/event-details-step';
import { ReviewPublishStep } from '@/components/event-creation/review-publish-step';
import { useToast } from '@/hooks/use-toast';

export default function CreateEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventData, setEventData] = useState({
    banner: null as string | null,
    title: '',
    summary: '',
    category: 'OTHER',
    eventType: 'single' as 'single' | 'recurring',
    date: '',
    startTime: '',
    endTime: '',
    locationType: 'venue' as 'venue' | 'online' | 'tba',
    venueName: '',
    venueAddress: '',
    meetingUrl: '',
    overview: '',
    goodToKnow: '',
    selectedArtists: [] as string[],
    tickets: [] as Array<{
      id: string;
      name: string;
      price: string;
      quantity: string;
      salesStart: string;
      salesEnd: string;
      earlyBird: boolean;
      earlyBirdPrice: string;
      description: string;
      displayOnPage: boolean;
      bchDiscount: boolean;
    }>,
    publishPublicly: true,
    allowPrivateLink: false,
    publishDate: '',
  });

  const handlePublish = async () => {
    if (
      !eventData.title ||
      !eventData.summary ||
      eventData.tickets.length === 0
    ) {
      toast({
        title: 'Add event details',
        description:
          'Please complete the required fields and at least one ticket type.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        bannerUrl: eventData.banner,
        title: eventData.title,
        summary: eventData.summary,
        overview: eventData.overview,
        goodToKnow: eventData.goodToKnow,
        category: eventData.category || 'OTHER',
        eventType: eventData.eventType,
        date: eventData.date || undefined,
        startTime: eventData.startTime || undefined,
        endTime: eventData.endTime || undefined,
        locationType: eventData.locationType.toUpperCase(),
        venueName: eventData.venueName,
        venueAddress: eventData.venueAddress,
        meetingUrl: eventData.meetingUrl,
        publishPublicly: eventData.publishPublicly,
        allowPrivateLink: eventData.allowPrivateLink,
        publishDate: eventData.publishDate || undefined,
        selectedArtists: eventData.selectedArtists,
        tickets: eventData.tickets.map((ticket) => ({
          name: ticket.name,
          description: ticket.description,
          price: ticket.price,
          quantity: Number.parseInt(ticket.quantity || '0', 10),
          salesStart: ticket.salesStart || undefined,
          salesEnd: ticket.salesEnd || undefined,
          earlyBird: ticket.earlyBird,
          earlyBirdPrice: ticket.earlyBirdPrice || undefined,
          displayOnPage: ticket.displayOnPage,
          bchDiscount: ticket.bchDiscount,
        })),
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? 'Failed to publish event.');
      }

      const result = await response.json();
      toast({
        title: 'Event published!',
        description: 'Your event is now live.',
      });
      router.push(`/events/${result.event.slug ?? result.event.id}`);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to publish event',
        description:
          error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Progress indicator */}
      <div className="bg-card sticky top-0 z-10 border-b">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    currentStep === step
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > step
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                <span
                  className={`hidden text-sm font-medium sm:block ${
                    currentStep === step
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step === 1 && 'Event Details'}
                  {step === 2 && 'Add Tickets'}
                  {step === 3 && 'Review & Publish'}
                </span>
                {step < 3 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      currentStep > step ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {currentStep === 1 && (
          <EventDetailsStep
            data={eventData}
            onUpdate={setEventData}
            onNext={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 2 && (
          <AddTicketsStep
            data={eventData}
            onUpdate={setEventData}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 3 && (
          <ReviewPublishStep
            data={eventData}
            onUpdate={setEventData}
            onBack={() => setCurrentStep(2)}
            onPublish={handlePublish}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
