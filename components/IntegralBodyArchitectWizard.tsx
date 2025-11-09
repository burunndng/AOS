import React, { useMemo, useState } from 'react';
import { X, ArrowRight, Heart, Dumbbell, Wind, CheckCircle, Download, Play, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import {
  IntegralBodyPlan,
  YangConstraints,
  YinPreferences,
  YinPracticeGoal,
  DayPlan,
  YinPracticeDetail,
  WorkoutRoutine
} from '../types.ts';
import { generateIntegralWeeklyPlan } from '../services/integralBodyArchitectService.ts';

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
  onLaunchYangPractice
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
