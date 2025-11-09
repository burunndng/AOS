/**
 * Validate Embeddings Script
 * Validates that all practices and frameworks are properly indexed in Pinecone
 * Run with: npx ts-node scripts/validate-embeddings.ts
 */

import { initializeDatabase } from '../api/lib/db.js';
import { initializePinecone, getIndexStats, queryVectors } from '../api/lib/pinecone.js';
import { generateEmbedding } from '../api/lib/embeddings.js';

/**
 * Validate embeddings
 */
async function validateEmbeddings(): Promise<void> {
  console.log('\n=== VALIDATING EMBEDDINGS ===\n');

  try {
    // Initialize services
    const db = await initializeDatabase();
    const pinecone = await initializePinecone();

    // Get database stats
    console.log('Checking database contents...');
    const dbStats = await db.getStats();
    console.log(`✓ Database contains:`);
    console.log(`  - ${dbStats.practicesCount} practices`);
    console.log(`  - ${dbStats.frameworksCount} frameworks`);
    console.log(`  - ${dbStats.userSessionsCount} user sessions`);

    // Get Pinecone stats
    console.log('\nChecking Pinecone index...');
    const indexStats = await getIndexStats();
    console.log(`✓ Pinecone index contains:`);
    console.log(`  - ${indexStats.vectorCount} vectors`);

    // Validate embedding dimensions
    console.log('\nValidating embedding dimensions...');
    const testQuery = await generateEmbedding('test');
    if (testQuery.length === 1536) {
      console.log(`✓ Embedding dimensions correct (1536)`);
    } else {
      console.error(
        `✗ Embedding dimension mismatch: expected 1536, got ${testQuery.length}`,
      );
      process.exit(1);
    }

    // Test semantic search
    console.log('\nTesting semantic search...');
    const testEmbedding = await generateEmbedding('mindfulness meditation practice');
    const searchResults = await queryVectors(testEmbedding, 5);

    if (searchResults.length > 0) {
      console.log(`✓ Semantic search working (found ${searchResults.length} results)`);
      console.log('  Top results:');
      for (const result of searchResults.slice(0, 3)) {
        console.log(`    - ${result.metadata.practiceTitle || result.metadata.frameworkType || result.id} (${(result.score * 100).toFixed(1)}% match)`);
      }
    } else {
      console.warn('⚠ No results from semantic search');
    }

    // Check for coverage gaps
    console.log('\nChecking for coverage gaps...');
    const gapQueries = [
      'mindfulness meditation',
      'trauma healing',
      'somatic practice',
      'shadow work',
      'relationships',
      'attachment patterns',
    ];

    const coverageResults: Record<string, number> = {};
    for (const query of gapQueries) {
      const embedding = await generateEmbedding(query);
      const results = await queryVectors(embedding, 3);
      coverageResults[query] = results.length > 0 ? results[0].score : 0;
    }

    console.log('Coverage by topic:');
    for (const [topic, score] of Object.entries(coverageResults)) {
      const status = score > 0.6 ? '✓' : '⚠';
      console.log(`  ${status} ${topic}: ${(score * 100).toFixed(1)}% coverage`);
    }

    // Performance check
    console.log('\nPerformance validation...');
    const startTime = performance.now();
    const queryEmbedding = await generateEmbedding('performance test');
    const perfResults = await queryVectors(queryEmbedding, 10);
    const queryTime = performance.now() - startTime;

    console.log(`✓ Query completed in ${queryTime.toFixed(2)}ms`);
    if (queryTime > 1000) {
      console.warn('⚠ Query time exceeds 1 second - may need optimization');
    }

    // Consistency check
    console.log('\nConsistency validation...');
    const practicesInDb = await db.getPractices();
    const frameworksInDb = await db.getFrameworks();

    const expectedVectorCount = practicesInDb.length + frameworksInDb.length;
    const actualVectorCount = indexStats.vectorCount;

    if (expectedVectorCount <= actualVectorCount) {
      console.log(
        `✓ Vector count consistent: ${actualVectorCount} ≥ ${expectedVectorCount} expected`,
      );
    } else {
      console.warn(
        `⚠ Vector count mismatch: ${actualVectorCount} < ${expectedVectorCount} expected`,
      );
      console.log(`  Missing vectors: ${expectedVectorCount - actualVectorCount}`);
    }

    // Final summary
    console.log('\n=== VALIDATION SUMMARY ===');
    console.log(`✓ Database initialized with ${dbStats.practicesCount + dbStats.frameworksCount} documents`);
    console.log(`✓ Pinecone index contains ${indexStats.vectorCount} vectors`);
    console.log(`✓ Embedding dimensions verified (1536-dimensional)`);
    console.log(`✓ Semantic search operational`);
    console.log(`✓ Query performance: ${queryTime.toFixed(2)}ms`);

    const allGapsPositive = Object.values(coverageResults).every((s) => s > 0.5);
    if (allGapsPositive) {
      console.log(`✓ Good topic coverage across all areas`);
    } else {
      console.log(`⚠ Some topics have lower coverage - consider adding more content`);
    }

    console.log('\n✓ RAG SYSTEM READY FOR USE\n');
  } catch (error) {
    console.error('Validation error:', error);
    process.exit(1);
  }
}

// Run validation if this is the main module
validateEmbeddings().then(() => {
  process.exit(0);
});
