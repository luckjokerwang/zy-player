import TrackPlayer, {
  Event,
  RepeatMode,
  State,
} from 'react-native-track-player';
import { ToastAndroid } from 'react-native';
import * as PlayerService from './PlayerService';

export default async function PlaybackService() {
  console.log('[PlaybackService] Registered');

  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    console.log('[PlaybackService] RemotePlay');
    ToastAndroid.show('通知中心：播放', ToastAndroid.SHORT);
    await TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    console.log('[PlaybackService] RemotePause');
    ToastAndroid.show('通知中心：暂停', ToastAndroid.SHORT);
    await TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemotePlayPause, async () => {
    console.log('[PlaybackService] RemotePlayPause');
    const playbackState = await TrackPlayer.getPlaybackState();
    if (playbackState.state === State.Playing) {
      ToastAndroid.show('通知中心：执行暂停', ToastAndroid.SHORT);
      await TrackPlayer.pause();
    } else {
      ToastAndroid.show('通知中心：执行播放', ToastAndroid.SHORT);
      await TrackPlayer.play();
    }
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    console.log('[PlaybackService] RemoteStop');
    await TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    console.log('[PlaybackService] RemoteNext');
    ToastAndroid.show('通知中心：下一首', ToastAndroid.SHORT);
    await PlayerService.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    console.log('[PlaybackService] RemotePrevious');
    ToastAndroid.show('通知中心：上一首', ToastAndroid.SHORT);
    await PlayerService.skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async event => {
    console.log('[PlaybackService] RemoteSeek', event.position);
    await TrackPlayer.seekTo(event.position);
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async event => {
    console.log('[PlaybackService] PlaybackQueueEnded');
    if (event.position > 0) {
      const repeatMode = await TrackPlayer.getRepeatMode();
      if (repeatMode === RepeatMode.Off) {
        return;
      }
      const queue = await TrackPlayer.getQueue();
      if (queue.length > 0) {
        await PlayerService.playTrack(0);
      }
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackError, async event => {
    console.error('[PlaybackService] PlaybackError:', event.message);
    const state = await TrackPlayer.getPlaybackState();
    if (state.state === State.Error) {
      const activeIndex = await TrackPlayer.getActiveTrackIndex();
      if (activeIndex !== undefined && activeIndex !== null) {
        await PlayerService.playTrack(activeIndex);
      }
    }
  });
}
