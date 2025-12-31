'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Pencil, Save, Loader2, UserCheck } from 'lucide-react';

interface SettingsFormProps {
  profile: {
    id: string;
    name: string | null;
    department: string | null;
    year_of_study: number | null;
    language: string | null;
    role: string | null;
    user_category: string | null;
  } | null;
  userId: string;
}

export function SettingsForm({ profile, userId }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const [name, setName] = useState(profile?.name || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [yearOfStudy, setYearOfStudy] = useState(profile?.year_of_study?.toString() || '');
  const [language, setLanguage] = useState(profile?.language || 'en');
  const [userCategory, setUserCategory] = useState(profile?.user_category || 'learner');

  const handleSave = () => {
    startTransition(async () => {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            name: name.trim() || null,
            department: department.trim() || null,
            year_of_study: yearOfStudy && yearOfStudy.trim() !== '' ? parseInt(yearOfStudy, 10) : null,
            language,
            user_category: userCategory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) throw error;

        toast.success('Profile updated successfully!');
        router.refresh();
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: unknown }).message)
            : JSON.stringify(error);
        console.error('Error updating profile:', errorMessage, error);
        toast.error(`Failed to update profile: ${errorMessage}`);
      }
    });
  };

  return (
    <Card className="glass-card border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-stone-100">
          <Pencil className="w-5 h-5 text-amber-400" />
          Edit Profile
        </CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-stone-300">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department" className="text-stone-300">Department</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Computer Science"
              className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year" className="text-stone-300">Year of Study</Label>
            <Select value={yearOfStudy} onValueChange={setYearOfStudy}>
              <SelectTrigger className="bg-stone-800/50 border-stone-700">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Year 1</SelectItem>
                <SelectItem value="2">Year 2</SelectItem>
                <SelectItem value="3">Year 3</SelectItem>
                <SelectItem value="4">Year 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language" className="text-stone-300">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-stone-800/50 border-stone-700">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* User Category - Identity (Learner vs Senior Learner) */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <Label className="text-stone-200 font-medium">
                  Category
                </Label>
                <p className="text-sm text-stone-400 mt-1">
                  This is your identity in the system - are you a student (Learner) or faculty/staff (Senior Learner)?
                </p>
              </div>
              <Select value={userCategory} onValueChange={setUserCategory}>
                <SelectTrigger className="bg-stone-800/50 border-stone-700">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learner">Learner (Student)</SelectItem>
                  <SelectItem value="senior_learner">Senior Learner (Faculty/Staff)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isPending}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-stone-900"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
