import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for code generation
const SYSTEM_PROMPT = `You are an expert full-stack developer building Next.js 14+ applications with:
- App Router
- TypeScript
- Tailwind CSS
- Supabase for backend (auth, database, storage)
- shadcn/ui components

When generating code:
1. Use modern React patterns (hooks, server/client components)
2. Follow Next.js 14 App Router conventions
3. Use TypeScript with proper types
4. Apply Tailwind CSS for styling
5. Structure files properly:
   - app/ for pages and routes
   - components/ for reusable components
   - lib/ for utilities and helpers
   - types/ for TypeScript types

IMPORTANT: When outputting code, wrap each file in a special code block format:
\`\`\`[type]:path/to/file.tsx
// file content here
\`\`\`

Where [type] is one of: page, component, lib, api, style, config, other

Example:
\`\`\`component:components/ui/Button.tsx
'use client';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      {children}
    </button>
  );
}
\`\`\`

Always generate complete, working code - no placeholders or TODOs.
Include all necessary imports.
Make the UI beautiful with Tailwind CSS.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, conversationHistory = [], projectName, projectDescription } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Build context
    let contextPrompt = prompt;
    if (projectName || projectDescription) {
      contextPrompt = `Project: ${projectName || 'Untitled'}
Description: ${projectDescription || 'No description'}

User Request: ${prompt}`;
    }

    // Build messages array
    const messages: Message[] = [
      ...conversationHistory,
      { role: 'user' as const, content: contextPrompt },
    ];

    // Create streaming response
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      messages,
    });

    // Create a ReadableStream for the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text;
              // Send as Server-Sent Event format
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`));
            }
          }

          // Get the final message for parsing files
          const finalMessage = await stream.finalMessage();
          const fullContent = finalMessage.content
            .filter((c): c is Anthropic.TextBlock => c.type === 'text')
            .map(c => c.text)
            .join('');

          // Parse files from the response
          const files = parseGeneratedCode(fullContent);

          // Send files
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'files', files })}\n\n`));

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Stream error' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}

// Parse generated code into files
function parseGeneratedCode(content: string): Array<{
  path: string;
  content: string;
  type: string;
  language: string;
}> {
  const files: Array<{
    path: string;
    content: string;
    type: string;
    language: string;
  }> = [];

  // Match code blocks with our special format: ```[type]:path
  const codeBlockRegex = /```(\w+):([^\n]+)\n([\s\S]*?)```/g;

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [, type, path, code] = match;
    const trimmedPath = path.trim();

    // Detect language from file extension
    const extension = trimmedPath.split('.').pop() || '';
    const languageMap: Record<string, string> = {
      tsx: 'typescript',
      ts: 'typescript',
      jsx: 'javascript',
      js: 'javascript',
      css: 'css',
      json: 'json',
      md: 'markdown',
    };

    files.push({
      type,
      path: trimmedPath,
      content: code.trim(),
      language: languageMap[extension] || 'text',
    });
  }

  return files;
}
