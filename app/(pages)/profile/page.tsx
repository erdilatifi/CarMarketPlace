"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

// --- Phone helpers (simple E.164-style checks) ---
function normalizePhone(input: string): string {
  // Remove spaces, dashes, parentheses
  const trimmed = input.replace(/[\s\-()]/g, '');
  if (trimmed.startsWith('00')) return '+' + trimmed.slice(2);
  return trimmed;
}

function isValidE164(phone: string): boolean {
  // + followed by 8 to 15 digits
  return /^\+[0-9]{8,15}$/.test(phone);
}

function isPotentialE164(phone: string): boolean {
  // Allow partial typing: starts with + and up to 15 digits
  return /^\+[0-9]{0,15}$/.test(phone) || phone === '';
}

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const supabase = createClient();

  const [username, setUsername] = useState('');
  const [role, setRole] = useState('buyer');
  // Full E.164 formatted phone as stored/saved
  const [sellerPhone, setSellerPhone] = useState('');
  // Country dial code and subscriber number (digits only, without leading 0)
  const [dialCode, setDialCode] = useState<string>('+1');
  const [subscriber, setSubscriber] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [open, setOpen] = useState(false); // ✅ modal state

  const COUNTRIES: { label: string; code: string }[] = [
    { label: 'United States (+1)', code: '+1' },
    { label: 'United Kingdom (+44)', code: '+44' },
    { label: 'Germany (+49)', code: '+49' },
    { label: 'France (+33)', code: '+33' },
    { label: 'Italy (+39)', code: '+39' },
    { label: 'Spain (+34)', code: '+34' },
    { label: 'Netherlands (+31)', code: '+31' },
    { label: 'Albania (+355)', code: '+355' },
    { label: 'Kosovo (+383)', code: '+383' },
  ];

  function parseE164ToParts(e164: string) {
    const normalized = normalizePhone(e164);
    if (!normalized.startsWith('+')) return;
    // Try to match one of our dial codes at the start
    const codes = COUNTRIES.map(c => c.code).sort((a,b) => b.length - a.length); // longest first
    const match = codes.find(c => normalized.startsWith(c));
    if (match) {
      setDialCode(match);
      const rest = normalized.slice(match.length);
      setSubscriber(rest);
    }
  }

  function buildE164(code: string, sub: string): string {
    const subDigits = (sub || '').replace(/\D/g, '');
    // remove a single leading 0 (domestic trunk prefix)
    const trimmed = subDigits.replace(/^0/, '');
    return `${code}${trimmed}`;
  }

  // Initialize local state from AuthContext user
  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata?.full_name || '');
      setRole(user.user_metadata?.role || 'buyer');
      const existing = user.user_metadata?.seller_phone || '';
      setSellerPhone(existing);
      if (existing) parseE164ToParts(existing);
    }
  }, [user]);

  // Handle profile update
  const handleUpdate = async () => {
    // Only validate/update phone if the user actually provided/changed it.
    // If subscriber is empty and there is no previously saved phone, omit seller_phone from update.
    let updatePayload: Record<string, any> = {
      full_name: username,
      role,
    };

    const hadExistingPhone = Boolean(user?.user_metadata?.seller_phone);
    const userProvidedSubscriber = (subscriber || '').trim().length > 0;

    if (userProvidedSubscriber) {
      const combined = buildE164(dialCode, subscriber);
      if (!isValidE164(combined)) {
        setPhoneError('Please enter a valid phone (E.164), e.g., +38345123456');
        return;
      }
      updatePayload.seller_phone = combined;
      setSellerPhone(combined);
      setPhoneError(null);
    } else if (hadExistingPhone) {
      // Keep existing phone by not sending a new value
    } else {
      // No phone on file and none provided now: do not include seller_phone in update
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: updatePayload,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile updated successfully!');
      setOpen(false);
    }
    setSaving(false);
  };

  const handleApplyPhoneToAllListings = async () => {
    if (!user) return;
    const combined = buildE164(dialCode, subscriber);
    if (!isValidE164(combined)) {
      setPhoneError('Please enter a valid phone (E.164), e.g., +38345123456');
      return;
    }
    setPhoneError(null);
    setBackfillLoading(true);
    try {
      const { error } = await supabase
        .from('cars')
        .update({ seller_phone: combined, updated_at: new Date().toISOString() })
        .eq('seller_id', user.id);
      if (error) throw error;
      toast.success('Updated phone on all your listings.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update listings.');
    } finally {
      setBackfillLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#121212] to-[#161616] ring-1 ring-white/5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_50px_-12px_rgba(0,0,0,0.7)] transition">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-sm md:text-base text-muted-foreground"><strong className="text-white/90">Email:</strong> {user?.email}</p>
            <p className="text-sm md:text-base text-muted-foreground"><strong className="text-white/90">Name:</strong> {user?.user_metadata?.full_name || 'No name set'}</p>
            <p className="text-sm md:text-base text-muted-foreground"><strong className="text-white/90">Role:</strong> {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Buyer'}</p>
            <div className="flex items-center gap-2">
              <p className="text-sm md:text-base text-muted-foreground"><strong className="text-white/90">Phone (WhatsApp):</strong> {sellerPhone || user?.user_metadata?.seller_phone || 'Not set'}</p>
              {(sellerPhone || user?.user_metadata?.seller_phone) && (
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    const v = sellerPhone || (user?.user_metadata?.seller_phone as string);
                    try {
                      await navigator.clipboard.writeText(v);
                      toast.success('Phone copied to clipboard');
                    } catch {
                      toast.error('Failed to copy');
                    }
                  }}
                >
                  Copy
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 p-4 bg-black/30">
            <p className="text-sm text-muted-foreground">Tip: You can edit any field below. Phone is optional.</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 w-full">Edit Profile</Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Username input */}
                  <div>
                    <Label htmlFor="username" className='mb-2'>Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  {/* Role selector */}
                  <div>
                    <Label htmlFor="role" className='mb-2'>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="seller">Seller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Phone number (optional) */}
                  <div>
                    <Label htmlFor="seller_phone" className='mb-2'>Phone (WhatsApp) — optional</Label>
                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
                      <Select value={dialCode} onValueChange={setDialCode}>
                        <SelectTrigger aria-label="Country dial code">
                          <SelectValue placeholder="Dial code" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(c => (
                            <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="seller_phone"
                        placeholder="subscriber number (e.g., 45123456)"
                        value={subscriber}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          setSubscriber(digits);
                          if (digits.trim() === '') { setPhoneError(null); return; }
                          const combined = buildE164(dialCode, digits);
                          if (!isPotentialE164(combined)) {
                            setPhoneError('Digits only. Total length (with country code) must be up to 15.');
                          } else {
                            setPhoneError(null);
                          }
                        }}
                        onBlur={() => {
                          if ((subscriber || '').trim() === '') return; // optional
                          const combined = buildE164(dialCode, subscriber);
                          setSellerPhone(combined);
                          if (!isValidE164(combined)) {
                            setPhoneError('Please enter a valid phone (E.164), e.g., +38345123456');
                          } else {
                            setPhoneError(null);
                          }
                        }}
                      />
                    </div>
                    <p className={`mt-1 text-xs ${phoneError ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {phoneError ?? `Saved format: ${sellerPhone || user?.user_metadata?.seller_phone || '(optional)'}`}
                    </p>
                  </div>
                </div>
                <DialogFooter className="flex gap-2">
                  <Button onClick={handleUpdate} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleApplyPhoneToAllListings}
                    disabled={backfillLoading}
                  >
                    {backfillLoading ? 'Updating…' : 'Apply to all my listings'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
