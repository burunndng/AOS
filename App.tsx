// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import NavSidebar from './components/NavSidebar.tsx';
import DashboardTab from './components/DashboardTab.tsx';
import StackTab from './components/StackTab.tsx';
import BrowseTab from './components/BrowseTab.tsx';
import TrackerTab from './components/TrackerTab.tsx';
import StreaksTab from './components/StreaksTab.tsx';
import RecommendationsTab from './components/RecommendationsTab.tsx';
import AqalTab from './components/AqalTab.tsx';
// FIX: Add file extension to import path.
import LibraryTab from './components/LibraryTab.tsx';
import Coach from './components/Coach.tsx';
import CustomPracticeModal from './components/CustomPracticeModal.tsx';
import PracticeCustomizationModal from './components/PracticeCustomizationModal.tsx';
import PracticeInfoModal from './components/PracticeInfoModal.tsx';
import PracticeExplanationModal from './components/PracticeExplanationModal.tsx';
import GuidedPracticeGenerator from './components/GuidedPracticeGenerator.tsx';
import MindToolsTab from './components/MindToolsTab.tsx';
import ShadowToolsTab from './components/ShadowToolsTab.tsx';
// FIX: Add file extension to import path.
import BiasDetectiveWizard from './components/BiasDetectiveWizard.tsx';
import SubjectObjectWizard from './components/SubjectObjectWizard.tsx';
import PerspectiveShifterWizard from './components/PerspectiveShifterWizard.tsx';
import PolarityMapperWizard from './components/PolarityMapperWizard.tsx';
import ThreeTwoOneWizard from './components/ThreeTwoOneWizard.tsx';
import IFSWizard from './components/IFSWizard.tsx';

import { 
    AllPractice, ActiveTab, Practice, CustomPractice, ModuleKey, AqalReportData,
    ThreeTwoOneSession, IFSSession, IFSPart, BiasDetectiveSession, SubjectObjectSession,
    PerspectiveShifterSession, PolarityMap
} from './types.ts';
import { starterStacks, practices as corePractices, modules } from './constants.ts';
import * as geminiService from './services/geminiService.ts';

// Custom hook for managing state with localStorage persistence
const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = window.localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
};

