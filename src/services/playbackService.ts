import TrackPlayer, { Event } from 'react-native-track-player';
import { ToastAndroid } from 'react-native';
import { fetchPlayUrl } from '../api/bilibili';

const BILIBILI_AUDIO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.bilibili.com',
};

export default async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());

  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());

  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());

  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (event) => {
    if (event.track && event.track.url?.includes('placeholder.bilibili')) {
      const urlParts = event.track.url.split('/');
      const bvid = urlParts[3];
      const cid = urlParts[4];
      
      try {
        const realUrl = await fetchPlayUrl(bvid, cid);
        if (realUrl && event.index !== undefined) {
          const queue = await TrackPlayer.getQueue();
          if (queue[event.index]) {
            await TrackPlayer.remove(event.index);
            await TrackPlayer.add({
              ...queue[event.index],
              url: realUrl,
              headers: BILIBILI_AUDIO_HEADERS,
            }, event.index);
            await TrackPlayer.skip(event.index);
            await TrackPlayer.play();
          }
        } else {
          ToastAndroid.show('无法获取播放地址，跳到下一曲', ToastAndroid.SHORT);
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
        } catch (e) {}
      }
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async (event) => {
    if (event.position > 0) {
      const queue = await TrackPlayer.getQueue();
      if (queue.length > 0) {
        await TrackPlayer.skip(0);
      }
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
    console.error('Playback error:', event.message);
  });
}
