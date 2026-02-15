/**
 * PlayerContext - Backward Compatibility Facade
 *
 * This file re-exports from PlaybackContext and FavoritesContext
 * to maintain backward compatibility with existing code that uses usePlayer().
 *
 * New code should prefer using usePlayback() and useFavorites() directly.
 */

import React, { ReactNode } from 'react';
import {
  PlaybackProvider,
  usePlayback,
  PlaybackContextType,
} from './PlaybackContext';
import {
  FavoritesProvider,
  useFavorites,
  FavoritesContextType,
} from './FavoritesContext';

// Combined type for backward compatibility
export interface PlayerContextType
  extends PlaybackContextType,
    FavoritesContextType {}

// Combined provider - wraps both contexts
export const PlayerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <FavoritesProvider>
    <PlaybackProvider>{children}</PlaybackProvider>
  </FavoritesProvider>
);

// Combined hook for backward compatibility
export const usePlayer = (): PlayerContextType => {
  const playback = usePlayback();
  const favorites = useFavorites();
  return { ...playback, ...favorites };
};

// Re-export individual hooks for new code
export { usePlayback, useFavorites };
export type { PlaybackContextType, FavoritesContextType };
