'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Printer,
  FileText,
  Grid,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface Track {
  id: string;
  name: string;
  submission_count: number;
}

interface BackupSheetsState {
  tracks: Track[];
  total_submissions: number;
  is_loading: boolean;
  error: string | null;
}

export default function BackupSheetsPage() {
  const [state, setState] = useState<BackupSheetsState>({
    tracks: [],
    total_submissions: 0,
    is_loading: true,
    error: null,
  });
  const [generating, setGenerating] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, is_loading: true, error: null }));
    try {
      const response = await fetch('/api/admin/demo-day');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const tracks = data.data.tracks.map((t: { id: string; name: string; total_submissions: number }) => ({
        id: t.id,
        name: t.name,
        submission_count: t.total_submissions,
      }));

      setState({
        tracks,
        total_submissions: data.data.total_submissions,
        is_loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setState(prev => ({
        ...prev,
        is_loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = (type: 'individual' | 'grid' | 'all', trackId?: string) => {
    const key = `${type}-${trackId || 'all'}`;
    setGenerating(key);

    let url = `/api/admin/demo-day/backup-sheets?type=${type}`;
    if (trackId) {
      url += `&track_id=${trackId}`;
    }

    // Open in new tab for print
    window.open(url, '_blank');

    setTimeout(() => setGenerating(null), 1000);
  };

  const handlePreview = (type: 'individual' | 'grid' | 'all', trackId?: string) => {
    let url = `/api/admin/demo-day/backup-sheets?type=${type}`;
    if (trackId) {
      url += `&track_id=${trackId}`;
    }
    setPreviewUrl(url);
  };

  if (state.is_loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-stone-400 mb-4">{state.error}</p>
          <Button onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/demo-day">
            <Button
              variant="ghost"
              size="sm"
              className="text-stone-400 hover:text-stone-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Command Center
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-display font-bold text-stone-100">
          Paper Backup Sheets
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="border-stone-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Warning Banner */}
      <div className="glass-card rounded-xl p-4 border border-amber-500/30 bg-amber-500/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-amber-500 font-medium">Emergency Backup System</h3>
            <p className="text-stone-400 text-sm mt-1">
              Print these sheets BEFORE Demo Day. If tech fails, judges can score manually.
              Digital scores from paper sheets must be entered manually after the event.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-3xl font-bold text-amber-400">{state.total_submissions}</div>
          <div className="text-sm text-stone-400 mt-1">Total Submissions</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-3xl font-bold text-amber-400">{state.tracks.length}</div>
          <div className="text-sm text-stone-400 mt-1">Tracks</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-3xl font-bold text-amber-400">
            {state.total_submissions + state.tracks.length}
          </div>
          <div className="text-sm text-stone-400 mt-1">Total Pages to Print</div>
        </div>
      </div>

      {/* Generate All Section */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-stone-100 mb-4 flex items-center gap-2">
          <Printer className="w-5 h-5 text-amber-500" />
          Generate All Sheets
        </h2>
        <p className="text-stone-400 text-sm mb-4">
          Generate complete backup package: individual score sheets for every submission + master grids for every track.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => handleGenerate('all')}
            disabled={generating !== null}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {generating === 'all-all' ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Generate Complete Package
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePreview('all')}
            className="border-stone-600"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {/* Individual Sheets Section */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-stone-100 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Individual Score Sheets
        </h2>
        <p className="text-stone-400 text-sm mb-4">
          One page per submission with all scoring criteria, bonus checkboxes, notes areas, and signature line.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => handleGenerate('individual')}
            disabled={generating !== null}
            variant="outline"
            className="border-stone-600"
          >
            {generating === 'individual-all' ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            All Individual Sheets ({state.total_submissions} pages)
          </Button>
        </div>
      </div>

      {/* Master Grids Section */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-stone-100 mb-4 flex items-center gap-2">
          <Grid className="w-5 h-5 text-green-500" />
          Master Summary Grids
        </h2>
        <p className="text-stone-400 text-sm mb-4">
          One page per track with all submissions in a compact table format for quick overview and verification.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => handleGenerate('grid')}
            disabled={generating !== null}
            variant="outline"
            className="border-stone-600"
          >
            {generating === 'grid-all' ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            All Master Grids ({state.tracks.length} pages)
          </Button>
        </div>
      </div>

      {/* Per-Track Section */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-stone-100 mb-4">
          Generate by Track
        </h2>
        <p className="text-stone-400 text-sm mb-4">
          Generate sheets for a specific track only. Useful for distributing to track-specific judges.
        </p>
        <div className="space-y-4">
          {state.tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between p-4 bg-stone-800/50 rounded-lg border border-stone-700"
            >
              <div>
                <h3 className="text-stone-100 font-medium">{track.name}</h3>
                <p className="text-stone-400 text-sm">
                  {track.submission_count} submissions
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleGenerate('individual', track.id)}
                  disabled={generating !== null}
                  variant="outline"
                  size="sm"
                  className="border-stone-600"
                >
                  {generating === `individual-${track.id}` ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Individual</span>
                </Button>
                <Button
                  onClick={() => handleGenerate('grid', track.id)}
                  disabled={generating !== null}
                  variant="outline"
                  size="sm"
                  className="border-stone-600"
                >
                  {generating === `grid-${track.id}` ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Grid className="w-4 h-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Grid</span>
                </Button>
                <Button
                  onClick={() => handleGenerate('all', track.id)}
                  disabled={generating !== null}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {generating === `all-${track.id}` ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Both</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Printing Tips */}
      <div className="glass-card rounded-xl p-6 bg-stone-800/30">
        <h2 className="text-lg font-semibold text-stone-100 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          Printing Checklist
        </h2>
        <ul className="space-y-2 text-stone-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">1.</span>
            <span>Use <strong className="text-stone-300">Chrome or Edge</strong> for best print quality</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">2.</span>
            <span>Set paper size to <strong className="text-stone-300">A4</strong> in print settings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">3.</span>
            <span>Enable <strong className="text-stone-300">Background Graphics</strong> for colors</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">4.</span>
            <span>Set margins to <strong className="text-stone-300">Default</strong> or <strong className="text-stone-300">Minimum</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">5.</span>
            <span>Print <strong className="text-stone-300">2 copies</strong> of each sheet (one for judge, one for backup)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">6.</span>
            <span>Sort sheets <strong className="text-stone-300">by track</strong> before distributing to judges</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">7.</span>
            <span>Keep master grids at <strong className="text-stone-300">admin desk</strong> for coordination</span>
          </li>
        </ul>
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-4xl h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 bg-stone-100 border-b">
              <h3 className="font-semibold text-stone-800">Preview</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(previewUrl, '_blank')}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button
                  onClick={() => setPreviewUrl(null)}
                  size="sm"
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
            <iframe
              src={previewUrl}
              className="w-full h-[calc(100%-64px)]"
              title="Backup Sheets Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
