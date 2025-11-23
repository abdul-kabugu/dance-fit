'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type TicketSummary = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  isEarlyBird?: boolean | null;
};

interface TicketPurchasePanelProps {
  ticketTypes: TicketSummary[];
  minimumPrice: number | null;
  checkoutPath: string;
  salesStartLabel: string;
}

export function TicketPurchasePanel({
  ticketTypes,
  minimumPrice,
  checkoutPath,
  salesStartLabel,
}: TicketPurchasePanelProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    ticketTypes[0]?.id ?? null,
  );

  const checkoutHref = useMemo(() => {
    if (!selectedTicketId) return checkoutPath;
    return `${checkoutPath}?ticket=${encodeURIComponent(selectedTicketId)}`;
  }, [checkoutPath, selectedTicketId]);

  const formattedMinimum =
    minimumPrice && minimumPrice > 0 ? `$${minimumPrice.toFixed(2)}` : 'Free';

  const hasTickets = ticketTypes.length > 0;

  return (
    <>
      <Card>
        <CardContent className="space-y-6 p-6">
          <div>
            <p className="text-muted-foreground text-sm">Starting from</p>
            <p className="text-primary text-3xl font-bold">
              {formattedMinimum}
            </p>
          </div>

          <Separator />

          {hasTickets ? (
            <div className="space-y-3">
              <h3 className="font-semibold">Available Tickets</h3>
              {ticketTypes.map((ticket) => {
                const selected = selectedTicketId === ticket.id;
                return (
                  <>
                    <div
                      key={ticket.id}
                      className={cn(
                        'border-border bg-muted/30 space-y-1 rounded-lg border p-3',
                        selected && 'border-primary ring-primary ring-1',
                      )}
                      onClick={() => setSelectedTicketId(ticket.id)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{ticket.name}</p>
                        <p className="text-sm font-semibold">
                          {ticket.priceCents === 0
                            ? 'Free'
                            : `$${(ticket.priceCents / 100).toFixed(2)}`}
                        </p>
                      </div>
                      {ticket.description && (
                        <p className="text-muted-foreground text-xs">
                          {ticket.description}
                        </p>
                      )}
                      {ticket.isEarlyBird && (
                        <Badge variant="secondary" className="text-xs">
                          Early Bird
                        </Badge>
                      )}
                    </div>
                  </>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Ticket types will be announced soon.
            </p>
          )}

          <Button size="lg" className="w-full" asChild disabled={!hasTickets}>
            <Link href={checkoutHref}>Get Tickets</Link>
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            Sales start {salesStartLabel || 'soon'}
          </p>
        </CardContent>
      </Card>

      <div className="border-border bg-background fixed right-0 bottom-0 left-0 z-20 border-t p-4 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs">From</p>
            <p className="text-primary text-xl font-bold">{formattedMinimum}</p>
          </div>
          <Button size="lg" className="flex-1" asChild disabled={!hasTickets}>
            <Link href={checkoutHref}>Get Tickets</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
