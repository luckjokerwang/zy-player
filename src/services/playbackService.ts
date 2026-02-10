import TrackPlayer, { Event } from 'react-native-track-player';

export default async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());

  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());

  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());

  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));

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
