import TrackPlayer, {
  Event,
  RepeatMode,
  State,
} from 'react-native-track-player';
import { ToastAndroid } from 'react-native';
import * as PlayerService from './PlayerService';

export default async function PlaybackService() {
  ToastAndroid.show('[PlaybackService] 启动', ToastAndroid.SHORT);

  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    ToastAndroid.show('RemotePlay', ToastAndroid.SHORT);
    await PlayerService.togglePlayPause();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    ToastAndroid.show('RemotePause', ToastAndroid.SHORT);
    TrackPlayer.pause();
  });

  // Android 12+ / Vivo / MIUI 设备发送合并的 PLAY_PAUSE 事件
  TrackPlayer.addEventListener(Event.RemotePlayPause, async () => {
    ToastAndroid.show('RemotePlayPause', ToastAndroid.SHORT);
    const playbackState = await TrackPlayer.getPlaybackState();
    if (playbackState.state === State.Playing) {
      TrackPlayer.pause();
    } else {
      await PlayerService.togglePlayPause();
    }
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    ToastAndroid.show('RemoteStop', ToastAndroid.SHORT);
    TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    ToastAndroid.show('RemoteNext', ToastAndroid.SHORT);
    await PlayerService.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    ToastAndroid.show('RemotePrevious', ToastAndroid.SHORT);
    await PlayerService.skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, event =>
    TrackPlayer.seekTo(event.position),
  );

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async event => {
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
    console.error('Playback error:', event.message);
    const state = await TrackPlayer.getPlaybackState();
    if (state.state === State.Error) {
      const activeIndex = await TrackPlayer.getActiveTrackIndex();
      if (activeIndex !== undefined && activeIndex !== null) {
        await PlayerService.playTrack(activeIndex);
      }
    }
  });
}
