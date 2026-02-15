import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  State,
  usePlaybackState,
  useProgress,
  useActiveTrack,
} from 'react-native-track-player';
import { Song, FavList } from '../utils/types';
import { storageManager } from '../storage/StorageManager';
import * as PlayerService from '../services/PlayerService';
import { PLAY_MODES, PlayMode } from '../utils/constants';

export interface PlaybackContextType {
  currentSong: Song | null;
  playingList: Song[];
  searchList: FavList;
  isPlaying: boolean;
  position: number;
  duration: number;
  playMode: PlayMode;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  playSong: (song: Song) => Promise<void>;
  playList: (songs: Song[], startIndex?: number) => Promise<void>;
  addToQueue: (songs: Song[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  setPlayMode: (mode: PlayMode) => Promise<void>;
  setSearchList: (list: FavList) => void;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(
  undefined,
);

export const PlaybackProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playingList, setPlayingList] = useState<Song[]>([]);
  const [searchList, setSearchList] = useState<FavList>({
    info: { id: 'FavList-Search', title: '搜索歌单' },
    songList: [],
  });
  const [playMode, setPlayModeState] = useState<PlayMode>(PLAY_MODES.ORDER);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playbackState = usePlaybackState();
  const progress = useProgress();
  const activeTrack = useActiveTrack();

  const isPlaying = playbackState.state === State.Playing;
  const position = progress.position;
  const duration = progress.duration;

  useEffect(() => {
    initializePlayer();
  }, []);

  useEffect(() => {
    if (activeTrack) {
      const song = playingList.find(s => s.id === activeTrack.id);
      if (song) {
        setCurrentSong(song);
      }
    }
  }, [activeTrack, playingList]);

  const initializePlayer = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await PlayerService.setupPlayer();

      const settings = await storageManager.getPlayerSettings();
      setPlayModeState(settings.playMode as PlayMode);
      await PlayerService.setPlayMode(settings.playMode as PlayMode);

      const lists = await storageManager.initFavLists();

      const lastPlayList = await storageManager.getLastPlayList();
      if (lastPlayList.length > 0) {
        setPlayingList(lastPlayList);
        await PlayerService.addSongsToQueueFast(lastPlayList, true);
        await PlayerService.playTrack(0);
      } else if (lists.length > 0 && lists[0].songList.length > 0) {
        setPlayingList(lists[0].songList);
        await PlayerService.addSongsToQueueFast(lists[0].songList, true);
        await PlayerService.playTrack(0);
      }
      setIsInitialized(true);
    } catch (err) {
      console.error('Error initializing player:', err);
      setError(err instanceof Error ? err.message : '播放器初始化失败');
    } finally {
      setIsLoading(false);
    }
  };

  const playSong = useCallback(
    async (song: Song) => {
      await PlayerService.playSong(song);

      if (!playingList.some(s => s.id === song.id)) {
        const newList = [song, ...playingList];
        setPlayingList(newList);
        await storageManager.setLastPlayList(newList);
      }
    },
    [playingList],
  );

  const playList = useCallback(
    async (songs: Song[], startIndex: number = 0) => {
      setPlayingList(songs);
      await PlayerService.addSongsToQueue(songs, true);
      await PlayerService.playTrack(startIndex);
      await storageManager.setLastPlayList(songs);
    },
    [],
  );

  const addToQueue = useCallback(
    async (songs: Song[]) => {
      const newSongs = songs.filter(
        song => !playingList.some(s => s.id === song.id),
      );
      if (newSongs.length > 0) {
        const newList = [...playingList, ...newSongs];
        setPlayingList(newList);
        await PlayerService.addSongsToQueue(newSongs);
        await storageManager.setLastPlayList(newList);
      }
    },
    [playingList],
  );

  const togglePlayPause = useCallback(async () => {
    await PlayerService.togglePlayPause();
  }, []);

  const skipNext = useCallback(async () => {
    await PlayerService.skipToNext();
  }, []);

  const skipPrevious = useCallback(async () => {
    await PlayerService.skipToPrevious();
  }, []);

  const seekTo = useCallback(async (pos: number) => {
    await PlayerService.seekTo(pos);
  }, []);

  const handleSetPlayMode = useCallback(async (mode: PlayMode) => {
    setPlayModeState(mode);
    await PlayerService.setPlayMode(mode);
    const settings = await storageManager.getPlayerSettings();
    settings.playMode = mode;
    await storageManager.setPlayerSettings(settings);
  }, []);

  const value: PlaybackContextType = {
    currentSong,
    playingList,
    searchList,
    isPlaying,
    position,
    duration,
    playMode,
    isLoading,
    isInitialized,
    error,

    playSong,
    playList,
    addToQueue,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seekTo,
    setPlayMode: handleSetPlayMode,
    setSearchList,
  };

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = (): PlaybackContextType => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
};
