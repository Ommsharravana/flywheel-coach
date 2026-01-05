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
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createUserSchema, type CreateUserInput } from '@/lib/validations/user';

export default function NewUserPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'builder',
    },
  });

  const role = watch('role');

  const onSubmit = async (data: CreateUserInput) => {
    setError(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to create user');
      }

      const { user } = await response.json();
      router.push(`/admin/users/${user.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-100">
            Add New User
          </h1>
          <p className="text-stone-400">Create a new user account</p>
        </div>
      </div>

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
                  className={`bg-stone-800 border-stone-700 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-stone-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Enter password"
                  className={`bg-stone-800 border-stone-700 ${errors.password ? 'border-red-500' : ''}`}
                />
                {errors.password ? (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                ) : (
                  <p className="text-xs text-stone-500">Minimum 6 characters</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-stone-300">
                  Role
                </Label>
                <Select
                  value={role}
                  onValueChange={(value) => setValue('role', value as CreateUserInput['role'])}
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
                {errors.role && (
                  <p className="text-xs text-red-400">{errors.role.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="gap-2 bg-amber-500 hover:bg-amber-600 text-stone-900"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
