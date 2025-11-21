'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface AddTicketsStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onBack: () => void;
  onNext: () => void;
}

export function AddTicketsStep({
  data,
  onUpdate,
  onBack,
  onNext,
}: AddTicketsStepProps) {
  const addTicket = () => {
    const newTicket = {
      id: Date.now().toString(),
      name: '',
      price: '',
      quantity: '',
      salesStart: '',
      salesEnd: '',
      earlyBird: false,
      earlyBirdPrice: '',
      description: '',
      displayOnPage: true,
      bchDiscount: false,
    };
    onUpdate({ ...data, tickets: [...data.tickets, newTicket] });
  };

  const removeTicket = (id: string) => {
    onUpdate({
      ...data,
      tickets: data.tickets.filter((t: any) => t.id !== id),
    });
  };

  const updateTicket = (id: string, updates: any) => {
    onUpdate({
      ...data,
      tickets: data.tickets.map((t: any) =>
        t.id === id ? { ...t, ...updates } : t,
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Tickets</h1>
        <p className="text-muted-foreground mt-1">
          Create ticket types for your event
        </p>
      </div>

      {data.tickets.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4 text-center">
              No tickets added yet. Add your first ticket type to get started.
            </p>
            <Button onClick={addTicket}>
              <Plus className="mr-2" />
              Add Ticket Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.tickets.map((ticket: any) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Ticket Type</CardTitle>
                    <CardDescription>
                      Configure ticket details and pricing
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeTicket(ticket.id)}
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${ticket.id}`}>Ticket Name *</Label>
                    <Input
                      id={`name-${ticket.id}`}
                      placeholder="e.g. General Admission, VIP Pass"
                      value={ticket.name}
                      onChange={(e) =>
                        updateTicket(ticket.id, { name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`price-${ticket.id}`}>Price (USD) *</Label>
                    <Input
                      id={`price-${ticket.id}`}
                      type="number"
                      placeholder="0.00"
                      value={ticket.price}
                      onChange={(e) =>
                        updateTicket(ticket.id, { price: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`quantity-${ticket.id}`}>
                      Quantity Available *
                    </Label>
                    <Input
                      id={`quantity-${ticket.id}`}
                      type="number"
                      placeholder="100"
                      value={ticket.quantity}
                      onChange={(e) =>
                        updateTicket(ticket.id, { quantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`salesStart-${ticket.id}`}>
                      Sales Start Date
                    </Label>
                    <Input
                      id={`salesStart-${ticket.id}`}
                      type="date"
                      value={ticket.salesStart}
                      onChange={(e) =>
                        updateTicket(ticket.id, { salesStart: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`salesEnd-${ticket.id}`}>
                    Sales End Date
                  </Label>
                  <Input
                    id={`salesEnd-${ticket.id}`}
                    type="date"
                    value={ticket.salesEnd}
                    onChange={(e) =>
                      updateTicket(ticket.id, { salesEnd: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`description-${ticket.id}`}>
                    Description (Optional)
                  </Label>
                  <Textarea
                    id={`description-${ticket.id}`}
                    placeholder="Add details about what's included with this ticket..."
                    value={ticket.description}
                    onChange={(e) =>
                      updateTicket(ticket.id, { description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={`earlyBird-${ticket.id}`}>
                        Early Bird Pricing
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        Offer a discounted price for early purchases
                      </p>
                    </div>
                    <Switch
                      id={`earlyBird-${ticket.id}`}
                      checked={ticket.earlyBird}
                      onCheckedChange={(checked) =>
                        updateTicket(ticket.id, { earlyBird: checked })
                      }
                    />
                  </div>

                  {ticket.earlyBird && (
                    <div className="space-y-2">
                      <Label htmlFor={`earlyBirdPrice-${ticket.id}`}>
                        Early Bird Price (USD)
                      </Label>
                      <Input
                        id={`earlyBirdPrice-${ticket.id}`}
                        type="number"
                        placeholder="0.00"
                        value={ticket.earlyBirdPrice}
                        onChange={(e) =>
                          updateTicket(ticket.id, {
                            earlyBirdPrice: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={`displayOnPage-${ticket.id}`}>
                        Display on event page
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        Show this ticket on the public event page
                      </p>
                    </div>
                    <Switch
                      id={`displayOnPage-${ticket.id}`}
                      checked={ticket.displayOnPage}
                      onCheckedChange={(checked) =>
                        updateTicket(ticket.id, { displayOnPage: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={`bchDiscount-${ticket.id}`}>
                        BCH Discount Available
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        Accept Bitcoin Cash with a discount
                      </p>
                    </div>
                    <Switch
                      id={`bchDiscount-${ticket.id}`}
                      checked={ticket.bchDiscount}
                      onCheckedChange={(checked) =>
                        updateTicket(ticket.id, { bchDiscount: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addTicket} className="w-full">
            <Plus className="mr-2" />
            Add Another Ticket Type
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back to Event Details
        </Button>
        <Button onClick={onNext} size="lg">
          Next: Review & Publish
        </Button>
      </div>
    </div>
  );
}
