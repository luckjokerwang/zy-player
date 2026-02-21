import TrackPlayer, {
  RepeatMode,
  Capability,
  AppKilledPlaybackBehavior,
  Track,
  State,
} from 'react-native-track-player';
import { ToastAndroid } from 'react-native';
import { Song } from '../utils/types';
import { fetchPlayUrl } from '../api/bilibili';
import {
  PLAY_MODES,
  PlayMode,
  BILIBILI_HEADERS,
  createPlaceholderUrl,
  isPlaceholderUrl,
  parsePlaceholderUrl,
} from '../utils/constants';

let isPlayerInitialized = false;
const resolvingPromises = new Map<number, Promise<boolean>>();

export const setupPlayer = async (): Promise<boolean> => {
  if (isPlayerInitialized) {
    return true;
  }

  ToastAndroid.show('setupPlayer 开始', ToastAndroid.SHORT);

  try {
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
    });

    ToastAndroid.show('setupPlayer 成功', ToastAndroid.SHORT);

    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
        Capability.SeekTo,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },
    });

    isPlayerInitialized = true;
    ToastAndroid.show('播放器初始化完成', ToastAndroid.SHORT);
    return true;
  } catch (error) {
    console.error('Error setting up player:', error);
    ToastAndroid.show('播放器初始化失败: ' + error, ToastAndroid.LONG);
    return false;
  }
};

export const convertSongToTrackFast = (song: Song): Track => {
  return {
    id: song.id,
    url: createPlaceholderUrl(song.bvid, song.id),
    title: song.name,
    artist: song.singer,
    artwork: song.cover,
    duration: 0,
    headers: BILIBILI_HEADERS,
  };
};

export const convertSongToTrack = async (song: Song): Promise<Track> => {
  const url = await fetchPlayUrl(song.bvid, song.id);
  return {
    id: song.id,
    url: url || '',
    title: song.name,
    artist: song.singer,
    artwork: song.cover,
    duration: 0,
    headers: BILIBILI_HEADERS,
  };
};

// 快速添加歌曲到队列（不获取URL，用于初始化）
export const addSongsToQueueFast = async (
  songs: Song[],
  clearQueue: boolean = false,
): Promise<void> => {
  try {
    if (clearQueue) {
      await TrackPlayer.reset();
    }

    const tracks: Track[] = songs.map(song => convertSongToTrackFast(song));
    await TrackPlayer.add(tracks);
  } catch (error) {
    console.error('Error adding songs to queue:', error);
  }
};

export const addSongsToQueue = async (
  songs: Song[],
  clearQueue: boolean = false,
): Promise<void> => {
  try {
    if (clearQueue) {
      await TrackPlayer.reset();
    }

    const tracks: Track[] = [];
    for (const song of songs) {
      const track = await convertSongToTrack(song);
      if (track.url) {
        tracks.push(track);
      }
    }

    await TrackPlayer.add(tracks);
  } catch (error) {
    console.error('Error adding songs to queue:', error);
  }
};

export const resolveTrackUrl = async (index: number): Promise<boolean> => {
  const existingPromise = resolvingPromises.get(index);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async (): Promise<boolean> => {
    try {
      const queue = await TrackPlayer.getQueue();
      const track = queue[index];
      if (!track) {
        return false;
      }
      if (!isPlaceholderUrl(track.url)) {
        return true;
      }
      const parsed = parsePlaceholderUrl(track.url);
      if (!parsed) {
        return false;
      }
      const realUrl = await fetchPlayUrl(parsed.bvid, parsed.cid);
      if (!realUrl) {
        return false;
      }
      await TrackPlayer.remove(index);
      await TrackPlayer.add(
        { ...track, url: realUrl, headers: BILIBILI_HEADERS },
        index,
      );
      return true;
    } catch (error) {
      console.error('[resolveTrackUrl] Error:', error);
      return false;
    }
  })();

  resolvingPromises.set(index, promise);

  try {
    return await promise;
  } finally {
    resolvingPromises.delete(index);
  }
};

export const playTrack = async (index: number): Promise<void> => {
  try {
    const resolved = await resolveTrackUrl(index);
    if (resolved) {
      await TrackPlayer.skip(index);
      await TrackPlayer.play();
    } else {
      ToastAndroid.show('无法获取播放地址，跳到下一曲', ToastAndroid.SHORT);
      const queue = await TrackPlayer.getQueue();
      if (queue.length > 1) {
        const nextIndex = (index + 1) % queue.length;
        await playTrack(nextIndex);
      }
    }
  } catch (error) {
    console.error('[playTrack] Error:', error);
    ToastAndroid.show('播放出错', ToastAndroid.SHORT);
  }
};

