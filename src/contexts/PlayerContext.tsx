import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Event, State, usePlaybackState, useProgress, useActiveTrack } from 'react-native-track-player';
import { Song, FavList, PlayerSettings } from '../utils/types';
import { storageManager } from '../storage/StorageManager';
import * as PlayerService from '../services/PlayerService';
import { PLAY_MODES, PlayMode } from '../utils/constants';

interface PlayerContextType {
  currentSong: Song | null;
  playingList: Song[];
  favLists: FavList[];
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
  addFavList: (name: string) => Promise<FavList>;
  deleteFavList: (id: string) => Promise<void>;
  updateFavList: (favList: FavList) => Promise<void>;
  addSongToFavList: (favListId: string, song: Song) => Promise<void>;
  removeSongFromFavList: (favListId: string, songId: string) => Promise<void>;
  refreshFavLists: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playingList, setPlayingList] = useState<Song[]>([]);
  const [favLists, setFavLists] = useState<FavList[]>([]);
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
      setFavLists(lists);

      const lastPlayList = await storageManager.getLastPlayList();
      if (lastPlayList.length > 0) {
        setPlayingList(lastPlayList);
        await PlayerService.addSongsToQueue(lastPlayList, true);
      } else if (lists.length > 0 && lists[0].songList.length > 0) {
        setPlayingList(lists[0].songList);
        await PlayerService.addSongsToQueue(lists[0].songList, true);
      }
      setIsInitialized(true);
    } catch (err) {
      console.error('Error initializing player:', err);
      setError(err instanceof Error ? err.message : '播放器初始化失败');
    } finally {
      setIsLoading(false);
    }
  };

  const playSong = useCallback(async (song: Song) => {
    await PlayerService.playSong(song);
    
    if (!playingList.some(s => s.id === song.id)) {
      const newList = [song, ...playingList];
      setPlayingList(newList);
      await storageManager.setLastPlayList(newList);
    }
  }, [playingList]);

  const playList = useCallback(async (songs: Song[], startIndex: number = 0) => {
    setPlayingList(songs);
    await PlayerService.addSongsToQueue(songs, true);
    await PlayerService.playTrack(startIndex);
    await storageManager.setLastPlayList(songs);
  }, []);

  const addToQueue = useCallback(async (songs: Song[]) => {
    const newSongs = songs.filter(song => !playingList.some(s => s.id === song.id));
    if (newSongs.length > 0) {
      const newList = [...playingList, ...newSongs];
      setPlayingList(newList);
      await PlayerService.addSongsToQueue(newSongs);
      await storageManager.setLastPlayList(newList);
    }
  }, [playingList]);

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

  const addFavList = useCallback(async (name: string) => {
    const newList = await storageManager.addFavList(name);
    setFavLists(prev => [...prev, newList]);
    return newList;
  }, []);

  const deleteFavList = useCallback(async (id: string) => {
    await storageManager.deleteFavList(id);
    setFavLists(prev => prev.filter(list => list.info.id !== id));
  }, []);

  const updateFavList = useCallback(async (favList: FavList) => {
    await storageManager.updateFavList(favList);
    setFavLists(prev => prev.map(list => list.info.id === favList.info.id ? favList : list));
  }, []);

  const addSongToFavList = useCallback(async (favListId: string, song: Song) => {
    await storageManager.addSongToFavList(favListId, song);
    setFavLists(prev => prev.map(list => {
      if (list.info.id === favListId && !list.songList.some(s => s.id === song.id)) {
        return { ...list, songList: [song, ...list.songList] };
      }
      return list;
    }));
  }, []);

  const removeSongFromFavList = useCallback(async (favListId: string, songId: string) => {
    await storageManager.removeSongFromFavList(favListId, songId);
    setFavLists(prev => prev.map(list => {
      if (list.info.id === favListId) {
        return { ...list, songList: list.songList.filter(s => s.id !== songId) };
      }
      return list;
    }));
  }, []);

  const refreshFavLists = useCallback(async () => {
    const lists = await storageManager.initFavLists();
    setFavLists(lists);
  }, []);

  const value: PlayerContextType = {
    currentSong,
    playingList,
    favLists,
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
    addFavList,
    deleteFavList,
    updateFavList,
    addSongToFavList,
    removeSongFromFavList,
    refreshFavLists,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
