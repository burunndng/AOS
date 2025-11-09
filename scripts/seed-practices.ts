/**
 * Seed Practices Script
 * Seeds all practices from the frontend constants into MongoDB and indexes in Pinecone
 * Run with: npx ts-node scripts/seed-practices.ts
 */

import { initializeDatabase, getDatabase } from '../api/lib/db.js';
import { initializePinecone, batchUpsertVectors } from '../api/lib/pinecone.js';
import { generateEmbeddingWithMetadata } from '../api/lib/embeddings.js';
import type { PracticeDocument, PineconeVector, PineconeVectorMetadata } from '../api/lib/types.js';

/**
 * Get all practices from constants
 * This would normally import from constants.ts
 */
function getPracticesData(): any[] {
  // In production, import from constants.ts
  // For now, sample practices
  return [
    {
      id: 'sleep',
      name: 'Sleep Foundation',
      description: 'Consistent 7-9 hours with a regular wake time.',
      category: 'body',
      why: "Sleep is the foundation for everything. It's when the brain consolidates learning, processes emotions, repairs tissue, and regulates hormones.",
      evidence: ["Walker 'Why We Sleep' (2017)", 'AASM/NSF consensus statements'],
      roi: 'EXTREME',
      difficulty: 'Medium',
      duration: 0,
      how: [
        'Aim for 7-9 hours nightly',
        'Set a consistent WAKE time (even on weekends)',
        'Keep the room dark, cool (65-68°F), and quiet',
        'Avoid screens for 60-90 minutes before bed',
        'Get 10 minutes of morning sunlight upon waking',
      ],
      frameworks: [],
      tags: ['foundational', 'recovery', 'nervous-system'],
    },
    {
      id: 'resistance',
      name: 'Resistance Training',
      description: '2x per week, 20-30 minutes, focusing on major movement patterns.',
      category: 'body',
      why: 'Builds and maintains muscle and bone density, which are critical for metabolic health and longevity.',
      evidence: ['Schoenfeld et al. (2016)', 'Westcott (2012) review', 'Leong (2015)'],
      roi: 'VERY HIGH',
      difficulty: 'Low',
      duration: 30,
      how: [
        '2x per week, full-body sessions',
        'Focus on compound movements: Squat, Hinge, Push, Pull',
        'Perform 1-2 sets per exercise to near-failure',
        'Progress by adding weight or reps over time',
      ],
      frameworks: [],
      tags: ['strength', 'body', 'longevity'],
    },
    {
      id: 'zone2-cardio',
      name: 'Zone 2 Cardio',
      description: '3-4x per week, 30-45 min at a conversational pace.',
      category: 'body',
      why: 'Builds your aerobic base and improves mitochondrial health, which is foundational for energy and longevity.',
      evidence: ['Mandsager et al. (2018) JAMA', 'San-Millán research on Zone 2'],
      roi: 'HIGH',
      difficulty: 'Low',
      duration: 40,
      how: [
        'Maintain a pace where you can speak in full sentences but not sing',
        '3-4 sessions of 30-45 minutes each week',
        'Any modality works: brisk walking, jogging, cycling, swimming, rowing',
        'This should feel sustainable, not exhausting',
      ],
      frameworks: [],
      tags: ['cardio', 'aerobic', 'mitochondrial-health'],
    },
    {
      id: 'mindfulness',
      name: 'Mindfulness Meditation',
      description: 'Daily meditation practice for present-moment awareness.',
      category: 'mind',
      why: 'Builds attention control, emotional regulation, and self-awareness.',
      evidence: ['Tang et al. (2015)', 'Goleman & Davidson (2017)'],
      roi: 'VERY HIGH',
      difficulty: 'Low',
      duration: 10,
      how: [
        'Find a quiet place to sit comfortably',
        'Close your eyes and focus on your breath',
        'When your mind wanders, gently return your attention',
        'Start with 5 minutes and extend as it becomes natural',
      ],
      frameworks: ['AQAL'],
      tags: ['meditation', 'mind', 'awareness'],
    },
    {
      id: 'journaling',
      name: 'Reflective Journaling',
      description: 'Daily written reflection for self-discovery.',
      category: 'mind',
      why: 'Helps clarify thinking, process emotions, and identify patterns.',
      evidence: ['Pennebaker (2018)', 'Emmons & King (2000)'],
      roi: 'HIGH',
      difficulty: 'Very Low',
      duration: 15,
      how: [
        'Set aside 10-15 minutes',
        'Write without editing or judgment',
        'Focus on what you learned, felt, or noticed',
        'Review patterns over time',
      ],
      frameworks: [],
      tags: ['journaling', 'reflection', 'self-awareness'],
    },
    {
      id: 'loving-kindness',
      name: 'Loving-Kindness Meditation',
      description: 'Cultivate compassion for self and others.',
      category: 'spirit',
      why: 'Increases psychological well-being and social connection.',
      evidence: ['Fredrickson (2009)', 'Hofmann et al. (2010)'],
      roi: 'HIGH',
      difficulty: 'Medium',
      duration: 15,
      how: [
        'Begin with yourself: "May I be happy, may I be healthy"',
        'Extend to a loved one',
        'Include a neutral person',
        'Gently work with someone difficult',
        'Expand to all beings',
      ],
      frameworks: ['AQAL'],
      tags: ['compassion', 'meditation', 'relationships'],
    },
    {
      id: 'cold-water',
      name: 'Cold Water Exposure',
      description: 'End showers with 30-60 seconds of cold water.',
      category: 'body',
      why: 'Increases dopamine and builds psychological resilience.',
      evidence: ['Søberg et al. (2021)', 'Huberman research'],
      roi: 'HIGH',
      difficulty: 'Medium',
      duration: 1,
      how: [
        'Finish your normal warm shower',
        'Turn water to coldest tolerable setting',
        'Stay under for 30-60 seconds',
        'Focus on slow, steady breathing',
      ],
      frameworks: [],
      tags: ['resilience', 'dopamine', 'nervous-system'],
    },
  ];
}

