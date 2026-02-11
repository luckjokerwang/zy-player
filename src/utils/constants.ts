// Bilibili API URLs
export const API = {
  PLAY_URL_BASE: 'https://api.bilibili.com/x/player/wbi/playurl',
  PLAY_URL: 'https://api.bilibili.com/x/player/playurl?cid={cid}&bvid={bvid}&qn=64&fnval=16',
  // BVID转CID
  BVID_TO_CID: 'https://api.bilibili.com/x/player/pagelist?bvid={bvid}&jsonp=jsonp',
  // 视频基本信息
  VIDEO_INFO: 'https://api.bilibili.com/x/web-interface/view?bvid={bvid}',
  // 用户频道系列
  BILI_SERIES: 'https://api.bilibili.com/x/series/archives?mid={mid}&series_id={sid}&only_normal=true&sort=desc&pn={pn}&ps=30',
  // 用户频道合集
  BILI_COLLECTION: 'https://api.bilibili.com/x/polymer/space/seasons_archives_list?mid={mid}&season_id={sid}&sort_reverse=false&page_num={pn}&page_size=30',
  // 收藏夹列表
  FAV_LIST: 'https://api.bilibili.com/x/v3/fav/resource/list?media_id={mid}&pn={pn}&ps=20&keyword=&order=mtime&type=0&tid=0&platform=web&jsonp=jsonp',
  // QQ音乐歌词搜索
  QQ_SEARCH: 'https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?key={KeyWord}',
  // QQ音乐歌词获取
  QQ_LYRIC: 'https://i.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid={SongMid}&g_tk=5381&format=json&inCharset=utf8&outCharset=utf-8&nobase64=1',
  // QQ音乐搜索备用接口
  QQ_SEARCH_POST: 'https://u.y.qq.com/cgi-bin/musicu.fcg',
};

// 存储键名
export const STORAGE_KEYS = {
  MY_FAV_LIST: 'MyFavList',
  LAST_PLAY_LIST: 'LastPlayList',
  LYRIC_MAPPING: 'LyricMappings',
  PLAYER_SETTINGS: 'PlayerSetting',
  CURRENT_PLAYING: 'CurrentPlaying',
};

// 默认BV号 - 初始歌单
export const DEFAULT_BVID = 'BV1wr4y1v7TA';

// 播放模式
export const PLAY_MODES = {
  ORDER: 'order',
  SHUFFLE: 'shuffle',
  SINGLE_LOOP: 'singleLoop',
  LIST_LOOP: 'listLoop',
} as const;

export type PlayMode = typeof PLAY_MODES[keyof typeof PLAY_MODES];

// 主题颜色
export const COLORS = {
  primary: '#ab5fff',
  primaryLight: '#c660e7',
  primaryDark: '#9600af94',
  secondary: '#FF8E53',
  background: '#121212',
  surface: '#1e1e1e',
  surfaceLight: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#9c55fac9',
  error: '#ff5252',
  success: '#4caf50',
};
