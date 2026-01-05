'use server';

import Anthropic from '@anthropic-ai/sdk';

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'page' | 'component' | 'lib' | 'api' | 'style' | 'config' | 'other';
}

export interface GenerationResult {
  files: GeneratedFile[];
  summary: string;
  projectStructure: string[];
}

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

// Parse generated code into files
function parseGeneratedCode(content: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  // Match code blocks with our special format: ```[type]:path
  const codeBlockRegex = /```(\w+):([^\n]+)\n([\s\S]*?)```/g;

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [, type, path, code] = match;
    files.push({
      type: type as GeneratedFile['type'],
      path: path.trim(),
      content: code.trim(),
    });
  }

  return files;
}

// Generate code from user prompt
export async function generateCode(
  userPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  existingFiles: GeneratedFile[] = []
): Promise<GenerationResult> {
  // Build context about existing files
  let existingContext = '';
  if (existingFiles.length > 0) {
    existingContext = '\n\nExisting files in the project:\n' +
      existingFiles.map(f => `- ${f.path}`).join('\n');
  }

  // Build messages array
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...conversationHistory,
    {
      role: 'user',
      content: userPrompt + existingContext,
    },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8096,
    system: SYSTEM_PROMPT,
    messages,
  });

  // Extract text content
  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in response');
  }

  const generatedText = textContent.text;

  // Parse files from the response
  const files = parseGeneratedCode(generatedText);

  // Extract summary (text before first code block)
  const summaryMatch = generatedText.match(/^([\s\S]*?)```/);
  const summary = summaryMatch ? summaryMatch[1].trim() : 'Code generated successfully';

  // Build project structure
  const projectStructure = files.map(f => f.path);

  return {
    files,
    summary,
    projectStructure,
  };
}

// Stream code generation for real-time updates
export async function* streamGenerateCode(
  userPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  existingFiles: GeneratedFile[] = []
): AsyncGenerator<{ type: 'text' | 'file'; content: string; file?: GeneratedFile }> {
  // Build context about existing files
  let existingContext = '';
  if (existingFiles.length > 0) {
    existingContext = '\n\nExisting files in the project:\n' +
      existingFiles.map(f => `- ${f.path}`).join('\n');
  }

  // Build messages array
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...conversationHistory,
    {
      role: 'user',
      content: userPrompt + existingContext,
    },
  ];

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8096,
    system: SYSTEM_PROMPT,
    messages,
  });

  let fullContent = '';
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockType = '';
  let codeBlockPath = '';

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      const text = event.delta.text;
      fullContent += text;

      // Check for start of code block
      if (!inCodeBlock && fullContent.includes('```')) {
        const match = fullContent.match(/```(\w+):([^\n]+)\n/);
        if (match) {
          inCodeBlock = true;
          codeBlockType = match[1];
          codeBlockPath = match[2].trim();
          codeBlockContent = fullContent.split(match[0])[1] || '';
        }
      }

      // Check for end of code block
      if (inCodeBlock && fullContent.includes('```', fullContent.lastIndexOf('```' + codeBlockType))) {
        const endMatch = codeBlockContent.match(/([\s\S]*?)```/);
        if (endMatch) {
          const file: GeneratedFile = {
            type: codeBlockType as GeneratedFile['type'],
            path: codeBlockPath,
            content: endMatch[1].trim(),
          };
          yield { type: 'file', content: codeBlockPath, file };
          inCodeBlock = false;
          codeBlockContent = '';
          codeBlockType = '';
          codeBlockPath = '';
        }
      }

      // Yield text updates
      yield { type: 'text', content: text };
    }
  }
}

// Template for new Next.js project
export const PROJECT_TEMPLATE: GeneratedFile[] = [
  {
    type: 'config',
    path: 'package.json',
    content: JSON.stringify({
      name: 'vibe-app',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        '@supabase/supabase-js': '^2.39.0',
        '@supabase/ssr': '^0.1.0',
      },
      devDependencies: {
        typescript: '^5.3.0',
        '@types/node': '^20.10.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        tailwindcss: '^3.4.0',
        autoprefixer: '^10.4.16',
        postcss: '^8.4.32',
      },
    }, null, 2),
  },
  {
    type: 'config',
    path: 'tailwind.config.js',
    content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
  },
  {
    type: 'style',
    path: 'app/globals.css',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;`,
  },
  {
    type: 'page',
    path: 'app/layout.tsx',
    content: `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vibe App',
  description: 'Built with JKKN Vibe Studio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
  },
  {
    type: 'page',
    path: 'app/page.tsx',
    content: `export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to Your App
        </h1>
        <p className="text-gray-400">
          Start building something amazing!
        </p>
      </div>
    </main>
  )
}`,
  },
];
