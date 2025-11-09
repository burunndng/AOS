/**
 * Seed Frameworks Script
 * Seeds all developmental frameworks into MongoDB and indexes in Pinecone
 * Frameworks: Kegan, AQAL, Attachment, Biases, IFS
 * Run with: npx ts-node scripts/seed-frameworks.ts
 */

import { initializeDatabase, getDatabase } from '../api/lib/db.js';
import { initializePinecone, batchUpsertVectors } from '../api/lib/pinecone.js';
import { generateEmbeddingWithMetadata } from '../api/lib/embeddings.js';
import type { FrameworkDocument, PineconeVector, PineconeVectorMetadata } from '../api/lib/types.js';

/**
 * Get all frameworks to seed
 */
function getFrameworksData(): any[] {
  return [
    {
      id: 'kegan-overview',
      type: 'Kegan',
      title: 'Kegan Stages of Development',
      description: 'Developmental model showing how perspective and self-authorship evolve',
      stages: [
        'Socialized Mind (Stage 3): Identity based on relationships and roles',
        'Self-Authoring Mind (Stage 4): Self-directed, creates own values and goals',
        'Self-Transforming Mind (Stage 5): Can transcend own perspective, holds contradictions',
      ],
      content: {
        overview: 'Kegan\'s theory proposes that adults continue to develop through distinct stages.',
        stage3: 'Seeking approval, identity defined by roles',
        stage4: 'Creating personal direction, managing complexity',
        stage5: 'Integrating opposing perspectives, serving broader purpose',
      },
    },
    {
      id: 'aqal-overview',
      type: 'AQAL',
      title: 'All Quadrants, All Levels (AQAL)',
      description: 'Integral framework for comprehensive development across dimensions',
      dimensions: [
        'Interior Individual (subjective experience)',
        'Exterior Individual (objective behaviors)',
        'Interior Collective (cultural/intersubjective)',
        'Exterior Collective (systems/objective structures)',
      ],
      content: {
        overview: 'AQAL offers a meta-framework for integrating all domains of human development.',
        quadrant1: 'Your inner experience, thoughts, feelings',
        quadrant2: 'Your observable behaviors, skills, fitness',
        quadrant3: 'Shared cultural values, relationships',
        quadrant4: 'Social systems, structures, institutions',
      },
    },
    {
      id: 'attachment-overview',
      type: 'Attachment',
      title: 'Attachment Styles',
      description: 'Theory of relational patterns based on early bonding experiences',
      stages: [
        'Secure: Comfortable with intimacy and independence',
        'Anxious: Craves closeness, fears rejection',
        'Avoidant: Values independence, uncomfortable with intimacy',
        'Disorganized: Inconsistent patterns, often from trauma',
      ],
      content: {
        overview: 'Attachment style shapes how we relate to others and ourselves.',
        secure: 'Flexible, responsive to relationship needs',
        anxious: 'Hypervigilant to partner cues, seeking reassurance',
        avoidant: 'Distant, independent, uncomfortable with vulnerability',
        disorganized: 'Unpredictable, often contradictory impulses',
      },
    },
    {
      id: 'biases-overview',
      type: 'Biases',
      title: 'Cognitive Biases Framework',
      description: 'Understanding systematic patterns in how we process information',
      content: {
        overview: 'We all have cognitive biases that filter how we see reality.',
        categories: [
          'Confirmation bias: seeking info that confirms existing beliefs',
          'Availability bias: overweighting recent memorable examples',
          'Attribution bias: misunderstanding cause of others\' behavior',
          'Status quo bias: preferring current state even if suboptimal',
          'Dunning-Kruger: overestimating competence in unfamiliar domains',
        ],
        value: 'Recognizing our biases increases our freedom to choose',
      },
    },
    {
      id: 'ifs-overview',
      type: 'IFS',
      title: 'Internal Family Systems',
      description: 'Model of mind as a multiplicity of parts, all trying to help',
      stages: [
        'Identify distinct internal parts with different perspectives',
        'Understand each part\'s protective role and fears',
        'Cultivate Self leadership through meditation and dialogue',
        'Facilitate communication and collaboration between parts',
      ],
      content: {
        overview: 'We\'re not a unified self, but a system of inner voices.',
        parts: 'Each part has an agenda, belief, and protective function',
        self: 'The calm, centered, compassionate presence within',
        unburdening: 'Releasing parts from extreme beliefs and trapped emotions',
        harmony: 'All parts collaborating under Self leadership',
      },
    },
  ];
}

