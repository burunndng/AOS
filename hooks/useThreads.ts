import { useState, useEffect } from 'react';
import {
  Thread,
  ThreadTheme,
  ThreadSessionRef,
  ThreadMetrics,
  MemoryReconsolidationSession,
  IFSSession,
  ThreeTwoOneSession,
  EightZonesSession
} from '../types';

const THREADS_KEY = 'AOS_THREADS';

export interface AllHistories {
  memoryReconHistory: MemoryReconsolidationSession[];
  ifsHistory: IFSSession[];
  threeTwoOneHistory: ThreeTwoOneSession[];
  eightZonesHistory: EightZonesSession[];
}

export function useThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);

  // Load threads from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(THREADS_KEY);
    if (stored) {
      try {
        setThreads(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse threads from localStorage:', error);
        setThreads([]);
      }
    }
  }, []);

  // Save threads to localStorage whenever they change
  useEffect(() => {
    if (threads.length > 0 || localStorage.getItem(THREADS_KEY)) {
      localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    }
  }, [threads]);

  // Create a new thread
  const createThread = (
    title: string,
    theme: ThreadTheme,
    initialSession: ThreadSessionRef
  ): Thread => {
    const newThread: Thread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      theme,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'active',
      sessions: [initialSession],
      metrics: {
        sessionsCount: 1,
        intensityTrend: []
      }
    };

    setThreads(prev => [...prev, newThread]);
    return newThread;
  };

  // Link a session to an existing thread
  const linkSessionToThread = (
    threadId: string,
    sessionRef: ThreadSessionRef
  ) => {
    setThreads(prev =>
      prev.map(thread => {
        if (thread.id === threadId) {
          // Check if session already linked
          const alreadyLinked = thread.sessions.some(
            s => s.sessionId === sessionRef.sessionId
          );
          if (alreadyLinked) return thread;

          return {
            ...thread,
            sessions: [...thread.sessions, sessionRef],
            lastActiveAt: new Date().toISOString(),
            metrics: {
              ...thread.metrics,
              sessionsCount: thread.sessions.length + 1
            }
          };
        }
        return thread;
      })
    );
  };

  // Update thread metrics (call after linking session)
  const updateThreadMetrics = (
    threadId: string,
    histories: AllHistories
  ) => {
    setThreads(prev =>
      prev.map(thread => {
        if (thread.id === threadId) {
          const metrics = calculateThreadMetrics(thread, histories);
          return { ...thread, metrics };
        }
        return thread;
      })
    );
  };

  // Update thread status
  const updateThreadStatus = (
    threadId: string,
    status: 'active' | 'dormant' | 'integrated'
  ) => {
    setThreads(prev =>
      prev.map(thread =>
        thread.id === threadId ? { ...thread, status } : thread
      )
    );
  };

  // Delete a thread
  const deleteThread = (threadId: string) => {
    setThreads(prev => prev.filter(thread => thread.id !== threadId));
  };

  // Get session data from histories
  const getSessionData = (
    sessionRef: ThreadSessionRef,
    histories: AllHistories
  ): any => {
    switch (sessionRef.wizardType) {
      case 'memory-recon':
        return histories.memoryReconHistory.find(s => s.id === sessionRef.sessionId);
      case 'ifs':
        return histories.ifsHistory.find(s => s.id === sessionRef.sessionId);
      case '3-2-1':
        return histories.threeTwoOneHistory.find(s => s.id === sessionRef.sessionId);
      case 'eight-zones':
        return histories.eightZonesHistory.find(s => s.id === sessionRef.sessionId);
      default:
        return null;
    }
  };

  // Calculate thread metrics from session data
  const calculateThreadMetrics = (
    thread: Thread,
    histories: AllHistories
  ): ThreadMetrics => {
    const intensities: number[] = [];

    thread.sessions.forEach(sessionRef => {
      const session = getSessionData(sessionRef, histories);
      if (!session) return;

      // Extract intensity based on wizard type
      if (sessionRef.wizardType === 'memory-recon') {
        const memSession = session as MemoryReconsolidationSession;
        if (memSession.baselineIntensity) {
          intensities.push(memSession.baselineIntensity);
        }
        if (memSession.completionSummary?.intensityShift !== undefined) {
          const afterIntensity =
            memSession.baselineIntensity + memSession.completionSummary.intensityShift;
          intensities.push(afterIntensity);
        }
      }
      // Can add intensity extraction for other wizard types as needed
    });

    return {
      sessionsCount: thread.sessions.length,
      intensityTrend: intensities,
      lastIntensity: intensities.length > 0 ? intensities[intensities.length - 1] : undefined
    };
  };

  // Suggest threads based on session content (simple keyword matching)
  const suggestThreads = (sessionSummary: string, limit: number = 3): Thread[] => {
    const keywords = extractKeywords(sessionSummary);

    return threads
      .filter(thread => {
        const titleLower = thread.title.toLowerCase();
        const themeLower = thread.theme.toLowerCase();

        return keywords.some(
          kw =>
            titleLower.includes(kw) ||
            themeLower.includes(kw) ||
            thread.theme === kw
        );
      })
      .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt))
      .slice(0, limit);
  };

  // Extract keywords from text (simple implementation)
  const extractKeywords = (text: string): string[] => {
    const lower = text.toLowerCase();
    const keywords: string[] = [];

    const themeKeywords = [
      'worthiness',
      'worth',
      'safety',
      'safe',
      'belonging',
      'belong',
      'control',
      'shame',
      'ashamed',
      'abandonment',
      'abandoned',
      'perfectionism',
      'perfect',
      'compassion'
    ];

    themeKeywords.forEach(keyword => {
      if (lower.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    return [...new Set(keywords)]; // Remove duplicates
  };

  return {
    threads,
    createThread,
    linkSessionToThread,
    updateThreadMetrics,
    updateThreadStatus,
    deleteThread,
    getSessionData,
    calculateThreadMetrics,
    suggestThreads
  };
}
