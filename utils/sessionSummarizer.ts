/**
 * Session Summarizer - Extracts and condenses wizard sessions for AI analysis
 */

import type { WizardSessionSummary } from '../types';

/**
 * Extract all wizard sessions from localStorage
 */
export function extractWizardSessions(): WizardSessionSummary[] {
  const sessions: WizardSessionSummary[] = [];

  // List of wizard session keys to check in localStorage
  // These must match the exact keys used in App.tsx
  const wizardKeys = [
    'historyBias',              // BiasDetectiveSession[]
    'historyBiasFinder',        // BiasFinderSession[]
    'historyIFS',               // IFSSession[]
    'historySO',                // SubjectObjectSession[]
    'history321',               // ThreeTwoOneSession[]
    'historyKegan',             // KeganAssessmentSession[]
    'historyAttachment',        // AttachmentAssessmentSession[]
    'historyBigMind',           // BigMindSession[]
    'somaticPracticeHistory',   // SomaticPracticeSession[]
    'memoryReconHistory',       // MemoryReconsolidationSession[]
    'polarityMapperSessions',   // PolarityMap[]
    'historyPS',                // PerspectiveShifterSession[]
    'eightZonesHistory',        // EightZonesSession[] ← FIX: was 'eightZonesSessions'
    'adaptiveCycleHistory',     // AdaptiveCycleSession[] ← NEW: added for Adaptive Cycle wizard
    'insightPracticeMapSession',
    'historyRelational',        // RelationalPatternSession[]
    'roleAlignmentSessions',
    'meditationWizardSessions',
    'integralBodyArchitectSessions',
    'dynamicWorkoutSessions',
  ];

  for (const key of wizardKeys) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        const wizardType = mapKeyToWizardType(key);

        // Handle both single sessions and arrays
        if (Array.isArray(parsed)) {
          for (const session of parsed) {
            sessions.push(summarizeSession(wizardType, session));
          }
        } else {
          sessions.push(summarizeSession(wizardType, parsed));
        }
      }
    } catch (error) {
      console.warn(`Failed to parse ${key}:`, error);
    }
  }

  // Sort by date, most recent first
  return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Map localStorage key to wizard type name
 */
function mapKeyToWizardType(key: string): string {
  const keyMap: Record<string, string> = {
    'historyBias': 'biasDetective',
    'historyBiasFinder': 'biasFinder',
    'historyIFS': 'ifs',
    'historySO': 'subjectObject',
    'history321': 'threeTwoOne',
    'historyKegan': 'keganAssessment',
    'historyAttachment': 'attachmentAssessment',
    'historyBigMind': 'bigMind',
    'somaticPracticeHistory': 'somaticGenerator',
    'memoryReconHistory': 'memoryReconsolidation',
    'polarityMapperSessions': 'polarityMapper',
    'historyPS': 'perspectiveShifter',
    'eightZonesHistory': 'eightZones',
    'adaptiveCycleHistory': 'adaptiveCycle',
    'insightPracticeMapSession': 'insightPracticeMap',
    'historyRelational': 'relationalPattern',
    'roleAlignmentSessions': 'roleAlignment',
    'meditationWizardSessions': 'meditationWizard',
    'integralBodyArchitectSessions': 'integralBodyArchitect',
    'dynamicWorkoutSessions': 'dynamicWorkout',
  };

  return keyMap[key] || key.replace('Sessions', '').replace('Session', '').replace('history', '').replace('History', '');
}

/**
 * Summarize a single wizard session into key insights
 */