/**
 * Seed all practices
 */
async function seedPractices(): Promise<void> {
  console.log('\n=== SEEDING PRACTICES ===\n');

  try {
    // Initialize database
    const db = await initializeDatabase();
    const pinecone = await initializePinecone();

    // Get all practices
    const practicesData = getPracticesData();
    console.log(`Found ${practicesData.length} practices to seed`);

    // Create practice documents and vectors
    const practiceDocuments: PracticeDocument[] = [];
    const vectors: PineconeVector[] = [];

    for (let i = 0; i < practicesData.length; i++) {
      const practice = practicesData[i];

      // Create practice document
      const document: PracticeDocument = {
        id: practice.id,
        title: practice.name,
        description: practice.description,
        category: practice.category,
        difficulty: practice.difficulty as any,
        duration: practice.duration || 10,
        instructions: practice.how || [],
        evidence: practice.evidence || [],
        roi: practice.roi || 'MEDIUM',
        frameworks: practice.frameworks || [],
        tags: practice.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      practiceDocuments.push(document);

      // Generate embedding
      const summary = `${practice.name}: ${practice.description}. ${practice.why}`;
      const embeddingResult = await generateEmbeddingWithMetadata(summary, {
        type: 'practice',
        practiceId: practice.id,
        practiceTitle: practice.name,
        category: practice.category,
        difficulty: practice.difficulty,
        duration: practice.duration,
        evidence: practice.evidence,
        roi: practice.roi,
        frameworks: practice.frameworks,
        tags: practice.tags,
        description: practice.description,
      } as PineconeVectorMetadata);

      // Create vector
      const vector: PineconeVector = {
        id: `practice-${practice.id}`,
        values: embeddingResult.embedding,
        metadata: embeddingResult.metadata as PineconeVectorMetadata,
      };

      vectors.push(vector);

      // Progress indicator
      const progress = ((i + 1) / practicesData.length) * 100;
      process.stdout.write(
        `\rProcessing practices: ${progress.toFixed(1)}% (${i + 1}/${practicesData.length})`,
      );
    }

    console.log('\n');

    // Insert into database
    console.log('Inserting practices into MongoDB...');
    const insertedIds = await db.addPractices(practiceDocuments);
    console.log(`✓ Inserted ${insertedIds.length} practices into MongoDB`);

    // Insert into Pinecone
    console.log('Indexing practices in Pinecone...');
    await batchUpsertVectors(vectors, 50, (current, total) => {
      const progress = (current / total) * 100;
      process.stdout.write(
        `\rIndexing in Pinecone: ${progress.toFixed(1)}% (${current}/${total})`,
      );
    });

    console.log('\n✓ All practices indexed in Pinecone');

    // Get stats
    const stats = await db.getStats();
    console.log(`\n=== SEED COMPLETE ===`);
    console.log(`Practices in database: ${stats.practicesCount}`);
    console.log(`Frameworks in database: ${stats.frameworksCount}`);
    console.log(`User sessions indexed: ${stats.userSessionsCount}`);
  } catch (error) {
    console.error('Error seeding practices:', error);
    process.exit(1);
  }
}

// Run seed if this is the main module
seedPractices().then(() => {
  process.exit(0);
});
