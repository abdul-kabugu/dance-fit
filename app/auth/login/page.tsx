'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useSignIn, useSignUp } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';

const ONBOARDING_ROLE_STORAGE_KEY = 'dancefit.selectedRole';

type FlowState = 'signIn' | 'signUp';

function getStoredRole() {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(ONBOARDING_ROLE_STORAGE_KEY);
  if (value === 'organizer' || value === 'artist' || value === 'attendee') {
    return value;
  }
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    isLoaded: isSignInLoaded,
    signIn,
    setActive: setSignInActive,
  } = useSignIn();
  const {
    isLoaded: isSignUpLoaded,
    signUp,
    setActive: setSignUpActive,
  } = useSignUp();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [flow, setFlow] = useState<FlowState>('signIn');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!isSignInLoaded) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      await signIn.create({
        identifier: email,
        strategy: 'email_code',
      });
      setFlow('signIn');
      setStep('otp');
      toast({
        title: 'Code sent!',
        description: `We've sent a verification code to ${email}`,
      });
    } catch (error) {
      const identifierMissing =
        typeof error === 'object' &&
        error !== null &&
        Array.isArray((error as { errors?: { code?: string }[] }).errors) &&
        (error as { errors: { code?: string }[] }).errors.some(
          (issue) => issue.code === 'form_identifier_not_found',
        );

      if (identifierMissing) {
        if (!isSignUpLoaded) {
          setErrorMessage('Sign-up module is still loading. Please try again.');
        } else {
          await signUp.create({ emailAddress: email });
          await signUp.prepareEmailAddressVerification({
            strategy: 'email_code',
          });
          setFlow('signUp');
          setStep('otp');
          toast({
            title: 'Code sent!',
            description: `We created a new account and emailed a code to ${email}.`,
          });
        }
      } else {
        console.error('[Login] Failed to start email auth flow', error);
        setErrorMessage('Unable to send the verification code.');
        toast({
          title: 'OTP failed',
          description: 'Please double-check the email and try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const syncUserAndRedirect = async (sessionId?: string) => {
    const body = sessionId ? JSON.stringify({ sessionId }) : undefined;
    const headers = body ? { 'Content-Type': 'application/json' } : undefined;
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      cache: 'no-store',
      headers,
      credentials: 'same-origin',
      body,
    });

    if (!response.ok) {
      throw new Error('Unable to sync user with database.');
    }

    const data = await response.json();

    if (!data.hasProfile) {
      const savedRole = getStoredRole();
      const target = savedRole
        ? `/onboarding?role=${savedRole}`
        : '/onboarding';
      router.push(target);
      return;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ONBOARDING_ROLE_STORAGE_KEY);
    }

    if (data.profileType === 'organizer') {
      router.push('/dashboard');
    } else {
      router.push('/events');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.replace(/\D/g, '');
    if (code.length < 6) return;
    if (
      (flow === 'signIn' && (!isSignInLoaded || !signIn)) ||
      (flow === 'signUp' && (!isSignUpLoaded || !signUp))
    ) {
      console.error('[Login] Auth modules not ready for OTP verification', {
        flow,
        isSignInLoaded,
        isSignUpLoaded,
        hasSignInInstance: Boolean(signIn),
        hasSignUpInstance: Boolean(signUp),
      });
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (flow === 'signIn') {
        if (!signIn) return;
        let result = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code,
        });
        if (result.status !== 'complete') {
          result = await result.reload();
        }
        if (result.status === 'complete' && result.createdSessionId) {
          await setSignInActive({ session: result.createdSessionId });
          await syncUserAndRedirect(result.createdSessionId);
          return;
        }
        console.error('[Login] Sign-in OTP did not complete', {
          status: result.status,
          createdSessionId: result.createdSessionId,
          firstFactorStatus: result.firstFactorVerification?.status,
          secondFactorStatus: result.secondFactorVerification?.status,
        });
      } else {
        if (!signUp) return;
        let result = await signUp.attemptEmailAddressVerification({
          code,
        });
        if (result.status !== 'complete') {
          result = await result.reload();
        }
        if (result.status === 'complete' && result.createdSessionId) {
          await setSignUpActive({ session: result.createdSessionId });
          await syncUserAndRedirect(result.createdSessionId);
          return;
        }
        console.error('[Login] Sign-up OTP did not complete', {
          status: result.status,
          createdSessionId: result.createdSessionId,
          requiredFields: result.requiredFields,
        });
      }

      setErrorMessage('Verification failed. Please request a new code.');
    } catch (error) {
      console.error('[Login] OTP verification error', {
        flow,
        error,
      });
      setErrorMessage('Invalid or expired code.');
      toast({
        title: 'Verification failed',
        description: 'The code was incorrect or expired.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canUseOtp = step === 'otp' && !isLoading && otp.length === 6;

  return (
    <div className="from-background via-muted/20 to-background flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
        style={{
          backgroundImage:
            "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/e-brite-5-6f19pgjhsvsuC3M8Lw0JDQ5j27g7wn.png')",
        }}
      />

      <Card className="border-border/50 bg-card/95 relative z-10 w-full max-w-md shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
              <span className="text-primary-foreground text-xl font-bold">
                D
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-balance">
            {step === 'email' ? 'Welcome!' : 'Enter verification code'}
          </CardTitle>
          <CardDescription className="text-base">
            {step === 'email'
              ? "What's your email?"
              : `We sent a code to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                  disabled={isLoading}
                />
              </div>
              {errorMessage && (
                <p className="text-destructive text-sm">{errorMessage}</p>
              )}
              <Button
                type="submit"
                className="h-12 w-full text-base font-medium"
                disabled={isLoading || !email}
              >
                {isLoading ? 'Sending code...' : 'Continue'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                }}
                className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2 text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Change email
              </button>
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  maxLength={6}
                  className="h-12 text-center font-mono text-2xl tracking-widest"
                  disabled={isLoading}
                />
              </div>
              {errorMessage && (
                <p className="text-destructive text-sm">{errorMessage}</p>
              )}
              <Button
                type="submit"
                className="h-12 w-full text-base font-medium"
                disabled={!canUseOtp}
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => handleEmailSubmit()}
                disabled={isLoading}
              >
                Resend code
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
