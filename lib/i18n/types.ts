export type Locale = 'en' | 'ta';

export interface TranslationParams {
  [key: string]: string | number;
}

export interface Dictionary {
  common: {
    loading: string;
    error: string;
    save: string;
    cancel: string;
    continue: string;
    back: string;
    next: string;
    previous: string;
    complete: string;
    view: string;
    edit: string;
    delete: string;
    confirm: string;
    signOut: string;
    logIn: string;
    getStarted: string;
    submit: string;
    saving: string;
    saved: string;
    updating: string;
    updated: string;
    learner: string;
    never: string;
    notAvailable: string;
    pts: string;
  };
  nav: {
    home: string;
    portfolio: string;
    settings: string;
    superAdmin: string;
    superAdminPanel: string;
  };
  dashboard: {
    welcome: string;
    welcomeWithName: string;
    currentStepInfo: string;
    readyToStart: string;
    startNewCycle: string;
    beginJourney: string;
    beginNewCycle: string;
    currentCycle: string;
    started: string;
    completedCycles: string;
    totalImpactScore: string;
    untitledCycle: string;
    completed: string;
    currentStep: string;
  };
  steps: {
    problem: { name: string; description: string };
    context: { name: string; description: string };
    value: { name: string; description: string };
    workflow: { name: string; description: string };
    prompt: { name: string; description: string };
    build: { name: string; description: string };
    deploy: { name: string; description: string };
    impact: { name: string; description: string };
  };
  settings: {
    title: string;
    subtitle: string;
    profile: string;
    accountInfo: string;
    cyclesStarted: string;
    completed: string;
    competitionMode: string;
    competitionDescription: string;
    languageTitle: string;
    languageDescription: string;
    account: string;
    accountDetails: string;
    email: string;
    created: string;
    lastUpdated: string;
    editProfile: string;
    editProfileDesc: string;
    name: string;
    namePlaceholder: string;
    department: string;
    departmentPlaceholder: string;
    yearOfStudy: string;
    selectYear: string;
    year1: string;
    year2: string;
    year3: string;
    year4: string;
    year5: string;
    saveChanges: string;
  };
  language: {
    english: string;
    tamil: string;
    englishNative: string;
    tamilNative: string;
    englishDesc: string;
    tamilDesc: string;
    note: string;
    noteEnglish: string;
    noteTamil: string;
  };
  gemini: {
    title: string;
    description: string;
    setupRequired: string;
    setupRequiredDesc: string;
    setupButton: string;
    connected: string;
    connectedDesc: string;
    disconnect: string;
    reconnect: string;
    testConnection: string;
    testing: string;
    connectionSuccess: string;
    connectionFailed: string;
  };
  institution: {
    title: string;
    description: string;
    currentInstitution: string;
    noInstitution: string;
    requestChange: string;
    selectInstitution: string;
    reason: string;
    reasonPlaceholder: string;
    submitRequest: string;
    pendingRequest: string;
    pendingRequestDesc: string;
  };
  appathon: {
    title: string;
    description: string;
    enabledDesc: string;
    disabledDesc: string;
  };
  toasts: {
    saved: string;
    error: string;
    copied: string;
    languageChangedEnglish: string;
    languageChangedTamil: string;
    profileUpdated: string;
    connectionSuccess: string;
    connectionFailed: string;
  };
  errors: {
    generic: string;
    networkError: string;
    unauthorized: string;
    notFound: string;
    failedToUpdate: string;
    failedToSave: string;
  };
  events: {
    selectEvent: string;
    activeEvents: string;
    noActiveEvents: string;
    viewDetails: string;
    participate: string;
    daysLeft: string;
    deadline: string;
  };
  portfolio: {
    title: string;
    subtitle: string;
    noCycles: string;
    startFirst: string;
    impactScore: string;
    stepReached: string;
    status: string;
    active: string;
    completed: string;
  };
  cycle: {
    newCycle: string;
    createCycle: string;
    cycleName: string;
    cycleNamePlaceholder: string;
    startCycle: string;
    stepOf: string;
    completeStep: string;
    skipStep: string;
    previousStep: string;
    nextStep: string;
    summary: string;
    notes: string;
    aiCoach: string;
    askCoach: string;
    coachPlaceholder: string;
    sendMessage: string;
    generating: string;
  };
  stepUI: {
    // Common step UI elements
    questions: string;
    statement: string;
    refine: string;
    discovery: string;
    yourAnswers: string;
    notAnswered: string;
    done: string;
    generateStatement: string;
    saveDraft: string;
    completeAndContinue: string;
    backToQuestions: string;
    continueToRefine: string;
    readyToProceed: string;
    // Problem Discovery
    discoveryQuestions: string;
    answerQuestionsDesc: string;
    problemStatement: string;
    yourProblemStatement: string;
    painLevel: string;
    howOftenOccur: string;
    mildAnnoyance: string;
    extremelyPainful: string;
    refineProblem: string;
    refineDesc: string;
    originalStatement: string;
    refinedStatement: string;
    refinedStatementPlaceholder: string;
    // Tips
    beSpecific: string;
    quantify: string;
    addContext: string;
    // Frequency
    daily: string;
    weekly: string;
    monthly: string;
    rarely: string;
    dailyDesc: string;
    weeklyDesc: string;
    monthlyDesc: string;
    rarelyDesc: string;
    // Context Discovery
    targetUsers: string;
    userPersona: string;
    userPersonaDesc: string;
    whenProblem: string;
    currentSolution: string;
    // Value Discovery
    valueProposition: string;
    willingness: string;
    validation: string;
    // Workflow
    workflowType: string;
    selectWorkflow: string;
    // Prompt
    generatePrompt: string;
    promptReady: string;
    copyPrompt: string;
    // Build
    buildProgress: string;
    uploadScreenshot: string;
    projectUrl: string;
    // Deploy
    deploymentStatus: string;
    liveUrl: string;
    // Impact
    measureImpact: string;
    impactMetrics: string;
  };
}
