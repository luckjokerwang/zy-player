# ZiyunPlayer 项目架构文档

## 1. 项目概述

**子云音播** - B 站第三方音频播放器，基于 React Native 开发。

- **版本**: 1.0.2
- **React Native**: 0.83.1
- **react-native-track-player**: 5.0.0-alpha0 (预发布版本)
- **目标平台**: Android

---

## 2. 项目结构

```
ZiyunPlayer/
├── index.js                    # 应用入口，注册 App 和 PlaybackService
├── App.tsx                     # React 根组件
├── app.json                    # RN 应用元数据
├── package.json                # 依赖和脚本
│
├── src/
│   ├── contexts/
│   │   ├── PlaybackContext.tsx # 播放器上下文，初始化和状态管理
│   │   ├── PlayerContext.tsx   # 组合上下文，提供 usePlayer() hook
│   │   └── FavoritesContext.tsx# 收藏夹上下文
│   │
│   ├── services/
│   │   ├── PlayerService.ts    # TrackPlayer 核心封装，队列和播放控制
│   │   └── playbackService.ts  # 后台服务，处理通知栏按钮事件
│   │
│   ├── api/
│   │   └── bilibili.ts         # Bilibili API，获取播放地址 (WBI签名)
│   │
│   ├── storage/
│   │   └── StorageManager.ts   # AsyncStorage 封装，持久化存储
│   │
│   ├── utils/
│   │   ├── constants.ts        # 常量：API端点、Headers、占位URL工具
│   │   └── wbi.ts              # WBI 签名实现
│   │
│   ├── components/             # UI 组件
│   ├── screens/                # 页面
│   └── navigation/             # 导航
│
└── android/
    └── app/src/main/
        └── AndroidManifest.xml # Android 权限和服务声明
```

---

## 3. 启动流程

```
index.js
    │
    ├─→ AppRegistry.registerComponent(appName, () => App)  # 注册 React 组件
    │
    └─→ TrackPlayer.registerPlaybackService(() => PlaybackService)  # 注册后台服务
          │
          ▼
App.tsx
    │
    └─→ PlayerProvider (PlayerContext.tsx)
          │
          └─→ PlaybackProvider (PlaybackContext.tsx)
                │
                ├─→ PlayerService.setupPlayer()          # 初始化 TrackPlayer
                ├─→ storageManager.getPlayerSettings()   # 加载设置
                ├─→ storageManager.initFavLists()        # 加载收藏
                ├─→ storageManager.getLastPlayList()      # 加载上次播放
                ├─→ PlayerService.addSongsToQueueFast()   # 添加到队列 (占位URL)
                └─→ PlayerService.playTrack(0)            # 播放第一首
```

---

## 4. TrackPlayer 初始化配置

**文件**: `src/services/PlayerService.ts` - `setupPlayer()`

```typescript
await TrackPlayer.setupPlayer({
  autoHandleInterruptions: true,
});

await TrackPlayer.updateOptions({
  capabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
    Capability.Stop,
    Capability.SeekTo,
  ],
  notificationCapabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
  ],
  android: {
    appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
  },
});
```

---

## 5. PlaybackService (后台服务)

**文件**: `src/services/playbackService.ts`

注册的事件监听器：

| 事件              | 触发时机                         | 处理逻辑                          |
| ----------------- | -------------------------------- | --------------------------------- |
| `RemotePlay`      | 通知栏点击播放                   | `PlayerService.togglePlayPause()` |
| `RemotePause`     | 通知栏点击暂停                   | `TrackPlayer.pause()`             |
| `RemotePlayPause` | 合并事件 (Android 12+/Vivo/MIUI) | 根据状态切换播放/暂停             |
| `RemoteNext`      | 通知栏点击下一首                 | `PlayerService.skipToNext()`      |
| `RemotePrevious`  | 通知栏点击上一首                 | `PlayerService.skipToPrevious()`  |
| `PlaybackError`   | 播放出错                         | 重试当前轨道                      |

**重要**: `RemotePlayPause` 事件在 Vivo/MIUI/Android 12+ 设备上必须处理，因为这些设备发送合并的 `KEYCODE_MEDIA_PLAY_PAUSE` 而不是分开的 Play/Pause 事件。

---

## 6. 音频 URL 策略 (占位 → 真实)

### 为什么使用占位 URL？

为了快速加载播放列表，避免在初始化时逐个获取真实播放地址。

### 占位 URL 格式

```
https://placeholder.bilibili/{bvid}/{cid}
```

### 解析流程

```
playTrack(index)
    │
    └─→ resolveTrackUrl(index)
          │
          ├─→ 检查 URL 是否为占位符 (isPlaceholderUrl)
          │
          ├─→ 解析 bvid 和 cid (parsePlaceholderUrl)
          │
          ├─→ 获取真实播放地址 (fetchPlayUrl)
          │     │
          │     └─→ WBI 签名 → 请求 Bilibili API → 提取 dash.audio[0].baseUrl
          │
          └─→ 替换队列中的占位轨道 (remove + add)
```