/**
 * Seed all frameworks
 */
async function seedFrameworks(): Promise<void> {
  console.log('\n🎯 SEEDING FRAMEWORKS\n');

  try {
    // Initialize services
    console.log('📦 Initializing services...');
    const db = await initializeDatabase();
    await initializePinecone();

    // Get all frameworks
    const frameworksData = getFrameworksData();
    console.log(`✓ Found ${frameworksData.length} frameworks to seed\n`);

    // Create framework documents and vectors
    const frameworkDocuments: FrameworkDocument[] = [];
    const vectors: PineconeVector[] = [];

    for (let i = 0; i < frameworksData.length; i++) {
      const framework = frameworksData[i];

      try {
        // Create framework document
        const document: FrameworkDocument = {
          id: framework.id,
          type: framework.type as any,
          title: framework.title,
          description: framework.description,
          stages: framework.stages || [],
          dimensions: framework.dimensions || [],
          content: framework.content || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        frameworkDocuments.push(document);

        // Generate embedding
        const summary = `${framework.title}: ${framework.description}. ${
          framework.stages?.join(', ') || framework.dimensions?.join(', ') || ''
        }`;
        const embeddingResult = await generateEmbeddingWithMetadata(summary, {
          type: 'framework',
          frameworkId: framework.id,
          frameworkType: framework.type,
          description: framework.description,
          tags: [framework.type.toLowerCase()],
        } as PineconeVectorMetadata);

        // Create vector
        const vector: PineconeVector = {
          id: `framework-${framework.id}`,
          values: embeddingResult.embedding,
          metadata: embeddingResult.metadata as PineconeVectorMetadata,
        };

        vectors.push(vector);

        // Progress indicator
        const progress = ((i + 1) / frameworksData.length) * 100;
        process.stdout.write(
          `\rProcessing: ${progress.toFixed(1)}% (${i + 1}/${frameworksData.length}) - ${framework.title}`,
        );
      } catch (err) {
        console.error(`\n✗ Error processing framework ${framework.id}:`, err);
      }
    }

    console.log('\n');

    // Insert into database
    console.log(`📝 Inserting ${frameworkDocuments.length} frameworks into database...`);
    const insertedIds = await db.addFrameworks(frameworkDocuments);
    console.log(`✓ Inserted ${insertedIds.length} frameworks`);

    // Insert into Pinecone
    console.log(`📍 Indexing ${vectors.length} frameworks in Pinecone...`);
    let indexed = 0;
    await batchUpsertVectors(vectors, 10, (current, total) => {
      const progress = (current / total) * 100;
      indexed = current;
      process.stdout.write(
        `\rIndexing: ${progress.toFixed(1)}% (${current}/${total})`,
      );
    });
    console.log(`\n✓ All ${indexed} frameworks indexed in Pinecone`);

    // Get stats
    const stats = await db.getStats();
    console.log(`\n📊 SEED SUMMARY:`);
    console.log(`  • Practices in database: ${stats.practicesCount}`);
    console.log(`  • Frameworks in database: ${stats.frameworksCount}`);
    console.log(`  • User sessions indexed: ${stats.userSessionsCount}`);
    console.log(`\n✅ SEEDING COMPLETE!\n`);

  } catch (error) {
    console.error('❌ Error seeding frameworks:', error);
    process.exit(1);
  }
}

// Run seed if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFrameworks().then(() => {
    process.exit(0);
  });
}
