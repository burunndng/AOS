/**
 * Model Fallback Utility
 * Manages fallback models for wizards and key features
 *
 * Fallback Rules:
 * - DeepSeek / Grok --> Fallback to: gemini-2.5-flash-lite
 * - Gemini Model --> Fallback to: gpt-oss-120:exacto (via OpenRouter, bf16 quantization)
 */

export type ModelProvider = 'google' | 'openrouter' | 'groq' | 'grok' | 'anthropic';

export interface ModelConfig {
  model: string;
  provider: ModelProvider;
}

export interface FallbackConfig extends ModelConfig {
  fallbackModel: string;
  fallbackProvider: ModelProvider;
}

/**
 * Determine if a model is a DeepSeek or Grok model
 */
export function isDeepSeekOrGrokModel(model: string): boolean {
  const lowerModel = model.toLowerCase();
  return (
    lowerModel.includes('deepseek') ||
    lowerModel.includes('grok') ||
    lowerModel.includes('deepseek-v3') ||
    lowerModel.includes('deepseek-r1')
  );
}

/**
 * Determine if a model is a Gemini model
 */
export function isGeminiModel(model: string): boolean {
  const lowerModel = model.toLowerCase();
  return lowerModel.includes('gemini');
}

/**
 * Get the fallback model for a given primary model
 *
 * Rules:
 * - DeepSeek / Grok --> gemini-2.5-flash-lite
 * - Gemini --> gpt-oss-120:exacto (OpenRouter)
 * - Other --> returns the original model
 */
export function getFallbackModel(primaryModel: string): FallbackConfig {
  if (isDeepSeekOrGrokModel(primaryModel)) {
    return {
      model: primaryModel,
      provider: 'openrouter',
      fallbackModel: 'gemini-2.5-flash-lite',
      fallbackProvider: 'google',
    };
  }

  if (isGeminiModel(primaryModel)) {
    return {
      model: primaryModel,
      provider: 'google',
      fallbackModel: 'openai/gpt-oss-120b:exacto',
      fallbackProvider: 'openrouter',
    };
  }

  // No fallback needed for other models
  return {
    model: primaryModel,
    provider: 'openrouter',
    fallbackModel: primaryModel,
    fallbackProvider: 'openrouter',
  };
}

/**
 * Check if we should attempt fallback based on error
 */
export function shouldUseFallback(error: unknown): boolean {
  const errorStr = String(error).toLowerCase();

  // Rate limit errors
  if (errorStr.includes('429') || errorStr.includes('rate limit')) {
    return true;
  }

  // Quota errors
  if (errorStr.includes('quota') || errorStr.includes('out of quota')) {
    return true;
  }

  // Service unavailable
  if (errorStr.includes('503') || errorStr.includes('service unavailable')) {
    return true;
  }

  // Timeout errors
  if (errorStr.includes('timeout') || errorStr.includes('timed out')) {
    return true;
  }

  // Resource exhausted
  if (errorStr.includes('resource exhausted') || errorStr.includes('exhausted')) {
    return true;
  }

  // API Key issues (might indicate service unavailable)
  if (errorStr.includes('api key') && errorStr.includes('invalid')) {
    return false; // Don't fallback, this is a config issue
  }

  return false;
}

/**
 * Log fallback attempt for monitoring
 */
export function logFallbackAttempt(
  wizardName: string,
  primaryModel: string,
  fallbackModel: string,
  error: unknown
): void {
  console.warn(
    `[Model Fallback] ${wizardName}: Switching from ${primaryModel} to ${fallbackModel}`,
    `Error: ${String(error).substring(0, 200)}`
  );
}

/**
 * Create a retry config with fallback
 */
export function createRetryConfig(
  primaryModel: string,
  maxRetries: number = 3,
  fallbackEnabled: boolean = true
) {
  const fallbackConfig = getFallbackModel(primaryModel);

  return {
    primaryModel,
    fallbackModel: fallbackEnabled ? fallbackConfig.fallbackModel : primaryModel,
    maxRetries,
    fallbackEnabled,
    models: fallbackEnabled ? [primaryModel, fallbackConfig.fallbackModel] : [primaryModel],
  };
}

/**
 * Safe model execution with automatic fallback
 */
export async function executeWithFallback<T>(
  wizardName: string,
  primaryModel: string,
  primaryFn: (model: string) => Promise<T>,
  fallbackFn?: (model: string) => Promise<T>
): Promise<T> {
  try {
    return await primaryFn(primaryModel);
  } catch (primaryError) {
    if (!shouldUseFallback(primaryError)) {
      throw primaryError;
    }

    const fallbackConfig = getFallbackModel(primaryModel);
    const fallbackModel = fallbackConfig.fallbackModel;

    logFallbackAttempt(wizardName, primaryModel, fallbackModel, primaryError);

    if (!fallbackFn) {
      throw new Error(
        `Fallback to ${fallbackModel} not implemented for ${wizardName}`
      );
    }

    try {
      return await fallbackFn(fallbackModel);
    } catch (fallbackError) {
      // Attach original error context
      const combinedError = new Error(
        `Both primary (${primaryModel}) and fallback (${fallbackModel}) models failed. ` +
        `Primary: ${String(primaryError).substring(0, 100)}. ` +
        `Fallback: ${String(fallbackError).substring(0, 100)}`
      );
      throw combinedError;
    }
  }
}
