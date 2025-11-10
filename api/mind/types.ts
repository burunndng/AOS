/**
 * Mind Module Types
 * Type definitions for 8 Zones of Knowing feature
 */

export interface ZoneAnalysis {
  zoneNumber: number;
  zoneFocus: string;
  userInput: string;
  aiEnhancement?: string;
  keyInsights?: string[];
  generatedAt?: string;
}

export interface ZoneConnection {
  fromZone: number;
  toZone: number;
  connectionType: string;
  insight: string;
}

export interface EnhanceZoneRequest {
  zoneNumber: number;
  zoneFocus: string;
  userInput: string;
}

export interface EnhanceZoneResponse {
  zoneNumber: number;
  aiEnhancement: string;
  keyInsights: string[];
}

export interface SynthesizeZonesRequest {
  zones: ZoneAnalysis[];
}

export interface SynthesizeZonesResponse {
  synthesis: string;
  connections: ZoneConnection[];
  integratedInsights: string[];
}

export interface SessionCompletionRequest {
  zoneAnalyses: ZoneAnalysis[];
  personalReflection: string;
}

export interface SessionCompletionResponse {
  acknowledgement: string;
  integrationGuidance: string;
}