export default function App() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
    const [practiceStack, setPracticeStack] = usePersistentState<AllPractice[]>('practiceStack', []);
    const [completionHistory, setCompletionHistory] = usePersistentState<Record<string, string[]>>('completionHistory', {});
    const [practiceNotes, setPracticeNotes] = usePersistentState<Record<string, string>>('practiceNotes', {});
    const [dailyNotes, setDailyNotes] = usePersistentState<Record<string, string>>('dailyNotes', {});

    // Modals
    const [isCustomPracticeModalOpen, setIsCustomPracticeModalOpen] = useState(false);
    const [isGuidedPracticeModalOpen, setIsGuidedPracticeModalOpen] = useState(false);
    const [customizationPractice, setCustomizationPractice] = useState<Practice | null>(null);
    const [infoModalPractice, setInfoModalPractice] = useState<Practice | null>(null);
    const [explanationModal, setExplanationModal] = useState<{ practice: Practice; explanation: string; } | null>(null);

    // AI-generated content state
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [aqalReport, setAqalReport] = useState<AqalReportData | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    
    // Tool Wizards State
    const [activeWizard, setActiveWizard] = useState<string | null>(null);
    // -- 3-2-1
    const [sessionHistory321, setSessionHistory321] = usePersistentState<ThreeTwoOneSession[]>('sessionHistory321', []);
    const [draft321Session, setDraft321Session] = usePersistentState<Partial<ThreeTwoOneSession> | null>('draft321', null);
    // -- IFS
    const [sessionHistoryIFS, setSessionHistoryIFS] = usePersistentState<IFSSession[]>('sessionHistoryIFS', []);
    const [partsLibrary, setPartsLibrary] = usePersistentState<IFSPart[]>('partsLibrary', []);
    const [draftIFSSession, setDraftIFSSession] = usePersistentState<IFSSession | null>('draftIFS', null);
    // -- Bias Detective
    const [sessionHistoryBias, setSessionHistoryBias] = usePersistentState<BiasDetectiveSession[]>('sessionHistoryBias', []);
    const [draftBiasSession, setDraftBiasSession] = usePersistentState<BiasDetectiveSession | null>('draftBias', null);
    // -- Subject-Object
    const [sessionHistorySO, setSessionHistorySO] = usePersistentState<SubjectObjectSession[]>('sessionHistorySO', []);
    const [draftSOSession, setDraftSOSession] = usePersistentState<SubjectObjectSession | null>('draftSO', null);
    // -- Perspective Shifter
    const [sessionHistoryPS, setSessionHistoryPS] = usePersistentState<PerspectiveShifterSession[]>('sessionHistoryPS', []);
    const [draftPSSession, setDraftPSSession] = usePersistentState<PerspectiveShifterSession | null>('draftPS', null);
    // -- Polarity Mapper
    const [polarityMapHistory, setPolarityMapHistory] = usePersistentState<PolarityMap[]>('polarityMapHistory', []);
    const [draftPolarityMap, setDraftPolarityMap] = usePersistentState<Partial<PolarityMap> | null>('draftPolarity', null);
    
    // --- Practice Management ---
    const addToStack = (practice: Practice) => {
        if (!practiceStack.some(p => p.id === practice.id)) {
            setPracticeStack(prev => [...prev, practice]);
        }
    };

    const removeFromStack = (practiceId: string) => {
        setPracticeStack(prev => prev.filter(p => p.id !== practiceId));
    };

    const applyStarterStack = (practiceIds: string[]) => {
        const practicesToAdd = Object.values(corePractices).flat().filter(p => practiceIds.includes(p.id));
        setPracticeStack(practicesToAdd);
        setActiveTab('stack');
    };

    const updatePracticeNote = (practiceId: string, note: string) => {
        setPracticeNotes(prev => ({ ...prev, [practiceId]: note }));
    };

    const handleSaveCustomPractice = (practice: CustomPractice, module: ModuleKey) => {
        setPracticeStack(prev => [...prev, { ...practice, module }]);
        setIsCustomPracticeModalOpen(false);
    };
    
    const handleSavePersonalizedPractice = (practiceId: string, personalizedSteps: string[]) => {
        const practiceToAdd = Object.values(corePractices).flat().find(p => p.id === practiceId);
        if(practiceToAdd) {
            const personalizedPractice: AllPractice = { ...practiceToAdd, how: personalizedSteps };
            setPracticeStack(prev => [...prev, personalizedPractice]);
        }
        setCustomizationPractice(null);
    };

    const handleExplainPractice = async (practice: Practice) => {
        setIsAiLoading(true);
        setExplanationModal({ practice, explanation: 'Aura is thinking...' });
        try {
            // FIX: Corrected function call to `geminiService.explainPractice` which was missing.
            const explanation = await geminiService.explainPractice(practice);
            setExplanationModal({ practice, explanation });
        } catch (e) {
            setExplanationModal({ practice, explanation: 'Sorry, I had trouble generating an explanation.' });
        } finally {
            setIsAiLoading(false);
        }
    };


    // --- Daily Tracking ---
    const todayKey = new Date().toISOString().split('T')[0];
    const completedPractices = completionHistory[todayKey] ? completionHistory[todayKey].reduce((acc, pId) => ({ ...acc, [pId]: true }), {}) : {};

    const togglePracticeCompletion = (practiceId: string) => {
        setCompletionHistory(prev => {
            const todayHistory = prev[todayKey] || [];
            const newTodayHistory = todayHistory.includes(practiceId)
                ? todayHistory.filter(id => id !== practiceId)
                : [...todayHistory, practiceId];
            return { ...prev, [todayKey]: newTodayHistory };
        });
    };

    const updateDailyNote = (practiceId: string, note: string) => {
        const noteKey = `${practiceId}-${todayKey}`;
        setDailyNotes(prev => ({ ...prev, [noteKey]: note }));
    };

    const findModuleKey = useCallback((practiceId: string): ModuleKey => {
        const practice = practiceStack.find(p => p.id === practiceId);
        if (practice && 'isCustom' in practice && practice.isCustom) return practice.module;
        for (const key in corePractices) {
            if (corePractices[key as ModuleKey].some(p => p.id === practiceId)) {
                return key as ModuleKey;
            }
        }
        return 'mind'; // Fallback
    }, [practiceStack]);
    
    // --- AI Generation ---
    const generateAiContent = async (type: 'recommendations' | 'aqal') => {
        setIsAiLoading(true);
        setAiError(null);
        try {
            const context = `
                Current Date: ${todayKey}
                Practice Stack (${practiceStack.length} practices): ${practiceStack.map(p => p.name).join(', ')}
                Today's Completion: ${Object.values(completedPractices).filter(Boolean).length}/${practiceStack.length}
                Recent Notes: ${Object.entries(dailyNotes).slice(-5).map(([key, val]) => `${key}: ${val}`).join('\n')}
            `;
            if (type === 'recommendations') {
                const recs = await geminiService.generateRecommendations(context);
                setRecommendations(recs);
            } else {
                const report = await geminiService.generateAqalReport(context);
                setAqalReport(report);
            }
        } catch (err) {
            setAiError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsAiLoading(false);
        }
    };
    
    // --- Data Management ---
    const handleExport = () => {
        const data = {
            practiceStack, completionHistory, practiceNotes, dailyNotes, 
            sessionHistory321, draft321Session,
            sessionHistoryIFS, draftIFSSession, partsLibrary,
            sessionHistoryBias, draftBiasSession,
            sessionHistorySO, draftSOSession,
            sessionHistoryPS, draftPSSession,
            polarityMapHistory, draftPolarityMap
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aura-ilp-backup-${todayKey}.json`;
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
                        if (window.confirm("This will overwrite all your current data. This action cannot be undone. Are you sure?")) {
                            
                            const allKeys = ['practiceStack', 'completionHistory', 'practiceNotes', 'dailyNotes', 'sessionHistory321', 'draft321', 'sessionHistoryIFS', 'draftIFS', 'partsLibrary', 'sessionHistoryBias', 'draftBias', 'sessionHistorySO', 'draftSO', 'sessionHistoryPS', 'draftPS', 'polarityMapHistory', 'draftPolarity'];
                            
                            allKeys.forEach(key => {
                                const storageKey = key.replace(/Session|History/g, ''); // a bit of a hack to match the hook keys
                                if(data[key] !== undefined) {
                                     window.localStorage.setItem(key, JSON.stringify(data[key]));
                                } else {
                                     window.localStorage.removeItem(key); // remove if not in backup
                                }
                            });
                            
                            alert("Data imported successfully! The application will now reload.");
                            setTimeout(() => window.location.reload(), 300);
                        }
                    } catch (err) {
                        alert("Failed to import data. The file appears to be invalid.");
                        console.error("Import Error:", err);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const handleReset = () => {
        if (window.confirm("This will permanently delete all your data. This action cannot be undone. Are you sure?")) {
             localStorage.clear();
             window.location.reload();
        }
    };
    
    // --- Wizard Save Handlers ---
    const handleSave321 = (session: ThreeTwoOneSession) => {
        setSessionHistory321(prev => [...prev.filter(s => s.id !== session.id), session]);
        setDraft321Session(null);
        setActiveWizard(null);
    };
    const handleSaveIFS = (session: IFSSession) => {
        setSessionHistoryIFS(prev => [...prev.filter(s => s.id !== session.id), session]);
        if (session.partName) {
            const partExists = partsLibrary.some(p => p.id === session.partId);
            const newPart: IFSPart = {
                id: session.partId, name: session.partName, role: session.partRole || '',
                fears: session.partFears || '', positiveIntent: session.partPositiveIntent || '',
                lastActive: new Date().toISOString()
            };
            if (partExists) {
                setPartsLibrary(prev => prev.map(p => p.id === session.partId ? newPart : p));
            } else {
                setPartsLibrary(prev => [...prev, newPart]);
            }
        }
        setDraftIFSSession(null);
        setActiveWizard(null);
    };
    const handleSaveBias = (session: BiasDetectiveSession) => {
        setSessionHistoryBias(prev => [...prev.filter(s => s.id !== session.id), session]);
        setDraftBiasSession(null);
        setActiveWizard(null);
    };
    const handleSaveSO = (session: SubjectObjectSession) => {
        setSessionHistorySO(prev => [...prev.filter(s => s.id !== session.id), session]);
        setDraftSOSession(null);
        setActiveWizard(null);
    };
    const handleSavePS = (session: PerspectiveShifterSession) => {
        setSessionHistoryPS(prev => [...prev.filter(s => s.id !== session.id), session]);
        setDraftPSSession(null);
        setActiveWizard(null);
    };
    const handleSavePolarity = (map: PolarityMap) => {
        setPolarityMapHistory(prev => [...prev.filter(m => m.id !== map.id), map]);
        setDraftPolarityMap(null);
        setActiveWizard(null);
    };

    // --- Render logic ---
    const completedCount = Object.values(completedPractices).filter(Boolean).length;
    const timeCommitment = practiceStack.reduce((sum, p) => sum + p.timePerWeek, 0);

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardTab openGuidedPracticeGenerator={() => setIsGuidedPracticeModalOpen(true)} setActiveTab={setActiveTab} />;
            case 'stack': return <StackTab practiceStack={practiceStack} removeFromStack={removeFromStack} practiceNotes={practiceNotes} updatePracticeNote={updatePracticeNote} openCustomPracticeModal={() => setIsCustomPracticeModalOpen(true)} openGuidedPracticeGenerator={() => setIsGuidedPracticeModalOpen(true)} />;
            case 'browse': return <BrowseTab practiceStack={practiceStack} addToStack={addToStack} onExplainClick={handleExplainPractice} onPersonalizeClick={setCustomizationPractice} />;
            case 'tracker': return <TrackerTab practiceStack={practiceStack} completedPractices={completedPractices} togglePracticeCompletion={togglePracticeCompletion} dailyNotes={dailyNotes} updateDailyNote={updateDailyNote} findModuleKey={findModuleKey} />;
            case 'streaks': return <StreaksTab practiceStack={practiceStack} completionHistory={completionHistory} findModuleKey={findModuleKey} />;
            case 'recommendations': return <RecommendationsTab starterStacks={starterStacks} applyStarterStack={applyStarterStack} recommendations={recommendations} isLoading={isAiLoading} error={aiError} onGenerate={() => generateAiContent('recommendations')} />;
            case 'aqal': return <AqalTab report={aqalReport} isLoading={isAiLoading} error={aiError} onGenerate={() => generateAiContent('aqal')} />;
            case 'library': return <LibraryTab />;
            case 'mind-tools': return <MindToolsTab onStartBiasDetective={() => setActiveWizard('bias')} sessionHistoryBias={sessionHistoryBias} draftBiasSession={draftBiasSession} onStartSubjectObject={()=>setActiveWizard('so')} sessionHistorySO={sessionHistorySO} draftSOSession={draftSOSession} onStartPerspectiveShifter={()=>setActiveWizard('ps')} sessionHistoryPS={sessionHistoryPS} draftPSSession={draftPSSession} onStartPolarityMapper={()=>setActiveWizard('polarity')} polarityMapHistory={polarityMapHistory} draftPolarityMap={draftPolarityMap} />;
            case 'shadow-tools': return <ShadowToolsTab onStart321={()=>setActiveWizard('321')} onStartIFS={()=>setActiveWizard('ifs')} sessionHistory321={sessionHistory321} sessionHistoryIFS={sessionHistoryIFS} draft321Session={draft321Session} draftIFSSession={draftIFSSession} setDraft321Session={setDraft321Session} setDraftIFSSession={setDraftIFSSession} partsLibrary={partsLibrary} />;
            default: return <DashboardTab openGuidedPracticeGenerator={() => setIsGuidedPracticeModalOpen(true)} setActiveTab={setActiveTab} />;
        }
    };
    
    return (
        <div className="text-slate-300 h-full flex font-sans">
            <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} onExport={handleExport} onImport={handleImport} onReset={handleReset} />
            <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
                {renderActiveTab()}
            </main>
            <Coach 
                practiceStack={practiceStack} 
                completedCount={completedCount}
                completionRate={practiceStack.length > 0 ? (completedCount / practiceStack.length) * 100 : 0}
                timeCommitment={timeCommitment}
                timeIndicator={timeCommitment > 10 ? 'High' : timeCommitment > 5 ? 'Medium' : 'Low'}
                modules={modules}
                getStreak={(pId) => 0} // Placeholder
                practiceNotes={practiceNotes}
                dailyNotes={dailyNotes}
            />
            {isCustomPracticeModalOpen && <CustomPracticeModal isOpen={isCustomPracticeModalOpen} onClose={() => setIsCustomPracticeModalOpen(false)} onSave={handleSaveCustomPractice} />}
            {customizationPractice && <PracticeCustomizationModal practice={customizationPractice} onClose={() => setCustomizationPractice(null)} onSave={handleSavePersonalizedPractice} />}
            {explanationModal && <PracticeExplanationModal isOpen={!!explanationModal} onClose={() => setExplanationModal(null)} title={explanationModal.practice.name} explanation={explanationModal.explanation} />}
            {isGuidedPracticeModalOpen && <GuidedPracticeGenerator isOpen={isGuidedPracticeModalOpen} onClose={() => setIsGuidedPracticeModalOpen(false)} onLogPractice={() => { /* Implement logging */ }} />}
            
            {/* Wizards */}
            {activeWizard === '321' && <ThreeTwoOneWizard onClose={() => setActiveWizard(null)} onSave={handleSave321} session={draft321Session} />}
            {activeWizard === 'ifs' && <IFSWizard isOpen={true} onClose={(draft)=> { setDraftIFSSession(draft); setActiveWizard(null); }} onSaveSession={handleSaveIFS} draft={draftIFSSession} partsLibrary={partsLibrary} />}
            {activeWizard === 'bias' && <BiasDetectiveWizard onClose={() => setActiveWizard(null)} onSave={handleSaveBias} session={draftBiasSession} setDraft={setDraftBiasSession} />}
            {activeWizard === 'so' && <SubjectObjectWizard onClose={() => setActiveWizard(null)} onSave={handleSaveSO} session={draftSOSession} setDraft={setDraftSOSession} />}
            {activeWizard === 'ps' && <PerspectiveShifterWizard onClose={() => setActiveWizard(null)} onSave={handleSavePS} session={draftPSSession} setDraft={setDraftPSSession} />}
            {activeWizard === 'polarity' && <PolarityMapperWizard onClose={() => setActiveWizard(null)} onSave={handleSavePolarity} draft={draftPolarityMap} setDraft={setDraftPolarityMap} />}
        </div>
    );
}