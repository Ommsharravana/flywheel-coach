import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const APPATHON_EVENT_ID = '003089a3-8b28-4844-9714-b94f9b838462';

// Scoring criteria with weights
const SCORING_CRITERIA = [
  { name: 'Problem Impact', weight: '20%', description: 'Real problem affecting real users' },
  { name: 'Solution Innovation', weight: '20%', description: 'Creative and novel approach' },
  { name: 'Working Prototype', weight: '20%', description: 'Functional, demonstrable solution' },
  { name: 'User Validation', weight: '15%', description: 'Evidence of user testing/feedback' },
  { name: 'Presentation Quality', weight: '5%', description: 'Clear, engaging demo' },
  { name: 'Bioconvergence Alignment', weight: '5%', description: 'Aligns with JKKN vision' },
];

const BONUS_CRITERIA = [
  { name: 'Cross-Disciplinary Team', value: '+5%', description: 'Team spans multiple departments' },
  { name: 'Cross-Institutional Team', value: '+5%', description: 'Team spans multiple JKKN colleges' },
  { name: 'First-Year Participation', value: '+3%', description: 'Includes first-year learners' },
  { name: 'User Testimonials', value: '+2%', description: 'Real users vouching for solution' },
];

interface SubmissionData {
  id: string;
  submission_number: string;
  app_name: string;
  category: string;
  description: string | null;
  app_url: string | null;
  demo_slot: number | null;
  track_name: string;
  track_id: string;
  user_name: string | null;
  user_institution: string | null;
}

