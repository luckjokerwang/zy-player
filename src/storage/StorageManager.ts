import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS, DEFAULT_BVID } from '../utils/constants';
import { Song, FavList, PlayerSettings, LyricMapping } from '../utils/types';
import { getSongListFromBVID } from '../api/bilibili';

// Type definition for exported storage data structure
interface StorageExportData {
  [key: string]:
    | FavList
    | Song[]
    | PlayerSettings
    | LyricMapping[]
    | string[]
    | Song
    | unknown;
}

export class StorageManager {
  async initFavLists(): Promise<FavList[]> {
    try {
      const favListIds = await this.getItem<string[]>(STORAGE_KEYS.MY_FAV_LIST);

      if (favListIds && favListIds.length > 0) {
        return this.loadFavListsByIds(favListIds);
      }

      return this.initWithDefault();
    } catch (error) {
      console.error('Error initializing fav lists:', error);
      return this.initWithDefault();
    }
  }

  private async loadFavListsByIds(ids: string[]): Promise<FavList[]> {
    const favLists: FavList[] = [];
    for (const id of ids) {
      const favList = await this.getItem<FavList>(id);
      if (favList) {
        favLists.push(favList);
      }
    }
    return favLists;
  }

  private async initWithDefault(): Promise<FavList[]> {
    try {
      const songs = await getSongListFromBVID(DEFAULT_BVID);
      const defaultFavList: FavList = {
        info: {
          id: 'FavList-' + uuidv4(),
          title: '【阿梓】2021精选翻唱50首【纯享】',
        },
        songList: songs,
      };

      await this.setItem(defaultFavList.info.id, defaultFavList);
      await this.setItem(STORAGE_KEYS.MY_FAV_LIST, [defaultFavList.info.id]);
      await this.setItem(STORAGE_KEYS.LAST_PLAY_LIST, []);
      await this.setItem(STORAGE_KEYS.LYRIC_MAPPING, []);

      return [defaultFavList];
    } catch (error) {
      console.error('Error initializing default fav list:', error);
      return [];
    }
  }

  async addFavList(name: string): Promise<FavList> {
    const newFavList: FavList = {
      info: {
        id: 'FavList-' + uuidv4(),
        title: name,
      },
      songList: [],
    };

    await this.setItem(newFavList.info.id, newFavList);

    const favListIds =
      (await this.getItem<string[]>(STORAGE_KEYS.MY_FAV_LIST)) || [];
    favListIds.push(newFavList.info.id);
    await this.setItem(STORAGE_KEYS.MY_FAV_LIST, favListIds);

    return newFavList;
  }

  async deleteFavList(id: string): Promise<void> {
    await AsyncStorage.removeItem(id);

    const favListIds =
      (await this.getItem<string[]>(STORAGE_KEYS.MY_FAV_LIST)) || [];
    const newIds = favListIds.filter(favId => favId !== id);
    await this.setItem(STORAGE_KEYS.MY_FAV_LIST, newIds);
  }

  async updateFavList(favList: FavList): Promise<void> {
    await this.setItem(favList.info.id, favList);
  }

  async addSongToFavList(favListId: string, song: Song): Promise<void> {
    const favList = await this.getItem<FavList>(favListId);
    if (favList) {
      const exists = favList.songList.some(s => s.id === song.id);
      if (!exists) {
        favList.songList.unshift(song);
        await this.setItem(favListId, favList);
      }
    }
  }

  async removeSongFromFavList(
    favListId: string,
    songId: string,
  ): Promise<void> {
    const favList = await this.getItem<FavList>(favListId);
    if (favList) {
      favList.songList = favList.songList.filter(s => s.id !== songId);
      await this.setItem(favListId, favList);
    }
  }

  async getLastPlayList(): Promise<Song[]> {
    return (await this.getItem<Song[]>(STORAGE_KEYS.LAST_PLAY_LIST)) || [];
  }

  async setLastPlayList(songs: Song[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.LAST_PLAY_LIST, songs);
  }

  async getPlayerSettings(): Promise<PlayerSettings> {
    const settings = await this.getItem<PlayerSettings>(
      STORAGE_KEYS.PLAYER_SETTINGS,
    );
    return settings || { playMode: 'order', defaultVolume: 0.5 };
  }

  async setPlayerSettings(settings: PlayerSettings): Promise<void> {
    await this.setItem(STORAGE_KEYS.PLAYER_SETTINGS, settings);
  }

  async getLyricDetail(songId: string): Promise<LyricMapping | undefined> {
    const mappings =
      (await this.getItem<LyricMapping[]>(STORAGE_KEYS.LYRIC_MAPPING)) || [];
    return mappings.find(m => m.id === songId);
  }

