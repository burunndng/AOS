import React, { useState, useCallback } from 'react';
import { X, ArrowRight, Dumbbell, Zap, CheckCircle, Download, ChevronDown, ChevronUp, Bookmark, Share2, AlertCircle } from 'lucide-react';
import { generateDynamicWorkout, WorkoutProgram, GeneratedWorkout } from '../services/dynamicWorkoutArchitectService.ts';

interface DynamicWorkoutArchitectWizardProps {
  onClose: () => void;
  onSave: (program: WorkoutProgram) => void;
}

type WizardStep = 'BLUEPRINT' | 'SYNTHESIS' | 'DELIVERY' | 'HANDOFF';

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];
const EQUIPMENT_OPTIONS = ['bodyweight', 'dumbbells', 'barbell', 'full-gym', 'resistance-bands', 'kettlebells', 'cables', 'machines'];
const INTENSITY_OPTIONS: Array<'light' | 'moderate' | 'intense'> = ['light', 'moderate', 'intense'];
const FOCUS_AREAS = ['chest', 'back', 'shoulders', 'arms', 'core', 'legs', 'glutes', 'cardio', 'full-body', 'functional', 'power'];

export default function DynamicWorkoutArchitectWizard({
  onClose,
  onSave
}: DynamicWorkoutArchitectWizardProps) {
  const [step, setStep] = useState<WizardStep>('BLUEPRINT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Blueprint inputs
  const [userGoals, setUserGoals] = useState('');
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate');
  const [duration, setDuration] = useState('45');
  const [equipment, setEquipment] = useState<string[]>(['bodyweight', 'dumbbells']);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [focusAreas, setFocusAreas] = useState<string[]>(['full-body']);
  const [bodyAwareness, setBodyAwareness] = useState('');
  const [injuries, setInjuries] = useState('');
  const [preferences, setPreferences] = useState('');
  const [isWeeklyProgram, setIsWeeklyProgram] = useState(false);

  const [generatedProgram, setGeneratedProgram] = useState<WorkoutProgram | null>(null);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<string[]>([]);

  const toggleEquipment = (item: string) => {
    setEquipment(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]));
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => (prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]));
  };

  const handleGenerate = async () => {
    if (!userGoals.trim()) {
      setError('Please define your fitness goals.');
      return;
    }

    if (equipment.length === 0) {
      setError('Please select at least one equipment option.');
      return;
    }

    setError('');
    setIsLoading(true);
    setStep('SYNTHESIS');

    try {
      const program = await generateDynamicWorkout({
        userGoals,
        intensity,
        duration: parseInt(duration),
        equipment,
        experienceLevel,
        focusAreas,
        bodyAwareness: bodyAwareness || undefined,
        injuries: injuries || undefined,
        preferences: preferences || undefined,
        isWeeklyProgram
      });

      setGeneratedProgram(program);
      setStep('DELIVERY');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate workout. Please try again.');
      setStep('BLUEPRINT');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProgram = () => {
    if (!generatedProgram) return;
    onSave(generatedProgram);
    setStep('HANDOFF');
  };

  const toggleSavedWorkout = (workoutId: string) => {
    setSavedWorkouts(prev =>
      prev.includes(workoutId)
        ? prev.filter(id => id !== workoutId)
        : [...prev, workoutId]
    );
  };

  const handleExportProgram = useCallback(() => {
    if (!generatedProgram) return;
    
    let text = `${generatedProgram.title}\n`;
    text += `${new Date(generatedProgram.date).toLocaleDateString()}\n\n`;
    text += `Summary: ${generatedProgram.summary}\n\n`;
    
    generatedProgram.workouts.forEach((workout, idx) => {
      text += `\n=== Workout ${idx + 1}: ${workout.name} ===\n`;
      text += `Intensity: ${workout.intensity} | Duration: ${workout.duration}min | Difficulty: ${workout.difficulty}\n`;
      text += `Muscle Groups: ${workout.muscleGroupsFocused.join(', ')}\n\n`;
      
      if (workout.warmup) {
        text += `WARMUP: ${workout.warmup.name} (${workout.warmup.duration}min)\n${workout.warmup.description}\n\n`;
      }
      
      text += `EXERCISES:\n`;
      workout.exercises.forEach(ex => {
        text += `\n${ex.name}\n`;
        text += `Sets x Reps: ${ex.sets} x ${ex.reps}\n`;
        if (ex.tempo) text += `Tempo: ${ex.tempo}\n`;
        if (ex.restSeconds) text += `Rest: ${ex.restSeconds}s\n`;
        if (ex.formGuidance && ex.formGuidance.length > 0) {
          text += `Form Cues: ${ex.formGuidance.join(' | ')}\n`;
        }
        if (ex.modifications && ex.modifications.length > 0) {
          text += `Modifications: ${ex.modifications.join(' | ')}\n`;
        }
      });
      
      if (workout.cooldown) {
        text += `\nCOOLDOWN: ${workout.cooldown.name} (${workout.cooldown.duration}min)\n${workout.cooldown.description}\n`;
      }
      
      if (workout.somaticGuidance) {
        text += `\nSomatic Guidance: ${workout.somaticGuidance}\n`;
      }
    });
    
    downloadFile('dynamic-workout-program.txt', text, 'text/plain');
  }, [generatedProgram]);

  const renderContent = () => {
    switch (step) {
      case 'BLUEPRINT':
        return <BlueprintStep
          userGoals={userGoals}
          onUserGoalsChange={setUserGoals}
          intensity={intensity}
          onIntensityChange={setIntensity}
          duration={duration}
          onDurationChange={setDuration}
          equipment={equipment}
          onToggleEquipment={toggleEquipment}
          experienceLevel={experienceLevel}
          onExperienceLevelChange={setExperienceLevel}
          focusAreas={focusAreas}
          onToggleFocusArea={toggleFocusArea}
          bodyAwareness={bodyAwareness}
          onBodyAwarenessChange={setBodyAwareness}
          injuries={injuries}
          onInjuriesChange={setInjuries}
          preferences={preferences}
          onPreferencesChange={setPreferences}
          isWeeklyProgram={isWeeklyProgram}
          onWeeklyProgramChange={setIsWeeklyProgram}
          error={error}
        />;
      case 'SYNTHESIS':
        return (
          <div className="text-center py-12">
            <Dumbbell size={48} className="mx-auto text-accent animate-pulse" />
            <h3 className="text-lg font-semibold font-mono mt-4 text-accent">Architecting Your Workout...</h3>
            <p className="text-slate-400 text-sm mt-2">Personalizing exercises and structure based on your preferences.</p>
          </div>
        );
      case 'DELIVERY':
        return generatedProgram && (
          <DeliveryStep
            program={generatedProgram}
            expandedWorkout={expandedWorkout}
            onToggleWorkout={setExpandedWorkout}
            savedWorkouts={savedWorkouts}
            onToggleSaved={toggleSavedWorkout}
          />
        );
      case 'HANDOFF':
        return (
          <div className="text-center py-12 space-y-6">
            <CheckCircle size={64} className="mx-auto text-green-400" />
            <div>
              <h3 className="text-2xl font-bold text-slate-100">Your Personalized Workout is Ready</h3>
              <p className="text-slate-400 mt-2">Start with proper form and adjust intensity as needed.</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleExportProgram}
                className="btn-luminous px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <Download size={20} /> Export Workout
              </button>
              <p className="text-xs text-slate-500">You can save and customize your workouts as you progress.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-mono">Dynamic Workout Architect</h2>
            <p className="text-sm text-slate-400 mt-1">AI-powered personalized workout generation</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <ProgressHeader currentStep={step} />
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
                Generate Workout <ArrowRight size={20} />
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
                onClick={handleSaveProgram}
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

function ProgressHeader({ currentStep }: { currentStep: WizardStep }) {
  const steps = ['BLUEPRINT', 'SYNTHESIS', 'DELIVERY', 'HANDOFF'];
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <div className={`flex flex-col items-center ${idx <= currentIndex ? 'text-accent' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                idx < currentIndex ? 'bg-green-500 text-white' : 
                idx === currentIndex ? 'bg-accent text-black' : 
                'bg-slate-700 text-slate-300'
              }`}>
                {idx < currentIndex ? '✓' : step[0]}
              </div>
              <span className="text-xs font-semibold mt-2 uppercase tracking-wider">{step}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${idx < currentIndex ? 'bg-green-500' : 'bg-slate-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

interface BlueprintStepProps {
  userGoals: string;
  onUserGoalsChange: (value: string) => void;
  intensity: 'light' | 'moderate' | 'intense';
  onIntensityChange: (value: 'light' | 'moderate' | 'intense') => void;
  duration: string;
  onDurationChange: (value: string) => void;
  equipment: string[];
  onToggleEquipment: (value: string) => void;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  onExperienceLevelChange: (value: 'beginner' | 'intermediate' | 'advanced') => void;
  focusAreas: string[];
  onToggleFocusArea: (value: string) => void;
  bodyAwareness: string;
  onBodyAwarenessChange: (value: string) => void;
  injuries: string;
  onInjuriesChange: (value: string) => void;
  preferences: string;
  onPreferencesChange: (value: string) => void;
  isWeeklyProgram: boolean;
  onWeeklyProgramChange: (value: boolean) => void;
  error: string;
}

function BlueprintStep(props: BlueprintStepProps) {
  const {
    userGoals,
    onUserGoalsChange,
    intensity,
    onIntensityChange,
    duration,
    onDurationChange,
    equipment,
    onToggleEquipment,
    experienceLevel,
    onExperienceLevelChange,
    focusAreas,
    onToggleFocusArea,
    bodyAwareness,
    onBodyAwarenessChange,
    injuries,
    onInjuriesChange,
    preferences,
    onPreferencesChange,
    isWeeklyProgram,
    onWeeklyProgramChange,
    error
  } = props;

  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    goals: true,
    structure: true,
    equipment: true,
    bodyMind: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="bg-slate-900/40 border border-slate-700 p-4 rounded-md text-sm text-slate-300">
        <p className="font-semibold mb-2">Welcome to the Dynamic Workout Architect</p>
        <p>This intelligent coach creates personalized workouts tailored to your goals, experience level, equipment, and somatic awareness.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-md text-red-300 flex gap-3 text-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Goals Section */}
      <CollapsibleSection
        title="Your Fitness Goals"
        icon={<Zap size={18} className="text-amber-400" />}
        isExpanded={expandedSections.goals}
        onToggle={() => toggleSection('goals')}
      >
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">
                What are your fitness goals? <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-slate-500">Required</span>
            </div>
            <textarea
              value={userGoals}
              onChange={e => onUserGoalsChange(e.target.value)}
              rows={3}
              placeholder="e.g., 'Build lean muscle mass and improve cardiovascular endurance while maintaining flexibility'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">💡 Be specific about what you want to achieve</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Workout Structure Section */}
      <CollapsibleSection
        title="Workout Structure"
        icon={<Dumbbell size={18} className="text-blue-400" />}
        isExpanded={expandedSections.structure}
        onToggle={() => toggleSection('structure')}
      >
        <div className="space-y-4">
          {/* Intensity */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Intensity</label>
            <div className="flex gap-2 flex-wrap">
              {INTENSITY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => onIntensityChange(opt)}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                    intensity === opt
                      ? 'bg-accent text-black'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {intensity === 'light' && 'Low impact, recovery-focused, good for beginners'}
              {intensity === 'moderate' && 'Balanced challenge, sustainable effort, builds fitness steadily'}
              {intensity === 'intense' && 'High challenge, demanding, requires good conditioning'}
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Duration (minutes)</label>
            <input
              type="number"
              min="15"
              max="120"
              step="5"
              value={duration}
              onChange={e => onDurationChange(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100"
            />
          </div>

          {/* Weekly Program Toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isWeeklyProgram}
                onChange={e => onWeeklyProgramChange(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-slate-300">Generate a full 7-day program</span>
            </label>
            <p className="text-xs text-slate-500 mt-2 ml-7">Unchecked: Single workout session | Checked: Full weekly program with variety</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Equipment Section */}
      <CollapsibleSection
        title="Equipment & Focus"
        icon={<Dumbbell size={18} className="text-teal-400" />}
        isExpanded={expandedSections.equipment}
        onToggle={() => toggleSection('equipment')}
      >
        <div className="space-y-4">
          {/* Equipment */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Available Equipment</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => onToggleEquipment(opt)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    equipment.includes(opt)
                      ? 'bg-accent text-black'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Experience Level</label>
            <div className="flex gap-2 flex-wrap">
              {EXPERIENCE_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => onExperienceLevelChange(level as 'beginner' | 'intermediate' | 'advanced')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                    experienceLevel === level
                      ? 'bg-accent text-black'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Focus Areas (select one or more)</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map(area => (
                <button
                  key={area}
                  onClick={() => onToggleFocusArea(area)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    focusAreas.includes(area)
                      ? 'bg-accent text-black'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {area.charAt(0).toUpperCase() + area.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Body & Mind Integration Section */}
      <CollapsibleSection
        title="Body Awareness & Considerations"
        icon={<Zap size={18} className="text-purple-400" />}
        isExpanded={expandedSections.bodyMind}
        onToggle={() => toggleSection('bodyMind')}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Body Awareness Preferences</label>
            <textarea
              value={bodyAwareness}
              onChange={e => onBodyAwarenessChange(e.target.value)}
              rows={2}
              placeholder="e.g., 'Focus on breathing patterns', 'Slow, controlled movements', 'Mind-muscle connection'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Injuries or Pain Considerations</label>
            <textarea
              value={injuries}
              onChange={e => onInjuriesChange(e.target.value)}
              rows={2}
              placeholder="e.g., 'Lower back pain', 'Shoulder mobility issues', 'Previous ACL tear - right knee'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Additional Preferences</label>
            <textarea
              value={preferences}
              onChange={e => onPreferencesChange(e.target.value)}
              rows={2}
              placeholder="e.g., 'Prefer compound lifts', 'Include metabolic conditioning', 'Avoid high impact exercises'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

interface DeliveryStepProps {
  program: WorkoutProgram;
  expandedWorkout: string | null;
  onToggleWorkout: (workoutId: string | null) => void;
  savedWorkouts: string[];
  onToggleSaved: (workoutId: string) => void;
}

function DeliveryStep({
  program,
  expandedWorkout,
  onToggleWorkout,
  savedWorkouts,
  onToggleSaved
}: DeliveryStepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-2">{program.title}</h3>
        <p className="text-slate-300 text-sm">{program.summary}</p>
        {program.personalizationNotes && (
          <div className="mt-4 p-3 bg-slate-800/50 border-l-2 border-accent rounded text-slate-200 text-sm">
            <p className="font-semibold mb-1">📝 Personalization Notes:</p>
            <p>{program.personalizationNotes}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-slate-200">Your Workouts ({program.workouts.length})</h4>
        {program.workouts.map((workout, idx) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            index={idx}
            isExpanded={expandedWorkout === workout.id}
            onToggle={() => onToggleWorkout(expandedWorkout === workout.id ? null : workout.id)}
            isSaved={savedWorkouts.includes(workout.id)}
            onToggleSaved={() => onToggleSaved(workout.id)}
          />
        ))}
      </div>

      {program.progressionRecommendations && program.progressionRecommendations.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-100 mb-3">📈 Progression Recommendations</h4>
          <ul className="space-y-2">
            {program.progressionRecommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-slate-300 flex gap-2">
                <span className="text-accent">→</span> {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface WorkoutCardProps {
  workout: GeneratedWorkout;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isSaved: boolean;
  onToggleSaved: () => void;
}

function WorkoutCard({
  workout,
  index,
  isExpanded,
  onToggle,
  isSaved,
  onToggleSaved
}: WorkoutCardProps) {
  const intensityColor = {
    light: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
    moderate: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
    intense: 'bg-red-500/20 border-red-500/50 text-red-300'
  };

  return (
    <div className="bg-neutral-900/40 border border-neutral-700/40 rounded-xl">
      <div
        className="p-4 cursor-pointer flex items-start justify-between hover:bg-neutral-800/40 transition"
        onClick={onToggle}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h5 className="text-lg font-semibold text-slate-100">{workout.name}</h5>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${intensityColor[workout.intensity]}`}>
              {workout.intensity.charAt(0).toUpperCase() + workout.intensity.slice(1)}
            </span>
            <span className="text-xs bg-slate-700/50 px-2 py-1 rounded text-slate-300">{workout.difficulty}</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <span>⏱️ {workout.duration}min</span>
            <span>🎯 {workout.muscleGroupsFocused.join(', ')}</span>
            {workout.caloriesBurned && <span>🔥 ~{workout.caloriesBurned} cal</span>}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSaved();
            }}
            className={`p-2 rounded-md transition ${
              isSaved
                ? 'bg-accent/20 text-accent border border-accent/50'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
            }`}
          >
            <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-md bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 transition"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-700/50 p-4 space-y-4 bg-slate-900/20">
          {workout.warmup && (
            <div>
              <h6 className="font-semibold text-accent mb-2">🔥 Warmup: {workout.warmup.name}</h6>
              <p className="text-sm text-slate-300 ml-4">{workout.warmup.description}</p>
              <p className="text-xs text-slate-500 ml-4 mt-1">{workout.warmup.duration}min</p>
            </div>
          )}

          <div>
            <h6 className="font-semibold text-slate-200 mb-3">Exercises</h6>
            <div className="space-y-4">
              {workout.exercises.map((exercise, idx) => (
                <ExerciseDetail key={idx} exercise={exercise} />
              ))}
            </div>
          </div>

          {workout.cooldown && (
            <div>
              <h6 className="font-semibold text-accent mb-2">❄️ Cooldown: {workout.cooldown.name}</h6>
              <p className="text-sm text-slate-300 ml-4">{workout.cooldown.description}</p>
              <p className="text-xs text-slate-500 ml-4 mt-1">{workout.cooldown.duration}min</p>
            </div>
          )}

          {workout.somaticGuidance && (
            <div className="bg-purple-900/20 border border-purple-700/30 rounded p-3">
              <h6 className="font-semibold text-purple-300 mb-2">🧘 Somatic Guidance</h6>
              <p className="text-sm text-slate-300">{workout.somaticGuidance}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ExerciseDetailProps {
  exercise: {
    name: string;
    sets: number;
    reps: string;
    duration?: number;
    tempo?: string;
    restSeconds?: number;
    notes?: string;
    modifications?: string[];
    formGuidance?: string[];
  };
}

function ExerciseDetail({ exercise }: ExerciseDetailProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
      <div className="cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium text-slate-100">{exercise.name}</p>
            <p className="text-sm text-slate-400 mt-1">
              {exercise.sets} sets × {exercise.reps}
              {exercise.duration && ` / ${exercise.duration}min`}
            </p>
          </div>
          {showDetails ? <ChevronUp size={16} className="text-slate-400 mt-0.5" /> : <ChevronDown size={16} className="text-slate-400 mt-0.5" />}
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 space-y-2 text-sm text-slate-300 border-t border-slate-700/50 pt-3">
          {exercise.tempo && <p><strong>Tempo:</strong> {exercise.tempo}</p>}
          {exercise.restSeconds && <p><strong>Rest:</strong> {exercise.restSeconds}s between sets</p>}
          {exercise.formGuidance && exercise.formGuidance.length > 0 && (
            <div>
              <strong>Form Cues:</strong>
              <ul className="ml-4 mt-1 space-y-1 list-disc">
                {exercise.formGuidance.map((cue, idx) => <li key={idx}>{cue}</li>)}
              </ul>
            </div>
          )}
          {exercise.modifications && exercise.modifications.length > 0 && (
            <div>
              <strong>Modifications:</strong>
              <ul className="ml-4 mt-1 space-y-1 list-disc">
                {exercise.modifications.map((mod, idx) => <li key={idx}>{mod}</li>)}
              </ul>
            </div>
          )}
          {exercise.notes && <p><strong>Notes:</strong> {exercise.notes}</p>}
        </div>
      )}
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  isExpanded,
  onToggle,
  children
}: CollapsibleSectionProps) {
  return (
    <div className="bg-slate-900/20 border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/60 transition"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-slate-200">{title}</h3>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isExpanded && (
        <div className="px-4 py-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
