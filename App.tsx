import React, { useState, useEffect, useCallback } from 'react';

// Core Components
import NavSidebar from './components/NavSidebar.tsx';
import DashboardTab from './components/DashboardTab.tsx';
import StackTab from './components/StackTab.tsx';
import BrowseTab from './components/BrowseTab.tsx';
import TrackerTab from './components/TrackerTab.tsx';
import StreaksTab from './components/StreaksTab.tsx';
import RecommendationsTab from './components/RecommendationsTab.tsx';
import AqalTab from './components/AqalTab.tsx';
import MindToolsTab from './components/MindToolsTab.tsx';
import ShadowToolsTab from './components/ShadowToolsTab.tsx';
import BodyToolsTab from './components/BodyToolsTab.tsx'; // NEW: Body Tools tab import
import LibraryTab from './components/LibraryTab.tsx';
// FIX: Imported the Coach component to resolve "Cannot find name 'Coach'" error.
import Coach from './components/Coach.tsx';

// Modals & Wizards
import PracticeInfoModal from './components/PracticeInfoModal.tsx';
import PracticeExplanationModal from './components/PracticeExplanationModal.tsx';
import PracticeCustomizationModal from './components/PracticeCustomizationModal.tsx';
import CustomPracticeModal from './components/CustomPracticeModal.tsx';
import GuidedPracticeGenerator from './components/GuidedPracticeGenerator.tsx';
import ThreeTwoOneWizard from './components/ThreeTwoOneWizard.tsx';
import IFSWizard from './components/IFSWizard.tsx';
import BiasDetectiveWizard from './components/BiasDetectiveWizard.tsx';
import SubjectObjectWizard from './components/SubjectObjectWizard.tsx';
import PerspectiveShifterWizard from './components/PerspectiveShifterWizard.tsx';
import PolarityMapperWizard from './components/PolarityMapperWizard.tsx';
import SomaticGeneratorWizard from './components/SomaticGeneratorWizard.tsx';
import KeganAssessmentWizard from './components/KeganAssessmentWizard.tsx';
import RelationalPatternChatbot from './components/RelationalPatternChatbot.tsx';


// Constants & Types
import {
  ActiveTab,
  AllPractice,
  Practice,
  CustomPractice,
  ModuleKey,
  ThreeTwoOneSession,
  IFSSession,
  IFSPart,
  BiasDetectiveSession,
  SubjectObjectSession,
  PerspectiveShifterSession,
  PolarityMap,
  AqalReportData,
  IntegratedInsight,
  SomaticPracticeSession,
  PolarityMapDraft, // FIX: Imported PolarityMapDraft
  KeganAssessmentSession,
  RelationalPatternSession
} from './types.ts';
import { practices as corePractices, starterStacks, modules } from './constants.ts'; // FIX: Moved import to prevent re-declaration.


// Services
import * as geminiService from './services/geminiService.ts';

