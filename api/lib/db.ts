/**
 * MongoDB Database Connection
 * Handles initialization and collection management for RAG system persistence
 */

import type {
  PracticeDocument,
  FrameworkDocument,
  UserSessionDocument,
} from './types.js';

// Mock MongoDB implementation for development
// In production, replace with actual MongoDB/Mongoose connection
interface Collection<T> {
  insertOne(doc: T): Promise<{ insertedId: string }>;
  insertMany(docs: T[]): Promise<{ insertedIds: string[] }>;
  findOne(filter: Record<string, any>): Promise<T | null>;
  find(filter: Record<string, any>): Promise<T[]>;
  updateOne(filter: Record<string, any>, update: Record<string, any>): Promise<void>;
  deleteOne(filter: Record<string, any>): Promise<void>;
}

class MockCollection<T> implements Collection<T> {
  private data: Map<string, T> = new Map();
  private idCounter = 0;

  async insertOne(doc: T): Promise<{ insertedId: string }> {
    const id = String(++this.idCounter);
    this.data.set(id, doc);
    return { insertedId: id };
  }

  async insertMany(docs: T[]): Promise<{ insertedIds: string[] }> {
    const ids: string[] = [];
    for (const doc of docs) {
      const { insertedId } = await this.insertOne(doc);
      ids.push(insertedId);
    }
    return { insertedIds: ids };
  }

  async findOne(filter: Record<string, any>): Promise<T | null> {
    for (const [, doc] of this.data) {
      if (this.matchesFilter(doc, filter)) {
        return doc;
      }
    }
    return null;
  }

  async find(filter: Record<string, any>): Promise<T[]> {
    const results: T[] = [];
    for (const [, doc] of this.data) {
      if (this.matchesFilter(doc, filter)) {
        results.push(doc);
      }
    }
    return results;
  }

  async updateOne(filter: Record<string, any>, update: Record<string, any>): Promise<void> {
    for (const [id, doc] of this.data) {
      if (this.matchesFilter(doc, filter)) {
        const updateValue = update.$set || update;
        Object.assign(doc, updateValue);
        return;
      }
    }
  }

  async deleteOne(filter: Record<string, any>): Promise<void> {
    for (const [id, doc] of this.data) {
      if (this.matchesFilter(doc, filter)) {
        this.data.delete(id);
        return;
      }
    }
  }

  private matchesFilter(doc: any, filter: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (doc[key] !== value) {
        return false;
      }
    }
    return true;
  }
}

// Database class for managing collections
export class Database {
  private practices: Collection<PracticeDocument>;
  private frameworks: Collection<FrameworkDocument>;
  private userSessions: Collection<UserSessionDocument>;
  private initialized = false;

