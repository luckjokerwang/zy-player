// Error types for categorization
export type ErrorCategory =
  | 'network'
  | 'api'
  | 'storage'
  | 'player'
  | 'unknown';

export interface AppError {
  category: ErrorCategory;
  message: string; // User-friendly Chinese message
  originalError?: Error;
  code?: string;
}

// Parse error and return user-friendly message
export function parseError(error: unknown): AppError {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return {
        category: 'network',
        message: '网络连接失败，请检查网络设置',
        originalError: error,
      };
    }
    // API errors (Bilibili specific)
    if (error.message.includes('API') || error.message.includes('Bilibili')) {
      return {
        category: 'api',
        message: 'B站接口请求失败，请稍后重试',
        originalError: error,
      };
    }
    // Storage errors
    if (
      error.message.includes('Storage') ||
      error.message.includes('AsyncStorage')
    ) {
      return {
        category: 'storage',
        message: '数据存储失败，请重试',
        originalError: error,
      };
    }
    // Player errors
    if (error.message.includes('Track') || error.message.includes('Player')) {
      return {
        category: 'player',
        message: '播放器错误，请重试',
        originalError: error,
      };
    }
  }

  return {
    category: 'unknown',
    message: '发生未知错误，请重试',
    originalError: error instanceof Error ? error : new Error(String(error)),
  };
}

// Get user-friendly error message
export function getErrorMessage(error: unknown): string {
  return parseError(error).message;
}

// Log error for debugging (can be replaced with proper logging)
export function logError(context: string, error: unknown): void {
  const appError = parseError(error);
  console.error(`[${context}] ${appError.category}:`, appError.originalError);
}
