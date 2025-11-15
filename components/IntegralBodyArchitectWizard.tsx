import React, { useMemo, useState, useCallback } from 'react';
import { X, ArrowRight, Heart, Dumbbell, Wind, CheckCircle, Download, Play, ChevronDown, ChevronUp, Share2, AlertCircle, Plus, Trash2, Clock, FileText, User, Target } from 'lucide-react';
import {
  IntegralBodyPlan,
  YangConstraints,
  YinPreferences,
  YinPracticeGoal,
  DayPlan,
  YinPracticeDetail,
  WorkoutRoutine,
  PersonalizationSummary,
  TimeWindow,
  InjuryRestriction
} from '../types.ts';
import { generateIntegralWeeklyPlan } from '../services/integralBodyArchitectService.ts';
import { formatIntegralBodyPlanAsText, downloadAsFile } from '../services/planExportUtils.ts';

interface PracticeHandoffPayload {
  name: string;
  intention: string;
  instructions: string[];
  duration?: number;
  timeOfDay?: string;
  dayName?: string;
}

interface WorkoutHandoffPayload {
  name: string;
  exercises: WorkoutRoutine['exercises'];
  notes?: string;
  duration?: number;
  dayName?: string;
}

interface IntegralBodyArchitectWizardProps {
  onClose: () => void;
  onSave: (plan: IntegralBodyPlan) => void;
  onLaunchYinPractice?: (payload: PracticeHandoffPayload) => void;
  onLaunchYangPractice?: (payload: WorkoutHandoffPayload) => void;
  personalizationSummary?: PersonalizationSummary | null;
}

type WizardStep = 'BLUEPRINT' | 'SYNTHESIS' | 'DELIVERY' | 'HANDOFF';

type TimeSlotKey = 'morning' | 'midmorning' | 'midday' | 'afternoon' | 'evening' | 'winddown' | 'bedtime';

const YIN_GOAL_OPTIONS: { value: YinPracticeGoal; label: string; description: string; }[] = [
  { value: 'reduce-stress', label: 'Reduce Stress', description: 'Calm the nervous system, release tension' },
  { value: 'increase-focus', label: 'Increase Focus', description: 'Sharpen attention, mental clarity' },
  { value: 'wind-down', label: 'Wind Down', description: 'Prepare for restful sleep' },
  { value: 'increase-energy', label: 'Increase Energy', description: 'Energize body and mind' },
  { value: 'balance', label: 'Balance', description: 'Mix of grounding and energizing' },
];

