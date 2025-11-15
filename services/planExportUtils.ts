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
      if (nutrition.breakfast) {
        lines.push(`Breakfast: ${nutrition.breakfast.description} (${nutrition.breakfast.protein}g protein)`);
      }
      if (nutrition.lunch) {
        lines.push(`Lunch: ${nutrition.lunch.description} (${nutrition.lunch.protein}g protein)`);
      }
      if (nutrition.dinner) {
        lines.push(`Dinner: ${nutrition.dinner.description} (${nutrition.dinner.protein}g protein)`);
      }
      if (nutrition.snacks) {
        lines.push(`Snacks: ${nutrition.snacks.description} (${nutrition.snacks.protein}g protein)`);
      }
      if (nutrition.totalProtein) lines.push(`Total Protein: ${nutrition.totalProtein}g`);
      if (nutrition.totalCalories) lines.push(`Total Calories: ${nutrition.totalCalories} kcal`);
      if (nutrition.notes) lines.push(`Notes: ${nutrition.notes}`);
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

  // Program title and summary
  if (program.title) lines.push(`Title: ${program.title}`);
  if (program.date) lines.push(`Date: ${new Date(program.date).toLocaleDateString()}`);
  if (program.summary) {
    lines.push('');
    lines.push('PROGRAM SUMMARY:');
    lines.push(program.summary);
  }
  lines.push('');

  // Personalization Notes
  if (program.personalizationNotes) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('PERSONALIZATION NOTES');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(program.personalizationNotes);
    lines.push('');
  }

  // Workout Sessions - FIXED: use 'workouts' not 'workoutSessions'
  if (program.workouts && program.workouts.length > 0) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('WORKOUT SESSIONS');
    lines.push('───────────────────────────────────────────────────────────');

    program.workouts.forEach((workout, workoutIdx) => {
      lines.push('');
      lines.push(`SESSION ${workoutIdx + 1}: ${workout.name}`);
      lines.push(`Intensity: ${workout.intensity} | Duration: ${workout.duration} minutes | Difficulty: ${workout.difficulty}`);
      if (workout.muscleGroupsFocused && workout.muscleGroupsFocused.length > 0) {
        lines.push(`Muscle Groups: ${workout.muscleGroupsFocused.join(', ')}`);
      }
      if (workout.caloriesBurned) {
        lines.push(`Estimated Calories Burned: ${workout.caloriesBurned}`);
      }
      lines.push('');

      // Warmup
      if (workout.warmup) {
        lines.push('WARMUP:');
        lines.push(`${workout.warmup.name} (${workout.warmup.duration} minutes)`);
        lines.push(workout.warmup.description);
        lines.push('');
      }

      // Main Exercises
      if (workout.exercises && workout.exercises.length > 0) {
        lines.push('EXERCISES:');
        workout.exercises.forEach((exercise, exIdx) => {
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
          if (exercise.formGuidance && exercise.formGuidance.length > 0) {
            lines.push(`     Form: ${exercise.formGuidance.join(' | ')}`);
          }
          if (exercise.modifications && exercise.modifications.length > 0) {
            lines.push(`     Modifications: ${exercise.modifications.join(', ')}`);
          }
          lines.push('');
        });
      }

      // Cooldown
      if (workout.cooldown) {
        lines.push('COOLDOWN:');
        lines.push(`${workout.cooldown.name} (${workout.cooldown.duration} minutes)`);
        lines.push(workout.cooldown.description);
        lines.push('');
      }

      // Somatic Guidance
      if (workout.somaticGuidance) {
        lines.push('SOMATIC GUIDANCE:');
        lines.push(workout.somaticGuidance);
        lines.push('');
      }

      // Notes
      if (workout.notes) {
        lines.push('NOTES:');
        lines.push(workout.notes);
        lines.push('');
      }
    });
  }

  // Progression Recommendations
  if (program.progressionRecommendations && program.progressionRecommendations.length > 0) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('PROGRESSION RECOMMENDATIONS');
    lines.push('───────────────────────────────────────────────────────────');
    program.progressionRecommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. ${rec}`);
    });
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
 * Download as PDF using html2pdf library
 */
const downloadAsPDF = (content: string, filename: string) => {
  try {
    // Create a script loader function that returns a promise
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if script is already loaded
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript && (window as any).html2pdf) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;

        script.onload = () => {
          // Give the library a moment to initialize
          setTimeout(resolve, 100);
        };

        script.onerror = () => {
          reject(new Error('Failed to load html2pdf library'));
        };

        document.head.appendChild(script);
      });
    };

    // Load html2pdf and then generate the PDF
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')
      .then(() => {
        // Create the element to convert
        const element = document.createElement('div');
        element.style.padding = '20mm';
        element.style.fontFamily = 'monospace';
        element.style.fontSize = '11px';
        element.style.whiteSpace = 'pre-wrap';
        element.style.wordWrap = 'break-word';
        element.style.lineHeight = '1.4';
        element.textContent = content;

        // Add element to DOM so html2pdf can render it
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-10000px';
        container.style.top = '-10000px';
        container.style.width = '210mm';
        container.appendChild(element);
        document.body.appendChild(container);

        // Configure PDF options
        const options = {
          margin: [10, 10, 10, 10],
          filename: `${filename}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        };

        // Generate PDF
        const html2pdfLib = (window as any).html2pdf;
        if (!html2pdfLib) {
          throw new Error('html2pdf library not properly loaded');
        }

        // Execute html2pdf with proper error handling
        html2pdfLib()
          .set(options)
          .from(element)
          .save()
          .catch((error: any) => {
            console.error('Error generating PDF:', error);
            // Fall back to text download
            document.body.removeChild(container);
            downloadAsText(content, filename);
          })
          .finally(() => {
            // Clean up the temporary element after a delay
            setTimeout(() => {
              if (document.body.contains(container)) {
                document.body.removeChild(container);
              }
            }, 1000);
          });
      })
      .catch((error) => {
        console.warn('PDF library not available, downloading as TXT instead:', error);
        downloadAsText(content, filename);
      });
  } catch (e) {
    console.warn('Error initiating PDF download, downloading as TXT instead:', e);
    downloadAsText(content, filename);
  }
};
