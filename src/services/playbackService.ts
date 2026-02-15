import TrackPlayer, { Event, RepeatMode } from 'react-native-track-player';
import { ToastAndroid } from 'react-native';
import { fetchPlayUrl } from '../api/bilibili';
import {
  BILIBILI_HEADERS,
  isPlaceholderUrl,
  parsePlaceholderUrl,
} from '../utils/constants';

export default async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());

  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());

  TrackPlayer.addEventListener(Event.RemoteNext, () =>
    TrackPlayer.skipToNext(),
  );

  TrackPlayer.addEventListener(Event.RemotePrevious, () =>
    TrackPlayer.skipToPrevious(),
  );

  TrackPlayer.addEventListener(Event.RemoteSeek, event =>
    TrackPlayer.seekTo(event.position),
  );

  TrackPlayer.addEventListener(
    Event.PlaybackActiveTrackChanged,
    async event => {
      if (event.track && isPlaceholderUrl(event.track.url)) {
        const parsed = parsePlaceholderUrl(event.track.url!);
        if (!parsed) return;

        try {
          const realUrl = await fetchPlayUrl(parsed.bvid, parsed.cid);
          if (realUrl && event.index !== undefined) {
            const queue = await TrackPlayer.getQueue();
            if (queue[event.index]) {
              await TrackPlayer.remove(event.index);
              await TrackPlayer.add(
                {
                  ...queue[event.index],
                  url: realUrl,
                  headers: BILIBILI_HEADERS,
                },
                event.index,
              );
              await TrackPlayer.skip(event.index);
              await TrackPlayer.play();
            }
          } else {
            ToastAndroid.show(
              '无法获取播放地址，跳到下一曲',
              ToastAndroid.SHORT,
            );
            const queue = await TrackPlayer.getQueue();
            if (queue.length > 1) {
              await TrackPlayer.skipToNext();
            }
          }
        } catch (error) {
          console.error('Error fetching real URL:', error);
          ToastAndroid.show('播放出错，跳到下一曲', ToastAndroid.SHORT);
          try {
            await TrackPlayer.skipToNext();
          } catch (skipError) {
            console.error('Failed to skip after playback error:', skipError);
          }
        }
      }
    },
  );

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async event => {
    if (event.position > 0) {
      const repeatMode = await TrackPlayer.getRepeatMode();
      if (repeatMode === RepeatMode.Off) {
        return;
      }
      const queue = await TrackPlayer.getQueue();
      if (queue.length > 0) {
        await TrackPlayer.skip(0);
      }
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackError, event => {
    console.error('Playback error:', event.message);
  });
}