### 相关文件

- `src/utils/constants.ts` - `createPlaceholderUrl`, `isPlaceholderUrl`, `parsePlaceholderUrl`
- `src/api/bilibili.ts` - `fetchPlayUrl` (WBI 签名)
- `src/utils/wbi.ts` - WBI 签名实现

---

## 7. 构建流程

### 开发模式

```bash
# 启动 Metro bundler
npm start

# 运行 Android 调试版本
npm run android
```

### 重新构建 JS Bundle (重要！)

**修改 TypeScript 文件后必须重新打包 JS bundle：**

```bash
# 重新打包 JavaScript
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

# 然后重新构建 APK
cd android && ./gradlew assembleDebug
```

### 发布版本

```bash
npm run android:release
# APK 输出: android/app/build/outputs/apk/release/app-release.apk
```

### 关键文件位置

- **JS Bundle**: `android/app/src/main/assets/index.android.bundle`
- **调试 APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **发布 APK**: `android/app/build/outputs/apk/release/app-release.apk`

---

## 8. 关键文件说明

| 文件                               | 作用                                             |
| ---------------------------------- | ------------------------------------------------ |
| `index.js`                         | 应用入口，注册 React 组件和 TrackPlayer 后台服务 |
| `App.tsx`                          | React 根组件，设置 Provider 和导航               |
| `src/contexts/PlaybackContext.tsx` | 播放器上下文，初始化和状态管理                   |
| `src/services/PlayerService.ts`    | TrackPlayer 封装，队列管理和播放控制             |
| `src/services/playbackService.ts`  | 后台服务，处理通知栏按钮事件                     |
| `src/api/bilibili.ts`              | Bilibili API 集成，获取播放地址                  |
| `src/utils/wbi.ts`                 | WBI 签名实现                                     |
| `src/utils/constants.ts`           | 常量定义，占位 URL 工具函数                      |
| `src/storage/StorageManager.ts`    | 持久化存储                                       |
| `android/.../AndroidManifest.xml`  | Android 权限和服务声明                           |

---

## 9. Android 配置

### 权限

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### 服务声明

```xml
<service
    android:name="com.doublesymmetry.trackplayer.service.MusicService"
    android:foregroundServiceType="mediaPlayback" />

<receiver android:name="androidx.media.session.MediaButtonReceiver" android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MEDIA_BUTTON" />
    </intent-filter>
</receiver>
```

---

## 10. 当前问题排查

### 问题描述

- **应用内播放**: ✅ 正常工作
- **通知栏显示**: ✅ 显示歌曲信息
- **通知栏按钮**: ❌ 点击无反应

### 已确认

- `setupPlayer()` 执行成功
- `PlaybackService` 启动成功 (Toast 显示)
- `RemotePlay`, `RemotePause`, `RemotePlayPause` 等事件**未触发**

### 可能原因

#### 1. RNTP 版本问题

- 当前使用 `5.0.0-alpha0` (预发布版本)
- 设备运行 **Android 16 (API 36)** - 非常新的版本
- 可能存在兼容性问题

#### 2. Vivo/FuntouchOS 特殊行为

- Vivo 设备可能对媒体按钮有特殊处理
- 需要检查电池优化设置

#### 3. Android 16 媒体控制变更

- Android 16 可能更改了 MediaSession 行为

### 建议排查步骤

1. **检查 logcat 中的媒体按钮事件**:

   ```bash
   adb logcat | grep -i "MediaButton\|KeyEvent\|RemotePlay"
   ```

2. **尝试升级/降级 RNTP 版本**:

   ```bash
   npm install react-native-track-player@4.1.1
   ```

3. **检查 Vivo 电池优化设置**:

   - 设置 → 电池 → 应用耗电管理 → 子云音播 → 关闭优化

4. **添加原生日志**:
   - 修改 `MusicService.kt` 添加日志确认事件是否到达原生层

---

## 11. 开发注意事项

### 修改代码后

1. 如果修改 `.ts/.tsx` 文件，必须重新打包 JS bundle
2. 如果修改原生代码，需要重新构建 APK

### 调试

- Vivo 设备过滤了 `console.log`，使用 `ToastAndroid` 进行调试
- Headless JS context 中 `ToastAndroid` 不工作，需要在主应用中调试

### 清理构建

```bash
cd android && ./gradlew clean && ./gradlew assembleDebug
```

---

## 12. 参考链接

- [react-native-track-player 文档](https://rntp.dev/docs/basics/getting-started)
- [react-native-track-player GitHub Issues](https://github.com/doublesymmetry/react-native-track-player/issues)
- [Issue #2543 - 通知按钮不工作](https://github.com/doublesymmetry/react-native-track-player/issues/2543)
- [Issue #2564 - MIUI 13 按钮无响应](https://github.com/doublesymmetry/react-native-track-player/issues/2564)