  constructor() {
    // Initialize mock collections
    this.practices = new MockCollection<PracticeDocument>();
    this.frameworks = new MockCollection<FrameworkDocument>();
    this.userSessions = new MockCollection<UserSessionDocument>();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('[DB] Initializing database collections...');
      // In production, this would connect to MongoDB
      // For now, we're using in-memory mock collections
      this.initialized = true;
      console.log('[DB] Database initialized successfully');
    } catch (error) {
      console.error('[DB] Failed to initialize database:', error);
      throw error;
    }
  }

  // ============================================
  // PRACTICE COLLECTION OPERATIONS
  // ============================================

  async addPractice(practice: PracticeDocument): Promise<string> {
    const result = await this.practices.insertOne(practice);
    console.log(`[DB] Added practice: ${practice.id}`);
    return result.insertedId;
  }

  async addPractices(practices: PracticeDocument[]): Promise<string[]> {
    const result = await this.practices.insertMany(practices);
    console.log(`[DB] Added ${practices.length} practices`);
    return result.insertedIds;
  }

  async getPractice(id: string): Promise<PracticeDocument | null> {
    return this.practices.findOne({ id });
  }

  async getPractices(filter?: Record<string, any>): Promise<PracticeDocument[]> {
    return this.practices.find(filter || {});
  }

  async updatePractice(id: string, updates: Partial<PracticeDocument>): Promise<void> {
    await this.practices.updateOne({ id }, { $set: updates });
    console.log(`[DB] Updated practice: ${id}`);
  }

  // ============================================
  // FRAMEWORK COLLECTION OPERATIONS
  // ============================================

  async addFramework(framework: FrameworkDocument): Promise<string> {
    const result = await this.frameworks.insertOne(framework);
    console.log(`[DB] Added framework: ${framework.id}`);
    return result.insertedId;
  }

  async addFrameworks(frameworks: FrameworkDocument[]): Promise<string[]> {
    const result = await this.frameworks.insertMany(frameworks);
    console.log(`[DB] Added ${frameworks.length} frameworks`);
    return result.insertedIds;
  }

  async getFramework(id: string): Promise<FrameworkDocument | null> {
    return this.frameworks.findOne({ id });
  }

  async getFrameworks(filter?: Record<string, any>): Promise<FrameworkDocument[]> {
    return this.frameworks.find(filter || {});
  }

  async updateFramework(id: string, updates: Partial<FrameworkDocument>): Promise<void> {
    await this.frameworks.updateOne({ id }, { $set: updates });
    console.log(`[DB] Updated framework: ${id}`);
  }

  // ============================================
  // USER SESSION COLLECTION OPERATIONS
  // ============================================

  async addUserSession(session: UserSessionDocument): Promise<string> {
    const result = await this.userSessions.insertOne(session);
    console.log(`[DB] Added user session: ${session.sessionId} for user: ${session.userId}`);
    return result.insertedId;
  }

  async getUserSessions(userId: string): Promise<UserSessionDocument[]> {
    return this.userSessions.find({ userId });
  }

  async getUserSession(sessionId: string): Promise<UserSessionDocument | null> {
    return this.userSessions.findOne({ sessionId });
  }

  async updateUserSession(sessionId: string, updates: Partial<UserSessionDocument>): Promise<void> {
    await this.userSessions.updateOne({ sessionId }, { $set: updates });
    console.log(`[DB] Updated session: ${sessionId}`);
  }

  // ============================================
  // USER PROFILE OPERATIONS
  // ============================================

  async getUserProfile(userId: string): Promise<Record<string, any> | null> {
    // For now, return a mock user profile based on their sessions
    const sessions = await this.getUserSessions(userId);

    if (sessions.length === 0) {
      return null;
    }

    // Analyze sessions to build a profile
    const completedPractices = new Set<string>();
    const identifiedBiases = new Set<string>();
    const sessionTypes = new Map<string, number>();

    for (const session of sessions) {
      // Track session types
      sessionTypes.set(session.type, (sessionTypes.get(session.type) || 0) + 1);

      // Extract biases if present
      if (session.content?.identifiedBiases) {
        (session.content.identifiedBiases as string[]).forEach((b) => identifiedBiases.add(b));
      }

      // Extract completed practices
      if (session.type === 'practice' && session.content?.practiceId) {
        completedPractices.add(session.content.practiceId);
      }
    }

    return {
      userId,
      completedPractices: Array.from(completedPractices),
      currentStack: [],
      preferences: {
        preferredDuration: 'medium',
        preferredModalities: [],
        preferredFrameworks: [],
        focusAreas: Array.from(sessionTypes.keys()),
      },
      identifiedBiases: Array.from(identifiedBiases),
      sessionCount: sessions.length,
      lastSessionDate: sessions[sessions.length - 1]?.createdAt,
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async deleteUserData(userId: string): Promise<void> {
    // In a real implementation, this would GDPR-comply deletion
    const sessions = await this.userSessions.find({ userId });
    for (const session of sessions) {
      await this.userSessions.deleteOne({ sessionId: session.sessionId });
    }
    console.log(`[DB] Deleted all data for user: ${userId}`);
  }

  async getStats(): Promise<Record<string, number>> {
    const practices = await this.getPractices();
    const frameworks = await this.getFrameworks();
    const sessions = await this.userSessions.find({});

    return {
      practicesCount: practices.length,
      frameworksCount: frameworks.length,
      userSessionsCount: sessions.length,
    };
  }

  async health(): Promise<{ status: 'ok' | 'error'; message: string }> {
    if (!this.initialized) {
      return { status: 'error', message: 'Database not initialized' };
    }
    return { status: 'ok', message: 'Database is healthy' };
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export async function initializeDatabase(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = new Database();
    await dbInstance.initialize();
  }
  return dbInstance;
}

export function getDatabase(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}
