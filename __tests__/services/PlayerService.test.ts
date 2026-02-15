/**
 * @format
 */

import TrackPlayer, { State, RepeatMode } from 'react-native-track-player';
import * as PlayerService from '../../src/services/PlayerService';
import { Song } from '../../src/utils/types';
import { PLAY_MODES } from '../../src/utils/constants';
import * as BilibiliApi from '../../src/api/bilibili';

// Mock the bilibili API
jest.mock('../../src/api/bilibili', () => ({
  fetchPlayUrl: jest.fn(),
}));

const mockFetchPlayUrl = BilibiliApi.fetchPlayUrl as jest.MockedFunction<
  typeof BilibiliApi.fetchPlayUrl
>;

describe('PlayerService', () => {
  const mockSong: Song = {
    id: 'test-cid-123',
    bvid: 'BV1234567890',
    name: 'Test Song',
    singer: 'Test Artist',
    singerId: 'test-singer-id',
    cover: 'https://example.com/cover.jpg',
  };

  const mockSong2: Song = {
    id: 'test-cid-456',
    bvid: 'BV0987654321',
    name: 'Test Song 2',
    singer: 'Test Artist 2',
    singerId: 'test-singer-id-2',
    cover: 'https://example.com/cover2.jpg',
  };

  const mockTrack = {
    id: mockSong.id,
    url: 'https://example.com/audio.mp3',
    title: mockSong.name,
    artist: mockSong.singer,
    artwork: mockSong.cover,
    duration: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchPlayUrl.mockResolvedValue('https://example.com/audio.mp3');
  });

  describe('setupPlayer', () => {
    it('should setup player with options on first call', async () => {
      const result = await PlayerService.setupPlayer();

      expect(result).toBe(true);
      expect(TrackPlayer.setupPlayer).toHaveBeenCalledWith({
        autoHandleInterruptions: true,
      });
      expect(TrackPlayer.updateOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          capabilities: expect.arrayContaining([
            'play',
            'pause',
            'skip-to-next',
            'skip-to-previous',
            'stop',
            'seek-to',
          ]),
        }),
      );
    });

    it('should return true without re-initializing on subsequent calls', async () => {
      // First call
      await PlayerService.setupPlayer();
      jest.clearAllMocks();

      // Second call
      const result = await PlayerService.setupPlayer();

      expect(result).toBe(true);
      expect(TrackPlayer.setupPlayer).not.toHaveBeenCalled();
      expect(TrackPlayer.updateOptions).not.toHaveBeenCalled();
    });

    it('should handle setup errors gracefully', async () => {
      (TrackPlayer.setupPlayer as jest.Mock).mockRejectedValueOnce(
        new Error('Setup failed'),
      );

      await expect(PlayerService.setupPlayer()).resolves.not.toThrow();
    });
  });

  describe('convertSongToTrackFast', () => {
    it('should convert song to track with placeholder URL', () => {
      const track = PlayerService.convertSongToTrackFast(mockSong);

      expect(track).toMatchObject({
        id: mockSong.id,
        url: expect.stringContaining('placeholder.bilibili'),
        title: mockSong.name,
        artist: mockSong.singer,
        artwork: mockSong.cover,
        duration: 0,
      });
      expect(track.url).toContain(mockSong.bvid);
      expect(track.url).toContain(mockSong.id);
    });
  });

  describe('convertSongToTrack', () => {
    it('should convert song to track with real play URL', async () => {
      const playUrl = 'https://example.com/real-audio.mp3';
      mockFetchPlayUrl.mockResolvedValueOnce(playUrl);

      const track = await PlayerService.convertSongToTrack(mockSong);

      expect(mockFetchPlayUrl).toHaveBeenCalledWith(mockSong.bvid, mockSong.id);
      expect(track).toMatchObject({
        id: mockSong.id,
        url: playUrl,
        title: mockSong.name,
        artist: mockSong.singer,
        artwork: mockSong.cover,
        duration: 0,
      });
    });

    it('should return empty URL when fetchPlayUrl returns null', async () => {
      mockFetchPlayUrl.mockResolvedValueOnce(null);

      const track = await PlayerService.convertSongToTrack(mockSong);

      expect(track.url).toBe('');
    });
  });

  describe('addSongsToQueueFast', () => {
    it('should add songs to queue without clearing', async () => {
      await PlayerService.addSongsToQueueFast([mockSong, mockSong2]);

      expect(TrackPlayer.reset).not.toHaveBeenCalled();
      expect(TrackPlayer.add).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: mockSong.id,
            title: mockSong.name,
          }),
          expect.objectContaining({
            id: mockSong2.id,
            title: mockSong2.name,
          }),
        ]),
      );
    });

    it('should clear queue before adding when clearQueue is true', async () => {
      await PlayerService.addSongsToQueueFast([mockSong], true);

      expect(TrackPlayer.reset).toHaveBeenCalled();
      expect(TrackPlayer.add).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (TrackPlayer.add as jest.Mock).mockRejectedValueOnce(
        new Error('Add failed'),
      );

      await expect(
        PlayerService.addSongsToQueueFast([mockSong]),
      ).resolves.not.toThrow();
    });
  });

  describe('addSongsToQueue', () => {
    it('should add songs to queue with real URLs', async () => {
      await PlayerService.addSongsToQueue([mockSong, mockSong2]);

      expect(mockFetchPlayUrl).toHaveBeenCalledTimes(2);
      expect(TrackPlayer.reset).not.toHaveBeenCalled();
      expect(TrackPlayer.add).toHaveBeenCalled();
    });

    it('should skip songs with no URL', async () => {
      mockFetchPlayUrl
        .mockResolvedValueOnce('https://example.com/audio1.mp3')
        .mockResolvedValueOnce(null);

      await PlayerService.addSongsToQueue([mockSong, mockSong2]);

      const addCall = (TrackPlayer.add as jest.Mock).mock.calls[0][0];
      expect(addCall).toHaveLength(1);
      expect(addCall[0].id).toBe(mockSong.id);
    });

    it('should clear queue when clearQueue is true', async () => {
      await PlayerService.addSongsToQueue([mockSong], true);

      expect(TrackPlayer.reset).toHaveBeenCalled();
    });
  });

  describe('playTrack', () => {
    it('should resolve placeholder and play', async () => {
      const placeholderTrack = {
        id: mockSong.id,
        url: 'https://placeholder.bilibili/BV1234567890/test-cid-123',
        title: mockSong.name,
        artist: mockSong.singer,
      };
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValue([placeholderTrack]);
      mockFetchPlayUrl.mockResolvedValueOnce('https://real-audio.mp3');

      await PlayerService.playTrack(0);

      expect(mockFetchPlayUrl).toHaveBeenCalledWith(
        'BV1234567890',
        'test-cid-123',
      );
      expect(TrackPlayer.remove).toHaveBeenCalledWith(0);
      expect(TrackPlayer.add).toHaveBeenCalled();
      expect(TrackPlayer.skip).toHaveBeenCalledWith(0);
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should play directly when URL is not a placeholder', async () => {
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValue([mockTrack]);

      await PlayerService.playTrack(0);

      expect(TrackPlayer.skip).toHaveBeenCalledWith(0);
      expect(TrackPlayer.play).toHaveBeenCalled();
      expect(mockFetchPlayUrl).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (TrackPlayer.getQueue as jest.Mock).mockRejectedValueOnce(
        new Error('Queue error'),
      );

      await expect(PlayerService.playTrack(0)).resolves.not.toThrow();
    });
  });

  describe('playSong', () => {
    it('should play existing song from queue', async () => {
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
        mockTrack,
        { id: mockSong2.id },
      ]);

      await PlayerService.playSong(mockSong);

      expect(TrackPlayer.getQueue).toHaveBeenCalled();
      expect(TrackPlayer.skip).toHaveBeenCalledWith(0);
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should add and play new song not in queue', async () => {
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce([
        { id: 'other-song' },
      ]);
      mockFetchPlayUrl.mockResolvedValueOnce('https://example.com/audio.mp3');

      await PlayerService.playSong(mockSong);

      expect(mockFetchPlayUrl).toHaveBeenCalledWith(mockSong.bvid, mockSong.id);
      expect(TrackPlayer.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockSong.id,
          url: 'https://example.com/audio.mp3',
        }),
        0,
      );
      expect(TrackPlayer.skip).toHaveBeenCalledWith(0);
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should not add song if URL fetch fails', async () => {
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce([]);
      mockFetchPlayUrl.mockResolvedValueOnce(null);

      await PlayerService.playSong(mockSong);

      expect(TrackPlayer.add).not.toHaveBeenCalled();
    });
  });

  describe('setPlayMode', () => {
    it('should set ORDER mode to RepeatMode.Off', async () => {
      await PlayerService.setPlayMode(PLAY_MODES.ORDER);

      expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Off);
    });

    it('should set LIST_LOOP mode to RepeatMode.Queue', async () => {
      await PlayerService.setPlayMode(PLAY_MODES.LIST_LOOP);

      expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Queue);
    });

    it('should set SINGLE_LOOP mode to RepeatMode.Track', async () => {
      await PlayerService.setPlayMode(PLAY_MODES.SINGLE_LOOP);

      expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Track);
    });

    it('should set SHUFFLE mode to RepeatMode.Queue', async () => {
      await PlayerService.setPlayMode(PLAY_MODES.SHUFFLE);

      expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Queue);
    });
  });

  describe('getCurrentTrackInfo', () => {
    it('should return current track when available', async () => {
      const mockQueue = [mockTrack, { id: 'track2' }];
      (TrackPlayer.getActiveTrackIndex as jest.Mock).mockResolvedValueOnce(0);
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce(mockQueue);

      const result = await PlayerService.getCurrentTrackInfo();

      expect(result).toEqual(mockTrack);
    });

    it('should return null when no active track', async () => {
      (TrackPlayer.getActiveTrackIndex as jest.Mock).mockResolvedValueOnce(
        null,
      );

      const result = await PlayerService.getCurrentTrackInfo();

      expect(result).toBeNull();
    });

    it('should return null when track index is undefined', async () => {
      (TrackPlayer.getActiveTrackIndex as jest.Mock).mockResolvedValueOnce(
        undefined,
      );

      const result = await PlayerService.getCurrentTrackInfo();

      expect(result).toBeNull();
    });

    it('should return null when track not found in queue', async () => {
      (TrackPlayer.getActiveTrackIndex as jest.Mock).mockResolvedValueOnce(5);
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce([mockTrack]);

      const result = await PlayerService.getCurrentTrackInfo();

      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      (TrackPlayer.getActiveTrackIndex as jest.Mock).mockRejectedValueOnce(
        new Error('Error'),
      );

      const result = await PlayerService.getCurrentTrackInfo();

      expect(result).toBeNull();
    });
  });

  describe('getPlaybackState', () => {
    it('should return playback state', async () => {
      (TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValueOnce({
        state: State.Playing,
      });

      const result = await PlayerService.getPlaybackState();

      expect(result).toBe(State.Playing);
    });

    it('should return null on error', async () => {
      (TrackPlayer.getPlaybackState as jest.Mock).mockRejectedValueOnce(
        new Error('Error'),
      );

      const result = await PlayerService.getPlaybackState();

      expect(result).toBeNull();
    });
  });

  describe('togglePlayPause', () => {
    it('should pause when currently playing', async () => {
      (TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValueOnce({
        state: State.Playing,
      });

      await PlayerService.togglePlayPause();

      expect(TrackPlayer.pause).toHaveBeenCalled();
      expect(TrackPlayer.play).not.toHaveBeenCalled();
    });

    it('should play when currently paused', async () => {
      (TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValueOnce({
        state: State.Paused,
      });

      await PlayerService.togglePlayPause();

      expect(TrackPlayer.play).toHaveBeenCalled();
      expect(TrackPlayer.pause).not.toHaveBeenCalled();
    });

    it('should play when state is stopped', async () => {
      (TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValueOnce({
        state: State.Stopped,
      });

      await PlayerService.togglePlayPause();

      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (TrackPlayer.getPlaybackState as jest.Mock).mockRejectedValueOnce(
        new Error('Error'),
      );

      await expect(PlayerService.togglePlayPause()).resolves.not.toThrow();
    });
  });

  describe('skipToNext', () => {
    it('should resolve and play next track', async () => {
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
        mockTrack,
        { id: mockSong2.id, url: 'https://example.com/audio2.mp3' },
      ]);
      (TrackPlayer.getActiveTrackIndex as jest.Mock).mockResolvedValueOnce(0);

      await PlayerService.skipToNext();

      expect(TrackPlayer.skip).toHaveBeenCalledWith(1);
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should do nothing when no active track', async () => {
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce([mockTrack]);
      (TrackPlayer.getActiveTrackIndex as jest.Mock).mockResolvedValueOnce(
        undefined,
      );

      await PlayerService.skipToNext();

      expect(TrackPlayer.skip).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (TrackPlayer.getQueue as jest.Mock).mockRejectedValueOnce(
        new Error('Error'),
      );

      await expect(PlayerService.skipToNext()).resolves.not.toThrow();
    });
  });

  describe('skipToPrevious', () => {
    it('should resolve and play previous track', async () => {
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
        { id: mockSong2.id, url: 'https://example.com/audio2.mp3' },
        mockTrack,
      ]);
      (TrackPlayer.getActiveTrackIndex as jest.Mock).mockResolvedValueOnce(1);

      await PlayerService.skipToPrevious();

      expect(TrackPlayer.skip).toHaveBeenCalledWith(0);
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should wrap to last track when at beginning', async () => {
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
        mockTrack,
        { id: mockSong2.id, url: 'https://example.com/audio2.mp3' },
      ]);
      (TrackPlayer.getActiveTrackIndex as jest.Mock).mockResolvedValueOnce(0);

      await PlayerService.skipToPrevious();

      expect(TrackPlayer.skip).toHaveBeenCalledWith(1);
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (TrackPlayer.getQueue as jest.Mock).mockRejectedValueOnce(
        new Error('Error'),
      );

      await expect(PlayerService.skipToPrevious()).resolves.not.toThrow();
    });
  });

  describe('seekTo', () => {
    it('should seek to position', async () => {
      await PlayerService.seekTo(30);

      expect(TrackPlayer.seekTo).toHaveBeenCalledWith(30);
    });

    it('should handle errors gracefully', async () => {
      (TrackPlayer.seekTo as jest.Mock).mockRejectedValueOnce(
        new Error('Error'),
      );

      await expect(PlayerService.seekTo(30)).resolves.not.toThrow();
    });
  });

  describe('setVolume', () => {
    it('should set volume', async () => {
      await PlayerService.setVolume(0.5);

      expect(TrackPlayer.setVolume).toHaveBeenCalledWith(0.5);
    });

    it('should handle errors gracefully', async () => {
      (TrackPlayer.setVolume as jest.Mock).mockRejectedValueOnce(
        new Error('Error'),
      );

      await expect(PlayerService.setVolume(0.5)).resolves.not.toThrow();
    });
  });

  describe('getQueue', () => {
    it('should return queue', async () => {
      const mockQueue = [mockTrack, { id: 'track2' }];
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce(mockQueue);

      const result = await PlayerService.getQueue();

      expect(result).toEqual(mockQueue);
    });

    it('should return empty array on error', async () => {
      (TrackPlayer.getQueue as jest.Mock).mockRejectedValueOnce(
        new Error('Error'),
      );

      const result = await PlayerService.getQueue();

      expect(result).toEqual([]);
    });
  });

  describe('clearQueue', () => {
    it('should clear queue using reset', async () => {
      await PlayerService.clearQueue();

      expect(TrackPlayer.reset).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (TrackPlayer.reset as jest.Mock).mockRejectedValueOnce(
        new Error('Error'),
      );

      await expect(PlayerService.clearQueue()).resolves.not.toThrow();
    });
  });

  describe('removeTrackFromQueue', () => {
    it('should remove track at index', async () => {
      await PlayerService.removeTrackFromQueue(2);

      expect(TrackPlayer.remove).toHaveBeenCalledWith(2);
    });

    it('should handle errors gracefully', async () => {
      (TrackPlayer.remove as jest.Mock).mockRejectedValueOnce(
        new Error('Error'),
      );

      await expect(
        PlayerService.removeTrackFromQueue(2),
      ).resolves.not.toThrow();
    });
  });
});
