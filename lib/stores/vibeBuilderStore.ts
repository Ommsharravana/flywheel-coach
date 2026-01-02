import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export interface BYOSConnection {
  supabase: {
    connected: boolean;
    projectId?: string;
    projectName?: string;
  };
  github: {
    connected: boolean;
    username?: string;
    repoName?: string;
  };
  vercel: {
    connected: boolean;
    teamId?: string;
    projectId?: string;
    previewUrl?: string;
  };
}

interface BuilderState {
  // Project info (from onboarding)
  projectName: string;
  projectDescription: string;

  // Chat
  messages: ChatMessage[];
  isGenerating: boolean;
  streamingContent: string;

  // Generated code
  files: GeneratedFile[];
  activeFile: string | null;

  // BYOS connections
  byos: BYOSConnection;

  // Deployment
  isDeploying: boolean;
  deploymentStatus: 'idle' | 'pushing' | 'building' | 'ready' | 'error';
  previewUrl: string | null;

  // Actions
  setProject: (name: string, description: string) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  setIsGenerating: (generating: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  addFile: (file: GeneratedFile) => void;
  updateFile: (path: string, content: string) => void;
  setActiveFile: (path: string | null) => void;
  setFiles: (files: GeneratedFile[]) => void;
  setBYOSConnection: (provider: keyof BYOSConnection, data: Partial<BYOSConnection[keyof BYOSConnection]>) => void;
  setDeploymentStatus: (status: BuilderState['deploymentStatus']) => void;
  setPreviewUrl: (url: string | null) => void;
  setIsDeploying: (deploying: boolean) => void;
  reset: () => void;
}

const initialBYOS: BYOSConnection = {
  supabase: { connected: false },
  github: { connected: false },
  vercel: { connected: false },
};

const initialState = {
  projectName: '',
  projectDescription: '',
  messages: [],
  isGenerating: false,
  streamingContent: '',
  files: [],
  activeFile: null,
  byos: initialBYOS,
  isDeploying: false,
  deploymentStatus: 'idle' as const,
  previewUrl: null,
};

export const useBuilderStore = create<BuilderState>((set) => ({
  ...initialState,

  setProject: (name, description) => set({ projectName: name, projectDescription: description }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }],
  })),

  updateLastMessage: (content) => set((state) => {
    const messages = [...state.messages];
    if (messages.length > 0) {
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content,
      };
    }
    return { messages };
  }),

  setIsGenerating: (generating) => set({ isGenerating: generating }),

  setStreamingContent: (content) => set({ streamingContent: content }),

  appendStreamingContent: (chunk) => set((state) => ({
    streamingContent: state.streamingContent + chunk,
  })),

  addFile: (file) => set((state) => ({
    files: [...state.files, file],
    activeFile: state.activeFile || file.path,
  })),

  updateFile: (path, content) => set((state) => ({
    files: state.files.map((f) =>
      f.path === path ? { ...f, content } : f
    ),
  })),

  setActiveFile: (path) => set({ activeFile: path }),

  setFiles: (files) => set({ files, activeFile: files[0]?.path || null }),

  setBYOSConnection: (provider, data) => set((state) => ({
    byos: {
      ...state.byos,
      [provider]: { ...state.byos[provider], ...data },
    },
  })),

  setDeploymentStatus: (status) => set({ deploymentStatus: status }),

  setPreviewUrl: (url) => set({ previewUrl: url }),

  setIsDeploying: (deploying) => set({ isDeploying: deploying }),

  reset: () => set(initialState),
}));
