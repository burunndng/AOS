// Memory Reconsolidation Component Types

export interface CompletionData {
  success: boolean;
  sessionId: string;
  integrationSummary: string;
  suggestedPractices: string[];
}

export interface IntegrationPractice {
  practiceId: string;
  practiceName: string;
  description: string;
  bestFor: readonly string[];
}

export interface WizardStepProps {
  isLoading: boolean;
  error: string | null;
  onNext: () => Promise<void>;
}
