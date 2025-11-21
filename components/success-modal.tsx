'use client';

import { useEffect, useState } from 'react';

import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  ctaLabel: string;
  ctaAction: () => void;
  showConfetti?: boolean;
}

export function SuccessModal({
  open,
  onOpenChange,
  title,
  description,
  ctaLabel,
  ctaAction,
  showConfetti = true,
}: SuccessModalProps) {
  const { toast } = useToast();
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  useEffect(() => {
    if (open && showConfetti && !confettiTriggered) {
      // Trigger confetti animation
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 100,
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      // Import confetti dynamically
      import('canvas-confetti').then((confetti) => {
        const interval = setInterval(function () {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            clearInterval(interval);
            return;
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti.default({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          });
          confetti.default({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          });
        }, 250);
      });

      setConfettiTriggered(true);
    }

    // Reset confetti trigger when modal closes
    if (!open) {
      setConfettiTriggered(false);
    }
  }, [open, showConfetti, confettiTriggered]);

  const handleCtaClick = () => {
    ctaAction();
    toast({
      title: 'Success',
      description: 'Link copied to clipboard',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleCtaClick}
            size="lg"
            className="w-full sm:w-auto"
          >
            {ctaLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
