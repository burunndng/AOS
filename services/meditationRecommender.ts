import { MeditationPractice } from '../data/meditationPractices.ts';
import { UserProfile } from '../data/meditationAssessment.ts';

export interface PracticeScore {
  practiceId: string;
  overallScore: number;
  breakdown: {
    goalAlignment: number;
    personalityFit: number;
    practicalFit: number;
    culturalAlignment: number;
  };
  concerns: string[];
  adaptations: string[];
  reasoning: string;
}

export interface RecommendationReport {
  topRecommendation: {
    practice: MeditationPractice;
    score: PracticeScore;
    why: string;
    nextSteps: string[];
  };
  alternatives: Array<{
    practice: MeditationPractice;
    score: PracticeScore;
    why: string;
  }>;
  notRecommended: Array<{
    practice: MeditationPractice;
    why: string;
  }>;
  hybridApproach?: {
    description: string;
    practices: string[];
    schedule: string;
  };
}

export class MeditationRecommender {
  // Calculate goal alignment score
  private calculateGoalAlignment(
    userGoals: string[] | undefined,
    practice: MeditationPractice
  ): number {
    if (!userGoals || userGoals.length === 0) return 0.5;

    let score = 0;
    const maxScore = userGoals.length;

    userGoals.forEach(goal => {
      // Map user goals to practice benefits
      const benefitMatch = this.matchGoalToBenefits(goal, practice);
      score += benefitMatch;
    });

    return score / maxScore;
  }

  private matchGoalToBenefits(goal: string, practice: MeditationPractice): number {
    const goalMappings: Record<string, string[]> = {
      'stress-reduction': ['Reduced anxiety', 'Lower cortisol', 'Stress reduction', 'Relaxation', 'Reduced stress markers'],
      'awakening': ['Spiritual awakening', 'enlightenment', 'Self-realization', 'Recognize', 'Buddha nature', 'rigpa'],
      'focus': ['Enhanced focus', 'Improved concentration', 'sustained attention', 'working memory', 'cognitive control'],
      'insight': ['Insight', 'understanding', 'impermanence', 'nature of mind', 'meta-awareness', 'awareness'],
      'compassion': ['compassion', 'loving-kindness', 'empathy', 'social connection', 'friendliness'],
      'pain': ['pain management', 'chronic pain', 'Pain reduction', 'body awareness'],
      'consciousness': ['consciousness', 'non-dual', 'awareness aware of itself', 'true nature', 'Self'],
      'peace': ['peace', 'tranquility', 'contentment', 'equanimity', 'calm'],
      'healing': ['trauma', 'emotional release', 'healing', 'processing', 'PTSD']
    };

    const searchTerms = goalMappings[goal] || [];
    let matchScore = 0;

    const allBenefits = [
      ...practice.research.benefits.cognitive,
      ...practice.research.benefits.emotional,
      ...practice.research.benefits.physical,
      ...practice.overview.goals
    ].join(' ').toLowerCase();

    searchTerms.forEach(term => {
      if (allBenefits.includes(term.toLowerCase())) {
        matchScore += 0.3;
      }
    });

    return Math.min(matchScore, 1);
  }