function summarizeSession(wizardType: string, session: any): WizardSessionSummary {
  const insights: string[] = [];

  switch (wizardType) {
    case 'biasDetective':
      if (session.identifiedBiases) {
        insights.push(`Identified biases: ${session.identifiedBiases.map((b: any) => b.name || b).join(', ')}`);
      }
      if (session.decision) {
        insights.push(`Decision context: ${session.decision.substring(0, 100)}`);
      }
      break;

    case 'ifs':
      if (session.partName) {
        insights.push(`Worked with part: ${session.partName}`);
      }
      if (session.partRole) {
        insights.push(`Part role: ${session.partRole}`);
      }
      if (session.partFears) {
        insights.push(`Part fears: ${session.partFears}`);
      }
      if (session.positiveIntent) {
        insights.push(`Positive intent: ${session.positiveIntent}`);
      }
      break;

    case 'subjectObject':
      if (session.pattern) {
        insights.push(`Pattern explored: ${session.pattern}`);
      }
      if (session.subjectToStatement) {
        insights.push(`Subject to: ${session.subjectToStatement}`);
      }
      if (session.costs && session.costs.length > 0) {
        insights.push(`Costs: ${session.costs.join(', ')}`);
      }
      break;

    case 'threeTwoOne':
      if (session.trigger) {
        insights.push(`Trigger: ${session.trigger}`);
      }
      if (session.integration) {
        insights.push(`Integration: ${session.integration.substring(0, 150)}`);
      }
      break;

    case 'keganAssessment':
      if (session.overallInterpretation?.centerOfGravity) {
        insights.push(`Developmental stage: ${session.overallInterpretation.centerOfGravity}`);
      }
      if (session.overallInterpretation?.developmentalEdge) {
        insights.push(`Growth edge: ${session.overallInterpretation.developmentalEdge.substring(0, 150)}`);
      }
      break;

    case 'attachmentAssessment':
      if (session.assessedStyle) {
        insights.push(`Attachment style: ${session.assessedStyle}`);
      }
      break;

    case 'bigMind':
      if (session.exploredVoices) {
        insights.push(`Explored voices: ${session.exploredVoices.join(', ')}`);
      }
      break;

    case 'somaticGenerator':
      if (session.practices) {
        insights.push(`Generated ${session.practices.length} somatic practices`);
      }
      break;

    case 'memoryReconsolidation':
      if (session.targetBelief) {
        insights.push(`Target belief: ${session.targetBelief}`);
      }
      if (session.contradictionExperience) {
        insights.push(`Contradiction found: ${session.contradictionExperience.substring(0, 100)}`);
      }
      break;

    case 'polarityMapper':
      if (session.polePair) {
        insights.push(`Polarity: ${session.polePair.pole1} / ${session.polePair.pole2}`);
      }
      break;

    case 'perspectiveShifter':
      if (session.situation) {
        insights.push(`Situation: ${session.situation.substring(0, 100)}`);
      }
      if (session.perspectives) {
        insights.push(`Explored ${session.perspectives.length} perspectives`);
      }
      break;

    case 'eightZones':
      if (session.focalQuestion) {
        insights.push(`AQAL analysis: ${session.focalQuestion.substring(0, 100)}`);
      }
      if (session.blindSpots) {
        insights.push(`Blind spots: ${session.blindSpots.join(', ')}`);
      }
      break;

    case 'adaptiveCycle':
      if (session.systemToAnalyze) {
        insights.push(`System analyzed: ${session.systemToAnalyze}`);
      }
      if (session.diagnosedPhase && session.phaseAnalysis) {
        const phaseNames: Record<string, string> = {
          'r': 'Growth/Exploitation',
          'K': 'Conservation',
          'Ω': 'Release/Collapse',
          'α': 'Reorganization'
        };
        insights.push(`Current phase: ${phaseNames[session.diagnosedPhase] || session.diagnosedPhase}`);
      }
      break;

    case 'insightPracticeMap':
      if (session.currentStage) {
        insights.push(`Current insight stage: ${session.currentStage}`);
      }
      if (session.cycleCount) {
        insights.push(`Completed ${session.cycleCount} cycles`);
      }
      break;

    case 'relationalPattern':
      if (session.exploredRelationships) {
        insights.push(`Explored ${session.exploredRelationships.length} relationship patterns`);
      }
      if (session.analysis?.corePatterns) {
        insights.push(`Core patterns: ${session.analysis.corePatterns.join(', ')}`);
      }
      break;

    case 'roleAlignment':
      if (session.roles) {
        const avgScore = session.roles.reduce((sum: number, r: any) => sum + r.valueScore, 0) / session.roles.length;
        insights.push(`Assessed ${session.roles.length} roles, avg alignment: ${avgScore.toFixed(1)}/10`);
      }
      break;

    case 'meditationWizard':
      if (session.selectedMeditation) {
        insights.push(`Selected meditation: ${session.selectedMeditation.name}`);
      }
      break;

    case 'integralBodyArchitect':
      if (session.weeklyPlan) {
        insights.push(`Created weekly body practice plan`);
      }
      break;

    case 'dynamicWorkout':
      if (session.workoutProgram) {
        insights.push(`Generated workout program`);
      }
      break;

    default:
      insights.push(`Completed ${wizardType} session`);
  }

  return {
    type: wizardType,
    date: session.date || session.completedAt || new Date().toISOString(),
    keyInsights: insights,
    sessionData: session,
  };
}

/**
 * Generate a concise text summary of all wizard sessions for AI prompt
 */
export function summarizeWizardSessionsForAI(sessions: WizardSessionSummary[]): string {
  if (sessions.length === 0) {
    return 'No wizard sessions completed yet.';
  }

  const lines: string[] = [];
  lines.push(`User has completed ${sessions.length} wizard sessions:\n`);

  // Group by wizard type
  const grouped: Record<string, WizardSessionSummary[]> = {};
  for (const session of sessions) {
    if (!grouped[session.type]) {
      grouped[session.type] = [];
    }
    grouped[session.type].push(session);
  }

  // Summarize each type
  for (const [type, typeSessions] of Object.entries(grouped)) {
    lines.push(`\n**${formatWizardName(type)}** (${typeSessions.length} session${typeSessions.length > 1 ? 's' : ''}):`);

    // Show most recent session insights
    const recent = typeSessions[0];
    for (const insight of recent.keyInsights) {
      lines.push(`  - ${insight}`);
    }

    // If multiple sessions, note the pattern
    if (typeSessions.length > 1) {
      lines.push(`  - (Completed ${typeSessions.length} times, showing most recent)`);
    }
  }

  return lines.join('\n');
}

/**
 * Format wizard type names for display
 */
function formatWizardName(type: string): string {
  const names: Record<string, string> = {
    biasDetective: 'Bias Detective',
    ifs: 'Internal Family Systems',
    subjectObject: 'Subject-Object Explorer',
    threeTwoOne: '3-2-1 Shadow Work',
    keganAssessment: 'Kegan Developmental Assessment',
    attachmentAssessment: 'Attachment Assessment',
    bigMind: 'Big Mind Process',
    somaticGenerator: 'Somatic Practice Generator',
    memoryReconsolidation: 'Memory Reconsolidation',
    polarityMapper: 'Polarity Mapper',
    perspectiveShifter: 'Perspective Shifter',
    eightZones: 'Eight Zones (AQAL)',
    adaptiveCycle: 'Adaptive Cycle Mapper',
    insightPracticeMap: 'Insight Practice Map',
    relationalPattern: 'Relational Pattern Tracker',
    roleAlignment: 'Role Alignment',
    meditationWizard: 'Meditation Wizard',
    integralBodyArchitect: 'Integral Body Architect',
    dynamicWorkout: 'Dynamic Workout Architect',
  };

  return names[type] || type;
}
