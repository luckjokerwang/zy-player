import { API, BILIBILI_HEADERS } from '../utils/constants';
import {
  Song,
  VideoInfo,
  LyricOption,
  BilibiliVideoData,
  BilibiliPage,
  BilibiliArchive,
  BilibiliMedia,
  QQSearchItem,
  QQSearchResultItem,
} from '../utils/types';
import { signWbiParams } from '../utils/wbi';

const createVideoInfo = (data: BilibiliVideoData, bvid: string): VideoInfo => ({
  title: data.title,
  desc: data.desc,
  videoCount: data.videos,
  picSrc: data.pic,
  uploader: {
    name: data.owner.name,
    mid: data.owner.mid.toString(),
  },
  pages: data.pages.map((page: BilibiliPage) => ({
    bvid: bvid,
    part: page.part,
    cid: page.cid.toString(),
  })),
});

export const fetchVideoInfo = async (
  bvid: string,
): Promise<VideoInfo | null> => {
  try {
    const response = await fetch(API.VIDEO_INFO.replace('{bvid}', bvid), {
      headers: BILIBILI_HEADERS,
    });
    const json = await response.json();
    if (json.code !== 0) {
      console.error('Error fetching video info:', json.message);
      return null;
    }
    return createVideoInfo(json.data, bvid);
  } catch (error) {
    console.error('Error fetching video info:', error);
    return null;
  }
};

export const fetchPlayUrl = async (
  bvid: string,
  cid: string,
): Promise<string | null> => {
  try {
    const params = {
      bvid: bvid,
      cid: cid,
      qn: 64,
      fnval: 16,
      fnver: 0,
      fourk: 1,
    };

    const signedQuery = await signWbiParams(params);
    const url = `${API.PLAY_URL_BASE}?${signedQuery}`;

    console.log('Fetching play URL with WBI sign:', url);

    const response = await fetch(url, {
      headers: BILIBILI_HEADERS,
    });
    const text = await response.text();
    if (text.startsWith('<') || text.startsWith('<!')) {
      console.error(
        'fetchPlayUrl returned HTML instead of JSON - API blocked or network issue',
      );
      return null;
    }
    const json = JSON.parse(text);
    if (json.code !== 0) {
      console.error('Error fetching play url:', json.code, json.message);
      return null;
    }
    return json.data.dash?.audio?.[0]?.baseUrl || null;
  } catch (error) {
    console.error('Error fetching play url:', error);
    return null;
  }
};

export const fetchCID = async (bvid: string): Promise<string | null> => {
  try {
    const response = await fetch(API.BVID_TO_CID.replace('{bvid}', bvid), {
      headers: BILIBILI_HEADERS,
    });
    const json = await response.json();
    if (json.code !== 0) return null;
    return json.data[0]?.cid?.toString() || null;
  } catch (error) {
    console.error('Error fetching CID:', error);
    return null;
  }
};

export const getSongListFromBVID = async (bvid: string): Promise<Song[]> => {
  const info = await fetchVideoInfo(bvid);
  if (!info) return [];

  const songs: Song[] = [];

  if (info.pages.length === 1) {
    songs.push({
      id: info.pages[0].cid,
      bvid: bvid,
      name: info.title,
      singer: info.uploader.name,
      singerId: info.uploader.mid,
      cover: info.picSrc,
    });
  } else {
    for (const page of info.pages) {
      songs.push({
        id: page.cid,
        bvid: bvid,
        name: page.part,
        singer: info.uploader.name,
        singerId: info.uploader.mid,
        cover: info.picSrc,
      });
    }
  }

  return songs;
};

const getSongsFromVideoInfos = (infos: (VideoInfo | null)[]): Song[] => {
  const songs: Song[] = [];

  for (const info of infos) {
    if (!info) continue;

    if (info.pages.length === 1) {
      songs.push({
        id: info.pages[0].cid,
        bvid: info.pages[0].bvid,
        name: info.title,
        singer: info.uploader.name,
        singerId: info.uploader.mid,
        cover: info.picSrc,
      });
    } else {
      for (const page of info.pages) {
        songs.push({
          id: page.cid,
          bvid: page.bvid,
          name: page.part,
          singer: info.uploader.name,
          singerId: info.uploader.mid,
          cover: info.picSrc,
        });
      }
    }
  }

  return songs;
};

export const fetchBiliSeriesList = async (
  mid: string,
  sid: string,
): Promise<Song[]> => {
  try {
    const url = API.BILI_SERIES.replace('{mid}', mid)
      .replace('{sid}', sid)
      .replace('{pn}', '0');
    const response = await fetch(url, {
      headers: BILIBILI_HEADERS,
    });
    const json = await response.json();
    if (json.code !== 0) return [];

    const videoInfoPromises = json.data.archives.map(
      (archive: BilibiliArchive) => fetchVideoInfo(archive.bvid),
    );
    const videoInfos = await Promise.all(videoInfoPromises);
    return getSongsFromVideoInfos(videoInfos);
  } catch (error) {
    console.error('Error fetching series list:', error);
    return [];
  }
};

