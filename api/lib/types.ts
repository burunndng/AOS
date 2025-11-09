/**
 * RAG System Type Definitions
 * Core types for Pinecone, embeddings, and RAG functionality
 */

// ============================================
// EMBEDDING & VECTOR TYPES
// ============================================

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface PineconeVectorMetadata {
  // Practice-specific metadata
  practiceId?: string;
  practiceTitle?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // minutes
  evidence?: string[];
  roi?: string;
  frameworks?: string[]; // frameworks associated with this practice

  // Framework metadata
  frameworkId?: string;
  frameworkType?: 'Kegan' | 'AQAL' | 'Attachment' | 'Biases' | 'IFS';

  // User session metadata
  userId?: string;
  sessionId?: string;
  sessionType?: 'bias_detective' | 'ifs_work' | 'practice' | 'framework_assessment';
  completionDate?: string;

  // General metadata
  type: 'practice' | 'framework' | 'user_session' | 'insight' | 'user_profile';
  source?: string; // where this data came from
  description?: string;
  tags?: string[];
}

export interface PineconeVector {
  id: string;
  values: number[]; // 1536-dimensional embedding
  metadata: PineconeVectorMetadata;
}

export interface QueryResult {
  id: string;
  score: number; // similarity score (0-1)
  metadata: PineconeVectorMetadata;
  text?: string; // original text if stored
}

// ============================================
// RAG CONTEXT TYPES
// ============================================

export interface RAGContext {
  userId: string;
  userHistory: UserHistory;
  retrievedPractices: QueryResult[];
  retrievedFrameworks: QueryResult[];
  userSessions: UserSession[];
  relevantInsights: string[];
}

export interface UserHistory {
  completedPractices: string[];
  currentStack: string[];
  preferences: UserPreferences;
  biases: string[];
  developmentalStage?: string;
  attachmentStyle?: string;
}

export interface UserPreferences {
  preferredDuration: 'short' | 'medium' | 'long'; // 5-15min, 15-30min, 30+min
  preferredModalities: string[]; // 'visual', 'auditory', 'kinesthetic', 'intellectual'
  preferredFrameworks: string[]; // 'Kegan', 'AQAL', etc.
  focusAreas: string[]; // 'mindfulness', 'shadow_work', 'relationships', etc.
  avoidancePatterns?: string[];
}

export interface UserSession {
  id: string;
  userId: string;
  type: 'bias_detective' | 'ifs_work' | 'practice' | 'framework_assessment';
  content: Record<string, any>;
  insights: string[];
  completedAt: Date;
  embedding?: number[];
}

// ============================================
// PROMPT & GENERATION TYPES
// ============================================

export interface RAGPrompt {
  system: string;
  user: string;
  context: {
    practices: QueryResult[];
    frameworks: QueryResult[];
    userProfile: UserHistory;
    userInsights: string[];
  };
}

export interface GenerationRequest {
  userId: string;
  type: 'recommendation' | 'insight' | 'personalization' | 'prompt_generation';
  query: string;
  filters?: {
    category?: string;
    difficulty?: string;
    frameworkType?: string;
  };
  topK?: number; // number of results to retrieve
}

export interface GenerationResponse {
  type: string;
  content: string;
  sources: QueryResult[]; // which practices/frameworks informed this
  confidence: number; // 0-1
  metadata: Record<string, any>;
}

// ============================================
// DATABASE TYPES
// ============================================

export interface PracticeDocument {
  _id?: string;
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  instructions: string[];
  evidence: string[];
  roi: string;
  frameworks: string[];
  tags: string[];
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FrameworkDocument {
  _id?: string;
  id: string;
  type: 'Kegan' | 'AQAL' | 'Attachment' | 'Biases' | 'IFS';
  title: string;
  description: string;
  stages?: string[];
  dimensions?: string[];
  content: Record<string, any>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSessionDocument {
  _id?: string;
  userId: string;
  sessionId: string;
  type: 'bias_detective' | 'ifs_work' | 'practice' | 'framework_assessment';
  content: Record<string, any>;
  insights: string[];
  embedding?: number[];
  completedAt: Date;
  createdAt: Date;
}

// ============================================
// RECOMMENDATION TYPES
// ============================================

export interface PersonalizedRecommendation {
  practiceId: string;
  practiceTitle: string;
  reasoning: string;
  relevanceScore: number;
  personalizationNotes: string[];
  customSteps?: string[];
}

export interface RecommendationResponse {
  userId: string;
  recommendations: PersonalizedRecommendation[];
  insights: string[];
  generatedAt: Date;
}

// ============================================
// SYNC & PERSISTENCE TYPES
// ============================================

export interface SyncPayload {
  userId: string;
  sessionData: UserSession;
  userPreferences: UserPreferences;
  timestamp: Date;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  indexedSessionId?: string;
  updatedUserEmbedding?: number[];
}