const EQUIPMENT_OPTIONS = ['bodyweight', 'dumbbells', 'barbell', 'full-gym', 'resistance-bands', 'kettlebells'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_OF_DAY_SLOTS: Record<TimeSlotKey, { label: string; hour: number; minute: number }> = {
  morning: { label: 'Morning', hour: 7, minute: 0 },
  midmorning: { label: 'Mid-Morning', hour: 9, minute: 30 },
  midday: { label: 'Midday', hour: 12, minute: 0 },
  afternoon: { label: 'Afternoon', hour: 16, minute: 0 },
  evening: { label: 'Evening', hour: 19, minute: 30 },
  winddown: { label: 'Wind Down', hour: 21, minute: 0 },
  bedtime: { label: 'Before Bed', hour: 21, minute: 30 }
};

// Pre-compile regex patterns for O(1) access and faster matching
const TIME_KEYWORDS: { pattern: RegExp; slot: TimeSlotKey }[] = [
  { pattern: /(early\s*)?morning/i, slot: 'morning' },
  { pattern: /(mid\s*-?morning|late morning)/i, slot: 'midmorning' },
  { pattern: /(mid\s*-?day|lunch|noon)/i, slot: 'midday' },
  { pattern: /(afternoon)/i, slot: 'afternoon' },
  { pattern: /(evening|after dinner)/i, slot: 'evening' },
  { pattern: /(wind[- ]?down|30 ?min before bed|pre-bed)/i, slot: 'winddown' },
  { pattern: /(bedtime|before sleep|night)/i, slot: 'bedtime' }
];

// Cache for time slot inference to avoid repeated regex matching
const timeSlotCache = new Map<string | undefined, { hour: number; minute: number }>();

const DEFAULT_WORKOUT_SLOT: TimeSlotKey = 'morning';
const DEFAULT_PRACTICE_SLOT: TimeSlotKey = 'evening';

export default function IntegralBodyArchitectWizard({
  onClose,
  onSave,
  onLaunchYinPractice,
  onLaunchYangPractice,
  personalizationSummary
}: IntegralBodyArchitectWizardProps) {
  const [step, setStep] = useState<WizardStep>('BLUEPRINT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [goalStatement, setGoalStatement] = useState('');

  // PHASE 1: Core Biometrics
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('male');
  const [height, setHeight] = useState('');
  const [bodyweight, setBodyweight] = useState('');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'athlete'>('lightly-active');

  // PHASE 1: Training Background
  const [strengthTrainingExperience, setStrengthTrainingExperience] = useState<'never' | 'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [primaryGoal, setPrimaryGoal] = useState<'lose-fat' | 'gain-muscle' | 'recomp' | 'maintain' | 'performance' | 'general-health'>('general-health');

  // PHASE 1: Session Constraints
  const [maxWorkoutDuration, setMaxWorkoutDuration] = useState('60');
  const [preferredWorkoutTimes, setPreferredWorkoutTimes] = useState<('morning' | 'afternoon' | 'evening')[]>([]);
  const [sleepHours, setSleepHours] = useState('8');
  const [equipment, setEquipment] = useState<string[]>(['bodyweight']);
  const [unavailableDays, setUnavailableDays] = useState<string[]>([]);

  // Existing fields
  const [nutritionFocus, setNutritionFocus] = useState('');
  const [additionalConstraints, setAdditionalConstraints] = useState('');

  const [yinGoal, setYinGoal] = useState<YinPracticeGoal>('reduce-stress');
  const [yinExperience, setYinExperience] = useState<'Beginner' | 'Intermediate'>('Beginner');
  const [yinIntentions, setYinIntentions] = useState('');
  const [yinNotes, setYinNotes] = useState('');

  // Advanced fields
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [injuryRestrictions, setInjuryRestrictions] = useState<InjuryRestriction[]>([]);
  const [availableTimeWindows, setAvailableTimeWindows] = useState<TimeWindow[]>([]);

  const [generatedPlan, setGeneratedPlan] = useState<IntegralBodyPlan | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const toggleEquipment = (item: string) => {
    setEquipment(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]));
  };

  const toggleUnavailableDay = (day: string) => {
    setUnavailableDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));
  };

  const togglePreferredWorkoutTime = (time: 'morning' | 'afternoon' | 'evening') => {
    setPreferredWorkoutTimes(prev => (prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]));
  };

  const handleGenerate = async () => {
    if (!goalStatement.trim()) {
      setError('Please define your goal for the week.');
      return;
    }

    // Validation for required fields
    if (!age || !height || !bodyweight) {
      setError('Please fill in all required biometric fields (Age, Height, Weight).');
      return;
    }

    setError('');
    setIsLoading(true);
    setStep('SYNTHESIS');

    try {
      const yangConstraints: YangConstraints = {
        // PHASE 1: Core Biometrics
        age: age ? parseInt(age) : undefined,
        sex,
        height: height ? parseFloat(height) : undefined,
        bodyweight: bodyweight ? parseFloat(bodyweight) : undefined,
        activityLevel,

        // PHASE 1: Training Background
        strengthTrainingExperience,
        primaryGoal,

        // PHASE 1: Session Constraints
        maxWorkoutDuration: maxWorkoutDuration ? parseInt(maxWorkoutDuration) : undefined,
        preferredWorkoutTimes: preferredWorkoutTimes.length > 0 ? preferredWorkoutTimes : undefined,
        sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
        equipment,
        unavailableDays,

        // Advanced Constraints
        availableTimeWindows: availableTimeWindows.length > 0 ? availableTimeWindows : undefined,
        injuryRestrictions: injuryRestrictions.length > 0 ? injuryRestrictions : undefined,
        nutritionFocus: nutritionFocus || undefined,
        additionalConstraints: additionalConstraints || undefined,
      };

      const yinPreferences: YinPreferences = {
        goal: yinGoal,
        experienceLevel: yinExperience,
        intentions: yinIntentions ? yinIntentions.split(',').map(i => i.trim()).filter(Boolean) : undefined,
        additionalNotes: yinNotes || undefined,
      };

      const plan = await generateIntegralWeeklyPlan({
        goalStatement,
        yangConstraints,
        yinPreferences,
        personalizationSummary: personalizationSummary || undefined,
      });

      setGeneratedPlan(plan);
      setStep('DELIVERY');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate plan. Please try again.');
      setStep('BLUEPRINT');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = () => {
    if (!generatedPlan) return;
    onSave(generatedPlan);
    setStep('HANDOFF');
  };

  const handleExportShoppingList = useCallback(() => {
    if (!generatedPlan || !generatedPlan.shoppingList) return;
    const text = `Shopping List for Week of ${new Date(generatedPlan.weekStartDate).toLocaleDateString()}\n\n${generatedPlan.shoppingList.map((item, i) => `${i + 1}. ${item}`).join('\n')}`;
    downloadAsFile(text, 'integral-body-architect-shopping-list', 'txt');
  }, [generatedPlan]);

  const handleCalendarSync = useCallback(() => {
    if (!generatedPlan) return;
    const ics = buildCalendarICS(generatedPlan);
    downloadCalendarFile('integral-body-architect-week.ics', ics, 'text/calendar');
  }, [generatedPlan]);

  const handleYinLaunch = (practice: YinPracticeDetail, dayName: string) => {
    if (!onLaunchYinPractice) return;
    onLaunchYinPractice({
      name: practice.name,
      intention: practice.intention,
      instructions: practice.instructions,
      duration: practice.duration,
      timeOfDay: practice.timeOfDay,
      dayName
    });
  };

  const handleYangLaunch = (workout: WorkoutRoutine, dayName: string) => {
    if (!onLaunchYangPractice) return;
    onLaunchYangPractice({
      name: workout.name,
      exercises: workout.exercises,
      notes: workout.notes,
      duration: workout.duration,
      dayName
    });
  };

  const renderContent = () => {
    switch (step) {
      case 'BLUEPRINT':
        return <BlueprintStep
          goalStatement={goalStatement}
          onGoalChange={setGoalStatement}
          // PHASE 1: Core Biometrics
          age={age}
          onAgeChange={setAge}
          sex={sex}
          onSexChange={setSex}
          height={height}
          onHeightChange={setHeight}
          bodyweight={bodyweight}
          onBodyweightChange={setBodyweight}
          activityLevel={activityLevel}
          onActivityLevelChange={setActivityLevel}
          // PHASE 1: Training Background
          strengthTrainingExperience={strengthTrainingExperience}
          onStrengthTrainingExperienceChange={setStrengthTrainingExperience}
          primaryGoal={primaryGoal}
          onPrimaryGoalChange={setPrimaryGoal}
          // PHASE 1: Session Constraints
          maxWorkoutDuration={maxWorkoutDuration}
          onMaxWorkoutDurationChange={setMaxWorkoutDuration}
          preferredWorkoutTimes={preferredWorkoutTimes}
          onTogglePreferredWorkoutTime={togglePreferredWorkoutTime}
          sleepHours={sleepHours}
          onSleepHoursChange={setSleepHours}
          equipment={equipment}
          onToggleEquipment={toggleEquipment}
          unavailableDays={unavailableDays}
          onToggleDay={toggleUnavailableDay}
          // Existing fields
          nutritionFocus={nutritionFocus}
          onNutritionFocusChange={setNutritionFocus}
          additionalConstraints={additionalConstraints}
          onAdditionalConstraintsChange={setAdditionalConstraints}
          yinGoal={yinGoal}
          onYinGoalChange={setYinGoal}
          yinExperience={yinExperience}
          onYinExperienceChange={setYinExperience}
          yinIntentions={yinIntentions}
          onYinIntentionsChange={setYinIntentions}
          yinNotes={yinNotes}
          onYinNotesChange={setYinNotes}
          stressLevel={stressLevel}
          onStressLevelChange={setStressLevel}
          injuryRestrictions={injuryRestrictions}
          onInjuryRestrictionsChange={setInjuryRestrictions}
          availableTimeWindows={availableTimeWindows}
          onAvailableTimeWindowsChange={setAvailableTimeWindows}
          error={error}
        />;
      case 'SYNTHESIS':
        return (
          <div className="text-center py-12">
            <Heart size={48} className="mx-auto text-accent animate-pulse" />
            <h3 className="text-lg font-semibold font-mono mt-4 text-accent">Synthesizing Your Integral Week...</h3>
            <p className="text-slate-400 text-sm mt-2">The Architect is balancing Yang and Yin practices for optimal integration.</p>
          </div>
        );
      case 'DELIVERY':
        return generatedPlan && (
          <DeliveryStep
            plan={generatedPlan}
            expandedDay={expandedDay}
            onToggleDay={setExpandedDay}
            onLaunchYin={handleYinLaunch}
            onLaunchYang={handleYangLaunch}
          />
        );
      case 'HANDOFF':
        return (
          <div className="text-center py-12 space-y-6">
            <CheckCircle size={64} className="mx-auto text-green-400" />
            <div>
              <h3 className="text-2xl font-bold text-slate-100">Your Integral Week is Locked In</h3>
              <p className="text-slate-400 mt-2">Calendar-ready and ready to hand off to specialist coaches.</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleCalendarSync}
                className="btn-luminous px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <Share2 size={20} /> Sync to Calendar
              </button>
              <button
                onClick={handleExportShoppingList}
                className="px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 mx-auto bg-slate-700 hover:bg-slate-600 text-slate-100"
              >
                <Download size={20} /> Export Shopping List
              </button>
              <p className="text-xs text-slate-500">Tap practices in your daily briefings to launch specialist agents.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const completedSteps = useMemo(() => {
    switch (step) {
      case 'BLUEPRINT':
        return 0;
      case 'SYNTHESIS':
        return 1;
      case 'DELIVERY':
        return 2;
      case 'HANDOFF':
        return 3;
      default:
        return 0;
    }
  }, [step]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-mono">The Integral Body Architect</h2>
            <p className="text-sm text-slate-400 mt-1">Master planner for Yang & Yin integration</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <ProgressHeader currentStep={step} completedSteps={completedSteps} />
          {renderContent()}

          {step === 'BLUEPRINT' && (
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-700">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-md font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="btn-luminous px-6 py-2 rounded-md font-medium flex items-center gap-2"
              >
                Generate Plan <ArrowRight size={20} />
              </button>
            </div>
          )}

          {step === 'DELIVERY' && (
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-700">
              <button
                onClick={() => setStep('BLUEPRINT')}
                className="px-6 py-2 rounded-md font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
              >
                Regenerate
              </button>
              <button
                onClick={handleSavePlan}
                className="btn-luminous px-6 py-2 rounded-md font-medium flex items-center gap-2"
              >
                Save & Continue <ArrowRight size={20} />
              </button>
            </div>
          )}

          {step === 'HANDOFF' && (
            <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-slate-700">
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => {
                    if (generatedPlan) {
                      const textContent = formatIntegralBodyPlanAsText(generatedPlan);
                      downloadAsFile(textContent, `Integral-Body-Plan-${new Date().toISOString().split('T')[0]}`, 'txt');
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-md font-medium transition-colors"
                >
                  <FileText size={18} />
                  Download as TXT
                </button>
                <button
                  onClick={() => {
                    if (generatedPlan) {
                      const textContent = formatIntegralBodyPlanAsText(generatedPlan);
                      downloadAsFile(textContent, `Integral-Body-Plan-${new Date().toISOString().split('T')[0]}`, 'pdf');
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-md font-medium transition-colors"
                >
                  <Download size={18} />
                  Download as PDF
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="btn-luminous px-8 py-3 rounded-md font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface BlueprintStepProps {
  goalStatement: string;
  onGoalChange: (value: string) => void;

  // PHASE 1: Core Biometrics
  age: string;
  onAgeChange: (value: string) => void;
  sex: 'male' | 'female' | 'other';
  onSexChange: (value: 'male' | 'female' | 'other') => void;
  height: string;
  onHeightChange: (value: string) => void;
  bodyweight: string;
  onBodyweightChange: (value: string) => void;
  activityLevel: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'athlete';
  onActivityLevelChange: (value: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'athlete') => void;

  // PHASE 1: Training Background
  strengthTrainingExperience: 'never' | 'beginner' | 'intermediate' | 'advanced';
  onStrengthTrainingExperienceChange: (value: 'never' | 'beginner' | 'intermediate' | 'advanced') => void;
  primaryGoal: 'lose-fat' | 'gain-muscle' | 'recomp' | 'maintain' | 'performance' | 'general-health';
  onPrimaryGoalChange: (value: 'lose-fat' | 'gain-muscle' | 'recomp' | 'maintain' | 'performance' | 'general-health') => void;

  // PHASE 1: Session Constraints
  maxWorkoutDuration: string;
  onMaxWorkoutDurationChange: (value: string) => void;
  preferredWorkoutTimes: ('morning' | 'afternoon' | 'evening')[];
  onTogglePreferredWorkoutTime: (value: 'morning' | 'afternoon' | 'evening') => void;
  sleepHours: string;
  onSleepHoursChange: (value: string) => void;
  equipment: string[];
  onToggleEquipment: (value: string) => void;
  unavailableDays: string[];
  onToggleDay: (value: string) => void;

  // Existing fields
  nutritionFocus: string;
  onNutritionFocusChange: (value: string) => void;
  additionalConstraints: string;
  onAdditionalConstraintsChange: (value: string) => void;
  yinGoal: YinPracticeGoal;
  onYinGoalChange: (value: YinPracticeGoal) => void;
  yinExperience: 'Beginner' | 'Intermediate';
  onYinExperienceChange: (value: 'Beginner' | 'Intermediate') => void;
  yinIntentions: string;
  onYinIntentionsChange: (value: string) => void;
  yinNotes: string;
  onYinNotesChange: (value: string) => void;
  stressLevel: number;
  onStressLevelChange: (value: number) => void;
  injuryRestrictions: InjuryRestriction[];
  onInjuryRestrictionsChange: (value: InjuryRestriction[]) => void;
  availableTimeWindows: TimeWindow[];
  onAvailableTimeWindowsChange: (value: TimeWindow[]) => void;
  error: string;
}

function BlueprintStep(props: BlueprintStepProps) {
  const {
    goalStatement,
    onGoalChange,
    // PHASE 1: Core Biometrics
    age,
    onAgeChange,
    sex,
    onSexChange,
    height,
    onHeightChange,
    bodyweight,
    onBodyweightChange,
    activityLevel,
    onActivityLevelChange,
    // PHASE 1: Training Background
    strengthTrainingExperience,
    onStrengthTrainingExperienceChange,
    primaryGoal,
    onPrimaryGoalChange,
    // PHASE 1: Session Constraints
    maxWorkoutDuration,
    onMaxWorkoutDurationChange,
    preferredWorkoutTimes,
    onTogglePreferredWorkoutTime,
    sleepHours,
    onSleepHoursChange,
    equipment,
    onToggleEquipment,
    unavailableDays,
    onToggleDay,
    // Existing fields
    nutritionFocus,
    onNutritionFocusChange,
    additionalConstraints,
    onAdditionalConstraintsChange,
    yinGoal,
    onYinGoalChange,
    yinExperience,
    onYinExperienceChange,
    yinIntentions,
    onYinIntentionsChange,
    yinNotes,
    onYinNotesChange,
    stressLevel,
    onStressLevelChange,
    injuryRestrictions,
    onInjuryRestrictionsChange,
    availableTimeWindows,
    onAvailableTimeWindowsChange,
    error
  } = props;

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    goals: true,
    essentialProfile: true,
    trainingGoals: true,
    yangConstraints: true,
    yinStates: true,
    recoveryLifestyle: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="bg-slate-900/40 border border-slate-700 p-4 rounded-md text-sm text-slate-300">
        <p className="font-semibold mb-2">Welcome to The Integral Body Architect</p>
        <p>This master planner synthesizes a 7-day schedule that balances Yang (training, sleep, nutrition) and Yin (subtle energy, breath, Qigong) for coherent progress.</p>
      </div>

      {/* Goals Section */}
      <CollapsibleSection
        title="Your Goals"
        icon={<Heart size={18} className="text-red-400" />}
        isExpanded={expandedSections.goals}
        onToggle={() => toggleSection('goals')}
      >
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Goal for This Week <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-slate-500">Required</span>
            </div>
            <textarea
              value={goalStatement}
              onChange={e => onGoalChange(e.target.value)}
              rows={3}
              placeholder="e.g., 'Build strength while keeping stress regulated during a product launch week'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">💡 Be specific about what success looks like for you this week</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Essential Profile Section */}
      <CollapsibleSection
        title="Essential Profile"
        icon={<User size={18} className="text-cyan-400" />}
        isExpanded={expandedSections.essentialProfile}
        onToggle={() => toggleSection('essentialProfile')}
      >
        <div className="space-y-4">
          {/* Demographics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Age (years) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={age}
                onChange={e => onAgeChange(e.target.value)}
                placeholder="28"
                min="13"
                max="100"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Sex <span className="text-red-400">*</span>
              </label>
              <select
                value={sex}
                onChange={e => onSexChange(e.target.value as 'male' | 'female' | 'other')}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other/Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Height (cm) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={height}
                onChange={e => onHeightChange(e.target.value)}
                placeholder="175"
                min="120"
                max="250"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
              />
            </div>
          </div>

          {/* Body & Activity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Bodyweight (kg) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={bodyweight}
                onChange={e => onBodyweightChange(e.target.value)}
                placeholder="70"
                min="30"
                max="250"
                step="0.1"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Activity Level <span className="text-red-400">*</span>
              </label>
              <select
                value={activityLevel}
                onChange={e => onActivityLevelChange(e.target.value as any)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
              >
                <option value="sedentary">Sedentary (desk job, little exercise)</option>
                <option value="lightly-active">Lightly Active (exercise 1-3 days/week)</option>
                <option value="moderately-active">Moderately Active (exercise 3-5 days/week)</option>
                <option value="very-active">Very Active (exercise 6-7 days/week)</option>
                <option value="athlete">Athlete (2x/day training)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Your baseline activity outside of planned workouts</p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Training Goals & Experience Section */}
      <CollapsibleSection
        title="Training Goals & Experience"
        icon={<Target size={18} className="text-purple-400" />}
        isExpanded={expandedSections.trainingGoals}
        onToggle={() => toggleSection('trainingGoals')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Primary Goal <span className="text-red-400">*</span>
            </label>
            <select
              value={primaryGoal}
              onChange={e => onPrimaryGoalChange(e.target.value as any)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            >
              <option value="lose-fat">Lose Fat</option>
              <option value="gain-muscle">Gain Muscle</option>
              <option value="recomp">Body Recomposition (lose fat + gain muscle)</option>
              <option value="maintain">Maintain Current Composition</option>
              <option value="performance">Performance (strength/endurance)</option>
              <option value="general-health">General Health & Wellness</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">This determines your calorie/macro targets and training split</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Strength Training Experience <span className="text-red-400">*</span>
              </label>
              <select
                value={strengthTrainingExperience}
                onChange={e => onStrengthTrainingExperienceChange(e.target.value as any)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
              >
                <option value="never">Never trained with weights</option>
                <option value="beginner">&lt;6 months</option>
                <option value="intermediate">6 months - 2 years</option>
                <option value="advanced">2+ years</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Determines exercise complexity and volume</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Max Workout Duration
              </label>
              <select
                value={maxWorkoutDuration}
                onChange={e => onMaxWorkoutDurationChange(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Realistic time you have per session</p>
            </div>
          </div>

          {/* Preferred Workout Times */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Preferred Workout Times (Optional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['morning', 'afternoon', 'evening'] as const).map(time => (
                <button
                  key={time}
                  onClick={() => onTogglePreferredWorkoutTime(time)}
                  className={`p-2.5 rounded-md text-xs font-medium transition capitalize ${
                    preferredWorkoutTimes.includes(time)
                      ? 'bg-accent text-slate-900'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">AI will schedule workouts during these times</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Yang Constraints Section */}
      <CollapsibleSection
        title="Yang Constraints (Training & Lifestyle)"
        icon={<Dumbbell size={18} className="text-blue-400" />}
        isExpanded={expandedSections.yangConstraints}
        onToggle={() => toggleSection('yangConstraints')}
      >
        <div className="space-y-4">
          {/* Physical Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Bodyweight (kg)</label>
              <input
                type="number"
                value={bodyweight}
                onChange={e => onBodyweightChange(e.target.value)}
                placeholder="70"
                min="30"
                max="250"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Optional: helps personalize workouts</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Target Sleep (hours/night)</label>
              <input
                type="number"
                step="0.5"
                value={sleepHours}
                onChange={e => onSleepHoursChange(e.target.value)}
                placeholder="8"
                min="4"
                max="12"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Default: 8 hours</p>
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Equipment Available</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EQUIPMENT_OPTIONS.map(item => (
                <button
                  key={item}
                  onClick={() => onToggleEquipment(item)}
                  className={`p-2.5 rounded-md text-xs font-medium transition min-h-10 capitalize ${
                    equipment.includes(item)
                      ? 'bg-accent text-slate-900'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  title={item}
                >
                  {item.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Unavailable Days */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Unavailable Days</label>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  onClick={() => onToggleDay(day)}
                  className={`p-2 rounded-md text-xs font-medium transition min-h-10 ${
                    unavailableDays.includes(day)
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  title={day}
                >
                  {day.slice(0, 3).toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Mark days when you're unavailable for workouts</p>
          </div>

          {/* Nutrition Focus */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Nutrition Focus</label>
            <input
              type="text"
              value={nutritionFocus}
              onChange={e => onNutritionFocusChange(e.target.value)}
              placeholder="e.g., 'High protein Mediterranean, gluten-free'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Optional: dietary preferences and restrictions</p>
          </div>

          {/* Additional Constraints */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Additional Notes</label>
            <textarea
              value={additionalConstraints}
              onChange={e => onAdditionalConstraintsChange(e.target.value)}
              rows={2}
              placeholder="e.g., 'Recovering from shoulder strain, prefer morning workouts'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Optional: any other constraints or preferences</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Yin States Section */}
      <CollapsibleSection
        title="Yin States (Practice Preferences)"
        icon={<Wind size={18} className="text-teal-400" />}
        isExpanded={expandedSections.yinStates}
        onToggle={() => toggleSection('yinStates')}
      >
        <div className="space-y-4">
          {/* Yin Goal */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Primary Intention</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {YIN_GOAL_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => onYinGoalChange(option.value)}
                  className={`p-3 rounded-md text-left transition text-xs ${
                    yinGoal === option.value
                      ? 'bg-accent text-slate-900 border-2 border-accent'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-2 border-transparent'
                  }`}
                  title={option.label}
                >
                  <div className="font-semibold text-sm">{option.label}</div>
                  <div className="text-xs opacity-80 mt-0.5">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Experience Level</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Beginner', 'Intermediate'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => onYinExperienceChange(level)}
                  className={`p-2.5 rounded-md text-sm font-medium transition min-h-10 ${
                    yinExperience === level
                      ? 'bg-accent text-slate-900'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  title={level}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Intentions */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Additional Intentions</label>
            <input
              type="text"
              value={yinIntentions}
              onChange={e => onYinIntentionsChange(e.target.value)}
              placeholder="e.g., 'wind down quickly, deepen breath awareness'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Optional: comma-separated list</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Practice Notes</label>
            <textarea
              value={yinNotes}
              onChange={e => onYinNotesChange(e.target.value)}
              rows={2}
              placeholder="e.g., 'Prefer morning qigong, limited time after 9pm'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Optional: any timing or format preferences</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Recovery & Lifestyle Section */}
      <CollapsibleSection
        title="Recovery & Lifestyle"
        icon={<AlertCircle size={18} className="text-orange-400" />}
        isExpanded={expandedSections.recoveryLifestyle}
        onToggle={() => toggleSection('recoveryLifestyle')}
      >
        <div className="space-y-4">
          {/* Stress Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Current Stress Level</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="10"
                value={stressLevel}
                onChange={e => onStressLevelChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent"
                title="Stress level"
              />
              <div className={`text-2xl font-bold w-12 text-center ${
                stressLevel <= 3 ? 'text-green-400' :
                stressLevel <= 6 ? 'text-yellow-400' :
                stressLevel <= 8 ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {stressLevel}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">0 = Calm & centered | 10 = Overwhelmed & frazzled</p>
          </div>

          {/* Injury Restrictions */}
          <InjuryRestrictionsEditor
            restrictions={injuryRestrictions}
            onChange={onInjuryRestrictionsChange}
          />

          {/* Available Time Windows */}
          <TimeWindowsEditor
            windows={availableTimeWindows}
            onChange={onAvailableTimeWindowsChange}
          />
        </div>
      </CollapsibleSection>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-md p-3 text-sm text-red-200 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  isExpanded,
  onToggle,
  children
}: {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-700 rounded-md overflow-hidden bg-slate-900/30">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition text-left min-h-12"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />
        )}
      </button>
      {isExpanded && (
        <div className="border-t border-slate-700 px-4 py-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Injury Restrictions Editor Component
function InjuryRestrictionsEditor({
  restrictions,
  onChange
}: {
  restrictions: InjuryRestriction[];
  onChange: (restrictions: InjuryRestriction[]) => void;
}) {
  const [newRestriction, setNewRestriction] = useState<Partial<InjuryRestriction>>({
    bodyPart: '',
    severity: 'mild',
    restrictions: []
  });

  const addRestriction = () => {
    if (newRestriction.bodyPart?.trim()) {
      onChange([
        ...restrictions,
        {
          bodyPart: newRestriction.bodyPart,
          severity: newRestriction.severity as 'mild' | 'moderate' | 'severe',
          restrictions: newRestriction.restrictions || [],
          notes: newRestriction.notes
        }
      ]);
      setNewRestriction({ bodyPart: '', severity: 'mild', restrictions: [] });
    }
  };

  const removeRestriction = (index: number) => {
    onChange(restrictions.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Injury or Pain Restrictions (Optional)</label>
      <div className="space-y-2 mb-3">
        {restrictions.map((restriction, idx) => (
          <div key={idx} className="bg-slate-800/50 rounded-md p-3 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200">{restriction.bodyPart}</div>
              <div className="text-xs text-slate-400">{restriction.severity.charAt(0).toUpperCase() + restriction.severity.slice(1)} • {restriction.restrictions.join(', ')}</div>
              {restriction.notes && <div className="text-xs text-slate-500 mt-1 italic">{restriction.notes}</div>}
            </div>
            <button
              onClick={() => removeRestriction(idx)}
              className="text-red-400 hover:text-red-300 transition p-1 flex-shrink-0 touch-target"
              title="Remove restriction"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="space-y-2 p-3 bg-slate-800/30 rounded-md">
        <input
          type="text"
          value={newRestriction.bodyPart || ''}
          onChange={e => setNewRestriction(prev => ({ ...prev, bodyPart: e.target.value }))}
          placeholder="e.g., 'Shoulder', 'Lower back'"
          className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
        />
        <select
          value={newRestriction.severity || 'mild'}
          onChange={e => setNewRestriction(prev => ({ ...prev, severity: e.target.value as 'mild' | 'moderate' | 'severe' }))}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
        >
          <option value="mild">Mild (discomfort)</option>
          <option value="moderate">Moderate (pain when used)</option>
          <option value="severe">Severe (avoid completely)</option>
        </select>
        <input
          type="text"
          placeholder="e.g., 'no overhead pressing, avoid heavy squats'"
          className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
          onChange={e => setNewRestriction(prev => ({ ...prev, restrictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
        />
        <button
          onClick={addRestriction}
          disabled={!newRestriction.bodyPart?.trim()}
          className="w-full bg-accent hover:bg-accent/90 disabled:bg-slate-700 disabled:text-slate-400 text-slate-900 rounded-md py-2 px-3 font-medium text-sm transition flex items-center justify-center gap-2 touch-target"
          title="Add injury restriction"
        >
          <Plus size={16} /> Add Restriction
        </button>
      </div>
    </div>
  );
}

// Time Windows Editor Component
function TimeWindowsEditor({
  windows,
  onChange
}: {
  windows: TimeWindow[];
  onChange: (windows: TimeWindow[]) => void;
}) {
  const [newWindow, setNewWindow] = useState<Partial<TimeWindow>>({
    dayOfWeek: 'Monday',
    startHour: 9,
    endHour: 17
  });

  const addWindow = () => {
    if (newWindow.dayOfWeek && newWindow.startHour !== undefined && newWindow.endHour !== undefined) {
      onChange([
        ...windows,
        {
          dayOfWeek: newWindow.dayOfWeek,
          startHour: newWindow.startHour,
          endHour: newWindow.endHour
        }
      ]);
      setNewWindow({ dayOfWeek: 'Monday', startHour: 9, endHour: 17 });
    }
  };

  const removeWindow = (index: number) => {
    onChange(windows.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Available Practice Time Windows (Optional)</label>
      <div className="space-y-2 mb-3">
        {windows.map((window, idx) => (
          <div key={idx} className="bg-slate-800/50 rounded-md p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Clock size={14} className="text-slate-400" />
              <span className="font-medium">{window.dayOfWeek}</span>
              <span className="text-slate-400">{String(window.startHour).padStart(2, '0')}:00 - {String(window.endHour).padStart(2, '0')}:00</span>
            </div>
            <button
              onClick={() => removeWindow(idx)}
              className="text-red-400 hover:text-red-300 transition p-1 flex-shrink-0 touch-target"
              title="Remove time window"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="space-y-2 p-3 bg-slate-800/30 rounded-md">
        <select
          value={newWindow.dayOfWeek || 'Monday'}
          onChange={e => setNewWindow(prev => ({ ...prev, dayOfWeek: e.target.value }))}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
        >
          {DAYS_OF_WEEK.map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Start Hour</label>
            <input
              type="number"
              min="0"
              max="23"
              value={newWindow.startHour || 0}
              onChange={e => setNewWindow(prev => ({ ...prev, startHour: parseInt(e.target.value) }))}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">End Hour</label>
            <input
              type="number"
              min="0"
              max="23"
              value={newWindow.endHour || 23}
              onChange={e => setNewWindow(prev => ({ ...prev, endHour: parseInt(e.target.value) }))}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
          </div>
        </div>
        <button
          onClick={addWindow}
          disabled={!newWindow.dayOfWeek || newWindow.startHour === undefined || newWindow.endHour === undefined}
          className="w-full bg-accent hover:bg-accent/90 disabled:bg-slate-700 disabled:text-slate-400 text-slate-900 rounded-md py-2 px-3 font-medium text-sm transition flex items-center justify-center gap-2 touch-target"
          title="Add time window"
        >
          <Plus size={16} /> Add Time Window
        </button>
      </div>
    </div>
  );
}

interface DeliveryStepProps {
  plan: IntegralBodyPlan;
  expandedDay: string | null;
  onToggleDay: (day: string | null) => void;
  onLaunchYin: (practice: YinPracticeDetail, dayName: string) => void;
  onLaunchYang: (workout: WorkoutRoutine, dayName: string) => void;
}

function DeliveryStep({ plan, expandedDay, onToggleDay, onLaunchYin, onLaunchYang }: DeliveryStepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900/30 to-teal-900/30 border border-blue-700 rounded-lg p-5">
        <h3 className="text-xl font-bold text-slate-100 mb-2">Integrated Weekly Blueprint</h3>
        <p className="text-slate-300 text-sm">{plan.weekSummary}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <StatCard label="Daily Protein" value={`${plan.dailyTargets.proteinGrams}g`} accent="text-accent" />
          <StatCard label="Workouts" value={`${plan.dailyTargets.workoutDays}x`} accent="text-blue-400" />
          <StatCard label="Yin Practice" value={`${plan.dailyTargets.yinPracticeMinutes}min`} accent="text-teal-400" />
          <StatCard label="Sleep" value={`${plan.dailyTargets.sleepHours}h`} accent="text-purple-400" />
        </div>
      </div>

      <div className="space-y-3">
        {plan.days.map((day) => (
          <DayCard
            key={day.dayName}
            day={day}
            isExpanded={expandedDay === day.dayName}
            onToggle={() => onToggleDay(expandedDay === day.dayName ? null : day.dayName)}
            onLaunchYin={practice => onLaunchYin(practice, day.dayName)}
            onLaunchYang={workout => workout && onLaunchYang(workout, day.dayName)}
          />
        ))}
      </div>
    </div>
  );
}

function DayCard({ day, isExpanded, onToggle, onLaunchYin, onLaunchYang }: {
  day: DayPlan;
  isExpanded: boolean;
  onToggle: () => void;
  onLaunchYin: (practice: YinPracticeDetail) => void;
  onLaunchYang: (workout: WorkoutRoutine) => void;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex justify-between items-center hover:bg-slate-800/50 transition text-left"
      >
        <div>
          <h4 className="font-bold text-slate-100">{day.dayName}</h4>
          <p className="text-sm text-slate-400 mt-1">{day.summary}</p>
        </div>
        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-slate-700 space-y-4 text-sm">
          {day.workout && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-md p-3">
              <h5 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                <Dumbbell size={16} /> {day.workout.name}
              </h5>
              <div className="space-y-2">
                {day.workout.exercises.map((ex, idx) => (
                  <div key={idx} className="text-slate-300">
                    <span className="font-medium">{ex.name}</span>: {ex.sets} sets × {ex.reps}
                    {ex.notes && <span className="text-slate-500 text-xs ml-2">({ex.notes})</span>}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                {day.workout.notes && (
                  <p className="text-xs text-blue-200 italic max-w-sm">{day.workout.notes}</p>
                )}
                <button
                  onClick={() => onLaunchYang(day.workout as WorkoutRoutine)}
                  className="text-blue-300 hover:text-blue-200 text-xs font-medium underline"
                >
                  Launch Dynamic Workout Architect
                </button>
              </div>
            </div>
          )}

          {day.yinPractices.length > 0 && (
            <div className="bg-teal-900/20 border border-teal-700 rounded-md p-3">
              <h5 className="font-semibold text-teal-300 mb-2 flex items-center gap-2">
                <Wind size={16} /> Yin Practices
              </h5>
              <div className="space-y-3">
                {day.yinPractices.map((practice, idx) => (
                  <div key={idx} className="border-l-2 border-teal-600 pl-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-medium text-teal-200">{practice.name}</div>
                        <div className="text-xs text-slate-400">{practice.practiceType} • {practice.duration} min • {practice.timeOfDay}</div>
                        <p className="text-xs text-slate-300 mt-1 italic">{practice.intention}</p>
                      </div>
                      <button
                        onClick={() => onLaunchYin(practice)}
                        className="text-teal-400 hover:text-teal-300 transition"
                        title="Launch practice"
                      >
                        <Play size={16} />
                      </button>
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">View instructions</summary>
                      <ul className="list-disc list-inside text-xs text-slate-300 mt-2 space-y-1">
                        {practice.instructions.map((inst, i) => (
                          <li key={i}>{inst}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-800/50 border border-slate-600 rounded-md p-3">
            <h5 className="font-semibold text-slate-300 mb-2">Nutrition</h5>
            <div className="space-y-1 text-slate-300">
              <div><span className="text-slate-500">Breakfast:</span> {day.nutrition.breakfast.description} ({day.nutrition.breakfast.protein}g protein)</div>
              <div><span className="text-slate-500">Lunch:</span> {day.nutrition.lunch.description} ({day.nutrition.lunch.protein}g protein)</div>
              <div><span className="text-slate-500">Dinner:</span> {day.nutrition.dinner.description} ({day.nutrition.dinner.protein}g protein)</div>
              {day.nutrition.snacks && (
                <div><span className="text-slate-500">Snacks:</span> {day.nutrition.snacks.description} ({day.nutrition.snacks.protein}g protein)</div>
              )}
              <div className="pt-2 border-t border-slate-700 mt-2">
                <span className="font-medium text-accent">Total:</span> {day.nutrition.totalProtein}g protein
                {day.nutrition.totalCalories && <span className="text-slate-500"> • {day.nutrition.totalCalories} cal</span>}
              </div>
            </div>
            {day.nutrition.notes && (
              <p className="text-xs text-slate-400 mt-2 italic">{day.nutrition.notes}</p>
            )}
          </div>

          {day.sleepHygiene.length > 0 && (
            <div className="bg-purple-900/20 border border-purple-700 rounded-md p-3">
              <h5 className="font-semibold text-purple-300 mb-2">Sleep Hygiene</h5>
              <ul className="list-disc list-inside text-slate-300 space-y-1 text-xs">
                {day.sleepHygiene.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {day.synergyMetadata && (
            <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-700 rounded-md p-3">
              <h5 className="font-semibold text-amber-300 mb-2">Synergy Notes</h5>
              <div className="space-y-2 text-xs text-slate-300">
                {day.synergyMetadata.yangYinBalance && (
                  <p><span className="text-amber-400 font-medium">Balance:</span> {day.synergyMetadata.yangYinBalance}</p>
                )}
                {day.synergyMetadata.restSpacingNotes && (
                  <p><span className="text-amber-400 font-medium">Rest Spacing:</span> {day.synergyMetadata.restSpacingNotes}</p>
                )}
                {day.synergyMetadata.constraintResolution && (
                  <p><span className="text-amber-400 font-medium">Constraint Resolution:</span> {day.synergyMetadata.constraintResolution}</p>
                )}
              </div>
            </div>
          )}

          {day.yinPractices.length > 0 && day.yinPractices.some(p => p.schedulingConfidence) && (
            <div className="bg-slate-800/30 border border-slate-600 rounded-md p-3">
              <h5 className="font-semibold text-slate-300 mb-2 text-xs">Scheduling Confidence</h5>
              <div className="space-y-1">
                {day.yinPractices.map((practice, idx) => (
                  practice.schedulingConfidence && (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{practice.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-teal-400"
                            style={{ width: `${practice.schedulingConfidence}%` }}
                          />
                        </div>
                        <span className="text-teal-300 w-8 text-right">{practice.schedulingConfidence}%</span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {day.notes && (
            <div className="text-xs text-slate-400 italic">Note: {day.notes}</div>
          )}
          </div>
          )}
          </div>
          );
          }

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string; }) {
  return (
    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
      {icon}
      {title}
    </h3>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string; }) {
  return (
    <div className="bg-slate-900/50 rounded-md p-3 text-center">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function ProgressHeader({ currentStep, completedSteps }: { currentStep: WizardStep; completedSteps: number; }) {
  const steps: WizardStep[] = ['BLUEPRINT', 'SYNTHESIS', 'DELIVERY', 'HANDOFF'];
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, idx) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep === step
                ? 'bg-accent text-slate-900'
                : idx < completedSteps
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            {idx + 1}
          </div>
          {idx < steps.length - 1 && (
            <div className={`w-12 h-1 mx-2 ${idx < completedSteps ? 'bg-green-600' : 'bg-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function downloadCalendarFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildCalendarICS(plan: IntegralBodyPlan): string {
  const baseDate = new Date(plan.weekStartDate);
  baseDate.setHours(0, 0, 0, 0);
  const events: string[] = [];
  const timestamp = formatICSDate(new Date());

  plan.days.forEach((day, index) => {
    const dayDate = new Date(baseDate);
    dayDate.setDate(baseDate.getDate() + index);

    if (day.workout) {
      const slot = TIME_OF_DAY_SLOTS[DEFAULT_WORKOUT_SLOT];
      const start = toUTCDate(dayDate, slot.hour, slot.minute);
      const duration = day.workout.duration || 55;
      const end = new Date(start.getTime() + duration * 60000);
      events.push(buildICSEvent({
        uid: `${plan.id}-workout-${index}`,
        start,
        end,
        summary: `Workout: ${day.workout.name}`,
        description: [
          `Exercises:`,
          ...day.workout.exercises.map(ex => `${ex.name} - ${ex.sets} sets × ${ex.reps}${ex.notes ? ` (${ex.notes})` : ''}`),
          day.workout.notes || ''
        ].filter(Boolean).join('\n')
      }));
    }

    day.yinPractices.forEach((practice, practiceIndex) => {
      const slot = inferTimeSlot(practice.timeOfDay);
      const start = toUTCDate(dayDate, slot.hour, slot.minute);
      const duration = practice.duration || 15;
      const end = new Date(start.getTime() + duration * 60000);
      events.push(buildICSEvent({
        uid: `${plan.id}-yin-${index}-${practiceIndex}`,
        start,
        end,
        summary: `Yin Practice: ${practice.name}`,
        description: [practice.intention, '', ...practice.instructions].filter(Boolean).join('\n')
      }));
    });
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AuraOS//IntegralBodyArchitect//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
  ].join('\n') + '\n';
}

function buildICSEvent({ uid, start, end, summary, description }: { uid: string; start: Date; end: Date; summary: string; description: string; }): string {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@aura-os`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    'END:VEVENT'
  ].join('\n');
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICSText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function toUTCDate(base: Date, hour: number, minute: number): Date {
  return new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate(), hour, minute, 0));
}

function inferTimeSlot(label: string | undefined): { hour: number; minute: number } {
  // Check cache first - O(1) lookup
  if (timeSlotCache.has(label)) {
    return timeSlotCache.get(label)!;
  }

  let result: { hour: number; minute: number };

  if (!label) {
    result = TIME_OF_DAY_SLOTS[DEFAULT_PRACTICE_SLOT];
  } else {
    const match = TIME_KEYWORDS.find(entry => entry.pattern.test(label));
    result = match
      ? TIME_OF_DAY_SLOTS[match.slot]
      : TIME_OF_DAY_SLOTS[DEFAULT_PRACTICE_SLOT];
  }

  // Cache the result
  timeSlotCache.set(label, result);
  return result;
}
