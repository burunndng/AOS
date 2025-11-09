import React, { useMemo, useState } from 'react';
import { X, ArrowRight, Heart, Dumbbell, Wind, CheckCircle, Download, Play, ChevronDown, ChevronUp, Share2, Calendar, ShoppingCart, User, AlertTriangle, Target, Zap, Clock, TrendingUp } from 'lucide-react';
import {
  IntegralBodyPlan,
  YangConstraints,
  YinPreferences,
  YinPracticeGoal,
  DayPlan,
  YinPracticeDetail,
  WorkoutRoutine,
  PersonalizationSummary
} from '../types.ts';
import { generateIntegralWeeklyPlan } from '../services/integralBodyArchitectService.ts';
import { buildPersonalizationPromptInsertion } from '../services/integralBodyPersonalization.ts';

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

const TIME_KEYWORDS: { pattern: RegExp; slot: TimeSlotKey }[] = [
  { pattern: /(early\s*)?morning/i, slot: 'morning' },
  { pattern: /(mid\s*-?morning|late morning)/i, slot: 'midmorning' },
  { pattern: /(mid\s*-?day|lunch|noon)/i, slot: 'midday' },
  { pattern: /(afternoon)/i, slot: 'afternoon' },
  { pattern: /(evening|after dinner)/i, slot: 'evening' },
  { pattern: /(wind[- ]?down|30 ?min before bed|pre-bed)/i, slot: 'winddown' },
  { pattern: /(bedtime|before sleep|night)/i, slot: 'bedtime' }
];

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
  const [bodyweight, setBodyweight] = useState('');
  const [sleepHours, setSleepHours] = useState('8');
  const [equipment, setEquipment] = useState<string[]>(['bodyweight']);
  const [unavailableDays, setUnavailableDays] = useState<string[]>([]);
  const [nutritionFocus, setNutritionFocus] = useState('');
  const [additionalConstraints, setAdditionalConstraints] = useState('');

  const [yinGoal, setYinGoal] = useState<YinPracticeGoal>('reduce-stress');
  const [yinExperience, setYinExperience] = useState<'Beginner' | 'Intermediate'>('Beginner');
  const [yinIntentions, setYinIntentions] = useState('');
  const [yinNotes, setYinNotes] = useState('');

  const [generatedPlan, setGeneratedPlan] = useState<IntegralBodyPlan | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const toggleEquipment = (item: string) => {
    setEquipment(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]));
  };

  const toggleUnavailableDay = (day: string) => {
    setUnavailableDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));
  };

  const handleGenerate = async () => {
    if (!goalStatement.trim()) {
      setError('Please define your goal for the week.');
      return;
    }

    setError('');
    setIsLoading(true);
    setStep('SYNTHESIS');

    try {
      const yangConstraints: YangConstraints = {
        bodyweight: bodyweight ? parseFloat(bodyweight) : undefined,
        sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
        equipment,
        unavailableDays,
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

  const handleExportShoppingList = () => {
    if (!generatedPlan || !generatedPlan.shoppingList) return;
    const text = `Shopping List for Week of ${new Date(generatedPlan.weekStartDate).toLocaleDateString()}\n\n${generatedPlan.shoppingList.map((item, i) => `${i + 1}. ${item}`).join('\n')}`;
    downloadFile('integral-body-architect-shopping-list.txt', text, 'text/plain');
  };

  const handleCalendarSync = () => {
    if (!generatedPlan) return;
    const ics = buildCalendarICS(generatedPlan);
    downloadFile('integral-body-architect-week.ics', ics, 'text/calendar');
  };

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
          bodyweight={bodyweight}
          onBodyweightChange={setBodyweight}
          sleepHours={sleepHours}
          onSleepHoursChange={setSleepHours}
          equipment={equipment}
          onToggleEquipment={toggleEquipment}
          unavailableDays={unavailableDays}
          onToggleDay={toggleUnavailableDay}
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
            personalizationSummary={personalizationSummary}
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
            <div className="flex justify-center mt-6 pt-6 border-t border-slate-700">
              <button
                onClick={onClose}
                className="btn-luminous px-8 py-3 rounded-md font-medium"
              >
                Close
              </button>
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
  bodyweight: string;
  onBodyweightChange: (value: string) => void;
  sleepHours: string;
  onSleepHoursChange: (value: string) => void;
  equipment: string[];
  onToggleEquipment: (value: string) => void;
  unavailableDays: string[];
  onToggleDay: (value: string) => void;
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
  error: string;
}

function BlueprintStep(props: BlueprintStepProps) {
  const {
    goalStatement,
    onGoalChange,
    bodyweight,
    onBodyweightChange,
    sleepHours,
    onSleepHoursChange,
    equipment,
    onToggleEquipment,
    unavailableDays,
    onToggleDay,
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
    error
  } = props;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 border border-slate-700 p-4 rounded-md text-sm text-slate-300">
        <p className="font-semibold mb-2">Welcome to The Integral Body Architect</p>
        <p>This master planner synthesizes a 7-day schedule that balances Yang (training, sleep, nutrition) and Yin (subtle energy, breath, Qigong) for coherent progress.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Your Goal for This Week <span className="text-red-400">*</span>
        </label>
        <textarea
          value={goalStatement}
          onChange={e => onGoalChange(e.target.value)}
          rows={3}
          placeholder="e.g., 'Build strength while keeping stress regulated during a product launch week'"
          className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100"
        />
      </div>

      <div className="border-t border-slate-700 pt-6 space-y-4">
        <SectionHeading icon={<Dumbbell size={20} className="text-blue-400" />} title="Yang Parameters" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Bodyweight (kg)</label>
            <input
              type="number"
              value={bodyweight}
              onChange={e => onBodyweightChange(e.target.value)}
              placeholder="70"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Sleep (hours/night)</label>
            <input
              type="number"
              step="0.5"
              value={sleepHours}
              onChange={e => onSleepHoursChange(e.target.value)}
              placeholder="8"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Equipment Available</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {EQUIPMENT_OPTIONS.map(item => (
              <button
                key={item}
                onClick={() => onToggleEquipment(item)}
                className={`p-2 rounded-md text-sm font-medium transition capitalize ${
                  equipment.includes(item)
                    ? 'bg-accent text-slate-900'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {item.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Unavailable Days</label>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day}
                onClick={() => onToggleDay(day)}
                className={`p-2 rounded-md text-xs font-medium transition ${
                  unavailableDays.includes(day)
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {day.slice(0, 3).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Nutrition Focus (optional)</label>
          <input
            type="text"
            value={nutritionFocus}
            onChange={e => onNutritionFocusChange(e.target.value)}
            placeholder="e.g., 'High protein Mediterranean, gluten-free'"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Additional Constraints (optional)</label>
          <textarea
            value={additionalConstraints}
            onChange={e => onAdditionalConstraintsChange(e.target.value)}
            rows={2}
            placeholder="e.g., 'Recovering from shoulder strain, no overhead pressing'"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100"
          />
        </div>
      </div>

      <div className="border-t border-slate-700 pt-6 space-y-4">
        <SectionHeading icon={<Wind size={20} className="text-teal-400" />} title="Yin Parameters" />

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Primary Intention</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {YIN_GOAL_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => onYinGoalChange(option.value)}
                className={`p-3 rounded-md text-left transition ${
                  yinGoal === option.value
                    ? 'bg-accent text-slate-900 border-2 border-accent'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-2 border-transparent'
                }`}
              >
                <div className="font-semibold text-sm">{option.label}</div>
                <div className="text-xs opacity-80 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Experience Level</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Beginner', 'Intermediate'] as const).map(level => (
              <button
                key={level}
                onClick={() => onYinExperienceChange(level)}
                className={`p-2 rounded-md text-sm font-medium transition ${
                  yinExperience === level
                    ? 'bg-accent text-slate-900'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Additional Intentions (comma-separated)</label>
          <input
            type="text"
            value={yinIntentions}
            onChange={e => onYinIntentionsChange(e.target.value)}
            placeholder="e.g., 'wind down quickly, deepen breath awareness'"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Notes (optional)</label>
          <textarea
            value={yinNotes}
            onChange={e => onYinNotesChange(e.target.value)}
            rows={2}
            placeholder="e.g., 'Prefer morning qigong, limited time after 9pm'"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-md p-3 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}

interface DeliveryStepProps {
  plan: IntegralBodyPlan;
  expandedDay: string | null;
  onToggleDay: (day: string | null) => void;
  onLaunchYin: (practice: YinPracticeDetail, dayName: string) => void;
  onLaunchYang: (workout: WorkoutRoutine, dayName: string) => void;
  personalizationSummary?: PersonalizationSummary | null;
}

function DeliveryStep({ plan, expandedDay, onToggleDay, onLaunchYin, onLaunchYang, personalizationSummary }: DeliveryStepProps) {
  return (
    <div className="space-y-6">
      {/* Enhanced Summary Panel */}
      <WeeklySummaryPanel plan={plan} personalizationSummary={personalizationSummary} />

      {/* Quick Action Tiles */}
      <QuickActionTiles plan={plan} />

      {/* Timeline-style Daily Accordions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full"></div>
          Daily Timeline
        </h3>
        {plan.days.map((day, index) => (
          <TimelineDayCard
            key={day.dayName}
            day={day}
            dayIndex={index}
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

// Enhanced Summary Panel Component
function WeeklySummaryPanel({ plan, personalizationSummary }: { 
  plan: IntegralBodyPlan; 
  personalizationSummary?: PersonalizationSummary | null;
}) {
  const hasSynergyData = plan.synthesisMetadata?.synergyScoring;
  const hasPersonalization = personalizationSummary && personalizationSummary.planCount > 0;
  const hasConflicts = plan.synthesisMetadata?.constraintConflicts && plan.synthesisMetadata.constraintConflicts.length > 0;

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700 rounded-xl p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-bold text-slate-100 mb-2">Weekly Integration Blueprint</h3>
          <p className="text-slate-300 text-sm leading-relaxed">{plan.weekSummary}</p>
        </div>
        {hasConflicts && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg px-3 py-2 flex items-center gap-2 shrink-0">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-xs text-amber-300 font-medium">
              {plan.synthesisMetadata!.constraintConflicts.length} Adjustments
            </span>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Daily Protein" value={`${plan.dailyTargets.proteinGrams}g`} accent="text-accent" />
        <StatCard label="Workouts" value={`${plan.dailyTargets.workoutDays}x`} accent="text-blue-400" />
        <StatCard label="Yin Practice" value={`${plan.dailyTargets.yinPracticeMinutes}min`} accent="text-teal-400" />
        <StatCard label="Sleep" value={`${plan.dailyTargets.sleepHours}h`} accent="text-purple-400" />
      </div>

      {/* Synergy Insights */}
      {hasSynergyData && (
        <div className="bg-gradient-to-r from-blue-900/20 to-teal-900/20 border border-blue-700/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <Target size={16} />
            Synergy Intelligence
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Yang-Yin Balance</span>
              <span className="text-blue-300 font-medium">{plan.synthesisMetadata!.synergyScoring.yangYinPairingScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Rest Spacing</span>
              <span className="text-teal-300 font-medium">{plan.synthesisMetadata!.synergyScoring.restSpacingScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Integration</span>
              <span className="text-accent font-medium">{plan.synthesisMetadata!.synergyScoring.overallIntegrationScore}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Personalization Highlights */}
      {hasPersonalization && (
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-700/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
            <TrendingUp size={16} />
            Personalization Insights
          </h4>
          <div className="space-y-2 text-xs">
            {personalizationSummary!.adjustmentDirectives.slice(0, 3).map((directive, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                  directive.impact === 'high' ? 'bg-red-400' :
                  directive.impact === 'medium' ? 'bg-amber-400' : 'bg-green-400'
                }`} />
                <div>
                  <span className="text-purple-200 font-medium">{directive.type}:</span>
                  <span className="text-slate-300 ml-1">{directive.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflict Warnings */}
      {hasConflicts && (
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} />
            Constraint Resolutions
          </h4>
          <div className="space-y-2 text-xs">
            {plan.synthesisMetadata!.constraintConflicts.slice(0, 2).map((conflict, idx) => (
              <div key={idx} className="text-slate-300">
                <span className="text-amber-200 font-medium">{conflict.type}:</span>
                <span className="ml-1">{conflict.resolution}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Quick Action Tiles Component
function QuickActionTiles({ plan }: { plan: IntegralBodyPlan }) {
  const handleCalendarSync = () => {
    const ics = buildCalendarICS(plan);
    downloadFile('integral-body-architect-week.ics', ics, 'text/calendar');
  };

  const handleExportShoppingList = () => {
    if (!plan.shoppingList) return;
    const text = `Shopping List for Week of ${new Date(plan.weekStartDate).toLocaleDateString()}\n\n${plan.shoppingList.map((item, i) => `${i + 1}. ${item}`).join('\n')}`;
    downloadFile('integral-body-architect-shopping-list.txt', text, 'text/plain');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <button
        onClick={handleCalendarSync}
        className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 border border-blue-600/50 hover:border-blue-500/70 rounded-lg p-4 transition-all hover:scale-[1.02] group"
      >
        <Calendar size={20} className="text-blue-400 mb-2 group-hover:text-blue-300" />
        <div className="text-left">
          <div className="text-sm font-medium text-blue-300">Calendar Sync</div>
          <div className="text-xs text-slate-400">Add to your calendar</div>
        </div>
      </button>

      <button
        onClick={handleExportShoppingList}
        disabled={!plan.shoppingList}
        className="bg-gradient-to-r from-green-600/20 to-green-700/20 border border-green-600/50 hover:border-green-500/70 rounded-lg p-4 transition-all hover:scale-[1.02] group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ShoppingCart size={20} className="text-green-400 mb-2 group-hover:text-green-300" />
        <div className="text-left">
          <div className="text-sm font-medium text-green-300">Shopping List</div>
          <div className="text-xs text-slate-400">{plan.shoppingList ? `${plan.shoppingList.length} items` : 'Not available'}</div>
        </div>
      </button>

      <div className="bg-gradient-to-r from-purple-600/20 to-purple-700/20 border border-purple-600/50 rounded-lg p-4">
        <User size={20} className="text-purple-400 mb-2" />
        <div className="text-left">
          <div className="text-sm font-medium text-purple-300">Specialist Handoff</div>
          <div className="text-xs text-slate-400">Launch practices for coaching</div>
        </div>
      </div>
    </div>
  );
}

// Timeline Day Card Component
function TimelineDayCard({ day, dayIndex, isExpanded, onToggle, onLaunchYin, onLaunchYang }: {
  day: DayPlan;
  dayIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  onLaunchYin: (practice: YinPracticeDetail) => void;
  onLaunchYang: (workout: WorkoutRoutine) => void;
}) {
  // Calculate energy demand and focus theme
  const energyDemand = day.workout 
    ? (day.workout.exercises.length > 4 ? 'High' : day.workout.exercises.length > 2 ? 'Medium' : 'Low')
    : 'Rest';
  
  const focusTheme = day.workout ? 'Strength' : day.yinPractices.length > 0 ? 'Recovery' : 'Rest';

  return (
    <div className="relative">
      {/* Timeline connector */}
      {dayIndex > 0 && (
        <div className="absolute left-6 top-0 w-0.5 h-4 bg-slate-700 -translate-y-full"></div>
      )}

      <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-all">
        {/* Header with badges */}
        <button
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle();
            }
          }}
          className="w-full p-3 md:p-4 flex flex-col md:flex-row md:justify-between md:items-center hover:bg-slate-800/50 transition text-left gap-3 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset rounded-lg"
        >
          <div className="flex items-center gap-3">
            {/* Timeline dot */}
            <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
              energyDemand === 'High' ? 'bg-red-500 border-red-600' :
              energyDemand === 'Medium' ? 'bg-amber-500 border-amber-600' :
              energyDemand === 'Low' ? 'bg-green-500 border-green-600' :
              'bg-slate-500 border-slate-600'
            }`}></div>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-100 text-sm md:text-base">{day.dayName}</h4>
              <p className="text-xs md:text-sm text-slate-400 mt-1 line-clamp-2">{day.summary}</p>
            </div>
          </div>

          {/* Quick glance badges */}
          <div className="flex items-center gap-2 justify-between w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                focusTheme === 'Strength' ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50' :
                focusTheme === 'Recovery' ? 'bg-teal-900/30 text-teal-300 border border-teal-700/50' :
                'bg-slate-700/50 text-slate-400 border border-slate-600/50'
              }`}>
                {focusTheme}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                energyDemand === 'High' ? 'bg-red-900/30 text-red-300 border border-red-700/50' :
                energyDemand === 'Medium' ? 'bg-amber-900/30 text-amber-300 border border-amber-700/50' :
                energyDemand === 'Low' ? 'bg-green-900/30 text-green-300 border border-green-700/50' :
                'bg-slate-700/50 text-slate-400 border border-slate-600/50'
              }`}>
                {energyDemand}
              </span>
            </div>
            {isExpanded ? <ChevronUp size={20} className="text-slate-400 shrink-0" /> : <ChevronDown size={20} className="text-slate-400 shrink-0" />}
          </div>
        </button>

        {/* Expanded content with tabs */}
        {isExpanded && (
          <div className="border-t border-slate-700">
            <DayCardContent day={day} onLaunchYin={onLaunchYin} onLaunchYang={onLaunchYang} />
          </div>
        )}
      </div>
    </div>
  );
}

// Day Content with Tabs
function DayCardContent({ day, onLaunchYin, onLaunchYang }: {
  day: DayPlan;
  onLaunchYin: (practice: YinPracticeDetail) => void;
  onLaunchYang: (workout: WorkoutRoutine) => void;
}) {
  const [activeTab, setActiveTab] = useState<'workout' | 'yin' | 'nutrition' | 'sleep'>('workout');

  const tabs = [
    { key: 'workout' as const, label: 'Workout', icon: Dumbbell, hasContent: !!day.workout },
    { key: 'yin' as const, label: 'Yin', icon: Wind, hasContent: day.yinPractices.length > 0 },
    { key: 'nutrition' as const, label: 'Nutrition', icon: Target, hasContent: true },
    { key: 'sleep' as const, label: 'Sleep', icon: Clock, hasContent: day.sleepHygiene.length > 0 },
  ].filter(tab => tab.hasContent);

  return (
    <div className="p-4">
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 bg-slate-800/50 rounded-lg p-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab(tab.key);
                }
              }}
              className={`flex items-center justify-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded-md text-xs font-medium transition whitespace-nowrap min-w-0 flex-1 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset ${
                activeTab === tab.key
                  ? 'bg-accent text-slate-900'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Icon size={14} />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'workout' && day.workout && (
          <WorkoutTab workout={day.workout} onLaunch={() => onLaunchYang(day.workout!)} />
        )}
        {activeTab === 'yin' && (
          <YinTab practices={day.yinPractices} onLaunch={onLaunchYin} />
        )}
        {activeTab === 'nutrition' && (
          <NutritionTab nutrition={day.nutrition} />
        )}
        {activeTab === 'sleep' && (
          <SleepTab sleepHygiene={day.sleepHygiene} />
        )}
      </div>

      {/* Additional metadata */}
      {(day.synergyMetadata || day.notes) && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
          {day.synergyMetadata && (
            <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-700/50 rounded-md p-3">
              <h5 className="text-xs font-semibold text-amber-300 mb-2 flex items-center gap-2">
                <Zap size={12} />
                Synergy Notes
              </h5>
              <div className="space-y-1 text-xs text-slate-300">
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

          {day.notes && (
            <div className="text-xs text-slate-400 italic">Note: {day.notes}</div>
          )}
        </div>
      )}
    </div>
  );
}

// Tab Components
function WorkoutTab({ workout, onLaunch }: { workout: WorkoutRoutine; onLaunch: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-semibold text-blue-300 flex items-center gap-2">
          <Dumbbell size={16} />
          {workout.name}
        </h5>
        <button
          onClick={onLaunch}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium underline"
        >
          Launch Workout Architect
        </button>
      </div>
      
      <div className="space-y-2">
        {workout.exercises.map((ex, idx) => (
          <div key={idx} className="bg-slate-800/30 rounded-md p-3 border border-slate-700/50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <span className="font-medium text-slate-200">{ex.name}</span>
                <div className="text-slate-400 text-sm mt-1">
                  {ex.sets} sets × {ex.reps}
                </div>
                {ex.notes && (
                  <div className="text-slate-500 text-xs mt-2 italic">{ex.notes}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {workout.notes && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-md p-3">
          <p className="text-xs text-blue-200 italic">{workout.notes}</p>
        </div>
      )}
    </div>
  );
}

function YinTab({ practices, onLaunch }: { practices: YinPracticeDetail[]; onLaunch: (practice: YinPracticeDetail) => void }) {
  return (
    <div className="space-y-3">
      {practices.map((practice, idx) => (
        <div key={idx} className="bg-teal-900/20 border border-teal-700/50 rounded-md p-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <div className="font-medium text-teal-200">{practice.name}</div>
              <div className="text-xs text-slate-400 mt-1">
                {practice.practiceType} • {practice.duration} min • {practice.timeOfDay}
              </div>
              <p className="text-xs text-slate-300 mt-2 italic">{practice.intention}</p>
              
              {practice.schedulingConfidence && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400">Confidence:</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden max-w-24">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-teal-400"
                      style={{ width: `${practice.schedulingConfidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-teal-300 w-8 text-right">{practice.schedulingConfidence}%</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => onLaunch(practice)}
              className="text-teal-400 hover:text-teal-300 transition p-1"
              title="Launch practice"
            >
              <Play size={16} />
            </button>
          </div>

          <details className="mt-3">
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
  );
}

function NutritionTab({ nutrition }: { nutrition: DayPlan['nutrition'] }) {
  return (
    <div className="space-y-3">
      <h5 className="font-semibold text-green-300 flex items-center gap-2">
        <Target size={16} />
        Nutrition Plan
      </h5>
      
      <div className="space-y-2">
        <div className="bg-slate-800/30 rounded-md p-3 border border-slate-700/50">
          <div className="font-medium text-slate-200 text-sm">Breakfast</div>
          <div className="text-slate-300 text-xs mt-1">{nutrition.breakfast.description}</div>
          <div className="text-green-400 text-xs mt-2">{nutrition.breakfast.protein}g protein</div>
        </div>

        <div className="bg-slate-800/30 rounded-md p-3 border border-slate-700/50">
          <div className="font-medium text-slate-200 text-sm">Lunch</div>
          <div className="text-slate-300 text-xs mt-1">{nutrition.lunch.description}</div>
          <div className="text-green-400 text-xs mt-2">{nutrition.lunch.protein}g protein</div>
        </div>

        <div className="bg-slate-800/30 rounded-md p-3 border border-slate-700/50">
          <div className="font-medium text-slate-200 text-sm">Dinner</div>
          <div className="text-slate-300 text-xs mt-1">{nutrition.dinner.description}</div>
          <div className="text-green-400 text-xs mt-2">{nutrition.dinner.protein}g protein</div>
        </div>

        {nutrition.snacks && (
          <div className="bg-slate-800/30 rounded-md p-3 border border-slate-700/50">
            <div className="font-medium text-slate-200 text-sm">Snacks</div>
            <div className="text-slate-300 text-xs mt-1">{nutrition.snacks.description}</div>
            <div className="text-green-400 text-xs mt-2">{nutrition.snacks.protein}g protein</div>
          </div>
        )}
      </div>

      <div className="bg-green-900/20 border border-green-700/50 rounded-md p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-green-300">Daily Total</span>
          <div className="text-right">
            <div className="text-lg font-bold text-green-300">{nutrition.totalProtein}g protein</div>
            {nutrition.totalCalories && (
              <div className="text-xs text-slate-400">{nutrition.totalCalories} calories</div>
            )}
          </div>
        </div>
      </div>

      {nutrition.notes && (
        <div className="text-xs text-slate-400 italic">{nutrition.notes}</div>
      )}
    </div>
  );
}

function SleepTab({ sleepHygiene }: { sleepHygiene: string[] }) {
  return (
    <div className="space-y-3">
      <h5 className="font-semibold text-purple-300 flex items-center gap-2">
        <Clock size={16} />
        Sleep Hygiene
      </h5>
      
      <div className="bg-purple-900/20 border border-purple-700/50 rounded-md p-3">
        <ul className="space-y-2">
          {sleepHygiene.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></div>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Old DayCard function removed - replaced with TimelineDayCard above

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

function downloadFile(filename: string, content: string, mimeType: string) {
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
  if (!label) return TIME_OF_DAY_SLOTS[DEFAULT_PRACTICE_SLOT];
  const match = TIME_KEYWORDS.find(entry => entry.pattern.test(label));
  if (match) {
    return TIME_OF_DAY_SLOTS[match.slot];
  }
  return TIME_OF_DAY_SLOTS[DEFAULT_PRACTICE_SLOT];
}
