'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { updateUserSchema, type UpdateUserInput } from '@/lib/validations/user';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'builder' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin';
  user_category?: 'learner' | 'senior_learner';
  avatar_url: string | null;
}

interface UserEditFormProps {
  user: User;
}

export function UserEditForm({ user }: UserEditFormProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email,
      role: user.role,
      user_category: user.user_category || 'learner',
    },
  });

  const role = watch('role');
  const userCategory = watch('user_category');

  const onSubmit = async (data: UpdateUserInput) => {
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update user');
      }

      router.push(`/admin/users/${user.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      router.push('/admin/users');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  const isSuperadmin = user.role === 'superadmin';

  return (
    <div className="max-w-2xl">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-stone-300">
                Name
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter user name"
                className={`bg-stone-800 border-stone-700 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-stone-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter email address"
                className="bg-stone-800 border-stone-700"
                disabled
              />
              <p className="text-xs text-stone-500">
                Email cannot be changed after account creation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_category" className="text-stone-300">
                Category (Who they are)
              </Label>
              <Select
                value={userCategory}
                onValueChange={(value) => setValue('user_category', value as UpdateUserInput['user_category'])}
                disabled={isSuperadmin}
              >
                <SelectTrigger className={`bg-stone-800 border-stone-700 ${errors.user_category ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learner">Learner (Student)</SelectItem>
                  <SelectItem value="senior_learner">Senior Learner (Faculty/Staff)</SelectItem>
                </SelectContent>
              </Select>
              {errors.user_category ? (
                <p className="text-xs text-red-400">{errors.user_category.message}</p>
              ) : (
                <p className="text-xs text-stone-500">
                  This determines if they appear in Senior Learner searches for team formation
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-stone-300">
                Role (What they can do)
              </Label>
              <Select
                value={role}
                onValueChange={(value) => setValue('role', value as UpdateUserInput['role'])}
                disabled={isSuperadmin}
              >
                <SelectTrigger className={`bg-stone-800 border-stone-700 ${errors.role ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="builder">Builder (Default)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="event_admin">Event Admin</SelectItem>
                  <SelectItem value="institution_admin">Institution Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role ? (
                <p className="text-xs text-red-400">{errors.role.message}</p>
              ) : isSuperadmin ? (
                <p className="text-xs text-amber-400">
                  Super admin role cannot be changed
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between pt-4">
              {!isSuperadmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 text-red-400 border-red-500/30 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete User
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this user? This action cannot
                        be undone. All of their cycles and data will be permanently
                        removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-500 hover:bg-red-600"
                        disabled={deleting}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete User'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {isSuperadmin && <div />}

              <Button
                type="submit"
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-stone-900"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
