/**
 * Seed Practices Script
 * Seeds all practices from frontend constants into MongoDB and indexes in Pinecone
 * Run with: npx ts-node scripts/seed-practices.ts
 */

import { initializeDatabase, getDatabase } from '../api/lib/db.js';
import { initializePinecone, batchUpsertVectors } from '../api/lib/pinecone.js';
import { generateEmbeddingWithMetadata } from '../api/lib/embeddings.js';
import type { PracticeDocument, PineconeVector, PineconeVectorMetadata } from '../api/lib/types.js';
import { practices as allPractices } from '../constants.js';

/**
 * Convert practices from constants into PracticeDocument format
 */
function getPracticesData(): any[] {
  const practicesArray: any[] = [];

  // Iterate through all practice modules (body, mind, spirit, shadow)
  for (const [category, practiceList] of Object.entries(allPractices)) {
    if (Array.isArray(practiceList)) {
      for (const practice of practiceList) {
        practicesArray.push({
          id: practice.id,
          name: practice.name,
          description: practice.description,
          category: category,
          why: practice.why || '',
          evidence: typeof practice.evidence === 'string'
            ? [practice.evidence]
            : Array.isArray(practice.evidence)
              ? practice.evidence
              : [],
          roi: practice.roi || 'MEDIUM',
          difficulty: practice.difficulty || 'Medium',
          duration: practice.timePerWeek ? Math.round(practice.timePerWeek * 60) : 0,
          how: practice.how || [],
          customizationQuestion: practice.customizationQuestion || '',
          affectsSystem: practice.affectsSystem || [],
          frameworks: [],
          tags: [
            category,
            ...(practice.affectsSystem || []),
            practice.roi?.toLowerCase(),
            practice.difficulty?.toLowerCase(),
          ].filter(Boolean),
        });
      }
    }
  }

  return practicesArray;
}

/**
 * Seed all practices
 */
async function seedPractices(): Promise<void> {
  console.log('\n🌱 SEEDING PRACTICES\n');

  try {
    // Initialize services
    console.log('📦 Initializing services...');
    const db = await initializeDatabase();
    await initializePinecone();

    // Get all practices
    const practicesData = getPracticesData();
    console.log(`✓ Found ${practicesData.length} practices to seed\n`);

    // Create practice documents and vectors
    const practiceDocuments: PracticeDocument[] = [];
    const vectors: PineconeVector[] = [];

    for (let i = 0; i < practicesData.length; i++) {
      const practice = practicesData[i];

      try {
        // Create practice document
        const document: PracticeDocument = {
          id: practice.id,
          title: practice.name,
          description: practice.description,
          category: practice.category,
          difficulty: (practice.difficulty || 'Medium') as any,
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

        // Generate embedding from practice content
        const summary = `${practice.name}. ${practice.description}. ${practice.why}. Evidence: ${practice.evidence.join('; ')}`;
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
          `\rProcessing: ${progress.toFixed(1)}% (${i + 1}/${practicesData.length}) - ${practice.name.substring(0, 40)}`,
        );
      } catch (err) {
        console.error(`\n✗ Error processing practice ${practice.id}:`, err);
        // Continue with next practice
      }
    }

    console.log('\n');

    // Insert into database
    console.log(`📝 Inserting ${practiceDocuments.length} practices into database...`);
    const insertedIds = await db.addPractices(practiceDocuments);
    console.log(`✓ Inserted ${insertedIds.length} practices`);

    // Insert into Pinecone
    console.log(`📍 Indexing ${vectors.length} practices in Pinecone...`);
    let indexed = 0;
    await batchUpsertVectors(vectors, 50, (current, total) => {
      const progress = (current / total) * 100;
      indexed = current;
      process.stdout.write(
        `\rIndexing: ${progress.toFixed(1)}% (${current}/${total})`,
      );
    });
    console.log(`\n✓ All ${indexed} practices indexed in Pinecone`);

    // Get stats
    const stats = await db.getStats();
    console.log(`\n📊 SEED SUMMARY:`);
    console.log(`  • Practices in database: ${stats.practicesCount}`);
    console.log(`  • Frameworks in database: ${stats.frameworksCount}`);
    console.log(`  • User sessions indexed: ${stats.userSessionsCount}`);
    console.log(`\n✅ SEEDING COMPLETE!\n`);

  } catch (error) {
    console.error('❌ Error seeding practices:', error);
    process.exit(1);
  }
}

// Run seed if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPractices().then(() => {
    process.exit(0);
  });
}
