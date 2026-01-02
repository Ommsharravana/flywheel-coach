'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import {
  Loader2,
  Users,
  CheckCircle,
  Briefcase,
  GraduationCap,
  Building,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface Mentor {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  mentor_type: string;
  domains: string[];
  skills: string[];
  current_mentees: number;
  max_mentees: number;
}

interface MentorSelectionProps {
  applicationId: string;
  suggestedMentorIds: string[];
  onMentorSelected: () => void;
}

export function MentorSelection({
  applicationId,
  suggestedMentorIds,
  onMentorSelected,
}: MentorSelectionProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    loadMentors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedMentorIds]);

  const loadMentors = async () => {
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .in('id', suggestedMentorIds);

      if (error) throw error;
      setMentors(data || []);
    } catch (err) {
      console.error('Error loading mentors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMentor = async (mentorId: string) => {
    setSelecting(mentorId);
    try {
      const { error } = await supabase.rpc('select_mentor', {
        p_application_id: applicationId,
        p_mentor_id: mentorId,
      });

      if (error) throw error;

      toast.success('Mentor selected! Your incubation journey begins.');
      onMentorSelected();
    } catch (err) {
      console.error('Error selecting mentor:', err);
      toast.error('Failed to select mentor. Please try again.');
    } finally {
      setSelecting(null);
    }
  };

  const getMentorTypeIcon = (type: string) => {
    switch (type) {
      case 'senior_learner':
        return <GraduationCap className="h-4 w-4" />;
      case 'industry':
        return <Briefcase className="h-4 w-4" />;
      case 'nif_staff':
        return <Building className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getMentorTypeLabel = (type: string) => {
    switch (type) {
      case 'senior_learner':
        return 'Senior Learner';
      case 'industry':
        return 'Industry Expert';
      case 'nif_staff':
        return 'NIF Staff';
      default:
        return 'Mentor';
    }
  };

  if (loading) {
    return (
      <Card className="bg-stone-900/50 border-orange-500/30">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-stone-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading mentors...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-stone-900/50 border-orange-500/30">
      <CardHeader>
        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Choose Your Mentor
        </CardTitle>
        <p className="text-sm text-stone-400">
          The NIF team has suggested {mentors.length} mentors for you. Select one to begin your incubation journey.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {mentors.map((mentor) => (
          <Card
            key={mentor.id}
            className="bg-stone-800/50 border-stone-700 hover:border-orange-500/50 transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar className="h-16 w-16">
                  <AvatarImage src={mentor.avatar_url || ''} />
                  <AvatarFallback className="bg-orange-500/20 text-orange-400 text-lg">
                    {mentor.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-stone-100">{mentor.name}</h3>
                      {mentor.title && (
                        <p className="text-sm text-stone-400">{mentor.title}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs border-stone-600">
                      {getMentorTypeIcon(mentor.mentor_type)}
                      <span className="ml-1">{getMentorTypeLabel(mentor.mentor_type)}</span>
                    </Badge>
                  </div>

                  {mentor.bio && (
                    <p className="text-sm text-stone-400 line-clamp-2">{mentor.bio}</p>
                  )}

                  {/* Domains & Skills */}
                  <div className="flex flex-wrap gap-2">
                    {mentor.domains.slice(0, 3).map((domain) => (
                      <Badge key={domain} variant="outline" className="text-xs text-stone-400 border-stone-600">
                        {domain}
                      </Badge>
                    ))}
                    {mentor.skills.slice(0, 2).map((skill) => (
                      <Badge key={skill} className="text-xs bg-orange-500/20 text-orange-400">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={() => handleSelectMentor(mentor.id)}
                      disabled={selecting !== null}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {selecting === mentor.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Selecting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Select
                        </>
                      )}
                    </Button>

                    {mentor.linkedin_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(mentor.linkedin_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}

                    <span className="text-xs text-stone-500 ml-auto">
                      {mentor.current_mentees}/{mentor.max_mentees} mentees
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {mentors.length === 0 && (
          <div className="text-center py-8 text-stone-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No mentors available yet.</p>
            <p className="text-sm">Please wait for the NIF team to suggest mentors.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
