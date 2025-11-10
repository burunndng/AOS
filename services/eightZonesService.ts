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
  try {
    console.log('[8Zones] Starting synthesis request with', Object.keys(zoneAnalyses).length, 'zones');

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

    console.log('[8Zones] Synthesis API response status:', response.status);

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || response.statusText;
        console.error('[8Zones] Server error details:', errorData);
      } catch (e) {
        console.error('[8Zones] Could not parse error response:', e);
      }
      throw new Error(`API returned ${response.status}: ${errorMessage}`);
    }

    const data = await response.json();
    console.log('[8Zones] Synthesis response received, keys:', Object.keys(data));

    // Validate response structure
    if (!data.blindSpots || !data.novelInsights || !data.recommendations || !data.synthesisReport) {
      console.error('[8Zones] Invalid response structure:', {
        hasBlindSpots: !!data.blindSpots,
        hasNovelInsights: !!data.novelInsights,
        hasRecommendations: !!data.recommendations,
        hasSynthesisReport: !!data.synthesisReport,
      });
      throw new Error('Invalid synthesis response structure: missing required fields');
    }

    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error generating synthesis';
    console.error('[8Zones] Synthesis error:', message, err);
    throw new Error(message);
  }
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
