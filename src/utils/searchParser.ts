import { Song } from './types';
import { 
  getSongListFromBVID, 
  fetchFavList, 
  fetchBiliSeriesList, 
  fetchBiliCollectionList 
} from '../api/bilibili';

export interface SearchResult {
  songs: Song[];
  title: string;
  error?: string;
}

const BVID_REGEX = /^BV[a-zA-Z0-9]{10}$/;
const FAV_ID_REGEX = /^\d+$/;
const SERIES_URL_REGEX = /.*\.com\/(\d+)\/channel\/seriesdetail\?sid=(\d+).*/;
const COLLECTION_URL_REGEX = /.*\.com\/(\d+)\/channel\/collectiondetail\?sid=(\d+).*/;
const BVID_IN_URL_REGEX = /BV[a-zA-Z0-9]{10}/;

export const parseSearchInput = async (input: string): Promise<SearchResult> => {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return { songs: [], title: '搜索歌单', error: '请输入搜索内容' };
  }

  const bvidMatch = trimmedInput.match(BVID_IN_URL_REGEX);
  if (bvidMatch) {
    return searchByBVID(bvidMatch[0]);
  }

  const seriesMatch = SERIES_URL_REGEX.exec(trimmedInput);
  if (seriesMatch) {
    return searchBySeries(seriesMatch[1], seriesMatch[2]);
  }

  const collectionMatch = COLLECTION_URL_REGEX.exec(trimmedInput);
  if (collectionMatch) {
    return searchByCollection(collectionMatch[1], collectionMatch[2]);
  }

  if (BVID_REGEX.test(trimmedInput)) {
    return searchByBVID(trimmedInput);
  }

  if (FAV_ID_REGEX.test(trimmedInput)) {
    return searchByFavId(trimmedInput);
  }

  return { songs: [], title: '搜索歌单', error: '无法识别的搜索格式' };
};

const searchByBVID = async (bvid: string): Promise<SearchResult> => {
  try {
    const songs = await getSongListFromBVID(bvid);
    if (songs.length === 0) {
      return { songs: [], title: `搜索: ${bvid}`, error: '未找到视频或获取失败' };
    }
    return { songs, title: `搜索: ${bvid}` };
  } catch (error) {
    console.error('Error searching by BVID:', error);
    return { songs: [], title: `搜索: ${bvid}`, error: '搜索失败' };
  }
};

const searchByFavId = async (favId: string): Promise<SearchResult> => {
  try {
    const songs = await fetchFavList(favId);
    if (songs.length === 0) {
      return { songs: [], title: `收藏夹: ${favId}`, error: '收藏夹为空或无法访问' };
    }
    return { songs, title: `收藏夹: ${favId}` };
  } catch (error) {
    console.error('Error searching by fav ID:', error);
    return { songs: [], title: `收藏夹: ${favId}`, error: '获取收藏夹失败' };
  }
};

const searchBySeries = async (mid: string, sid: string): Promise<SearchResult> => {
  try {
    const songs = await fetchBiliSeriesList(mid, sid);
    if (songs.length === 0) {
      return { songs: [], title: `系列合集`, error: '合集为空或无法访问' };
    }
    return { songs, title: `系列合集` };
  } catch (error) {
    console.error('Error searching by series:', error);
    return { songs: [], title: `系列合集`, error: '获取合集失败' };
  }
};

const searchByCollection = async (mid: string, sid: string): Promise<SearchResult> => {
  try {
    const songs = await fetchBiliCollectionList(mid, sid);
    if (songs.length === 0) {
      return { songs: [], title: `视频合集`, error: '合集为空或无法访问' };
    }
    return { songs, title: `视频合集` };
  } catch (error) {
    console.error('Error searching by collection:', error);
    return { songs: [], title: `视频合集`, error: '获取合集失败' };
  }
};
