# 子云音播 (Ziyun Player)

[中文](#中文) | [English](#english)

---

<a id="中文"></a>

## 中文

### 子云音播 - B 站第三方音频播放器

基于 React Native 和 TypeScript 开发的 B 站第三方音频播放器。

### 功能特性

- 🎵 **音频播放**: 播放 B 站音频内容
- 📱 **跨平台支持**: Android 支持（iOS 即将推出）
- 🔍 **多种搜索**: 支持 BV 号、收藏夹 ID、合集搜索
- 💾 **数据管理**: 导出/导入歌单数据
- 🎨 **现代界面**: 简洁直观的用户界面
- 🔄 **WBI 签名**: 修复 B 站 WBI 签名，确保 API 调用正常

### 快速开始

#### 环境要求

- Node.js >= 20
- Android Studio
- React Native CLI

#### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/luckjokerwang/zy-player.git
cd zy-player

# 安装依赖
npm install

# 启动 Metro
npm start

# 构建 Android 应用
npm run android
```

#### 构建 APK

```bash
# 构建调试版 APK
npm run android

# 或直接从 Android 目录构建
cd android && ./gradlew assembleDebug
```

### 使用说明

#### 搜索类型

- **BV 号**: 视频 BV 号 (如 `BV1wr4y1v7TA`)
- **收藏夹 ID**: 公开收藏夹 ID (如 `1793186881`)
- **合集**: 完整 URL
  - Collection: `channel/collectiondetail?sid=xxx`
  - Series: `channel/seriesdetail?sid=xxx`

#### 数据管理

- 将歌单数据导出为 JSON 文件
- 导入之前导出的数据
- 自动备份功能

### 技术细节

- **框架**: React Native 0.83.1
- **语言**: TypeScript
- **导航**: React Navigation
- **音频**: React Native Track Player
- **状态管理**: React Context API
- **存储**: Async Storage

### 项目结构

```
src/
├── api/ # B 站 API 集成
├── components/ # 可复用 UI 组件
├── contexts/ # React Context 提供者
├── screens/ # 应用页面
├── services/ # 业务逻辑服务
├── storage/ # 数据存储管理
└── utils/ # 工具函数
```

### 开发信息

#### 关键文件

- `src/api/bilibili.ts` - B 站 API 集成，包含 WBI 签名
- `src/utils/wbi.ts` - WBI 签名实现
- `src/screens/` - 应用页面
- `src/components/` - UI 组件

#### 近期更新

- **v1.0.4**: 修复通知中心按钮点击问题，修复恢复播放时从头开始问题，优化首次启动自动进入播放器页面
- **v1.0.3**: 修复通知中心播放/暂停按钮，修复自动播放，升级 RNTP 到 5.0.0-alpha0
- **v1.0.2**: 更新应用图标，增强关于页面，添加免责声明
- **v1.0.1**: 修复 B 站 WBI 签名，解决 API 调用问题
- **v1.0.0**: 初始版本，包含基础音频播放功能

### 免责声明

本应用为第三方 B 站音频播放器，仅用于个人学习和交流目的，不涉及任何商业用途。音频资源来自 Bilibili 公开 API，请尊重版权，合理使用。

### 许可证

MIT 许可证

---

<a id="english"></a>

## English

### Ziyun Player - Bilibili Audio Player

A third-party Bilibili audio player built with React Native and TypeScript.

### Features

- 🎵 **Audio Playback**: Play Bilibili audio content
- 📱 **Cross-Platform**: Android support (iOS coming soon)
- 🔍 **Multiple Search**: Support for BV numbers, playlist IDs, collections
- 💾 **Data Management**: Export/import playlist data
- 🎨 **Modern UI**: Clean and intuitive interface
- 🔄 **WBI Signature**: Fixed Bilibili WBI signature for API calls

### Quick Start

#### Prerequisites

- Node.js >= 20
- Android Studio
- React Native CLI

#### Installation

```bash
# Clone the repository
git clone https://github.com/luckjokerwang/zy-player.git
cd zy-player

# Install dependencies
npm install

# Start Metro
npm start

# Build for Android
npm run android
```

#### Build APK

```bash
# Build debug APK
npm run android

# Or build directly from Android directory
cd android && ./gradlew assembleDebug
```

### Usage

#### Search Types

- **BV Number**: Video BV ID (e.g., `BV1wr4y1v7TA`)
- **Playlist ID**: Public playlist ID (e.g., `1793186881`)
- **Collection**: Full URL
  - Collection: `channel/collectiondetail?sid=xxx`
  - Series: `channel/seriesdetail?sid=xxx`

#### Data Management

- Export playlist data as JSON file
- Import previously exported data
- Automatic backup functionality

### Technical Details

- **Framework**: React Native 0.83.1
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Audio**: React Native Track Player
- **State Management**: React Context API
- **Storage**: Async Storage

### Project Structure

```
src/
├── api/ # Bilibili API integration
├── components/ # Reusable UI components
├── contexts/ # React Context providers
├── screens/ # App screens
├── services/ # Business logic services
├── storage/ # Data storage management
└── utils/ # Utility functions
```

### Development

#### Key Files

- `src/api/bilibili.ts` - Bilibili API integration with WBI signature
- `src/utils/wbi.ts` - WBI signature implementation
- `src/screens/` - Application screens
- `src/components/` - UI components

#### Recent Updates

- **v1.0.4**: Fixed notification center button clicks, fixed resume playback restarting issue, optimized initial screen navigation
- **v1.0.3**: Fixed notification center play/pause buttons, fixed auto-play, upgraded RNTP to 5.0.0-alpha0
- **v1.0.2**: Updated app icon, enhanced about page, added disclaimer
- **v1.0.1**: Fixed Bilibili WBI signature for API calls
- **v1.0.0**: Initial release with basic audio playback

### Disclaimer

This application is a third-party Bilibili audio player developed for personal learning and communication purposes only. It does not involve any commercial use. All audio resources are obtained through Bilibili's public APIs. Please respect copyright and use responsibly.

### License

MIT License

---

### Download

Latest APK: [zy-player.apk](android/app/build/outputs/apk/debug/zy-player.apk)

### Developer

- **GitHub**: [luckjokerwang](https://github.com/luckjokerwang)
- **Project**: [zy-player](https://github.com/luckjokerwang/zy-player)

### Support

For issues or suggestions, please submit via GitHub Issues.
