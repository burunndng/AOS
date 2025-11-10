import { ZoneAnalysis } from '../types.ts';

/**
 * Enhance user's zone analysis with AI-generated insights
 */
export const enhanceZoneAnalysis = async (
  userId: string,
  zoneNumber: number,
  zoneFocus: string,
  userInput: string,
  focalQuestion: string,
  previousZones?: ZoneAnalysis[]
): Promise<string> => {
  const response = await fetch('/api/mind/eight-zones/enhance-zone', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      zoneNumber,
      zoneFocus,
      userInput,
      focalQuestion,
      previousZones,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to enhance zone analysis: ${response.statusText}`);
  }

  const data = await response.json();
  return data.enhancement;
};

/**
 * Generate synthesis report showing connections between all zones
 */
export const generateSynthesis = async (
  userId: string,
  focalQuestion: string,
  zoneAnalyses: Record<number, ZoneAnalysis>
): Promise<{
  blindSpots: string[];
  novelInsights: string[];
  recommendations: string[];
  synthesisReport: string;
  connections: Array<{ fromZone: number; toZone: number; relationship: string }>;
}> => {
  const response = await fetch('/api/mind/eight-zones/synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      focalQuestion,
      zoneAnalyses,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate synthesis: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Submit completed session for archiving
 */
export const submitSessionCompletion = async (
  sessionId: string,
  userId: string,
  focalQuestion: string,
  zoneAnalyses: Record<number, ZoneAnalysis>,
  synthesisReport: string
): Promise<{ success: boolean; sessionId: string }> => {
  const response = await fetch('/api/mind/eight-zones/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      userId,
      focalQuestion,
      zoneAnalyses,
      synthesisReport,
      completedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit session: ${response.statusText}`);
  }

  return response.json();
};