  // Calculate personality fit score
  private calculatePersonalityFit(
    userProfile: UserProfile,
    practice: MeditationPractice
  ): number {
    let score = 0;
    let factors = 0;

    // Learning style / structure preference
    if (userProfile.personality?.structurePreference) {
      const structureScore = this.matchStructurePreference(
        userProfile.personality.structurePreference,
        practice.tags.structure
      );
      score += structureScore;
      factors++;
    }

    // Temperament match
    if (userProfile.personality?.temperament) {
      const temperamentScore = this.matchTemperament(
        userProfile.personality.temperament,
        practice
      );
      score += temperamentScore;
      factors++;
    }

    // Patience / time to results
    if (userProfile.practical?.timeAvailable) {
      const patienceScore = this.matchTimeExpectation(
        userProfile.practical.timeAvailable,
        practice.tags.timeToResults
      );
      score += patienceScore;
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  private matchStructurePreference(
    userPreference: number, // 1-10 scale
    practiceStructure: 'highly-structured' | 'moderately-structured' | 'minimally-structured'
  ): number {
    // Low numbers (1-3) = want high structure
    // High numbers (8-10) = want minimal structure
    // Middle (4-7) = want moderate structure

    const structureMap = {
      'highly-structured': 2,
      'moderately-structured': 5,
      'minimally-structured': 9
    };

    const practiceValue = structureMap[practiceStructure];
    const difference = Math.abs(userPreference - practiceValue);

    // Convert difference to score (0 = perfect match, 8 = worst mismatch)
    return Math.max(0, 1 - (difference / 8));
  }

  private matchTemperament(temperament: string, practice: MeditationPractice): number {
    const temperamentMatches: Record<string, string[]> = {
      'analytical': ['concentration', 'inquiry'],
      'devotional': ['mantra', 'heart'],
      'experiential': ['non-dual', 'awareness'],
      'active': ['body'],
      'contemplative': ['concentration', 'awareness', 'inquiry']
    };

    const userApproaches = temperamentMatches[temperament] || [];
    const practiceApproaches = practice.tags.approach;

    const matches = userApproaches.filter(a => practiceApproaches.includes(a as any));
    return matches.length / Math.max(userApproaches.length, 1);
  }

  private matchTimeExpectation(timeAvailable: string, timeToResults: string): number {
    // More time available = can handle long-term practices
    // Less time = need quick results
    const timeMap: Record<string, number> = {
      '5-10': 1,
      '15-20': 2,
      '30-45': 3,
      '60+': 4,
      'variable': 2
    };

    const resultsMap = {
      'quick': 1,
      'moderate': 2,
      'long-term': 4
    };

    const userTime = timeMap[timeAvailable] || 2;
    const practiceNeeds = resultsMap[timeToResults];

    // If user has enough time for practice needs, score high
    if (userTime >= practiceNeeds) return 1;
    // Partial match
    if (userTime >= practiceNeeds - 1) return 0.6;
    // Mismatch
    return 0.3;
  }

  // Calculate practical fit score
  private calculatePracticalFit(
    userProfile: UserProfile,
    practice: MeditationPractice
  ): number {
    let score = 0;
    let factors = 0;

    // Teacher requirement
    if (userProfile.practical?.locationAccess) {
      const teacherScore = this.matchTeacherRequirement(
        userProfile.practical.locationAccess,
        practice.tags.teacherRequired
      );
      score += teacherScore;
      factors++;
    }

    // Retreat requirement
    if (userProfile.practical?.retreatWillingness) {
      const retreatScore = this.matchRetreatRequirement(
        userProfile.practical.retreatWillingness,
        practice.tags.retreatFriendly
      );
      score += retreatScore;
      factors++;
    }

    // Time commitment
    if (userProfile.practical?.timeAvailable) {
      const timeScore = this.matchTimeCommitment(
        userProfile.practical.timeAvailable,
        practice.tags.difficultyLevel
      );
      score += timeScore;
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  private matchTeacherRequirement(access: string, required: boolean): number {
    if (!required) return 1; // Always good if teacher not required

    // Teacher required
    if (access === 'good' || access === 'travel') return 1;
    if (access === 'limited') return 0.5;
    return 0.3; // self-guided preference conflicts
  }

  private matchRetreatRequirement(willingness: string, retreatFriendly: boolean): number {
    if (!retreatFriendly) return 1; // Doesn't require retreats

    // Retreat-friendly practices
    if (willingness === 'yes-interested') return 1;
    if (willingness === 'maybe') return 0.7;
    if (willingness === 'probably-not') return 0.4;
    return 0.2; // definitely not
  }

  private matchTimeCommitment(timeAvailable: string, difficulty: string): number {
    const timeMap: Record<string, number> = {
      '5-10': 1,
      '15-20': 2,
      '30-45': 3,
      '60+': 4,
      'variable': 2
    };

    const difficultyMap = {
      'beginner-friendly': 1,
      'intermediate': 2,
      'advanced': 3
    };

    const userTime = timeMap[timeAvailable] || 2;
    const practiceNeeds = difficultyMap[difficulty];

    if (userTime >= practiceNeeds) return 1;
    if (userTime >= practiceNeeds - 1) return 0.6;
    return 0.3;
  }

  // Calculate cultural alignment score
  private calculateCulturalAlignment(
    userProfile: UserProfile,
    practice: MeditationPractice
  ): number {
    let score = 0;
    let factors = 0;

    // Cultural background match
    if (userProfile.background?.cultural) {
      const culturalScore = this.matchCulturalContext(
        userProfile.background.cultural,
        practice.tags.culturalContext
      );
      score += culturalScore;
      factors++;
    }

    // Spiritual openness
    if (userProfile.background?.spiritualOpenness !== undefined) {
      const spiritualScore = this.matchSpiritualOpenness(
        userProfile.background.spiritualOpenness,
        practice.tags.culturalContext
      );
      score += spiritualScore;
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  private matchCulturalContext(
    userBackground: string,
    practiceContext: 'secular' | 'buddhist' | 'hindu' | 'mixed'
  ): number {
    const contextMatch: Record<string, Record<string, number>> = {
      'secular': { 'secular': 1, 'mixed': 0.8, 'buddhist': 0.5, 'hindu': 0.5 },
      'buddhist': { 'buddhist': 1, 'mixed': 0.8, 'secular': 0.7, 'hindu': 0.5 },
      'hindu': { 'hindu': 1, 'mixed': 0.8, 'secular': 0.7, 'buddhist': 0.5 },
      'spiritual': { 'mixed': 1, 'buddhist': 0.9, 'hindu': 0.9, 'secular': 0.7 },
      'abrahamic': { 'secular': 0.9, 'mixed': 0.6, 'buddhist': 0.4, 'hindu': 0.4 },
      'agnostic': { 'secular': 1, 'mixed': 0.8, 'buddhist': 0.6, 'hindu': 0.6 }
    };

    return contextMatch[userBackground]?.[practiceContext] || 0.5;
  }

  private matchSpiritualOpenness(openness: number, context: string): number {
    // Openness 1-3: prefer secular
    // Openness 4-7: open to mixed
    // Openness 8-10: open to spiritual/traditional

    if (context === 'secular') {
      return openness <= 5 ? 1 : 0.7;
    } else if (context === 'mixed') {
      return 0.8; // Works for most
    } else { // buddhist or hindu
      return openness >= 5 ? 1 : Math.max(0.3, openness / 10);
    }
  }

  // Main scoring function
  public scorePractice(
    practice: MeditationPractice,
    userProfile: UserProfile
  ): PracticeScore {
    const weights = {
      goalAlignment: 0.35,
      personalityFit: 0.25,
      practicalFit: 0.25,
      culturalAlignment: 0.15
    };

    const breakdown = {
      goalAlignment: this.calculateGoalAlignment(userProfile.goals?.primary, practice),
      personalityFit: this.calculatePersonalityFit(userProfile, practice),
      practicalFit: this.calculatePracticalFit(userProfile, practice),
      culturalAlignment: this.calculateCulturalAlignment(userProfile, practice)
    };

    const overallScore =
      breakdown.goalAlignment * weights.goalAlignment +
      breakdown.personalityFit * weights.personalityFit +
      breakdown.practicalFit * weights.practicalFit +
      breakdown.culturalAlignment * weights.culturalAlignment;

    const concerns = this.identifyConcerns(userProfile, practice, breakdown);
    const adaptations = this.suggestAdaptations(userProfile, practice);
    const reasoning = this.generateReasoning(practice, breakdown, userProfile);

    return {
      practiceId: practice.id,
      overallScore,
      breakdown,
      concerns,
      adaptations,
      reasoning
    };
  }

  private identifyConcerns(
    userProfile: UserProfile,
    practice: MeditationPractice,
    breakdown: any
  ): string[] {
    const concerns: string[] = [];

    // Check if practice requires teacher but user doesn't have access
    if (practice.tags.teacherRequired && userProfile.practical?.locationAccess === 'self-guided') {
      concerns.push('This practice typically requires a qualified teacher for proper instruction');
    }

    // Check time commitment
    if (userProfile.practical?.timeAvailable === '5-10' && practice.tags.difficultyLevel === 'advanced') {
      concerns.push('This practice may require more daily time than you have available');
    }

    // Check cultural mismatch
    if (breakdown.culturalAlignment < 0.5) {
      concerns.push('The cultural or spiritual context may feel unfamiliar or uncomfortable');
    }

    // Check for retreat requirement
    if (practice.tags.retreatFriendly && userProfile.practical?.retreatWillingness === 'no') {
      concerns.push('Deep progress often requires retreat practice');
    }

    return concerns;
  }

  private suggestAdaptations(userProfile: UserProfile, practice: MeditationPractice): string[] {
    const adaptations: string[] = [];

    // Time-constrained adaptations
    if (userProfile.practical?.timeAvailable === '5-10') {
      adaptations.push('Start with shorter 5-10 minute sessions and gradually build up');
    }

    // Self-guided adaptations
    if (practice.tags.teacherRequired && userProfile.practical?.locationAccess === 'self-guided') {
      adaptations.push('Use books, online courses, and recorded teachings as substitute for in-person teacher');
    }

    // Cultural adaptations
    if (userProfile.background?.spiritualOpenness && userProfile.background.spiritualOpenness < 5
        && practice.tags.culturalContext !== 'secular') {
      adaptations.push('Focus on the practical techniques rather than religious/spiritual elements');
    }

    return adaptations;
  }

  private generateReasoning(
    practice: MeditationPractice,
    breakdown: any,
    userProfile: UserProfile
  ): string {
    let reasoning = `${practice.name} `;

    // Highlight strongest alignment
    const scores = Object.entries(breakdown) as [string, number][];
    const strongest = scores.reduce((a, b) => b[1] > a[1] ? b : a);

    if (strongest[0] === 'goalAlignment' && strongest[1] > 0.7) {
      reasoning += 'aligns well with your stated goals. ';
    } else if (strongest[0] === 'personalityFit' && strongest[1] > 0.7) {
      reasoning += 'matches your learning style and personality. ';
    } else if (strongest[0] === 'practicalFit' && strongest[1] > 0.7) {
      reasoning += 'fits well with your practical circumstances. ';
    } else if (strongest[0] === 'culturalAlignment' && strongest[1] > 0.7) {
      reasoning += 'aligns with your cultural and spiritual background. ';
    }

    // Add specific appeal based on user goals
    const primaryGoal = userProfile.goals?.primary?.[0];
    if (primaryGoal) {
      const goalDescriptions: Record<string, string> = {
        'stress-reduction': 'It offers proven stress-reduction benefits',
        'awakening': 'It provides a path toward spiritual awakening',
        'focus': 'It effectively develops concentration and focus',
        'insight': 'It cultivates deep insight into the nature of mind',
        'compassion': 'It develops compassion and loving-kindness',
        'pain': 'It has strong evidence for managing chronic pain',
        'consciousness': 'It explores the nature of consciousness',
        'peace': 'It cultivates deep inner peace',
        'healing': 'It supports emotional healing'
      };

      reasoning += goalDescriptions[primaryGoal] || '';
      reasoning += '. ';
    }

    return reasoning;
  }

  // Generate full recommendation report
  public generateReport(
    practices: Record<string, MeditationPractice>,
    userProfile: UserProfile
  ): RecommendationReport {
    // Score all practices
    const scoredPractices = Object.values(practices).map(practice => ({
      practice,
      score: this.scorePractice(practice, userProfile)
    }));

    // Sort by overall score
    scoredPractices.sort((a, b) => b.score.overallScore - a.score.overallScore);

    // Top recommendation
    const top = scoredPractices[0];
    const topRecommendation = {
      practice: top.practice,
      score: top.score,
      why: top.score.reasoning,
      nextSteps: this.generateNextSteps(top.practice, userProfile)
    };

    // Alternatives (2nd-4th place, but only if score > 0.6)
    const alternatives = scoredPractices
      .slice(1, 4)
      .filter(sp => sp.score.overallScore > 0.6)
      .map(sp => ({
        practice: sp.practice,
        score: sp.score,
        why: sp.score.reasoning
      }));

    // Not recommended (bottom 2-3 with scores < 0.5)
    const notRecommended = scoredPractices
      .filter(sp => sp.score.overallScore < 0.5)
      .slice(0, 3)
      .map(sp => ({
        practice: sp.practice,
        why: this.generateNotRecommendedReason(sp.practice, sp.score, userProfile)
      }));

    // Hybrid approach if applicable
    const hybridApproach = this.generateHybridApproach(scoredPractices, userProfile);

    return {
      topRecommendation,
      alternatives,
      notRecommended,
      hybridApproach
    };
  }

  private generateNextSteps(practice: MeditationPractice, userProfile: UserProfile): string[] {
    const steps: string[] = [];

    // Add first book recommendation
    if (practice.resources.books.length > 0) {
      steps.push(`Read "${practice.resources.books[0].title}" by ${practice.resources.books[0].author}`);
    }

    // Add app recommendation if available
    if (practice.resources.apps && practice.resources.apps.length > 0) {
      steps.push(`Try the ${practice.resources.apps[0]} app for guided practice`);
    }

    // Add teacher/center recommendation
    if (practice.tags.teacherRequired) {
      steps.push('Find a qualified teacher or center in your area');
    } else {
      steps.push('Start with 10-15 minute daily sessions to establish the habit');
    }

    // Add retreat recommendation if applicable
    if (practice.tags.retreatFriendly && userProfile.practical?.retreatWillingness !== 'no') {
      steps.push('Consider attending a beginner retreat after 2-3 months of practice');
    }

    return steps;
  }

  private generateNotRecommendedReason(
    practice: MeditationPractice,
    score: PracticeScore,
    userProfile: UserProfile
  ): string {
    const weakest = Object.entries(score.breakdown).reduce((a, b) =>
      b[1] < a[1] ? b : a
    );

    const reasons: Record<string, string> = {
      'goalAlignment': `${practice.name} doesn't align well with your stated goals`,
      'personalityFit': `${practice.name} may not match your learning style and personality`,
      'practicalFit': `${practice.name} may be difficult given your practical constraints`,
      'culturalAlignment': `${practice.name}'s cultural context may be uncomfortable for you`
    };

    return reasons[weakest[0]] || `${practice.name} is not a strong match`;
  }

  private generateHybridApproach(
    scoredPractices: any[],
    userProfile: UserProfile
  ): { description: string; practices: string[]; schedule: string } | undefined {
    // Suggest hybrid if top practices are close in score and complement each other
    const top3 = scoredPractices.slice(0, 3);
    const scoreDiff = top3[0].score.overallScore - top3[2].score.overallScore;

    if (scoreDiff < 0.15 && this.practicesComplement(top3.map(sp => sp.practice))) {
      return {
        description: 'You might benefit from a hybrid approach combining complementary practices',
        practices: top3.map(sp => sp.practice.name),
        schedule: 'Alternate between practices throughout the week, or use one for daily practice and another for weekly deep sessions'
      };
    }

    return undefined;
  }

  private practicesComplement(practices: MeditationPractice[]): boolean {
    // Check if practices have different approaches
    const approaches = new Set(practices.flatMap(p => p.tags.approach));
    return approaches.size >= 2; // At least 2 different approaches
  }
}

export default new MeditationRecommender();
