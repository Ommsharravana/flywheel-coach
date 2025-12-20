'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileQuestion,
  Check,
  X,
  Loader2,
  Clock,
  ArrowRight,
  User,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ChangeRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  from_institution: string | null;
  to_institution: string;
  reason: string | null;
  created_at: string;
}

export default function AdminChangeRequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const response = await fetch('/api/institution-change-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      toast.error('Failed to load change requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(requestId: string, action: 'approve' | 'reject') {
    setProcessingId(requestId);
    try {
      const response = await fetch('/api/institution-change-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action }),
      });

      if (response.ok) {
        toast.success(action === 'approve' ? 'Request approved' : 'Request rejected');
        setRequests(requests.filter(r => r.id !== requestId));
      } else {
        const data = await response.json();
        toast.error(data.error || `Failed to ${action} request`);
      }
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
      toast.error('Something went wrong');
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-stone-100">
          Institution Change Requests
        </h1>
        <p className="text-stone-400">
          {requests.length} pending {requests.length === 1 ? 'request' : 'requests'}
        </p>
      </div>

      {requests.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-800 flex items-center justify-center">
              <FileQuestion className="h-8 w-8 text-stone-600" />
            </div>
            <h3 className="text-lg font-medium text-stone-300 mb-2">
              No Pending Requests
            </h3>
            <p className="text-stone-500 max-w-md mx-auto">
              When users request to change their institution, their requests will appear here for your review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* User info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center">
                        <User className="h-5 w-5 text-stone-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-100">
                          {request.user_name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-stone-500">{request.user_email}</p>
                      </div>
                    </div>

                    {/* Institution change */}
                    <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-stone-500" />
                        <span className="text-stone-300">
                          {request.from_institution || 'No Institution'}
                        </span>
                      </div>
                      <ArrowRight className="h-5 w-5 text-amber-400" />
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-amber-400" />
                        <span className="font-medium text-amber-400">
                          {request.to_institution}
                        </span>
                      </div>
                    </div>

                    {/* Reason */}
                    {request.reason && (
                      <div className="mb-4">
                        <p className="text-sm text-stone-500 mb-1">Reason:</p>
                        <p className="text-stone-300">{request.reason}</p>
                      </div>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Clock className="h-4 w-4" />
                      <span>
                        Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleAction(request.id, 'approve')}
                      disabled={processingId === request.id}
                      className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleAction(request.id, 'reject')}
                      disabled={processingId === request.id}
                      variant="outline"
                      className="gap-2 border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
