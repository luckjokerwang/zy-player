import md5 from 'md5';

// WBI签名实现 - 来自 bilibili-API-collect
// https://github.com/pskdje/bilibili-API-collect/blob/master/docs/misc/sign/wbi.md

const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52,
];

// 对 imgKey 和 subKey 进行字符顺序打乱编码
const getMixinKey = (orig: string): string =>
  mixinKeyEncTab.map((n) => orig[n]).join('').slice(0, 32);

// 缓存 wbi keys
let cachedWbiKeys: { img_key: string; sub_key: string; timestamp: number } | null = null;
const WBI_KEYS_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12小时缓存

// 获取最新的 img_key 和 sub_key
export async function getWbiKeys(): Promise<{ img_key: string; sub_key: string }> {
  // 检查缓存
  if (cachedWbiKeys && Date.now() - cachedWbiKeys.timestamp < WBI_KEYS_CACHE_DURATION) {
    return { img_key: cachedWbiKeys.img_key, sub_key: cachedWbiKeys.sub_key };
  }

  try {
    const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://www.bilibili.com/',
      },
    });

    const json = await res.json();
    
    // 即使未登录 (code: -101) 也会返回 wbi_img
    if (!json.data?.wbi_img) {
      throw new Error('无法获取 WBI keys');
    }

    const { img_url, sub_url } = json.data.wbi_img;
    
    // 从 URL 中提取 key
    // https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png -> 7cd084941338484aae1ad9425b84077c
    const img_key = img_url.slice(img_url.lastIndexOf('/') + 1, img_url.lastIndexOf('.'));
    const sub_key = sub_url.slice(sub_url.lastIndexOf('/') + 1, sub_url.lastIndexOf('.'));

    // 更新缓存
    cachedWbiKeys = { img_key, sub_key, timestamp: Date.now() };

    console.log('WBI keys fetched:', { img_key, sub_key });
    return { img_key, sub_key };
  } catch (error) {
    console.error('获取 WBI keys 失败:', error);
    throw error;
  }
}

export function encWbi(
  params: Record<string, string | number>,
  img_key: string,
  sub_key: string
): string {
  const mixin_key = getMixinKey(img_key + sub_key);
  const curr_time = Math.round(Date.now() / 1000);
  const chr_filter = /[!'()*]/g;

  const signParams: Record<string, string | number> = { ...params, wts: curr_time };

  const query = Object.keys(signParams)
    .sort()
    .map((key) => {
      const value = signParams[key].toString().replace(chr_filter, '');
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');

  const wbi_sign = md5(query + mixin_key);

  return query + '&w_rid=' + wbi_sign;
}

// 便捷方法：直接为参数签名并返回完整的查询字符串
export async function signWbiParams(params: Record<string, string | number>): Promise<string> {
  const { img_key, sub_key } = await getWbiKeys();
  return encWbi(params, img_key, sub_key);
}

// 便捷方法：为 URL 添加 WBI 签名
export async function signWbiUrl(baseUrl: string, params: Record<string, string | number>): Promise<string> {
  const signedQuery = await signWbiParams(params);
  return `${baseUrl}?${signedQuery}`;
}
