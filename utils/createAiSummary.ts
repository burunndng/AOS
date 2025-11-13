/**
 * AI Summary Adapter
 *
 * Converts full session objects into concise summaries for AI analysis.
 * Extracts the most therapeutically relevant information from each wizard type.
 */

import type {
  MemoryReconsolidationSession,
  IFSSession,
  ThreeTwoOneSession,
  EightZonesSession
} from '../types';

/**
 * Creates a concise AI-friendly summary from a session
 * @param session - The full session object
 * @param wizardType - Type of wizard that created this session
 * @returns A string summary highlighting the most relevant therapeutic information
 */
export function createAiSummary(
  session: MemoryReconsolidationSession | IFSSession | ThreeTwoOneSession | EightZonesSession | any,
  wizardType: 'memory-recon' | 'ifs' | '3-2-1' | 'eight-zones'
): string {
  switch (wizardType) {
    case 'memory-recon':
      return createMemoryReconSummary(session as MemoryReconsolidationSession);
    case 'ifs':
      return createIFSSummary(session as IFSSession);
    case '3-2-1':
      return create321Summary(session as ThreeTwoOneSession);
    case 'eight-zones':
      return createEightZonesSummary(session as EightZonesSession);
    default:
      return 'Unknown session type';
  }
}

/**
 * Creates summary for Memory Reconsolidation session
 */
function createMemoryReconSummary(session: MemoryReconsolidationSession): string {
  const belief = session.implicitBeliefs[0]?.belief || 'Unknown belief';
  const emotionalTone = session.implicitBeliefs[0]?.emotionalTone || 'Unknown tone';
  const baselineIntensity = session.baselineIntensity || 0;

  let summary = `Memory Reconsolidation Session\n`;
  summary += `Core Belief: "${belief}"\n`;
  summary += `Emotional Tone: ${emotionalTone}\n`;
  summary += `Initial Intensity: ${baselineIntensity}/10\n`;

  // Add contradiction insight if available
  if (session.contradictionInsights && session.contradictionInsights.length > 0) {
    const insight = session.contradictionInsights[0];
    if (insight.anchors && insight.anchors.length > 0) {
      summary += `\nMemory Anchors Explored:\n${insight.anchors.slice(0, 2).map(a => `- ${a}`).join('\n')}\n`;
    }
    if (insight.newTruths && insight.newTruths.length > 0) {
      summary += `\nNew Truths Discovered:\n${insight.newTruths.slice(0, 2).map(t => `- ${t}`).join('\n')}\n`;
    }
  }

  // Add completion info if available
  if (session.completionSummary) {
    const intensityChange = session.completionSummary.intensityShift;
    summary += `\nIntensity Change: ${intensityChange > 0 ? '+' : ''}${intensityChange}\n`;

    if (session.completionSummary.insights && session.completionSummary.insights.length > 0) {
      summary += `Key Insight: ${session.completionSummary.insights[0]}\n`;
    }
  }

  // Add integration selections
  if (session.integrationSelections && session.integrationSelections.length > 0) {
    const selections = session.integrationSelections.map(s => s.practice.name).join(', ');
    summary += `\nIntegration Practices: ${selections}\n`;
  }

  return summary;
}

/**
 * Creates summary for IFS session
 */
