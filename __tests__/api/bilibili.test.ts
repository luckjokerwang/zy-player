/**
 * Unit tests for src/api/bilibili.ts
 * @format
 */

import {
  fetchVideoInfo,
  fetchPlayUrl,
  fetchCID,
  getSongListFromBVID,
  fetchBiliSeriesList,
  fetchBiliCollectionList,
  fetchFavList,
  searchLyricOptions,
  fetchLyric,
  extractSongName,
} from '../../src/api/bilibili';
import { signWbiParams } from '../../src/utils/wbi';
import type {
  BilibiliVideoData,
  BilibiliPage,
  VideoInfo,
  Song,
} from '../../src/utils/types';

// Mock the wbi module
jest.mock('../../src/utils/wbi', () => ({
  signWbiParams: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
// @ts-ignore - Jest environment provides global
global.fetch = mockFetch;

const mockSignWbiParams = signWbiParams as jest.MockedFunction<
  typeof signWbiParams
>;

describe('bilibili API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchVideoInfo', () => {
    const mockBvid = 'BV1wr4y1v7TA';
    const mockVideoData: BilibiliVideoData = {
      title: '测试视频',
      desc: '测试描述',
      videos: 2,
      pic: 'https://example.com/pic.jpg',
      owner: {
        name: 'TestUploader',
        mid: 12345,
      },
      pages: [
        { part: 'P1', cid: 111 },
        { part: 'P2', cid: 222 },
      ] as BilibiliPage[],
    };

    it('should return video info for valid bvid', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: 0, data: mockVideoData }),
      } as Response);

      const result = await fetchVideoInfo(mockBvid);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('测试视频');
      expect(result?.uploader.name).toBe('TestUploader');
      expect(result?.uploader.mid).toBe('12345');
      expect(result?.pages).toHaveLength(2);
      expect(result?.pages[0].bvid).toBe(mockBvid);
      expect(result?.pages[0].cid).toBe('111');
    });

    it('should return null when API returns error code', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: -404, message: 'Video not found' }),
      } as Response);

      const result = await fetchVideoInfo(mockBvid);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching video info:',
        'Video not found',
      );
    });

    it('should return null when fetch throws error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchVideoInfo(mockBvid);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching video info:',
        expect.any(Error),
      );
    });

    it('should handle single page video', async () => {
      const singlePageData = {
        ...mockVideoData,
        videos: 1,
        pages: [{ part: 'P1', cid: 111 }] as BilibiliPage[],
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: 0, data: singlePageData }),
      } as Response);

      const result = await fetchVideoInfo(mockBvid);

      expect(result).not.toBeNull();
      expect(result?.pages).toHaveLength(1);
    });
  });

  describe('fetchPlayUrl', () => {
    const mockBvid = 'BV1wr4y1v7TA';
    const mockCid = '12345';
    const mockAudioUrl = 'https://example.com/audio.m4a';

    beforeEach(() => {
      mockSignWbiParams.mockResolvedValue('signed_query_string');
    });

    it('should return audio URL for valid bvid and cid', async () => {
      mockFetch.mockResolvedValueOnce({
        text: async () =>
          JSON.stringify({
            code: 0,
            data: {
              dash: {
                audio: [{ baseUrl: mockAudioUrl }],
              },
            },
          }),
      } as Response);

      const result = await fetchPlayUrl(mockBvid, mockCid);

      expect(result).toBe(mockAudioUrl);
      expect(mockSignWbiParams).toHaveBeenCalledWith({
        bvid: mockBvid,
        cid: mockCid,
        qn: 64,
        fnval: 16,
        fnver: 0,
        fourk: 1,
      });
    });

    it('should return null when API returns HTML instead of JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        text: async () => '<html>Blocked</html>',
      } as Response);

      const result = await fetchPlayUrl(mockBvid, mockCid);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('returned HTML instead of JSON'),
      );
    });

    it('should return null when API returns error code', async () => {
      mockFetch.mockResolvedValueOnce({
        text: async () => JSON.stringify({ code: -403, message: 'Forbidden' }),
      } as Response);

      const result = await fetchPlayUrl(mockBvid, mockCid);

      expect(result).toBeNull();
    });

    it('should return null when no audio URL in response', async () => {
      mockFetch.mockResolvedValueOnce({
        text: async () =>
          JSON.stringify({
            code: 0,
            data: { dash: { audio: [] } },
          }),
      } as Response);

      const result = await fetchPlayUrl(mockBvid, mockCid);

      expect(result).toBeNull();
    });

    it('should return null when fetch throws error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchPlayUrl(mockBvid, mockCid);

      expect(result).toBeNull();
    });
  });

  describe('fetchCID', () => {
    const mockBvid = 'BV1wr4y1v7TA';

    it('should return CID for valid bvid', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: 0, data: [{ cid: 12345 }] }),
      } as Response);

      const result = await fetchCID(mockBvid);

      expect(result).toBe('12345');
    });

    it('should return null when API returns error code', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: -404, message: 'Not found' }),
      } as Response);

      const result = await fetchCID(mockBvid);

      expect(result).toBeNull();
    });

    it('should return null when data is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: 0, data: [] }),
      } as Response);

      const result = await fetchCID(mockBvid);

      expect(result).toBeNull();
    });

    it('should return null when fetch throws error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchCID(mockBvid);

      expect(result).toBeNull();
    });
  });

  describe('getSongListFromBVID', () => {
    const mockBvid = 'BV1wr4y1v7TA';

    it('should return song list for single page video', async () => {
      const mockVideoData: BilibiliVideoData = {
        title: '测试歌曲',
        desc: '描述',
        videos: 1,
        pic: 'https://example.com/pic.jpg',
        owner: { name: 'Singer', mid: 12345 },
        pages: [{ part: 'P1', cid: 111 }] as BilibiliPage[],
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: 0, data: mockVideoData }),
      } as Response);

      const result = await getSongListFromBVID(mockBvid);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('测试歌曲');
      expect(result[0].singer).toBe('Singer');
      expect(result[0].bvid).toBe(mockBvid);
      expect(result[0].id).toBe('111');
    });

    it('should return song list for multi-page video', async () => {
      const mockVideoData: BilibiliVideoData = {
        title: '合集',
        desc: '描述',
        videos: 2,
        pic: 'https://example.com/pic.jpg',
        owner: { name: 'Singer', mid: 12345 },
        pages: [
          { part: '歌曲1', cid: 111 },
          { part: '歌曲2', cid: 222 },
        ] as BilibiliPage[],
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: 0, data: mockVideoData }),
      } as Response);

      const result = await getSongListFromBVID(mockBvid);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('歌曲1');
      expect(result[1].name).toBe('歌曲2');
      expect(result[0].singer).toBe('Singer');
      expect(result[1].singer).toBe('Singer');
    });

    it('should return empty array when video info fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: -404, message: 'Not found' }),
      } as Response);

      const result = await getSongListFromBVID(mockBvid);

      expect(result).toEqual([]);
    });
  });

  describe('fetchBiliSeriesList', () => {
    const mockMid = '12345';
    const mockSid = '67890';

    it('should return song list from series', async () => {
      const mockSeriesData = {
        code: 0,
        data: {
          archives: [{ bvid: 'BV1' }, { bvid: 'BV2' }],
        },
      };

      const mockVideoData: BilibiliVideoData = {
        title: '视频',
        desc: '',
        videos: 1,
        pic: 'https://example.com/pic.jpg',
        owner: { name: 'UP主', mid: 12345 },
        pages: [{ part: 'P1', cid: 111 }] as BilibiliPage[],
      };

      mockFetch
        .mockResolvedValueOnce({
          json: async () => mockSeriesData,
        } as Response)
        .mockResolvedValueOnce({
          json: async () => ({ code: 0, data: mockVideoData }),
        } as Response)
        .mockResolvedValueOnce({
          json: async () => ({ code: 0, data: mockVideoData }),
        } as Response);

      const result = await fetchBiliSeriesList(mockMid, mockSid);

      expect(result).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should return empty array when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: -404, message: 'Not found' }),
      } as Response);

      const result = await fetchBiliSeriesList(mockMid, mockSid);

      expect(result).toEqual([]);
    });

    it('should return empty array when fetch throws error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchBiliSeriesList(mockMid, mockSid);

      expect(result).toEqual([]);
    });
  });

  describe('fetchBiliCollectionList', () => {
    const mockMid = '12345';
    const mockSid = '67890';

    it('should return song list from collection (single page)', async () => {
      const mockCollectionData = {
        code: 0,
        data: {
          meta: { total: 2 },
          page: { page_size: 30 },
          archives: [{ bvid: 'BV1' }, { bvid: 'BV2' }],
        },
      };

      const mockVideoData: BilibiliVideoData = {
        title: '视频',
        desc: '',
        videos: 1,
        pic: 'https://example.com/pic.jpg',
        owner: { name: 'UP主', mid: 12345 },
        pages: [{ part: 'P1', cid: 111 }] as BilibiliPage[],
      };

      mockFetch
        .mockResolvedValueOnce({
          json: async () => mockCollectionData,
        } as Response)
        .mockResolvedValueOnce({
          json: async () => ({ code: 0, data: mockVideoData }),
        } as Response)
        .mockResolvedValueOnce({
          json: async () => ({ code: 0, data: mockVideoData }),
        } as Response);

      const result = await fetchBiliCollectionList(mockMid, mockSid);

      expect(result).toHaveLength(2);
    });

    it('should handle multiple pages', async () => {
      const mockFirstPage = {
        code: 0,
        data: {
          meta: { total: 35 },
          page: { page_size: 30 },
          archives: Array(30)
            .fill(null)
            .map((_, i) => ({ bvid: `BV${i}` })),
        },
      };

      const mockSecondPage = {
        code: 0,
        data: {
          archives: Array(5)
            .fill(null)
            .map((_, i) => ({ bvid: `BV${i + 30}` })),
        },
      };

      const mockVideoData: BilibiliVideoData = {
        title: '视频',
        desc: '',
        videos: 1,
        pic: 'https://example.com/pic.jpg',
        owner: { name: 'UP主', mid: 12345 },
        pages: [{ part: 'P1', cid: 111 }] as BilibiliPage[],
      };

      mockFetch
        .mockResolvedValueOnce({
          json: async () => mockFirstPage,
        } as Response)
        .mockResolvedValueOnce({
          json: async () => mockSecondPage,
        } as Response);

      // Mock all video info requests
      for (let i = 0; i < 35; i++) {
        mockFetch.mockResolvedValueOnce({
          json: async () => ({ code: 0, data: mockVideoData }),
        } as Response);
      }

      const result = await fetchBiliCollectionList(mockMid, mockSid);

      expect(result).toHaveLength(35);
    });

    it('should return empty array when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: -404, message: 'Not found' }),
      } as Response);

      const result = await fetchBiliCollectionList(mockMid, mockSid);

      expect(result).toEqual([]);
    });

    it('should return empty array when fetch throws error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchBiliCollectionList(mockMid, mockSid);

      expect(result).toEqual([]);
    });
  });

  describe('fetchFavList', () => {
    const mockMid = '12345';

    it('should return song list from favorite list (single page)', async () => {
      const mockFavData = {
        code: 0,
        data: {
          info: { media_count: 2 },
          medias: [{ bvid: 'BV1' }, { bvid: 'BV2' }],
        },
      };

      const mockVideoData: BilibiliVideoData = {
        title: '视频',
        desc: '',
        videos: 1,
        pic: 'https://example.com/pic.jpg',
        owner: { name: 'UP主', mid: 12345 },
        pages: [{ part: 'P1', cid: 111 }] as BilibiliPage[],
      };

      mockFetch
        .mockResolvedValueOnce({
          json: async () => mockFavData,
        } as Response)
        .mockResolvedValueOnce({
          json: async () => ({ code: 0, data: mockVideoData }),
        } as Response)
        .mockResolvedValueOnce({
          json: async () => ({ code: 0, data: mockVideoData }),
        } as Response);

      const result = await fetchFavList(mockMid);

      expect(result).toHaveLength(2);
    });

    it('should handle multiple pages', async () => {
      const mockFirstPage = {
        code: 0,
        data: {
          info: { media_count: 25 },
          medias: Array(20)
            .fill(null)
            .map((_, i) => ({ bvid: `BV${i}` })),
        },
      };

      const mockSecondPage = {
        code: 0,
        data: {
          medias: Array(5)
            .fill(null)
            .map((_, i) => ({ bvid: `BV${i + 20}` })),
        },
      };

      const mockVideoData: BilibiliVideoData = {
        title: '视频',
        desc: '',
        videos: 1,
        pic: 'https://example.com/pic.jpg',
        owner: { name: 'UP主', mid: 12345 },
        pages: [{ part: 'P1', cid: 111 }] as BilibiliPage[],
      };

      mockFetch
        .mockResolvedValueOnce({
          json: async () => mockFirstPage,
        } as Response)
        .mockResolvedValueOnce({
          json: async () => mockSecondPage,
        } as Response);

      // Mock all video info requests
      for (let i = 0; i < 25; i++) {
        mockFetch.mockResolvedValueOnce({
          json: async () => ({ code: 0, data: mockVideoData }),
        } as Response);
      }

      const result = await fetchFavList(mockMid);

      expect(result).toHaveLength(25);
    });

    it('should handle null medias field', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          code: 0,
          data: { info: { media_count: 0 }, medias: null },
        }),
      } as Response);

      const result = await fetchFavList(mockMid);

      expect(result).toEqual([]);
    });

    it('should return empty array when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: -404, message: 'Not found' }),
      } as Response);

      const result = await fetchFavList(mockMid);

      expect(result).toEqual([]);
    });

    it('should return empty array when no data field', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ code: 0, data: null }),
      } as Response);

      const result = await fetchFavList(mockMid);

      expect(result).toEqual([]);
    });

    it('should return empty array when fetch throws error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchFavList(mockMid);

      expect(result).toEqual([]);
    });
  });

  describe('searchLyricOptions', () => {
    it('should return lyric options for valid search key', async () => {
      const mockSearchResult = {
        data: {
          song: {
            itemlist: [
              { mid: 'song1', name: '测试歌曲1', singer: '歌手1' },
              { mid: 'song2', name: '测试歌曲2', singer: '歌手2' },
            ],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => mockSearchResult,
      } as Response);

      const result = await searchLyricOptions('测试');

      expect(result).toHaveLength(2);
      expect(result[0].songMid).toBe('song1');
      expect(result[0].label).toContain('测试歌曲1');
      expect(result[0].label).toContain('歌手1');
      expect(result[1].songMid).toBe('song2');
    });

    it('should return empty array for empty search key', async () => {
      const result = await searchLyricOptions('');

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should use fallback when primary search returns empty', async () => {
      const mockPrimaryResult = {
        data: { song: { itemlist: [] } },
      };

      const mockFallbackResult = {
        req: {
          data: {
            body: {
              song: {
                list: [
                  {
                    mid: 'song3',
                    name: '备用歌曲',
                    singer: [{ name: '备用歌手' }],
                  },
                ],
              },
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          json: async () => mockPrimaryResult,
        } as Response)
        .mockResolvedValueOnce({
          json: async () => mockFallbackResult,
        } as Response);

      const result = await searchLyricOptions('测试');

      expect(result).toHaveLength(1);
      expect(result[0].songMid).toBe('song3');
      expect(result[0].label).toContain('备用歌曲');
      expect(result[0].label).toContain('备用歌手');
    });

    it('should use fallback when primary search throws error', async () => {
      const mockFallbackResult = {
        req: {
          data: {
            body: {
              song: {
                list: [
                  {
                    mid: 'song4',
                    name: '错误恢复',
                    singer: [{ name: '歌手' }],
                  },
                ],
              },
            },
          },
        },
      };

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          json: async () => mockFallbackResult,
        } as Response);

      const result = await searchLyricOptions('测试');

      expect(result).toHaveLength(1);
      expect(result[0].songMid).toBe('song4');
    });

    it('should handle fallback error gracefully', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Primary error'))
        .mockRejectedValueOnce(new Error('Fallback error'));

      const result = await searchLyricOptions('测试');

      expect(result).toEqual([]);
    });

    it('should handle singer without name in fallback', async () => {
      const mockFallbackResult = {
        req: {
          data: {
            body: {
              song: {
                list: [
                  {
                    mid: 'song5',
                    name: '无歌手',
                    singer: [],
                  },
                ],
              },
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          json: async () => ({ data: { song: { itemlist: [] } } }),
        } as Response)
        .mockResolvedValueOnce({
          json: async () => mockFallbackResult,
        } as Response);

      const result = await searchLyricOptions('测试');

      expect(result).toHaveLength(1);
      expect(result[0].label).toContain('Unknown');
    });
  });

  describe('fetchLyric', () => {
    const mockSongMid = 'song123';

    it('should return lyric for valid song mid', async () => {
      const mockLyricResponse = {
        lyric: '[00:00.00]歌词内容',
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => mockLyricResponse,
      } as Response);

      const result = await fetchLyric(mockSongMid);

      expect(result).toBe('[00:00.00]歌词内容');
    });

    it('should return lyric with translation when available', async () => {
      const mockLyricResponse = {
        lyric: '[00:00.00]歌词内容',
        trans: '[00:00.00]Translation',
      };

      mockFetch.mockResolvedValueOnce({
        json: async () => mockLyricResponse,
      } as Response);

      const result = await fetchLyric(mockSongMid);

      expect(result).toBe('[00:00.00]Translation\n[00:00.00]歌词内容');
    });

    it('should return default message when lyric not found', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({}),
      } as Response);

      const result = await fetchLyric(mockSongMid);

      expect(result).toBe('[00:00.000] 无法找到歌词');
    });

    it('should return default message when fetch throws error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchLyric(mockSongMid);

      expect(result).toBe('[00:00.000] 无法找到歌词');
    });
  });

  describe('extractSongName', () => {
    it('should extract song name from Chinese book marks', () => {
      const result = extractSongName('歌手名 - 《歌曲名》', '歌手名');
      expect(result).toBe('歌曲名');
    });

    it('should extract song name when only book marks present', () => {
      const result = extractSongName('《歌曲名》');
      expect(result).toBe('歌曲名');
    });

    it('should return original name when no book marks', () => {
      const result = extractSongName('普通歌曲名');
      expect(result).toBe('普通歌曲名');
    });

    it('should handle multiple book marks and return first match', () => {
      const result = extractSongName('《歌曲1》和《歌曲2》');
      expect(result).toBe('歌曲1》和《歌曲2');
    });

    it('should return original name for empty book marks', () => {
      const result = extractSongName('歌曲《》名');
      expect(result).toBe('');
    });

    it('should handle names with special characters', () => {
      const result = extractSongName('《歌曲-名字!@#》');
      expect(result).toBe('歌曲-名字!@#');
    });

    it('should ignore artist parameter (not used in implementation)', () => {
      const result = extractSongName('《歌曲名》', '某歌手');
      expect(result).toBe('歌曲名');
    });
  });
});
