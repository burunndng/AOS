import { IntegralBodyPlan, DayPlan, WorkoutProgram } from '../types';

/**
 * Export utilities for converting plans to readable text and PDF formats
 */

export const formatIntegralBodyPlanAsText = (plan: IntegralBodyPlan): string => {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('INTEGRAL BODY ARCHITECT - WEEKLY PLAN');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Week Starting: ${new Date(plan.weekStartDate).toLocaleDateString()}`);
  lines.push(`Goal: ${plan.goalStatement}`);
  lines.push('');

  // Daily Targets Summary
  lines.push('───────────────────────────────────────────────────────────');
  lines.push('WEEKLY TARGETS');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push(`Protein per day: ${plan.dailyTargets.proteinGrams}g`);
  lines.push(`Sleep per night: ${plan.dailyTargets.sleepHours} hours`);
  lines.push(`Workout days: ${plan.dailyTargets.workoutDays}`);
  lines.push(`Yin practice minutes per week: ${plan.dailyTargets.yinPracticeMinutes}`);
  lines.push('');

  if (plan.weekSummary) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('WEEK SUMMARY');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(plan.weekSummary);
    lines.push('');
  }

  // Daily Plans
  plan.days.forEach((day, index) => {
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push(`DAY ${index + 1}: ${day.dayName.toUpperCase()}`);
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push(day.summary);
    lines.push('');

    // Workout
    if (day.workout) {
      lines.push('>>> WORKOUT <<<');
      lines.push(`Name: ${day.workout.name}`);
      lines.push(`Duration: ${day.workout.duration} minutes`);
      if (day.workout.warmup) {
        lines.push(`Warmup: ${day.workout.warmup}`);
      }
      lines.push('');
      lines.push('Exercises:');
      day.workout.exercises.forEach((ex, i) => {
        lines.push(`  ${i + 1}. ${ex.name}`);
        if (ex.sets && ex.reps) lines.push(`     ${ex.sets} sets × ${ex.reps} reps`);
        if (ex.duration) lines.push(`     Duration: ${ex.duration} seconds`);
        if (ex.notes) lines.push(`     Notes: ${ex.notes}`);
      });
      if (day.workout.cooldown) {
        lines.push(`Cooldown: ${day.workout.cooldown}`);
      }
      if (day.workout.notes) {
        lines.push(`\nWorkout Notes: ${day.workout.notes}`);
      }
      lines.push('');
    }

    // Yin Practices
    if (day.yinPractices && day.yinPractices.length > 0) {
      lines.push('>>> YIN PRACTICES <<<');
      day.yinPractices.forEach((practice, i) => {
        lines.push(`${i + 1}. ${practice.name}`);
        lines.push(`   Goal: ${practice.intention}`);
        if (practice.duration) lines.push(`   Duration: ${practice.duration} minutes`);
        if (practice.timeOfDay) lines.push(`   Time of Day: ${practice.timeOfDay}`);
        if (practice.instructions && practice.instructions.length > 0) {
          lines.push(`   Instructions:`);
          practice.instructions.forEach((inst, j) => {
            lines.push(`     ${j + 1}. ${inst}`);
          });
        }
      });
      lines.push('');
    }

    // Nutrition
    if (day.nutrition) {
      lines.push('>>> NUTRITION <<<');
      const nutrition = day.nutrition;
      if (nutrition.breakfast) lines.push(`Breakfast: ${nutrition.breakfast}`);
      if (nutrition.lunch) lines.push(`Lunch: ${nutrition.lunch}`);
      if (nutrition.dinner) lines.push(`Dinner: ${nutrition.dinner}`);
      if (nutrition.snacks) lines.push(`Snacks: ${nutrition.snacks}`);
      if (nutrition.totalProtein) lines.push(`Total Protein: ${nutrition.totalProtein}g`);
      lines.push('');
    }

    // Sleep Hygiene
    if (day.sleepHygiene && day.sleepHygiene.length > 0) {
      lines.push('>>> SLEEP HYGIENE <<<');
      day.sleepHygiene.forEach((tip, i) => {
        lines.push(`${i + 1}. ${tip}`);
      });
      lines.push('');
    }

    // Synergy Notes
    if (day.synergyMetadata) {
      lines.push('>>> SYNERGY NOTES <<<');
      if (day.synergyMetadata.yangYinBalance) {
        lines.push(`Yang-Yin Balance: ${day.synergyMetadata.yangYinBalance}`);
      }
      if (day.synergyMetadata.restSpacingNotes) {
        lines.push(`Rest & Spacing: ${day.synergyMetadata.restSpacingNotes}`);
      }
      if (day.synergyMetadata.constraintResolution) {
        lines.push(`Constraint Notes: ${day.synergyMetadata.constraintResolution}`);
      }
      lines.push('');
    }
  });

  // Shopping List
  if (plan.shoppingList && plan.shoppingList.length > 0) {
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('WEEKLY SHOPPING LIST');
    lines.push('═══════════════════════════════════════════════════════════');
    plan.shoppingList.forEach((item, i) => {
      lines.push(`${i + 1}. ${item}`);
    });
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('End of Plan');
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
};

export const formatWorkoutProgramAsText = (program: WorkoutProgram): string => {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('DYNAMIC WORKOUT ARCHITECT - WORKOUT PROGRAM');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');

  if (program.goal) lines.push(`Goal: ${program.goal}`);
  if (program.focusAreas && program.focusAreas.length > 0) {
    lines.push(`Focus Areas: ${program.focusAreas.join(', ')}`);
  }
  if (program.intensity) lines.push(`Intensity Level: ${program.intensity}`);
  if (program.duration) lines.push(`Duration: ${program.duration} minutes`);
  if (program.experienceLevel) lines.push(`Experience Level: ${program.experienceLevel}`);
  lines.push('');

  // Workout Sessions
  if (program.workoutSessions && program.workoutSessions.length > 0) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('WORKOUT SESSIONS');
    lines.push('───────────────────────────────────────────────────────────');

    program.workoutSessions.forEach((session, sessionIdx) => {
      lines.push('');
      lines.push(`SESSION ${sessionIdx + 1}: ${session.name}`);
      lines.push(`Duration: ${session.duration} minutes`);
      if (session.focusArea) lines.push(`Focus: ${session.focusArea}`);
      lines.push('');

      // Warmup
      if (session.warmup) {
        lines.push('WARMUP:');
        lines.push(session.warmup);
        lines.push('');
      }

      // Main Exercises
      if (session.exercises && session.exercises.length > 0) {
        lines.push('MAIN EXERCISES:');
        session.exercises.forEach((exercise, exIdx) => {
          lines.push(`  ${exIdx + 1}. ${exercise.name}`);
          if (exercise.sets && exercise.reps) {
            lines.push(`     Sets: ${exercise.sets} | Reps: ${exercise.reps}`);
          }
          if (exercise.duration) {
            lines.push(`     Duration: ${exercise.duration} seconds`);
          }
          if (exercise.tempo) {
            lines.push(`     Tempo: ${exercise.tempo}`);
          }
          if (exercise.restSeconds) {
            lines.push(`     Rest: ${exercise.restSeconds} seconds`);
          }
          if (exercise.formGuidance) {
            lines.push(`     Form: ${exercise.formGuidance}`);
          }
          if (exercise.modifications && exercise.modifications.length > 0) {
            lines.push(`     Modifications: ${exercise.modifications.join(', ')}`);
          }
          lines.push('');
        });
      }

      // Cooldown
      if (session.cooldown) {
        lines.push('COOLDOWN:');
        lines.push(session.cooldown);
        lines.push('');
      }

      // Somatic Guidance
      if (session.somaticGuidance) {
        lines.push('SOMATIC GUIDANCE:');
        lines.push(session.somaticGuidance);
        lines.push('');
      }

      // Notes
      if (session.notes) {
        lines.push('NOTES:');
        lines.push(session.notes);
        lines.push('');
      }
    });
  }

  // Progression Recommendations
  if (program.progressionRecommendations) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('PROGRESSION RECOMMENDATIONS');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(program.progressionRecommendations);
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('End of Program');
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
};

/**
 * Download text content as a file
 */
export const downloadAsFile = (content: string, filename: string, format: 'txt' | 'pdf' = 'txt') => {
  if (format === 'txt') {
    downloadAsText(content, filename);
  } else if (format === 'pdf') {
    downloadAsPDF(content, filename);
  }
};

/**
 * Download as plain text file
 */
const downloadAsText = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download as PDF (simple format using text)
 * For a more robust PDF, consider adding a library like jsPDF or pdfkit
 */
const downloadAsPDF = (content: string, filename: string) => {
  // For now, we'll create a simple PDF-like format using a library if available
  // Otherwise, fallback to text
  try {
    // Try to use jsPDF if available, otherwise fallback to text
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      const element = document.createElement('pre');
      element.style.whiteSpace = 'pre-wrap';
      element.style.wordWrap = 'break-word';
      element.style.fontFamily = 'monospace';
      element.style.fontSize = '11px';
      element.style.padding = '20px';
      element.style.margin = '0';
      element.style.width = '100%';
      element.textContent = content;

      // IMPORTANT: Add element to DOM so html2pdf can render it fully
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.width = '210mm'; // A4 width
      container.appendChild(element);
      document.body.appendChild(container);

      const opt = {
        margin: 10,
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      };

      // @ts-ignore
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .finally(() => {
          // Clean up: remove the temporary element from DOM
          document.body.removeChild(container);
        });
    };
    // Fallback if CDN fails
    script.onerror = () => {
      console.warn('PDF library not available, downloading as TXT instead');
      downloadAsText(content, filename);
    };
    document.head.appendChild(script);
  } catch (e) {
    console.warn('Error loading PDF library, downloading as TXT instead');
    downloadAsText(content, filename);
  }
};
