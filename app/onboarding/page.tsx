'use client';

import { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Loader2, Music, Ticket, Upload, Users } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { uploadToBlob } from '@/lib/upload';

type OnboardingRole = 'organizer' | 'artist' | 'attendee' | null;

const ONBOARDING_ROLE_STORAGE_KEY = 'dancefit.selectedRole';

const persistRoleSelection = (role: OnboardingRole) => {
  if (typeof window === 'undefined') return;
  if (role) {
    window.localStorage.setItem(ONBOARDING_ROLE_STORAGE_KEY, role);
  } else {
    window.localStorage.removeItem(ONBOARDING_ROLE_STORAGE_KEY);
  }
};

const socialFields = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'website', label: 'Website' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<OnboardingRole>(null);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
    walletAddress: '',
  });
  const [organizerProfile, setOrganizerProfile] = useState({
    studioName: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    facebook: '',
    whatsapp: '',
    website: '',
    walletAddress: '',
  });
  const [artistProfile, setArtistProfile] = useState({
    instagram: '',
    tiktok: '',
    youtube: '',
    facebook: '',
    whatsapp: '',
    website: '',
    walletAddress: '',
    danceStyles: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/onboarding', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to load profile');
        }
        const data = await response.json();
        if (data.user) {
          setProfileData((prev) => ({
            ...prev,
            name: data.user.name ?? '',
            bio: data.user.bio ?? '',
            avatarUrl: data.user.avatarUrl ?? '',
          }));
          setHasCompletedProfile(Boolean(data.user.onboardingCompleted));
          if (data.user.role && data.user.onboardingCompleted) {
            setSelectedRole(data.user.role.toLowerCase() as OnboardingRole);
          }
          if (data.user.organizer) {
            setOrganizerProfile({
              studioName: data.user.organizer.studioName ?? '',
              instagram: data.user.organizer.instagram ?? '',
              tiktok: data.user.organizer.tiktok ?? '',
              youtube: data.user.organizer.youtube ?? '',
              facebook: data.user.organizer.facebook ?? '',
              whatsapp: data.user.organizer.whatsapp ?? '',
              website: data.user.organizer.website ?? '',
              walletAddress: data.user.organizer.walletAddress ?? '',
            });
          }
          if (data.user.artist) {
            setArtistProfile({
              instagram: data.user.artist.instagram ?? '',
              tiktok: data.user.artist.tiktok ?? '',
              youtube: data.user.artist.youtube ?? '',
              facebook: data.user.artist.facebook ?? '',
              whatsapp: data.user.artist.whatsapp ?? '',
              website: data.user.artist.website ?? '',
              walletAddress: data.user.artist.walletAddress ?? '',
              danceStyles: (data.user.artist.danceStyles ?? []).join(', '),
            });
          }
        }
      } catch (error) {
        console.error(error);
        persistRoleSelection(null);
        toast({
          title: 'Failed to load profile',
          description: 'Please refresh and try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [toast]);

  useEffect(() => {
    if (hasCompletedProfile || typeof window === 'undefined') return;
    if (selectedRole) return;
    const roleParam = (searchParams.get('role') ?? '').toLowerCase();
    if (
      roleParam === 'organizer' ||
      roleParam === 'artist' ||
      roleParam === 'attendee'
    ) {
      const nextRole = roleParam as OnboardingRole;
      persistRoleSelection(nextRole);
      setSelectedRole(nextRole);
      return;
    }
    const storedRole = window.localStorage.getItem(
      ONBOARDING_ROLE_STORAGE_KEY,
    ) as OnboardingRole | null;
    if (
      storedRole === 'organizer' ||
      storedRole === 'artist' ||
      storedRole === 'attendee'
    ) {
      setSelectedRole(storedRole);
    }
  }, [hasCompletedProfile, searchParams, selectedRole]);

  const handleSkip = () => {
    persistRoleSelection(null);
    router.push('/dashboard');
  };

  const handleRoleSelect = (role: OnboardingRole) => {
    setSelectedRole(role);
    persistRoleSelection(role);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadToBlob(file, `avatar-${file.name}`);
      setProfileData((prev) => ({ ...prev, avatarUrl: url }));
      toast({
        title: 'Uploaded!',
        description: 'Your profile image has been uploaded.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Upload failed',
        description: 'Please try again with a smaller file.',
        variant: 'destructive',
      });
    }
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRole) {
      toast({
        title: 'Select a role',
        description: 'Choose how you plan to use DanceFit.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        role: selectedRole,
        name: profileData.name,
        bio: profileData.bio,
        avatarUrl: profileData.avatarUrl,
      };

      if (selectedRole === 'organizer') {
        payload.organizer = {
          ...organizerProfile,
        };
      }

      if (selectedRole === 'artist') {
        payload.artist = {
          ...artistProfile,
          danceStyles: artistProfile.danceStyles
            .split(',')
            .map((style) => style.trim())
            .filter(Boolean),
        };
      }

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }

      toast({
        title: 'Profile created!',
        description: `Welcome to DanceFit as ${selectedRole}!`,
      });
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to save profile',
        description: 'Please check the form and try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderSocialInputs = (
    values: Record<string, string>,
    onChange: (key: string, value: string) => void,
  ) => (
    <div className="grid gap-4 sm:grid-cols-2">
      {socialFields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={`${field.key}-url`}>{field.label}</Label>
          <Input
            id={`${field.key}-url`}
            placeholder={`https://${field.key}.com/username`}
            value={values[field.key as keyof typeof values] ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      ))}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="walletAddress">Wallet Address</Label>
        <Input
          id="walletAddress"
          placeholder="bitcoincash:..."
          value={values.walletAddress ?? ''}
          onChange={(e) => onChange('walletAddress', e.target.value)}
        />
      </div>
    </div>
  );

  const renderRoleForm = () => {
    if (!selectedRole) return null;

    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>
            {selectedRole === 'attendee'
              ? 'Complete your attendee profile'
              : `Complete your ${selectedRole} profile`}
          </CardTitle>
          <CardDescription>
            Tell us about yourself to personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={profileData.avatarUrl || '/placeholder.svg'}
                />
                <AvatarFallback className="bg-primary/10 text-2xl">
                  {profileData.name.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="picture" className="cursor-pointer">
                  <div className="text-primary flex items-center gap-2 text-sm hover:underline">
                    <Upload className="h-4 w-4" />
                    Upload profile picture
                  </div>
                </Label>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Your full name"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Share a few sentences about your dance journey"
                value={profileData.bio}
                onChange={(e) =>
                  setProfileData({ ...profileData, bio: e.target.value })
                }
              />
            </div>

            {selectedRole === 'organizer' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="studioName">Studio or Brand Name</Label>
                  <Input
                    id="studioName"
                    placeholder="DanceFit Collective"
                    value={organizerProfile.studioName}
                    onChange={(e) =>
                      setOrganizerProfile({
                        ...organizerProfile,
                        studioName: e.target.value,
                      })
                    }
                  />
                </div>
                {renderSocialInputs(organizerProfile, (key, value) =>
                  setOrganizerProfile((prev) => ({ ...prev, [key]: value })),
                )}
              </div>
            )}

            {selectedRole === 'artist' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="danceStyles">
                    Dance Styles (comma separated)
                  </Label>
                  <Input
                    id="danceStyles"
                    placeholder="Bachata, Salsa"
                    value={artistProfile.danceStyles}
                    onChange={(e) =>
                      setArtistProfile({
                        ...artistProfile,
                        danceStyles: e.target.value,
                      })
                    }
                  />
                </div>
                {renderSocialInputs(artistProfile, (key, value) =>
                  setArtistProfile((prev) => ({ ...prev, [key]: value })),
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Saving profile...' : 'Save profile'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSelectedRole(null);
                persistRoleSelection(null);
              }}
            >
              Choose a different role
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="from-background via-muted/20 to-background flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <div className="relative w-full max-w-4xl">
        {/* Skip button */}
        <div className="absolute top-0 right-0 -mt-4">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip
          </Button>
        </div>

        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-lg">
              <span className="text-primary-foreground text-2xl font-bold">
                D
              </span>
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-balance">
            Welcome to DanceFit
          </h1>
          <p className="text-muted-foreground text-lg">
            {selectedRole
              ? `Complete your ${selectedRole} profile`
              : 'Choose how you want to use DanceFit'}
          </p>
        </div>

        {!selectedRole ? (
          <div className="grid gap-4 md:grid-cols-3">
            {/* Organizer Card */}
            <Card
              className="hover:border-primary group cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
              onClick={() => handleRoleSelect('organizer')}
            >
              <CardHeader className="pb-4 text-center">
                <div className="bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors">
                  <Users className="text-primary h-8 w-8" />
                </div>
                <CardTitle className="text-xl">Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Create and manage dance events, sell tickets, and grow your
                  community
                </CardDescription>
              </CardContent>
            </Card>

            {/* Artist Card */}
            <Card
              className="hover:border-primary group cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
              onClick={() => handleRoleSelect('artist')}
            >
              <CardHeader className="pb-4 text-center">
                <div className="bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors">
                  <Music className="text-primary h-8 w-8" />
                </div>
                <CardTitle className="text-xl">Artist</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Showcase your talent, get featured at events, and connect with
                  organizers
                </CardDescription>
              </CardContent>
            </Card>

            {/* Attendee Card */}
            <Card
              className="hover:border-primary group cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
              onClick={() => handleRoleSelect('attendee')}
            >
              <CardHeader className="pb-4 text-center">
                <div className="bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors">
                  <Ticket className="text-primary h-8 w-8" />
                </div>
                <CardTitle className="text-xl">Attendee</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Discover events, buy tickets, and join the dance community
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        ) : (
          renderRoleForm()
        )}
      </div>
    </div>
  );
}
