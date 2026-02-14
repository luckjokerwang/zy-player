# 子云音播 (Ziyun Player)

[English](#english) | [中文](#中文)

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
├── api/           # Bilibili API integration
├── components/    # Reusable UI components
├── contexts/      # React Context providers
├── screens/       # App screens
├── services/      # Business logic services
├── storage/       # Data storage management
└── utils/         # Utility functions
```

### Development

#### Key Files
- `src/api/bilibili.ts` - Bilibili API integration with WBI signature
- `src/utils/wbi.ts` - WBI signature implementation
- `src/screens/` - Application screens
- `src/components/` - UI components

#### Recent Updates
- **v1.0.2**: Updated app icon, enhanced about page, added disclaimer
- **v1.0.1**: Fixed Bilibili WBI signature for API calls
- **v1.0.0**: Initial release with basic audio playback

### Disclaimer

This application is a third-party Bilibili audio player developed for personal learning and communication purposes only. It does not involve any commercial use. All audio resources are obtained through Bilibili's public APIs. Please respect copyright and use responsibly.

### License

MIT License

---

<a id="中文"></a>
## 中文

### 子云音播 - B站第三方音频播放器

基于 React Native 和 TypeScript 开发的 B站第三方音频播放器。

### 功能特性

- 🎵 **音频播放**: 播放B站音频内容
- 📱 **跨平台支持**: Android支持（iOS即将推出）
- 🔍 **多种搜索**: 支持BV号、收藏夹ID、合集搜索
- 💾 **数据管理**: 导出/导入歌单数据
- 🎨 **现代界面**: 简洁直观的用户界面
- 🔄 **WBI签名**: 修复B站WBI签名，确保API调用正常

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
- **BV号**: 视频BV号 (如 `BV1wr4y1v7TA`)
- **收藏夹ID**: 公开收藏夹ID (如 `1793186881`)
- **合集**: 完整URL
  - Collection: `channel/collectiondetail?sid=xxx`
  - Series: `channel/seriesdetail?sid=xxx`

#### 数据管理
- 将歌单数据导出为JSON文件
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
├── api/           # B站API集成
├── components/    # 可复用UI组件
├── contexts/      # React Context提供者
├── screens/       # 应用页面
├── services/      # 业务逻辑服务
├── storage/       # 数据存储管理
└── utils/         # 工具函数
```

### 开发信息

#### 关键文件
- `src/api/bilibili.ts` - B站API集成，包含WBI签名
- `src/utils/wbi.ts` - WBI签名实现
- `src/screens/` - 应用页面
- `src/components/` - UI组件

#### 近期更新
- **v1.0.2**: 更新应用图标，增强关于页面，添加免责声明
- **v1.0.1**: 修复B站WBI签名，解决API调用问题
- **v1.0.0**: 初始版本，包含基础音频播放功能

### 免责声明

本应用为第三方B站音频播放器，仅用于个人学习和交流目的，不涉及任何商业用途。音频资源来自Bilibili公开API，请尊重版权，合理使用。

### 许可证

MIT 许可证

---

### 下载

最新版本 APK: [zy-player.apk](android/app/build/outputs/apk/debug/zy-player.apk)

### 开发者

- **GitHub**: [luckjokerwang](https://github.com/luckjokerwang)
- **项目地址**: [zy-player](https://github.com/luckjokerwang/zy-player)

### 技术支持

如有问题或建议，请通过GitHub Issues提交。
