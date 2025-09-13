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

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const supabase = createClient();

  const [username, setUsername] = useState('');
  const [role, setRole] = useState('buyer');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false); // ✅ modal state

  // Initialize local state from AuthContext user
  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata?.full_name || '');
      setRole(user.user_metadata?.role || 'buyer');
    }
  }, [user]);

  // Handle profile update
  const handleUpdate = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: username,
        role,
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
              </div>
              <DialogFooter>
                <Button onClick={handleUpdate} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
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