// Custom Hook for Local Storage
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export default function App() {
  const [activeTab, setActiveTab] = useLocalStorage<ActiveTab>('activeTab', 'dashboard');
  
  // Core Data
  const [practiceStack, setPracticeStack] = useLocalStorage<AllPractice[]>('practiceStack', []);
  const [practiceNotes, setPracticeNotes] = useLocalStorage<Record<string, string>>('practiceNotes', {});
  const [dailyNotes, setDailyNotes] = useLocalStorage<Record<string, string>>('dailyNotes', {});
  const [completionHistory, setCompletionHistory] = useLocalStorage<Record<string, string[]>>('completionHistory', {});
  
  // Session Drafts
  const [draft321, setDraft321] = useLocalStorage<Partial<ThreeTwoOneSession> | null>('draft321', null);
  const [draftIFS, setDraftIFS] = useLocalStorage<IFSSession | null>('draftIFS', null);
  const [draftBias, setDraftBias] = useLocalStorage<BiasDetectiveSession | null>('draftBias', null);
  const [draftSO, setDraftSO] = useLocalStorage<SubjectObjectSession | null>('draftSO', null);
  const [draftPS, setDraftPS] = useLocalStorage<PerspectiveShifterSession | null>('draftPS', null);
  // FIX: Updated draftPM to use PolarityMapDraft type.
  const [draftPM, setDraftPM] = useLocalStorage<PolarityMapDraft | null>('draftPM', null);
  const [draftKegan, setDraftKegan] = useLocalStorage<KeganAssessmentSession | null>('draftKegan', null);
  const [draftRelational, setDraftRelational] = useLocalStorage<RelationalPatternSession | null>('draftRelational', null);

  // Session History
  const [history321, setHistory321] = useLocalStorage<ThreeTwoOneSession[]>('history321', []);
  const [historyIFS, setHistoryIFS] = useLocalStorage<IFSSession[]>('historyIFS', []);
  const [historyBias, setHistoryBias] = useLocalStorage<BiasDetectiveSession[]>('historyBias', []);
  const [historySO, setHistorySO] = useLocalStorage<SubjectObjectSession[]>('historySO', []);
  const [historyPS, setHistoryPS] = useLocalStorage<PerspectiveShifterSession[]>('historyPS', []);
  const [historyPM, setHistoryPM] = useLocalStorage<PolarityMap[]>('historyPM', []);
  const [historyKegan, setHistoryKegan] = useLocalStorage<KeganAssessmentSession[]>('historyKegan', []);
  const [historyRelational, setHistoryRelational] = useLocalStorage<RelationalPatternSession[]>('historyRelational', []);
  const [partsLibrary, setPartsLibrary] = useLocalStorage<IFSPart[]>('partsLibrary', []);
  const [somaticPracticeHistory, setSomaticPracticeHistory] = useLocalStorage<SomaticPracticeSession[]>('somaticPracticeHistory', []);
  
  // AI-generated data
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [aqalReport, setAqalReport] = useLocalStorage<AqalReportData | null>('aqalReport', null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Modals state
  const [activeWizard, setActiveWizard] = useLocalStorage<string | null>('activeWizard', null);
  const [linkedInsightId, setLinkedInsightId] = useState<string | undefined>(undefined);
  const [infoModalPractice, setInfoModalPractice] = useState<Practice | null>(null);
  const [explanationModal, setExplanationModal] = useState<{ isOpen: boolean; title: string; explanation: string }>({ isOpen: false, title: '', explanation: '' });
  const [customizationModalPractice, setCustomizationModalPractice] = useState<Practice | null>(null);
  const [isCustomPracticeModalOpen, setIsCustomPracticeModalOpen] = useState(false);
  const [isGuidedPracticeGeneratorOpen, setIsGuidedPracticeGeneratorOpen] = useState(false);
  
  // Integrated Insights
  const [integratedInsights, setIntegratedInsights] = useLocalStorage<IntegratedInsight[]>('integratedInsights', []);

  const setActiveWizardAndLink = (wizardName: string | null, insightId?: string) => {
    setActiveWizard(wizardName);
    setLinkedInsightId(insightId);
  }

  const findModuleKey = useCallback((practiceId: string): ModuleKey => {
    const practice = practiceStack.find(p => p.id === practiceId);
    if (practice && 'isCustom' in practice && practice.isCustom) {
      return practice.module;
    }
    for (const key in corePractices) {
      if (corePractices[key as ModuleKey].some(p => p.id === practiceId)) {
        return key as ModuleKey;
      }
    }
    return 'mind'; // Default
  }, [practiceStack]);

  const addToStack = (practice: Practice) => {
    if (!practiceStack.some(p => p.id === practice.id)) {
      setPracticeStack(prev => [...prev, practice]);
      setActiveTab('stack');
    }
  };

  const removeFromStack = (practiceId: string) => {
    setPracticeStack(prev => prev.filter(p => p.id !== practiceId));
  };
  
  const handleSaveCustomPractice = (practice: CustomPractice, module: ModuleKey) => {
    setPracticeStack(prev => [...prev, { ...practice, module }]);
    setIsCustomPracticeModalOpen(false);
  };

  const updatePracticeNote = (practiceId: string, note: string) => {
    setPracticeNotes(prev => ({ ...prev, [practiceId]: note }));
  };
  
  const updateDailyNote = (practiceId: string, note: string) => {
    const todayKey = new Date().toISOString().split('T')[0];
    setDailyNotes(prev => ({ ...prev, [`${practiceId}-${todayKey}`]: note }));
  };

  const today = new Date().toISOString().split('T')[0];
  const completedToday = Object.entries(completionHistory)
    .filter(([_, dates]) => dates.includes(today))
    .reduce((acc, [id, _]) => ({ ...acc, [id]: true }), {});
  
  const togglePracticeCompletion = (practiceId: string) => {
    setCompletionHistory(prev => {
      const history = prev[practiceId] || [];
      const today = new Date().toISOString().split('T')[0];
      if (history.includes(today)) {
        return { ...prev, [practiceId]: history.filter(d => d !== today) };
      } else {
        return { ...prev, [practiceId]: [...history, today] };
      }
    });
  };

  const applyStarterStack = (practiceIds: string[]) => {
    const practicesToAdd = Object.values(corePractices).flat().filter(p => practiceIds.includes(p.id));
    setPracticeStack(practicesToAdd);
    setActiveTab('stack');
  };
  
  const getContextForAI = () => {
    const stackInfo = practiceStack.map(p => `- ${p.name}: ${practiceNotes[p.id] || 'No notes.'}`).join('\n');
    const completionInfo = `Completed today: ${Object.values(completedToday).filter(Boolean).length}/${practiceStack.length}`;
    return `Current Stack:\n${stackInfo}\n\n${completionInfo}`;
  };

  const generateRecommendations = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const recs = await geminiService.generateRecommendations(getContextForAI());
      setRecommendations(recs);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Failed to get recommendations.");
    } finally {
      setAiLoading(false);
    }
  };

  const generateAqalReport = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const report = await geminiService.generateAqalReport(getContextForAI());
      setAqalReport(report);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Failed to generate AQAL report.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleExplainPractice = async (practice: Practice) => {
    setExplanationModal({ isOpen: true, title: practice.name, explanation: "Aura is thinking..." });
    try {
      const explanation = await geminiService.explainPractice(practice);
      setExplanationModal({ isOpen: true, title: practice.name, explanation });
    } catch (e) {
      setExplanationModal({ isOpen: true, title: practice.name, explanation: "Sorry, I couldn't generate an explanation." });
    }
  };

  const handlePersonalizePractice = async (practiceId: string, personalizedSteps: string[]) => {
    setPracticeStack(prev => prev.map(p => {
      if (p.id === practiceId) {
        return { ...p, how: personalizedSteps, name: `${p.name} (Personalized)` };
      }
      return p;
    }));
    setCustomizationModalPractice(null);
  };
  
  const getStreak = (practiceId: string) => {
      const dates = completionHistory[practiceId] || [];
      if (dates.length === 0) return 0;
      const sortedDates = [...new Set(dates)].sort().reverse();
      let streak = 0;
      let expectedDate = new Date();
      expectedDate.setHours(0,0,0,0);

      for(const dateStr of sortedDates) {
          const d = new Date(dateStr);
          d.setHours(0,0,0,0);
          if (d.getTime() === expectedDate.getTime()) {
              streak++;
              expectedDate.setDate(expectedDate.getDate() - 1);
          } else {
              break;
          }
      }
      return streak;
  }
  
  const handleSaveBiasSession = async (session: BiasDetectiveSession) => {
    setHistoryBias(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftBias(null);
    setActiveWizard(null);
    const report = `# Bias Detective: ${session.decisionText}\n- Diagnosis: ${session.diagnosis}\n- Takeaway: ${session.oneThingToRemember}`;
    const insight = await geminiService.detectPatternsAndSuggestShadowWork(
      'Bias Detective', session.id, report, Object.values(corePractices.shadow)
    );
    if (insight) setIntegratedInsights(prev => [...prev, insight]);
  };
  
  const handleSaveSOSession = async (session: SubjectObjectSession) => {
    setHistorySO(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftSO(null);
    setActiveWizard(null);
    const report = `# S-O Explorer: ${session.pattern}\n- Subject to: ${session.subjectToStatement}\n- Insight: ${session.integrationShift}`;
    const insight = await geminiService.detectPatternsAndSuggestShadowWork(
      'Subject-Object Explorer', session.id, report, Object.values(corePractices.shadow)
    );
    if (insight) setIntegratedInsights(prev => [...prev, insight]);
  };

  const handleSavePSSession = async (session: PerspectiveShifterSession) => {
    setHistoryPS(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftPS(null);
    setActiveWizard(null);
    const report = `# P-S Shifter: ${session.stuckSituation}\n- Synthesis: ${session.synthesis}\n- Action Plan: ${session.realityCheckRefinement}`;
    const insight = await geminiService.detectPatternsAndSuggestShadowWork(
      'Perspective-Shifter', session.id, report, Object.values(corePractices.shadow)
    );
    if (insight) setIntegratedInsights(prev => [...prev, insight]);
  };
  
  const handleSavePMSession = async (map: PolarityMap) => {
    setHistoryPM(prev => [...prev.filter(m => m.id !== map.id), map]);
    setDraftPM(null);
    setActiveWizard(null);
    const report = `# Polarity Map: ${map.dilemma}\n- Pole A: ${map.poleA_name}\n- Pole B: ${map.poleB_name}`;
    const insight = await geminiService.detectPatternsAndSuggestShadowWork(
      'Polarity Mapper', map.id, report, Object.values(corePractices.shadow)
    );
    if (insight) setIntegratedInsights(prev => [...prev, insight]);
  };

  const handleSaveKeganSession = (session: KeganAssessmentSession) => {
    setHistoryKegan(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftKegan(null);
    setActiveWizard(null);
  };

  const handleSaveRelationalSession = (session: RelationalPatternSession) => {
    setHistoryRelational(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftRelational(null);
    setActiveWizard(null);
  };

  const handleSave321Session = (session: ThreeTwoOneSession) => {
    setHistory321(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraft321(null);
    setActiveWizard(null);
  };
  
  const handleSaveIFSSession = (session: IFSSession) => {
    setHistoryIFS(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftIFS(null);
    setActiveWizard(null);
    if (session.partId && session.partName) {
      const newPart: IFSPart = {
        id: session.partId, name: session.partName, role: session.partRole || 'Unknown',
        fears: session.partFears || 'Unknown', positiveIntent: session.partPositiveIntent || 'Unknown',
        lastSessionDate: session.date
      };
      setPartsLibrary(prev => {
        const existing = prev.find(p => p.id === newPart.id);
        if (existing) return prev.map(p => p.id === newPart.id ? newPart : p);
        return [...prev, newPart];
      });
    }
  };
  
  const handleSaveSomaticPractice = (session: SomaticPracticeSession) => {
    setSomaticPracticeHistory(prev => [...prev.filter(s => s.id !== session.id), session]);
    alert(`Practice "${session.title}" saved! You can find it in your Library.`);
    setActiveTab('library');
  };

  const markInsightAsAddressed = (insightId: string, shadowToolType: string, shadowSessionId: string) => {
    setIntegratedInsights(prev => prev.map(insight => {
        if (insight.id === insightId) {
            return {
                ...insight,
                status: 'addressed',
                shadowWorkSessionsAddressed: [
                    ...(insight.shadowWorkSessionsAddressed || []),
                    { shadowToolType, shadowSessionId, dateCompleted: new Date().toISOString() }
                ]
            };
        }
        return insight;
    }));
  };

  const handleExport = () => {
    const data = {
        practiceStack, practiceNotes, dailyNotes, completionHistory,
        history321, historyIFS, historyBias, historySO, historyPS, historyPM, historyKegan,
        partsLibrary, integratedInsights, aqalReport, somaticPracticeHistory
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    if (window.confirm('This will overwrite all current data. Are you sure?')) {
                        setPracticeStack(data.practiceStack || []);
                        setPracticeNotes(data.practiceNotes || {});
                        setDailyNotes(data.dailyNotes || {});
                        setCompletionHistory(data.completionHistory || {});
                        setHistory321(data.history321 || []);
                        setHistoryIFS(data.historyIFS || []);
                        setHistoryBias(data.historyBias || []);
                        setHistorySO(data.historySO || []);
                        setHistoryPS(data.historyPS || []);
                        setHistoryPM(data.historyPM || []);
                        setHistoryKegan(data.historyKegan || []);
                        setPartsLibrary(data.partsLibrary || []);
                        setIntegratedInsights(data.integratedInsights || []);
                        setAqalReport(data.aqalReport || null);
                        setSomaticPracticeHistory(data.somaticPracticeHistory || []);
                        alert('Data imported successfully!');
                    }
                } catch (err) {
                    alert('Error importing file. It may be corrupted.');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
  };

  const handleReset = () => {
      if (window.confirm('ARE YOU SURE? This will delete all your data permanently and cannot be undone.')) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab openGuidedPracticeGenerator={() => setIsGuidedPracticeGeneratorOpen(true)} setActiveTab={setActiveTab} integratedInsights={integratedInsights} markInsightAsAddressed={markInsightAsAddressed} setActiveWizard={setActiveWizardAndLink} />;
      case 'stack': return <StackTab practiceStack={practiceStack} removeFromStack={removeFromStack} practiceNotes={practiceNotes} updatePracticeNote={updatePracticeNote} openCustomPracticeModal={() => setIsCustomPracticeModalOpen(true)} openGuidedPracticeGenerator={() => setIsGuidedPracticeGeneratorOpen(true)} />;
      case 'browse': return <BrowseTab practiceStack={practiceStack} addToStack={addToStack} onExplainClick={handleExplainPractice} onPersonalizeClick={setCustomizationModalPractice} />;
      case 'tracker': return <TrackerTab practiceStack={practiceStack} completedPractices={completedToday} togglePracticeCompletion={togglePracticeCompletion} dailyNotes={dailyNotes} updateDailyNote={updateDailyNote} findModuleKey={findModuleKey} />;
      case 'streaks': return <StreaksTab practiceStack={practiceStack} completionHistory={completionHistory} findModuleKey={findModuleKey} />;
      case 'recommendations': return <RecommendationsTab starterStacks={starterStacks} applyStarterStack={applyStarterStack} recommendations={recommendations} isLoading={aiLoading} error={aiError} onGenerate={generateRecommendations} />;
      case 'aqal': return <AqalTab report={aqalReport} isLoading={aiLoading} error={aiError} onGenerate={generateAqalReport} />;
      case 'mind-tools': return <MindToolsTab setActiveWizard={setActiveWizardAndLink} />;
      // FIX: Changed prop `setDraftIFSSession` to `setDraftIFS` to match the updated ShadowToolsTabProps interface.
      case 'shadow-tools': return <ShadowToolsTab onStart321={(id) => setActiveWizardAndLink('321', id)} onStartIFS={(id) => setActiveWizardAndLink('ifs', id)} setActiveWizard={setActiveWizardAndLink} sessionHistory321={history321} sessionHistoryIFS={historyIFS} draft321Session={draft321} draftIFSSession={draftIFS} setDraft321Session={setDraft321} setDraftIFS={setDraftIFS} partsLibrary={partsLibrary} markInsightAsAddressed={markInsightAsAddressed} />;
      case 'body-tools': return <BodyToolsTab setActiveWizard={setActiveWizardAndLink} />; // NEW: BodyToolsTab
      case 'library': return <LibraryTab />;
      default: return <DashboardTab openGuidedPracticeGenerator={() => setIsGuidedPracticeGeneratorOpen(true)} setActiveTab={setActiveTab} integratedInsights={integratedInsights} markInsightAsAddressed={markInsightAsAddressed} setActiveWizard={setActiveWizardAndLink} />;
    }
  };

  const getActiveInsightContext = () => {
    if (!linkedInsightId) return null;
    return integratedInsights.find(i => i.id === linkedInsightId) || null;
  }
  
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} onExport={handleExport} onImport={handleImport} onReset={handleReset} />
      <main className="flex-1 overflow-y-auto p-8">
        {renderActiveTab()}
      </main>
      <Coach 
          practiceStack={practiceStack}
          completedCount={Object.values(completedToday).filter(Boolean).length}
          completionRate={practiceStack.length > 0 ? (Object.values(completedToday).filter(Boolean).length / practiceStack.length) * 100 : 0}
          timeCommitment={practiceStack.reduce((sum, p) => sum + p.timePerWeek, 0)}
          timeIndicator={"Balanced"}
          modules={modules}
          getStreak={getStreak}
          practiceNotes={practiceNotes}
          dailyNotes={dailyNotes}
      />
      {infoModalPractice && <PracticeInfoModal practice={infoModalPractice} onClose={() => setInfoModalPractice(null)} onAdd={addToStack} isInStack={practiceStack.some(p => p.id === infoModalPractice.id)} onExplainClick={handleExplainPractice} onPersonalizeClick={setCustomizationModalPractice} />}
      {explanationModal.isOpen && <PracticeExplanationModal isOpen={explanationModal.isOpen} onClose={() => setExplanationModal({ isOpen: false, title: '', explanation: '' })} title={explanationModal.title} explanation={explanationModal.explanation} />}
      {customizationModalPractice && <PracticeCustomizationModal practice={customizationModalPractice} onClose={() => setCustomizationModalPractice(null)} onSave={handlePersonalizePractice} />}
      {isCustomPracticeModalOpen && <CustomPracticeModal isOpen={isCustomPracticeModalOpen} onClose={() => setIsCustomPracticeModalOpen(false)} onSave={handleSaveCustomPractice} />}
      {isGuidedPracticeGeneratorOpen && <GuidedPracticeGenerator isOpen={isGuidedPracticeGeneratorOpen} onClose={() => setIsGuidedPracticeGeneratorOpen(false)} onLogPractice={() => alert('Practice logged!')} />}
      {activeWizard === '321' && <ThreeTwoOneWizard onClose={() => setActiveWizard(null)} onSave={handleSave321Session} session={draft321} insightContext={getActiveInsightContext()} markInsightAsAddressed={markInsightAsAddressed} />}
      {activeWizard === 'ifs' && <IFSWizard isOpen={true} onClose={(draft) => { setDraftIFS(draft); setActiveWizard(null); }} onSaveSession={handleSaveIFSSession} draft={draftIFS} partsLibrary={partsLibrary} insightContext={getActiveInsightContext()} markInsightAsAddressed={markInsightAsAddressed}/>}
      {activeWizard === 'bias' && <BiasDetectiveWizard onClose={() => setActiveWizard(null)} onSave={handleSaveBiasSession} session={draftBias} setDraft={setDraftBias} />}
      {activeWizard === 'so' && <SubjectObjectWizard onClose={() => setActiveWizard(null)} onSave={handleSaveSOSession} session={draftSO} setDraft={setDraftSO} />}
      {activeWizard === 'ps' && <PerspectiveShifterWizard onClose={() => setActiveWizard(null)} onSave={handleSavePSSession} session={draftPS} setDraft={setDraftPS} />}
      {activeWizard === 'pm' && <PolarityMapperWizard onClose={() => setActiveWizard(null)} onSave={handleSavePMSession} draft={draftPM} setDraft={setDraftPM} />}
      {activeWizard === 'kegan' && <KeganAssessmentWizard onClose={() => setActiveWizard(null)} onSave={handleSaveKeganSession} session={draftKegan} setDraft={setDraftKegan} />}
      {activeWizard === 'relational' && <RelationalPatternChatbot onClose={() => setActiveWizard(null)} onSave={handleSaveRelationalSession} session={draftRelational} setDraft={setDraftRelational} />}
      {activeWizard === 'somatic' && <SomaticGeneratorWizard onClose={() => setActiveWizard(null)} onSave={handleSaveSomaticPractice} />}
    </div>
  );
}