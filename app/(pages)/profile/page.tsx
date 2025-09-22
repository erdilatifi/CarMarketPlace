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
    // Build E.164 from dial code + subscriber
    const combined = buildE164(dialCode, subscriber);
    const valid = isValidE164(combined);
    if (!valid) {
      setPhoneError('Please enter a valid phone (E.164), e.g., +38345123456');
      return;
    }
    setSellerPhone(combined);
    setPhoneError(null);
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: username,
        role,
        seller_phone: combined,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile updated successfully!');
      setOpen(false); // ✅ close modal after success
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
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center  p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Name:</strong> {user?.user_metadata?.full_name || 'No name set'}</p>
          <p><strong>Role:</strong> {user?.user_metadata?.role || 'Not assigned'}</p>
          <div className="flex items-center gap-2">
            <p><strong>Phone (WhatsApp):</strong> {sellerPhone || user?.user_metadata?.seller_phone || 'Not set'}</p>
            {(sellerPhone || user?.user_metadata?.seller_phone) && (
              <Button
                type="button"
                variant="outline"
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

          {/* Modal trigger */}
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

                {/* Phone number (E.164 from Dial code + Subscriber) */}
                <div>
                  <Label htmlFor="seller_phone" className='mb-2'>Phone (WhatsApp)</Label>
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
                        // Only digits allowed for the subscriber part
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
                  <p className={`mt-1 text-xs ${phoneError ? 'text-red-600' : 'text-gray-500'}`}>
                    {phoneError ?? `Saved format: ${sellerPhone || '(will be +<code><number>)'}`}
                  </p>
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button onClick={handleUpdate} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyPhoneToAllListings}
                  disabled={backfillLoading}
                >
                  {backfillLoading ? 'Updating…' : 'Apply to all my listings'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
