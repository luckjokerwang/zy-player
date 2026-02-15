// Navigation Types
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

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

export type RootStackParamList = {
  Main: undefined;
  Player: undefined;
  Lyric: undefined;
  Queue: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  FavTab: undefined;
  SettingsTab: undefined;
};

export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'HomeTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type FavScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'FavTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type SettingsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'SettingsTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type PlayerScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Player'
>;
export type LyricScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Lyric'
>;
export type QueueScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Queue'
>;

// Bilibili API Response Types
export interface BilibiliApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface BilibiliVideoData {
  title: string;
  desc: string;
  videos: number;
  pic: string;
  owner: {
    name: string;
    mid: number;
  };
  pages: BilibiliPage[];
}

export interface BilibiliPage {
  part: string;
  cid: number;
}

export interface BilibiliArchive {
  bvid: string;
}

export interface BilibiliSeriesData {
  archives: BilibiliArchive[];
}

export interface BilibiliCollectionData {
  meta: { total: number };
  page: { page_size: number };
  archives: BilibiliArchive[];
}

export interface BilibiliMedia {
  bvid: string;
}

export interface BilibiliFavData {
  info: { media_count: number };
  medias: BilibiliMedia[] | null;
}

// QQ Music API Types
export interface QQSearchItem {
  mid: string;
  name: string;
  singer: string;
}

export interface QQSearchResultItem {
  mid: string;
  name: string;
  singer: Array<{ name: string }>;
}