// GET: Generate backup sheets HTML
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify superadmin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc('get_current_user_role');
    if (userRole !== 'superadmin' && userRole !== 'event_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'individual'; // 'individual' | 'grid' | 'all'
    const trackId = searchParams.get('track_id');
    const submissionId = searchParams.get('submission_id');

    // Fetch all submissions with track info, filtered by event
    let query = supabase
      .from('submission_track_assignments')
      .select(`
        id,
        submission_id,
        demo_slot,
        track_id,
        judging_tracks!inner (
          id,
          name,
          theme,
          event_id
        ),
        appathon_submissions!inner (
          id,
          submission_number,
          app_name,
          category,
          description,
          app_url,
          user_id,
          users (
            id,
            name,
            institution
          )
        )
      `)
      .eq('judging_tracks.event_id', APPATHON_EVENT_ID)
      .order('demo_slot', { ascending: true, nullsFirst: false });

    if (trackId) {
      query = query.eq('track_id', trackId);
    }

    if (submissionId) {
      query = query.eq('submission_id', submissionId);
    }

    const { data: assignments, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    // Transform data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const submissions: SubmissionData[] = (assignments || []).map((a: any) => ({
      id: a.appathon_submissions.id,
      submission_number: a.appathon_submissions.submission_number,
      app_name: a.appathon_submissions.app_name,
      category: a.appathon_submissions.category || 'General',
      description: a.appathon_submissions.description,
      app_url: a.appathon_submissions.app_url,
      demo_slot: a.demo_slot,
      track_name: a.judging_tracks.name,
      track_id: a.track_id,
      user_name: a.appathon_submissions.users?.name || 'Unknown',
      user_institution: a.appathon_submissions.users?.institution || 'Unknown',
    }));

    // Get unique tracks
    const tracks = [...new Map(submissions.map(s => [s.track_id, { id: s.track_id, name: s.track_name }])).values()];

    let html = '';

    if (type === 'individual' || type === 'all') {
      html += generateIndividualSheets(submissions);
    }

    if (type === 'grid' || type === 'all') {
      if (type === 'all' && submissions.length > 0) {
        html += '<div class="page-break"></div>';
      }
      html += generateMasterGrids(submissions, tracks);
    }

    const fullHtml = wrapInHtmlDocument(html);

    return new NextResponse(fullHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="backup-sheets-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating backup sheets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateIndividualSheets(submissions: SubmissionData[]): string {
  return submissions.map((submission, index) => `
    <div class="score-sheet ${index > 0 ? 'page-break' : ''}">
      <!-- Header -->
      <div class="sheet-header">
        <div class="logo-area">
          <div class="jkkn-logo">JKKN</div>
          <div class="event-name">APPATHON 2.0</div>
        </div>
        <div class="submission-info">
          <div class="submission-number">${submission.submission_number}</div>
          <div class="app-name">${escapeHtml(submission.app_name)}</div>
          <div class="category">${escapeHtml(submission.category)}</div>
        </div>
        <div class="track-info">
          <div class="track-label">Track</div>
          <div class="track-name">${escapeHtml(submission.track_name)}</div>
          <div class="demo-slot">Demo Slot: ${submission.demo_slot || 'TBD'}</div>
        </div>
      </div>

      <!-- Builder Info -->
      <div class="builder-info">
        <span class="label">Builder:</span> ${escapeHtml(submission.user_name || 'Unknown')}
        <span class="separator">|</span>
        <span class="label">Institution:</span> ${escapeHtml(submission.user_institution || 'Unknown')}
      </div>

      <!-- QR Code Fallback -->
      <div class="qr-section">
        <div class="qr-placeholder">
          <div class="qr-label">Digital Scoring Fallback</div>
          <div class="qr-url">jkkn.app/judge/score/${submission.id.slice(0, 8)}</div>
        </div>
      </div>

      <!-- Scoring Section -->
      <div class="scoring-section">
        <h2>SCORING CRITERIA</h2>
        <p class="instructions">Circle one score for each criterion (1 = Poor, 10 = Excellent)</p>

        <table class="criteria-table">
          <thead>
            <tr>
              <th class="criterion-col">Criterion</th>
              <th class="weight-col">Weight</th>
              <th class="scores-col">Score (Circle One)</th>
            </tr>
          </thead>
          <tbody>
            ${SCORING_CRITERIA.map(criterion => `
              <tr>
                <td class="criterion-name">
                  <strong>${criterion.name}</strong>
                  <div class="criterion-desc">${criterion.description}</div>
                </td>
                <td class="criterion-weight">${criterion.weight}</td>
                <td class="score-circles">
                  ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n =>
                    `<span class="score-circle">${n}</span>`
                  ).join('')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Bonus Section -->
      <div class="bonus-section">
        <h2>BONUS CRITERIA</h2>
        <p class="instructions">Check all that apply</p>

        <div class="bonus-grid">
          ${BONUS_CRITERIA.map(bonus => `
            <div class="bonus-item">
              <div class="checkbox"></div>
              <div class="bonus-info">
                <strong>${bonus.name}</strong> (${bonus.value})
                <div class="bonus-desc">${bonus.description}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Notes Section -->
      <div class="notes-section">
        <div class="notes-row">
          <div class="notes-box">
            <h3>Strengths</h3>
            <div class="notes-lines">
              <div class="line"></div>
              <div class="line"></div>
              <div class="line"></div>
            </div>
          </div>
          <div class="notes-box">
            <h3>Areas for Improvement</h3>
            <div class="notes-lines">
              <div class="line"></div>
              <div class="line"></div>
              <div class="line"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Signature Section -->
      <div class="signature-section">
        <div class="signature-row">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Judge Name (Print)</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Signature</div>
          </div>
          <div class="signature-box time-box">
            <div class="signature-line"></div>
            <div class="signature-label">Time</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sheet-footer">
        <div class="footer-note">Emergency Backup Sheet - Demo Day Jan 3, 2026</div>
        <div class="footer-id">Sheet ID: ${submission.submission_number}-${submission.track_id.slice(0, 4)}</div>
      </div>
    </div>
  `).join('\n');
}

function generateMasterGrids(submissions: SubmissionData[], tracks: { id: string; name: string }[]): string {
  return tracks.map((track, trackIndex) => {
    const trackSubmissions = submissions
      .filter(s => s.track_id === track.id)
      .sort((a, b) => (a.demo_slot || 999) - (b.demo_slot || 999));

    return `
      <div class="master-grid ${trackIndex > 0 ? 'page-break' : ''}">
        <!-- Grid Header -->
        <div class="grid-header">
          <div class="grid-logo">
            <div class="jkkn-logo">JKKN</div>
            <div class="event-name">APPATHON 2.0</div>
          </div>
          <div class="grid-title">
            <h1>MASTER SCORING GRID</h1>
            <div class="track-name">${escapeHtml(track.name)}</div>
          </div>
          <div class="grid-meta">
            <div class="date">Date: ___________</div>
            <div class="judge-name">Judge: ___________</div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="grid-instructions">
          <strong>Quick Reference:</strong> PI = Problem Impact, SI = Solution Innovation, WP = Working Prototype,
          UV = User Validation, PQ = Presentation Quality, BA = Bioconvergence Alignment (all 1-10 scale)
        </div>

        <!-- Scoring Grid Table -->
        <table class="grid-table">
          <thead>
            <tr>
              <th class="slot-col">#</th>
              <th class="app-col">App Name</th>
              <th class="sub-col">Sub #</th>
              <th class="score-col">PI</th>
              <th class="score-col">SI</th>
              <th class="score-col">WP</th>
              <th class="score-col">UV</th>
              <th class="score-col">PQ</th>
              <th class="score-col">BA</th>
              <th class="bonus-col">Bonus</th>
              <th class="total-col">Total</th>
            </tr>
          </thead>
          <tbody>
            ${trackSubmissions.map(submission => `
              <tr>
                <td class="slot">${submission.demo_slot || '?'}</td>
                <td class="app-name">${escapeHtml(submission.app_name.substring(0, 25))}${submission.app_name.length > 25 ? '...' : ''}</td>
                <td class="sub-num">${submission.submission_number}</td>
                <td class="score-cell"></td>
                <td class="score-cell"></td>
                <td class="score-cell"></td>
                <td class="score-cell"></td>
                <td class="score-cell"></td>
                <td class="score-cell"></td>
                <td class="bonus-cell"></td>
                <td class="total-cell"></td>
              </tr>
            `).join('')}
            ${trackSubmissions.length < 12 ? Array(12 - trackSubmissions.length).fill(null).map((_, i) => `
              <tr class="empty-row">
                <td class="slot">${trackSubmissions.length + i + 1}</td>
                <td class="app-name"></td>
                <td class="sub-num"></td>
                <td class="score-cell"></td>
                <td class="score-cell"></td>
                <td class="score-cell"></td>
                <td class="score-cell"></td>
                <td class="score-cell"></td>
                <td class="score-cell"></td>
                <td class="bonus-cell"></td>
                <td class="total-cell"></td>
              </tr>
            `).join('') : ''}
          </tbody>
        </table>

        <!-- Bonus Legend -->
        <div class="bonus-legend">
          <strong>Bonus Codes:</strong>
          CD = Cross-Disciplinary (+5%) |
          CI = Cross-Institutional (+5%) |
          FY = First-Year (+3%) |
          UT = User Testimonials (+2%)
        </div>

        <!-- Summary Section -->
        <div class="grid-summary">
          <div class="summary-row">
            <div class="summary-box">
              <div class="summary-label">Total Apps Scored</div>
              <div class="summary-value"></div>
            </div>
            <div class="summary-box">
              <div class="summary-label">Top 3 Apps (for verification)</div>
              <div class="summary-lines">
                <div class="top-line">1. _________________ Score: _____</div>
                <div class="top-line">2. _________________ Score: _____</div>
                <div class="top-line">3. _________________ Score: _____</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Grid Footer -->
        <div class="grid-footer">
          <div class="footer-left">
            <div class="signature-line"></div>
            <div class="signature-label">Judge Signature</div>
          </div>
          <div class="footer-center">
            Emergency Backup Grid - Demo Day Jan 3, 2026
          </div>
          <div class="footer-right">
            Track: ${escapeHtml(track.name)} | ${trackSubmissions.length} submissions
          </div>
        </div>
      </div>
    `;
  }).join('\n');
}

function wrapInHtmlDocument(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appathon 2.0 - Backup Scoring Sheets</title>
  <style>
    /* Reset and Base */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
    }

    /* Print Styles */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .page-break {
        page-break-before: always;
      }

      .no-print {
        display: none !important;
      }
    }

    @page {
      size: A4;
      margin: 12mm;
    }

    /* Individual Score Sheet Styles */
    .score-sheet {
      max-width: 210mm;
      margin: 0 auto;
      padding: 8mm;
      background: #fff;
      border: 1px solid #ccc;
      margin-bottom: 20px;
    }

    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 10px;
      border-bottom: 3px solid #0b6d41;
      margin-bottom: 12px;
    }

    .logo-area {
      text-align: left;
    }

    .jkkn-logo {
      font-size: 24pt;
      font-weight: bold;
      color: #0b6d41;
      letter-spacing: 2px;
    }

    .event-name {
      font-size: 10pt;
      color: #666;
      margin-top: 2px;
    }

    .submission-info {
      text-align: center;
      flex-grow: 1;
    }

    .submission-number {
      font-size: 20pt;
      font-weight: bold;
      color: #333;
      background: #ffde59;
      padding: 4px 16px;
      border-radius: 4px;
      display: inline-block;
    }

    .app-name {
      font-size: 14pt;
      font-weight: 600;
      margin-top: 6px;
      color: #333;
    }

    .category {
      font-size: 9pt;
      color: #666;
      background: #f0f0f0;
      padding: 2px 8px;
      border-radius: 3px;
      display: inline-block;
      margin-top: 4px;
    }

    .track-info {
      text-align: right;
    }

    .track-label {
      font-size: 8pt;
      color: #666;
      text-transform: uppercase;
    }

    .track-name {
      font-size: 11pt;
      font-weight: 600;
      color: #0b6d41;
    }

    .demo-slot {
      font-size: 9pt;
      color: #666;
      margin-top: 4px;
    }

    .builder-info {
      font-size: 9pt;
      color: #444;
      padding: 6px 12px;
      background: #f8f8f8;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .builder-info .label {
      color: #666;
    }

    .builder-info .separator {
      margin: 0 8px;
      color: #ccc;
    }

    .qr-section {
      text-align: right;
      margin-bottom: 10px;
    }

    .qr-placeholder {
      display: inline-block;
      border: 2px dashed #ccc;
      padding: 8px 12px;
      font-size: 8pt;
      color: #666;
      text-align: center;
    }

    .qr-label {
      font-weight: 600;
      margin-bottom: 2px;
    }

    .qr-url {
      font-family: monospace;
      font-size: 7pt;
    }

    /* Scoring Section */
    .scoring-section {
      margin-bottom: 16px;
    }

    .scoring-section h2,
    .bonus-section h2 {
      font-size: 11pt;
      color: #0b6d41;
      border-bottom: 1px solid #0b6d41;
      padding-bottom: 4px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .instructions {
      font-size: 8pt;
      color: #666;
      font-style: italic;
      margin-bottom: 10px;
    }

    .criteria-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }

    .criteria-table th {
      background: #0b6d41;
      color: #fff;
      padding: 6px 8px;
      text-align: left;
      font-size: 8pt;
      text-transform: uppercase;
    }

    .criteria-table td {
      border: 1px solid #ddd;
      padding: 6px 8px;
      vertical-align: middle;
    }

    .criterion-col {
      width: 35%;
    }

    .weight-col {
      width: 8%;
      text-align: center;
    }

    .scores-col {
      width: 57%;
    }

    .criterion-name strong {
      display: block;
      color: #333;
    }

    .criterion-desc {
      font-size: 7pt;
      color: #666;
      margin-top: 2px;
    }

    .criterion-weight {
      text-align: center;
      font-weight: 600;
      color: #0b6d41;
    }

    .score-circles {
      display: flex;
      justify-content: space-around;
    }

    .score-circle {
      width: 22px;
      height: 22px;
      border: 2px solid #333;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 9pt;
    }

    /* Bonus Section */
    .bonus-section {
      margin-bottom: 16px;
    }

    .bonus-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .bonus-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px;
      background: #f8f8f8;
      border-radius: 4px;
    }

    .checkbox {
      width: 18px;
      height: 18px;
      border: 2px solid #333;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .bonus-info {
      font-size: 9pt;
    }

    .bonus-info strong {
      color: #333;
    }

    .bonus-desc {
      font-size: 7pt;
      color: #666;
      margin-top: 2px;
    }

    /* Notes Section */
    .notes-section {
      margin-bottom: 16px;
    }

    .notes-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .notes-box {
      border: 1px solid #ddd;
      padding: 8px;
      border-radius: 4px;
    }

    .notes-box h3 {
      font-size: 9pt;
      color: #333;
      margin-bottom: 8px;
      border-bottom: 1px solid #eee;
      padding-bottom: 4px;
    }

    .notes-lines .line {
      height: 24px;
      border-bottom: 1px solid #ccc;
    }

    /* Signature Section */
    .signature-section {
      margin-bottom: 12px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
    }

    .signature-row {
      display: flex;
      gap: 20px;
    }

    .signature-box {
      flex: 1;
    }

    .time-box {
      flex: 0.5;
    }

    .signature-line {
      height: 24px;
      border-bottom: 1px solid #333;
      margin-bottom: 4px;
    }

    .signature-label {
      font-size: 7pt;
      color: #666;
      text-align: center;
    }

    /* Footer */
    .sheet-footer {
      display: flex;
      justify-content: space-between;
      font-size: 7pt;
      color: #999;
      padding-top: 8px;
      border-top: 1px dashed #ddd;
    }

    /* Master Grid Styles */
    .master-grid {
      max-width: 210mm;
      margin: 0 auto;
      padding: 8mm;
      background: #fff;
      border: 1px solid #ccc;
      margin-bottom: 20px;
    }

    .grid-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 10px;
      border-bottom: 3px solid #0b6d41;
      margin-bottom: 12px;
    }

    .grid-logo {
      text-align: left;
    }

    .grid-title {
      text-align: center;
      flex-grow: 1;
    }

    .grid-title h1 {
      font-size: 16pt;
      color: #333;
      margin-bottom: 4px;
    }

    .grid-title .track-name {
      font-size: 12pt;
      color: #0b6d41;
      font-weight: 600;
    }

    .grid-meta {
      text-align: right;
      font-size: 9pt;
      color: #666;
    }

    .grid-meta > div {
      margin-bottom: 4px;
    }

    .grid-instructions {
      font-size: 8pt;
      color: #666;
      background: #f8f8f8;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .grid-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-bottom: 12px;
    }

    .grid-table th {
      background: #0b6d41;
      color: #fff;
      padding: 6px 4px;
      text-align: center;
      font-size: 7pt;
      text-transform: uppercase;
    }

    .grid-table td {
      border: 1px solid #ddd;
      padding: 8px 4px;
      text-align: center;
    }

    .slot-col { width: 5%; }
    .app-col { width: 25%; text-align: left !important; }
    .sub-col { width: 10%; }
    .score-col { width: 6%; }
    .bonus-col { width: 10%; }
    .total-col { width: 8%; }

    .grid-table .app-name {
      text-align: left;
      font-weight: 500;
    }

    .grid-table .slot {
      font-weight: 600;
      color: #0b6d41;
    }

    .grid-table .sub-num {
      font-family: monospace;
      font-size: 7pt;
    }

    .grid-table .score-cell,
    .grid-table .bonus-cell,
    .grid-table .total-cell {
      background: #fafafa;
      min-height: 20px;
    }

    .grid-table .empty-row td {
      background: #f8f8f8;
      color: #ccc;
    }

    .bonus-legend {
      font-size: 7pt;
      color: #666;
      padding: 6px;
      background: #f8f8f8;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .grid-summary {
      margin-bottom: 16px;
    }

    .summary-row {
      display: flex;
      gap: 20px;
    }

    .summary-box {
      flex: 1;
      border: 1px solid #ddd;
      padding: 8px;
      border-radius: 4px;
    }

    .summary-label {
      font-size: 8pt;
      color: #666;
      margin-bottom: 8px;
    }

    .summary-value {
      height: 24px;
      border-bottom: 1px solid #333;
    }

    .summary-lines .top-line {
      font-size: 9pt;
      margin-bottom: 8px;
    }

    .grid-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 7pt;
      color: #999;
      padding-top: 8px;
      border-top: 1px dashed #ddd;
    }

    .footer-left {
      width: 150px;
    }

    .footer-center {
      text-align: center;
    }

    .footer-right {
      text-align: right;
    }

    /* Print Button (hidden in print) */
    .print-controls {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 1000;
      background: #0b6d41;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }

    .print-controls:hover {
      background: #095232;
    }

    @media print {
      .print-controls {
        display: none;
      }
    }
  </style>
</head>
<body>
  <button class="print-controls no-print" onclick="window.print()">
    Print / Save as PDF
  </button>

  ${content}

  <script>
    // Auto-print hint
    console.log('Tip: Press Ctrl+P (or Cmd+P on Mac) to print these sheets');
  </script>
</body>
</html>`;
}

function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
