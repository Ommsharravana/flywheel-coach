'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  ArrowRight,
  Check,
  X,
  Loader2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Institution {
  id: string;
  name: string;
  short_name: string;
  type: 'college' | 'school' | 'external';
  slug: string;
}

interface PendingRequest {
  id: string;
  to_institution: string;
  status: 'pending';
  created_at: string;
}

interface InstitutionChangeRequestProps {
  userId: string;
  currentInstitution: Institution | null;
}

export function InstitutionChangeRequest({
  userId,
  currentInstitution,
}: InstitutionChangeRequestProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch all institutions
      const institutionsRes = await fetch('/api/institutions');
      if (institutionsRes.ok) {
        const data = await institutionsRes.json();
        setInstitutions(data.filter((i: Institution) => i.id !== currentInstitution?.id));
      }

      // Check for pending request
      const requestRes = await fetch('/api/institution-change-requests/my-request');
      if (requestRes.ok) {
        const data = await requestRes.json();
        if (data && data.status === 'pending') {
          setPendingRequest(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedInstitution) {
      toast.error('Please select an institution');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/institution-change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_institution_id: selectedInstitution,
          reason: reason.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Change request submitted successfully');
        setShowModal(false);
        setSelectedInstitution(null);
        setReason('');
        // Refetch to show pending status
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (err) {
      console.error('Failed to submit:', err);
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <Building2 className="w-5 h-5 text-blue-400" />
            Institution
          </CardTitle>
          <CardDescription>Your educational institution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Institution */}
          <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
            <Label className="text-stone-400 text-xs uppercase tracking-wider">
              Current Institution
            </Label>
            <div className="mt-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-stone-100">
                  {currentInstitution?.short_name || 'Not Set'}
                </div>
                <div className="text-sm text-stone-500">
                  {currentInstitution?.name || 'Please select your institution'}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Request Status */}
          {pendingRequest && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-400 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-400">
                    Change Request Pending
                  </div>
                  <div className="text-sm text-stone-400 mt-1">
                    Your request to change to{' '}
                    <span className="text-stone-200">{pendingRequest.to_institution}</span>
                    {' '}is awaiting admin approval.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Request Change Button */}
          {!pendingRequest && currentInstitution && (
            <Button
              onClick={() => setShowModal(true)}
              variant="outline"
              className="w-full border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Request Institution Change
            </Button>
          )}

          {!currentInstitution && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400 mt-0.5" />
                <div>
                  <div className="font-medium text-rose-400">
                    No Institution Selected
                  </div>
                  <div className="text-sm text-stone-400 mt-1">
                    Please contact an administrator to set your institution.
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-stone-700 bg-stone-900 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-stone-800">
              <h2 className="font-display text-xl font-bold text-stone-100">
                Request Institution Change
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current → New */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                <div className="flex-1">
                  <Label className="text-xs text-stone-500">From</Label>
                  <div className="text-stone-300 font-medium">
                    {currentInstitution?.short_name}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-amber-400" />
                <div className="flex-1">
                  <Label className="text-xs text-stone-500">To</Label>
                  <div className="text-amber-400 font-medium">
                    {selectedInstitution
                      ? institutions.find(i => i.id === selectedInstitution)?.short_name
                      : 'Select...'}
                  </div>
                </div>
              </div>

              {/* Institution Selection */}
              <div>
                <Label className="text-stone-300 mb-2 block">
                  Select New Institution
                </Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {institutions.map((inst) => (
                    <button
                      key={inst.id}
                      onClick={() => setSelectedInstitution(inst.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        selectedInstitution === inst.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-600'
                      }`}
                    >
                      <Building2 className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{inst.short_name}</div>
                        <div className="text-xs text-stone-500 truncate">{inst.name}</div>
                      </div>
                      {selectedInstitution === inst.id && (
                        <Check className="h-5 w-5 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label className="text-stone-300 mb-2 block">
                  Reason for Change <span className="text-stone-500">(optional)</span>
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., I was assigned to the wrong institution during registration..."
                  className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-600"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border-stone-700 text-stone-300 hover:bg-stone-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedInstitution || submitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-900"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
