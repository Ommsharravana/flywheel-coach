'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ExportButtonProps {
  type: 'users' | 'cycles' | 'activity';
  filters?: Record<string, string>;
}

export function ExportButton({ type, filters }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      // Build URL with filters
      const params = new URLSearchParams(filters || {});
      const url = `/api/admin/${type}/export${params.toString() ? `?${params}` : ''}`;

      const res = await fetch(url);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get blob and download
      const blob = await res.blob();
      const filename = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
        || `export-${type}-${new Date().toISOString().split('T')[0]}.csv`;

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleExport}
      disabled={loading}
    >
      <Download className="h-4 w-4" />
      {loading ? 'Exporting...' : 'Export'}
    </Button>
  );
}