  async setLyricDetail(
    songId: string,
    lyricInfo: { songMid: string; label: string },
  ): Promise<void> {
    const mappings =
      (await this.getItem<LyricMapping[]>(STORAGE_KEYS.LYRIC_MAPPING)) || [];
    const existingIndex = mappings.findIndex(m => m.id === songId);

    const newMapping: LyricMapping = {
      id: songId,
      lrc: lyricInfo,
      lrcOffset: 0,
    };

    if (existingIndex !== -1) {
      mappings[existingIndex].lrc = lyricInfo;
    } else {
      mappings.push(newMapping);
    }

    await this.setItem(STORAGE_KEYS.LYRIC_MAPPING, mappings);
  }

  async setLyricOffset(songId: string, offset: number): Promise<void> {
    const mappings =
      (await this.getItem<LyricMapping[]>(STORAGE_KEYS.LYRIC_MAPPING)) || [];
    const existingIndex = mappings.findIndex(m => m.id === songId);

    if (existingIndex !== -1) {
      mappings[existingIndex].lrcOffset = offset;
      await this.setItem(STORAGE_KEYS.LYRIC_MAPPING, mappings);
    }
  }

  async exportAllData(): Promise<string> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys);
      const data: StorageExportData = {};

      for (const [key, value] of pairs) {
        if (value) {
          data[key] = JSON.parse(value) as
            | FavList
            | Song[]
            | PlayerSettings
            | LyricMapping[]
            | string[];
        }
      }

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importData(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString) as StorageExportData;

      const existingFavListIds =
        (await this.getItem<string[]>(STORAGE_KEYS.MY_FAV_LIST)) || [];
      const importedFavListIds =
        (data[STORAGE_KEYS.MY_FAV_LIST] as string[]) || [];

      const existingTitleToId = new Map<string, string>();
      for (const id of existingFavListIds) {
        const favList = await this.getItem<FavList>(id);
        if (favList) {
          existingTitleToId.set(favList.info.title, id);
        }
      }

      const mergedIds = [...existingFavListIds];

      for (const importedId of importedFavListIds) {
        const importedFavList = data[importedId] as FavList | undefined;
        if (!importedFavList) continue;

        const matchingExistingId = existingTitleToId.get(
          importedFavList.info.title,
        );

        if (matchingExistingId) {
          const existingFavList = await this.getItem<FavList>(
            matchingExistingId,
          );
          if (existingFavList) {
            const existingSongIds = new Set(
              existingFavList.songList.map(s => s.id),
            );
            const newSongs = importedFavList.songList.filter(
              s => !existingSongIds.has(s.id),
            );
            if (newSongs.length > 0) {
              existingFavList.songList = [
                ...existingFavList.songList,
                ...newSongs,
              ];
              await this.setItem(matchingExistingId, existingFavList);
            }
          }
        } else {
          const newId = 'FavList-' + uuidv4();
          const newFavList: FavList = {
            info: { id: newId, title: importedFavList.info.title },
            songList: importedFavList.songList || [],
          };
          await this.setItem(newId, newFavList);
          mergedIds.push(newId);
          existingTitleToId.set(importedFavList.info.title, newId);
        }
      }

      await this.setItem(STORAGE_KEYS.MY_FAV_LIST, mergedIds);

      if (data[STORAGE_KEYS.LYRIC_MAPPING]) {
        const existingMappings =
          (await this.getItem<LyricMapping[]>(STORAGE_KEYS.LYRIC_MAPPING)) ||
          [];
        const importedMappings: LyricMapping[] =
          (data[STORAGE_KEYS.LYRIC_MAPPING] as LyricMapping[]) || [];
        const existingMappingIds = new Set(existingMappings.map(m => m.id));
        const newMappings = importedMappings.filter(
          m => !existingMappingIds.has(m.id),
        );
        await this.setItem(STORAGE_KEYS.LYRIC_MAPPING, [
          ...existingMappings,
          ...newMappings,
        ]);
      }

      if (data[STORAGE_KEYS.PLAYER_SETTINGS]) {
        const existingSettings = await this.getItem<PlayerSettings>(
          STORAGE_KEYS.PLAYER_SETTINGS,
        );
        if (!existingSettings) {
          await this.setItem(
            STORAGE_KEYS.PLAYER_SETTINGS,
            data[STORAGE_KEYS.PLAYER_SETTINGS] as PlayerSettings,
          );
        }
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  private async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  private async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  }
}

export const storageManager = new StorageManager();
