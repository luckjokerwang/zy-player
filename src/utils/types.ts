export interface Song {
  id: string;
  bvid: string;
  name: string;
  singer: string;
  singerId: string;
  cover: string;
  lyric?: string;
  lyricOffset?: number;
}

export interface VideoInfo {
  title: string;
  desc: string;
  videoCount: number;
  picSrc: string;
  uploader: {
    name: string;
    mid: string;
  };
  pages: Array<{
    bvid: string;
    part: string;
    cid: string;
  }>;
}

export interface FavList {
  info: {
    id: string;
    title: string;
  };
  songList: Song[];
}

export interface PlayerSettings {
  playMode: string;
  defaultVolume: number;
}

export interface LyricMapping {
  id: string;
  lrc: {
    songMid: string;
    label: string;
  };
  lrcOffset: number;
}

export interface LyricOption {
  key: string;
  songMid: string;
  label: string;
}