export const fetchBiliCollectionList = async (
  mid: string,
  sid: string,
): Promise<Song[]> => {
  try {
    const firstPageUrl = API.BILI_COLLECTION.replace('{mid}', mid)
      .replace('{sid}', sid)
      .replace('{pn}', '1');
    const response = await fetch(firstPageUrl, {
      headers: BILIBILI_HEADERS,
    });
    const json = await response.json();
    if (json.code !== 0) return [];

    const mediaCount = json.data.meta.total;
    const pageSize = json.data.page.page_size;
    const totalPages = Math.ceil(mediaCount / pageSize);

    const allBvids: string[] = json.data.archives.map(
      (archive: BilibiliArchive) => archive.bvid,
    );

    for (let page = 2; page <= totalPages; page++) {
      const pageUrl = API.BILI_COLLECTION.replace('{mid}', mid)
        .replace('{sid}', sid)
        .replace('{pn}', page.toString());
      const pageResponse = await fetch(pageUrl, {
        headers: BILIBILI_HEADERS,
      });
      const pageJson = await pageResponse.json();
      if (pageJson.code === 0) {
        pageJson.data.archives.forEach((archive: BilibiliArchive) =>
          allBvids.push(archive.bvid),
        );
      }
    }

    const videoInfoPromises = allBvids.map(bvid => fetchVideoInfo(bvid));
    const videoInfos = await Promise.all(videoInfoPromises);
    return getSongsFromVideoInfos(videoInfos);
  } catch (error) {
    console.error('Error fetching collection list:', error);
    return [];
  }
};

export const fetchFavList = async (mid: string): Promise<Song[]> => {
  try {
    const firstPageUrl = API.FAV_LIST.replace('{mid}', mid).replace(
      '{pn}',
      '1',
    );
    const response = await fetch(firstPageUrl, {
      headers: BILIBILI_HEADERS,
    });
    const json = await response.json();
    if (json.code !== 0 || !json.data) return [];

    const mediaCount = json.data.info.media_count;
    const totalPages = Math.ceil(mediaCount / 20);

    const allBvids: string[] =
      json.data.medias?.map((media: BilibiliMedia) => media.bvid) || [];

    for (let page = 2; page <= totalPages; page++) {
      const pageUrl = API.FAV_LIST.replace('{mid}', mid).replace(
        '{pn}',
        page.toString(),
      );
      const pageResponse = await fetch(pageUrl, {
        headers: BILIBILI_HEADERS,
      });
      const pageJson = await pageResponse.json();
      if (pageJson.code === 0 && pageJson.data?.medias) {
        pageJson.data.medias.forEach((media: BilibiliMedia) =>
          allBvids.push(media.bvid),
        );
      }
    }

    const videoInfoPromises = allBvids.map(bvid => fetchVideoInfo(bvid));
    const videoInfos = await Promise.all(videoInfoPromises);
    return getSongsFromVideoInfos(videoInfos);
  } catch (error) {
    console.error('Error fetching fav list:', error);
    return [];
  }
};

export const searchLyricOptions = async (
  searchKey: string,
): Promise<LyricOption[]> => {
  if (!searchKey) return [];

  try {
    const response = await fetch(
      API.QQ_SEARCH.replace('{KeyWord}', encodeURIComponent(searchKey)),
    );
    const json = await response.json();
    const data = json.data?.song?.itemlist || [];

    if (data.length > 0) {
      return data.map((item: QQSearchItem, index: number) => ({
        key: item.mid,
        songMid: item.mid,
        label: `${index}. ${item.name} / ${item.singer}`,
      }));
    }

    return searchLyricOptionsFallback(searchKey);
  } catch (error) {
    console.error('Error searching lyrics:', error);
    return searchLyricOptionsFallback(searchKey);
  }
};

const searchLyricOptionsFallback = async (
  searchKey: string,
): Promise<LyricOption[]> => {
  try {
    const body = {
      comm: { ct: '19', cv: '1859', uin: '0' },
      req: {
        method: 'DoSearchForQQMusicDesktop',
        module: 'music.search.SearchCgiService',
        param: {
          grp: 1,
          num_per_page: 20,
          page_num: 1,
          query: searchKey,
          search_type: 0,
        },
      },
    };

    const response = await fetch(API.QQ_SEARCH_POST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await response.json();
    const data = json.req?.data?.body?.song?.list || [];

    return data.map((item: QQSearchResultItem, index: number) => ({
      key: item.mid,
      songMid: item.mid,
      label: `${index}. ${item.name} / ${item.singer?.[0]?.name || 'Unknown'}`,
    }));
  } catch (error) {
    console.error('Error in fallback lyric search:', error);
    return [];
  }
};

export const fetchLyric = async (songMid: string): Promise<string> => {
  try {
    const response = await fetch(API.QQ_LYRIC.replace('{SongMid}', songMid), {
      headers: { Referer: 'https://y.qq.com/' },
    });
    const json = await response.json();

    if (!json.lyric) {
      return '[00:00.000] 无法找到歌词';
    }

    let finalLrc = json.lyric;
    if (json.trans) {
      finalLrc = json.trans + '\n' + finalLrc;
    }

    return finalLrc;
  } catch (error) {
    console.error('Error fetching lyric:', error);
    return '[00:00.000] 无法找到歌词';
  }
};

export const extractSongName = (name: string, _artist?: string): string => {
  const nameReg = /《.*》/;
  const result = nameReg.exec(name);
  if (result && result.length > 0) {
    return result[0].substring(1, result[0].length - 1);
  }
  return name;
};
