import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  storageManager,
  StorageManager,
} from '../../src/storage/StorageManager';
import { STORAGE_KEYS, DEFAULT_BVID } from '../../src/utils/constants';
import {
  FavList,
  Song,
  PlayerSettings,
  LyricMapping,
} from '../../src/utils/types';
import * as bilibiliApi from '../../src/api/bilibili';

// Mock the bilibili API module
jest.mock('../../src/api/bilibili');

describe('StorageManager', () => {
  const mockSongs: Song[] = [
    {
      id: 'song-1',
      bvid: 'BV123',
      name: 'Test Song 1',
      singer: 'Test Singer 1',
      singerId: 'singer-1',
      cover: 'https://example.com/cover1.jpg',
    },
    {
      id: 'song-2',
      bvid: 'BV456',
      name: 'Test Song 2',
      singer: 'Test Singer 2',
      singerId: 'singer-2',
      cover: 'https://example.com/cover2.jpg',
    },
  ];

  const mockFavList: FavList = {
    info: {
      id: 'FavList-mock-uuid-1234',
      title: 'Test Fav List',
    },
    songList: mockSongs,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset AsyncStorage mock to default state
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([]);
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
  });

  describe('initFavLists', () => {
    it('should return empty array when no stored data and API fails', async () => {
      (bilibiliApi.getSongListFromBVID as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );

      const result = await storageManager.initFavLists();

      expect(result).toEqual([]);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.MY_FAV_LIST,
      );
    });

    it('should return stored fav lists when they exist', async () => {
      const favListIds = ['FavList-1', 'FavList-2'];
      const favList1: FavList = {
        info: { id: 'FavList-1', title: 'List 1' },
        songList: [mockSongs[0]],
      };
      const favList2: FavList = {
        info: { id: 'FavList-2', title: 'List 2' },
        songList: [mockSongs[1]],
      };

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(favListIds))
        .mockResolvedValueOnce(JSON.stringify(favList1))
        .mockResolvedValueOnce(JSON.stringify(favList2));

      const result = await storageManager.initFavLists();

      expect(result).toEqual([favList1, favList2]);
      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(3);
    });

    it('should initialize with default when no stored lists', async () => {
      (bilibiliApi.getSongListFromBVID as jest.Mock).mockResolvedValue(
        mockSongs,
      );

      const result = await storageManager.initFavLists();

      expect(result).toHaveLength(1);
      expect(result[0].info.id).toContain('FavList-');
      expect(result[0].info.title).toBe('【阿梓】2021精选翻唱50首【纯享】');
      expect(result[0].songList).toEqual(mockSongs);
      expect(bilibiliApi.getSongListFromBVID).toHaveBeenCalledWith(
        DEFAULT_BVID,
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.LAST_PLAY_LIST,
        JSON.stringify([]),
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.LYRIC_MAPPING,
        JSON.stringify([]),
      );
    });

    it('should handle errors during initialization gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage Error'),
      );
      (bilibiliApi.getSongListFromBVID as jest.Mock).mockResolvedValue(
        mockSongs,
      );

      const result = await storageManager.initFavLists();

      expect(result).toHaveLength(1);
      expect(result[0].songList).toEqual(mockSongs);
    });
  });

  describe('addFavList', () => {
    it('should create new fav list with unique id', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(['existing-id']),
      );

      const result = await storageManager.addFavList('New List');

      expect(result.info.id).toContain('FavList-');
      expect(result.info.title).toBe('New List');
      expect(result.songList).toEqual([]);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        result.info.id,
        JSON.stringify(result),
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.MY_FAV_LIST,
        JSON.stringify(['existing-id', result.info.id]),
      );
    });

    it('should handle empty existing list', async () => {
      const result = await storageManager.addFavList('First List');

      expect(result.info.title).toBe('First List');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.MY_FAV_LIST,
        JSON.stringify([result.info.id]),
      );
    });
  });

  describe('deleteFavList', () => {
    it('should remove fav list from storage and list', async () => {
      const listIds = ['FavList-1', 'FavList-2', 'FavList-3'];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(listIds),
      );

      await storageManager.deleteFavList('FavList-2');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('FavList-2');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.MY_FAV_LIST,
        JSON.stringify(['FavList-1', 'FavList-3']),
      );
    });

    it('should handle deleting non-existent list', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(['FavList-1']),
      );

      await storageManager.deleteFavList('FavList-999');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('FavList-999');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.MY_FAV_LIST,
        JSON.stringify(['FavList-1']),
      );
    });
  });

  describe('updateFavList', () => {
    it('should update existing fav list', async () => {
      await storageManager.updateFavList(mockFavList);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        mockFavList.info.id,
        JSON.stringify(mockFavList),
      );
    });
  });

  describe('addSongToFavList', () => {
    it('should add song to existing list', async () => {
      const favList: FavList = {
        info: { id: 'FavList-1', title: 'Test' },
        songList: [mockSongs[0]],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(favList),
      );

      await storageManager.addSongToFavList('FavList-1', mockSongs[1]);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'FavList-1',
        JSON.stringify({
          ...favList,
          songList: [mockSongs[1], mockSongs[0]],
        }),
      );
    });

    it('should not add duplicate songs', async () => {
      const favList: FavList = {
        info: { id: 'FavList-1', title: 'Test' },
        songList: [mockSongs[0]],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(favList),
      );

      await storageManager.addSongToFavList('FavList-1', mockSongs[0]);

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle non-existent list', async () => {
      await storageManager.addSongToFavList('FavList-999', mockSongs[0]);

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('removeSongFromFavList', () => {
    it('should remove song from list', async () => {
      const favList: FavList = {
        info: { id: 'FavList-1', title: 'Test' },
        songList: [...mockSongs],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(favList),
      );

      await storageManager.removeSongFromFavList('FavList-1', 'song-1');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'FavList-1',
        JSON.stringify({
          ...favList,
          songList: [mockSongs[1]],
        }),
      );
    });

    it('should handle removing non-existent song', async () => {
      const favList: FavList = {
        info: { id: 'FavList-1', title: 'Test' },
        songList: [mockSongs[0]],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(favList),
      );

      await storageManager.removeSongFromFavList('FavList-1', 'song-999');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'FavList-1',
        JSON.stringify(favList),
      );
    });

    it('should handle non-existent list', async () => {
      await storageManager.removeSongFromFavList('FavList-999', 'song-1');

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getLastPlayList', () => {
    it('should return empty array when no stored data', async () => {
      const result = await storageManager.getLastPlayList();

      expect(result).toEqual([]);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.LAST_PLAY_LIST,
      );
    });

    it('should return stored play list', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSongs),
      );

      const result = await storageManager.getLastPlayList();

      expect(result).toEqual(mockSongs);
    });
  });

  describe('setLastPlayList', () => {
    it('should store play list', async () => {
      await storageManager.setLastPlayList(mockSongs);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.LAST_PLAY_LIST,
        JSON.stringify(mockSongs),
      );
    });
  });

  describe('getPlayerSettings', () => {
    it('should return default settings when not stored', async () => {
      const result = await storageManager.getPlayerSettings();

      expect(result).toEqual({ playMode: 'order', defaultVolume: 0.5 });
    });

    it('should return stored settings', async () => {
      const settings: PlayerSettings = {
        playMode: 'shuffle',
        defaultVolume: 0.8,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(settings),
      );

      const result = await storageManager.getPlayerSettings();

      expect(result).toEqual(settings);
    });
  });

  describe('setPlayerSettings', () => {
    it('should store player settings', async () => {
      const settings: PlayerSettings = {
        playMode: 'listLoop',
        defaultVolume: 0.7,
      };

      await storageManager.setPlayerSettings(settings);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.PLAYER_SETTINGS,
        JSON.stringify(settings),
      );
    });
  });

  describe('getLyricDetail', () => {
    it('should return undefined when no mappings exist', async () => {
      const result = await storageManager.getLyricDetail('song-1');

      expect(result).toBeUndefined();
    });

    it('should return undefined when song not found in mappings', async () => {
      const mappings: LyricMapping[] = [
        {
          id: 'song-2',
          lrc: { songMid: 'mid-2', label: 'Song 2' },
          lrcOffset: 0,
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mappings),
      );

      const result = await storageManager.getLyricDetail('song-1');

      expect(result).toBeUndefined();
    });

    it('should return lyric mapping for song', async () => {
      const mappings: LyricMapping[] = [
        {
          id: 'song-1',
          lrc: { songMid: 'mid-1', label: 'Song 1' },
          lrcOffset: 100,
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mappings),
      );

      const result = await storageManager.getLyricDetail('song-1');

      expect(result).toEqual(mappings[0]);
    });
  });

  describe('setLyricDetail', () => {
    it('should add new lyric mapping', async () => {
      const lyricInfo = { songMid: 'mid-1', label: 'Test Song' };

      await storageManager.setLyricDetail('song-1', lyricInfo);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.LYRIC_MAPPING,
        JSON.stringify([
          {
            id: 'song-1',
            lrc: lyricInfo,
            lrcOffset: 0,
          },
        ]),
      );
    });

    it('should update existing lyric mapping', async () => {
      const existingMappings: LyricMapping[] = [
        {
          id: 'song-1',
          lrc: { songMid: 'old-mid', label: 'Old Label' },
          lrcOffset: 100,
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(existingMappings),
      );

      const newLyricInfo = { songMid: 'new-mid', label: 'New Label' };
      await storageManager.setLyricDetail('song-1', newLyricInfo);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.LYRIC_MAPPING,
        JSON.stringify([
          {
            id: 'song-1',
            lrc: newLyricInfo,
            lrcOffset: 100, // Offset preserved
          },
        ]),
      );
    });

    it('should preserve other mappings when updating', async () => {
      const existingMappings: LyricMapping[] = [
        {
          id: 'song-1',
          lrc: { songMid: 'mid-1', label: 'Song 1' },
          lrcOffset: 100,
        },
        {
          id: 'song-2',
          lrc: { songMid: 'mid-2', label: 'Song 2' },
          lrcOffset: 200,
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(existingMappings),
      );

      const newLyricInfo = { songMid: 'new-mid-1', label: 'Updated Song 1' };
      await storageManager.setLyricDetail('song-1', newLyricInfo);

      const expectedMappings = [
        {
          id: 'song-1',
          lrc: newLyricInfo,
          lrcOffset: 100,
        },
        existingMappings[1],
      ];

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.LYRIC_MAPPING,
        JSON.stringify(expectedMappings),
      );
    });
  });

  describe('setLyricOffset', () => {
    it('should update offset for existing mapping', async () => {
      const mappings: LyricMapping[] = [
        {
          id: 'song-1',
          lrc: { songMid: 'mid-1', label: 'Song 1' },
          lrcOffset: 100,
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mappings),
      );

      await storageManager.setLyricOffset('song-1', 500);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.LYRIC_MAPPING,
        JSON.stringify([
          {
            id: 'song-1',
            lrc: { songMid: 'mid-1', label: 'Song 1' },
            lrcOffset: 500,
          },
        ]),
      );
    });

    it('should not update when mapping does not exist', async () => {
      await storageManager.setLyricOffset('song-999', 500);

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('exportAllData', () => {
    it('should export all storage data as JSON string', async () => {
      const mockKeys = ['key1', 'key2'];
      const mockPairs: [string, string][] = [
        ['key1', JSON.stringify({ value: 'data1' })],
        ['key2', JSON.stringify({ value: 'data2' })],
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockPairs);

      const result = await storageManager.exportAllData();

      const parsed = JSON.parse(result);
      expect(parsed).toEqual({
        key1: { value: 'data1' },
        key2: { value: 'data2' },
      });
      expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(AsyncStorage.multiGet).toHaveBeenCalledWith(mockKeys);
    });

    it('should handle export errors', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(
        new Error('Export Error'),
      );

      await expect(storageManager.exportAllData()).rejects.toThrow(
        'Export Error',
      );
    });

    it('should skip null values during export', async () => {
      const mockKeys = ['key1', 'key2'];
      const mockPairs: [string, string | null][] = [
        ['key1', JSON.stringify({ value: 'data1' })],
        ['key2', null],
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockPairs);

      const result = await storageManager.exportAllData();

      const parsed = JSON.parse(result);
      expect(parsed).toEqual({
        key1: { value: 'data1' },
      });
    });
  });

  describe('importData', () => {
    it('should import new fav lists', async () => {
      const importData = {
        [STORAGE_KEYS.MY_FAV_LIST]: ['imported-id-1'],
        'imported-id-1': {
          info: { id: 'imported-id-1', title: 'Imported List' },
          songList: [mockSongs[0]],
        },
      };

      await storageManager.importData(JSON.stringify(importData));

      // Should create new list with new UUID
      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      expect(setItemCalls.length).toBeGreaterThan(0);

      // Find the call that sets MY_FAV_LIST
      const myFavListCall = setItemCalls.find(
        call => call[0] === STORAGE_KEYS.MY_FAV_LIST,
      );
      expect(myFavListCall).toBeDefined();

      const newFavListIds = JSON.parse(myFavListCall[1]);
      expect(newFavListIds).toHaveLength(1);
      expect(newFavListIds[0]).toContain('FavList-');
    });

    it('should merge songs into existing lists with same title', async () => {
      const existingList: FavList = {
        info: { id: 'existing-id', title: 'Test List' },
        songList: [mockSongs[0]],
      };

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(['existing-id']))
        .mockResolvedValueOnce(JSON.stringify(existingList))
        .mockResolvedValueOnce(JSON.stringify(existingList));

      const importData = {
        [STORAGE_KEYS.MY_FAV_LIST]: ['imported-id'],
        'imported-id': {
          info: { id: 'imported-id', title: 'Test List' },
          songList: [mockSongs[1]],
        },
      };

      await storageManager.importData(JSON.stringify(importData));

      // Should merge songs
      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const existingListUpdate = setItemCalls.find(
        call => call[0] === 'existing-id',
      );

      if (existingListUpdate) {
        const updatedList = JSON.parse(existingListUpdate[1]);
        expect(updatedList.songList).toHaveLength(2);
      }
    });

    it('should import lyric mappings without duplicates', async () => {
      const existingMappings: LyricMapping[] = [
        {
          id: 'song-1',
          lrc: { songMid: 'mid-1', label: 'Song 1' },
          lrcOffset: 100,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.LYRIC_MAPPING) {
          return Promise.resolve(JSON.stringify(existingMappings));
        }
        return Promise.resolve(null);
      });

      const importData = {
        [STORAGE_KEYS.LYRIC_MAPPING]: [
          {
            id: 'song-2',
            lrc: { songMid: 'mid-2', label: 'Song 2' },
            lrcOffset: 200,
          },
        ],
      };

      await storageManager.importData(JSON.stringify(importData));

      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const lyricMappingCall = setItemCalls.find(
        call => call[0] === STORAGE_KEYS.LYRIC_MAPPING,
      );

      expect(lyricMappingCall).toBeDefined();
      const importedMappings = JSON.parse(lyricMappingCall[1]);
      expect(importedMappings).toHaveLength(2);
      expect(importedMappings[0].id).toBe('song-1');
      expect(importedMappings[1].id).toBe('song-2');
    });

    it('should import player settings only if not already set', async () => {
      const importData = {
        [STORAGE_KEYS.PLAYER_SETTINGS]: {
          playMode: 'shuffle',
          defaultVolume: 0.9,
        },
      };

      await storageManager.importData(JSON.stringify(importData));

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.PLAYER_SETTINGS,
        JSON.stringify({
          playMode: 'shuffle',
          defaultVolume: 0.9,
        }),
      );
    });

    it('should not overwrite existing player settings', async () => {
      const existingSettings: PlayerSettings = {
        playMode: 'order',
        defaultVolume: 0.5,
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.PLAYER_SETTINGS) {
          return Promise.resolve(JSON.stringify(existingSettings));
        }
        return Promise.resolve(null);
      });

      const importData = {
        [STORAGE_KEYS.PLAYER_SETTINGS]: {
          playMode: 'shuffle',
          defaultVolume: 0.9,
        },
      };

      await storageManager.importData(JSON.stringify(importData));

      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const settingsCall = setItemCalls.find(
        call => call[0] === STORAGE_KEYS.PLAYER_SETTINGS,
      );

      expect(settingsCall).toBeUndefined();
    });

    it('should handle invalid JSON data', async () => {
      await expect(storageManager.importData('invalid json')).rejects.toThrow();
    });

    it('should handle import errors gracefully', async () => {
      const invalidJson = '{"unclosed": ';
      await expect(storageManager.importData(invalidJson)).rejects.toThrow();
    });
  });

  describe('storageManager singleton', () => {
    it('should export a singleton instance', () => {
      expect(storageManager).toBeInstanceOf(StorageManager);
    });

    it('should be the same instance across imports', () => {
      const {
        storageManager: storageManager2,
      } = require('../../src/storage/StorageManager');
      expect(storageManager).toBe(storageManager2);
    });
  });
});