function createIFSSummary(session: IFSSession): string {
  let summary = `Internal Family Systems Session\n`;
  summary += `Part Name: "${session.partName}"\n`;

  if (session.partRole) {
    summary += `Part Role: ${session.partRole}\n`;
  }

  if (session.partFears) {
    summary += `Part's Fears: ${session.partFears}\n`;
  }

  if (session.partPositiveIntent) {
    summary += `Positive Intent: ${session.partPositiveIntent}\n`;
  }

  // Extract key dialogue moments
  if (session.transcript && session.transcript.length > 0) {
    summary += `\nKey Dialogue Moments:\n`;

    // Get the last few exchanges that aren't from facilitator
    const partMessages = session.transcript
      .filter(entry => entry.speaker === 'part')
      .slice(-3)
      .map(entry => `- Part: "${entry.text}"`)
      .join('\n');

    if (partMessages) {
      summary += partMessages + '\n';
    }
  }

  // Add unblending status
  if (session.transcript && session.transcript.length > 0) {
    const hasUnblending = session.transcript.some(entry =>
      entry.speaker === 'part' && entry.blendingStatus === 'unblended'
    );
    if (hasUnblending) {
      summary += `\nUnblending Achieved: Yes\n`;
    }
  }

  if (session.insights && session.insights.length > 0) {
    summary += `\nKey Insights:\n${session.insights.slice(0, 2).map(i => `- ${i}`).join('\n')}\n`;
  }

  return summary;
}

/**
 * Creates summary for 3-2-1 Shadow Process session
 */
function create321Summary(session: ThreeTwoOneSession): string {
  let summary = `3-2-1 Shadow Process Session\n`;
  summary += `Trigger: "${session.trigger}"\n`;

  if (session.triggerDescription) {
    summary += `Context: ${session.triggerDescription}\n`;
  }

  if (session.dialogue) {
    const dialoguePreview = session.dialogue.length > 200
      ? session.dialogue.substring(0, 200) + '...'
      : session.dialogue;
    summary += `\nDialogue (2nd person):\n${dialoguePreview}\n`;
  }

  if (session.embodiment) {
    const embodimentPreview = session.embodiment.length > 150
      ? session.embodiment.substring(0, 150) + '...'
      : session.embodiment;
    summary += `\nEmbodiment (1st person):\n${embodimentPreview}\n`;
  }

  if (session.integration) {
    summary += `\nIntegration Reflection: ${session.integration}\n`;
  }

  if (session.aiSummary) {
    summary += `\nAI Analysis: ${session.aiSummary}\n`;
  }

  return summary;
}

/**
 * Creates summary for Eight Zones session
 */
function createEightZonesSummary(session: EightZonesSession): string {
  let summary = `Eight Zones of Enneagram Session\n`;
  summary += `Focal Question: "${session.focalQuestion}"\n`;

  if (session.focalQuestionContext) {
    summary += `Context: ${session.focalQuestionContext}\n`;
  }

  // Count completed zones
  const completedZones = Object.keys(session.zoneAnalyses || {}).length;
  summary += `\nZones Explored: ${completedZones}/8\n`;

  // Add synthesis if available
  if (session.blindSpots && session.blindSpots.length > 0) {
    summary += `\nBlind Spots Revealed:\n${session.blindSpots.slice(0, 3).map(bs => `- ${bs}`).join('\n')}\n`;
  }

  if (session.novelInsights && session.novelInsights.length > 0) {
    summary += `\nNovel Insights:\n${session.novelInsights.slice(0, 3).map(ni => `- ${ni}`).join('\n')}\n`;
  }

  if (session.recommendations && session.recommendations.length > 0) {
    summary += `\nRecommendations:\n${session.recommendations.slice(0, 2).map(r => `- ${r}`).join('\n')}\n`;
  }

  if (session.synthesisReport) {
    const synthesisPreview = session.synthesisReport.length > 300
      ? session.synthesisReport.substring(0, 300) + '...'
      : session.synthesisReport;
    summary += `\nSynthesis:\n${synthesisPreview}\n`;
  }

  return summary;
}

/**
 * Extracts thread context from previous sessions
 * @param sessions - Array of previous sessions in the thread
 * @returns Array of concise summaries
 */
export function createThreadContext(
  sessions: Array<{
    type: 'memory-recon' | 'ifs' | '3-2-1' | 'eight-zones';
    data: any;
    date: string;
  }>
): string[] {
  return sessions.map(session => {
    const date = new Date(session.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    const summary = createAiSummary(session.data, session.type);
    // Take first 2 lines of summary for context
    const briefSummary = summary.split('\n').slice(0, 3).join('\n');
    return `[${date}] ${briefSummary}`;
  });
}