export const playSong = async (song: Song): Promise<void> => {
  try {
    const queue = await TrackPlayer.getQueue();
    const existingIndex = queue.findIndex(track => track.id === song.id);

    if (existingIndex !== -1) {
      await playTrack(existingIndex);
    } else {
      const track = await convertSongToTrack(song);
      if (track.url) {
        await TrackPlayer.add(track, 0);
        await TrackPlayer.skip(0);
        await TrackPlayer.play();
      }
    }
  } catch (error) {
    console.error('Error playing song:', error);
  }
};

export const setPlayMode = async (mode: PlayMode): Promise<void> => {
  try {
    switch (mode) {
      case PLAY_MODES.ORDER:
        await TrackPlayer.setRepeatMode(RepeatMode.Off);
        break;
      case PLAY_MODES.LIST_LOOP:
        await TrackPlayer.setRepeatMode(RepeatMode.Queue);
        break;
      case PLAY_MODES.SINGLE_LOOP:
        await TrackPlayer.setRepeatMode(RepeatMode.Track);
        break;
      case PLAY_MODES.SHUFFLE:
        await TrackPlayer.setRepeatMode(RepeatMode.Queue);
        break;
    }
  } catch (error) {
    console.error('Error setting play mode:', error);
  }
};

export const getCurrentTrackInfo = async (): Promise<Track | null> => {
  try {
    const trackIndex = await TrackPlayer.getActiveTrackIndex();
    if (trackIndex === undefined || trackIndex === null) {
      return null;
    }
    const queue = await TrackPlayer.getQueue();
    return queue[trackIndex] || null;
  } catch (error) {
    console.error('Error getting current track:', error);
    return null;
  }
};

export const getPlaybackState = async (): Promise<State | null> => {
  try {
    const playback = await TrackPlayer.getPlaybackState();
    return playback.state;
  } catch (error) {
    console.error('Error getting playback state:', error);
    return null;
  }
};

export const togglePlayPause = async (): Promise<void> => {
  try {
    const state = await getPlaybackState();
    if (state === State.Playing) {
      await TrackPlayer.pause();
    } else {
      const activeIndex = await TrackPlayer.getActiveTrackIndex();
      if (activeIndex !== undefined && activeIndex !== null) {
        const resolved = await resolveTrackUrl(activeIndex);
        if (resolved) {
          // URL已解析，直接play()，避免skip()重置position
          await TrackPlayer.play();
        } else {
          ToastAndroid.show('无法获取播放地址', ToastAndroid.SHORT);
        }
      } else {
        await TrackPlayer.play();
      }
    }
  } catch (error) {
    console.error('Error toggling play/pause:', error);
  }
};

export const skipToNext = async (): Promise<void> => {
  try {
    const queue = await TrackPlayer.getQueue();
    const activeIndex = await TrackPlayer.getActiveTrackIndex();
    if (
      activeIndex === undefined ||
      activeIndex === null ||
      queue.length === 0
    ) {
      return;
    }
    const nextIndex = (activeIndex + 1) % queue.length;
    await playTrack(nextIndex);
  } catch (error) {
    console.error('Error skipping to next:', error);
  }
};

export const skipToPrevious = async (): Promise<void> => {
  try {
    const queue = await TrackPlayer.getQueue();
    const activeIndex = await TrackPlayer.getActiveTrackIndex();
    if (
      activeIndex === undefined ||
      activeIndex === null ||
      queue.length === 0
    ) {
      return;
    }
    const prevIndex = activeIndex > 0 ? activeIndex - 1 : queue.length - 1;
    await playTrack(prevIndex);
  } catch (error) {
    console.error('Error skipping to previous:', error);
  }
};

export const seekTo = async (position: number): Promise<void> => {
  try {
    await TrackPlayer.seekTo(position);
  } catch (error) {
    console.error('Error seeking:', error);
  }
};

export const setVolume = async (volume: number): Promise<void> => {
  try {
    await TrackPlayer.setVolume(volume);
  } catch (error) {
    console.error('Error setting volume:', error);
  }
};

export const getQueue = async (): Promise<Track[]> => {
  try {
    return await TrackPlayer.getQueue();
  } catch (error) {
    console.error('Error getting queue:', error);
    return [];
  }
};

export const clearQueue = async (): Promise<void> => {
  try {
    await TrackPlayer.reset();
  } catch (error) {
    console.error('Error clearing queue:', error);
  }
};

export const removeTrackFromQueue = async (index: number): Promise<void> => {
  try {
    await TrackPlayer.remove(index);
  } catch (error) {
    console.error('Error removing track:', error);
  }
};
