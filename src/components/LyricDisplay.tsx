import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePlayer } from '../contexts/PlayerContext';
import {
  searchLyricOptions,
  fetchLyric,
  extractSongName,
} from '../api/bilibili';
import { storageManager } from '../storage/StorageManager';
import { LyricOption } from '../utils/types';
import { COLORS } from '../utils/constants';

const { height: screenHeight } = Dimensions.get('window');

interface LyricLine {
  time: number;
  text: string;
}

const parseLrc = (lrcString: string): LyricLine[] => {
  const lines = lrcString.split('\n');
  const result: LyricLine[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = match[4].trim();
      if (text) {
        result.push({ time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
};

export const LyricDisplay: React.FC = () => {
  const { currentSong, position } = usePlayer();
  const [lyric, setLyric] = useState<string>('');
  const [lyricLines, setLyricLines] = useState<LyricLine[]>([]);
  const [lyricOffset, setLyricOffset] = useState<number>(0);
  const [lyricOptions, setLyricOptions] = useState<LyricOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<LyricOption | null>(
    null,
  );
  const [searchKey, setSearchKey] = useState<string>('');
  const [showOptions, setShowOptions] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);

  const selectLyricOption = useCallback(
    async (option: LyricOption) => {
      setSelectedOption(option);
      setShowOptions(false);

      const lrc = await fetchLyric(option.songMid);
      setLyric(lrc);

      if (currentSong) {
        await storageManager.setLyricDetail(currentSong.id, {
          songMid: option.songMid,
          label: option.label,
        });
      }
    },
    [currentSong],
  );

  const searchForLyric = useCallback(
    async (key: string) => {
      if (!key) return;

      const options = await searchLyricOptions(key);
      setLyricOptions(options);

      if (options.length > 0) {
        await selectLyricOption(options[0]);
      } else {
        setLyric('[00:00.000] 无法找到歌词，请手动搜索');
      }
    },
    [selectLyricOption],
  );

  const loadLyric = useCallback(async () => {
    if (!currentSong) return;

    const detail = await storageManager.getLyricDetail(currentSong.id);

    if (detail) {
      setLyricOffset(detail.lrcOffset);
      const lrc = await fetchLyric(detail.lrc.songMid);
      setLyric(lrc);
      setSelectedOption(detail.lrc as LyricOption);
    } else {
      const songName = extractSongName(currentSong.name, currentSong.singer);
      setSearchKey(songName);
      await searchForLyric(songName);
    }
  }, [currentSong, searchForLyric]);

  useEffect(() => {
    if (currentSong) {
      loadLyric();
    }
  }, [currentSong, loadLyric]);

  useEffect(() => {
    setLyricLines(parseLrc(lyric));
  }, [lyric]);

  // Intentionally exclude 'currentLineIndex' from dependencies to avoid infinite loops.
  // 'currentLineIndex' is updated inside this effect, so including it would cause re-runs.
  useEffect(() => {
    if (lyricLines.length === 0) return;

    const adjustedPosition = position + lyricOffset / 1000;
    let index = lyricLines.findIndex((line, i) => {
      const nextLine = lyricLines[i + 1];
      return (
        line.time <= adjustedPosition &&
        (!nextLine || nextLine.time > adjustedPosition)
      );
    });

    if (index !== currentLineIndex && index >= 0) {
      setCurrentLineIndex(index);
      scrollViewRef.current?.scrollTo({
        y: index * 40 - screenHeight / 4,
        animated: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, lyricLines, lyricOffset]);

  const handleOffsetChange = async (offset: number) => {
    setLyricOffset(offset);
    if (currentSong) {
      await storageManager.setLyricOffset(currentSong.id, offset);
    }
  };

  const handleSearch = async () => {
    await searchForLyric(searchKey);
    setShowOptions(true);
  };

  if (!currentSong) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>暂无播放歌曲</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: currentSong.cover }} style={styles.cover} />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="歌词搜索"
          placeholderTextColor={COLORS.textSecondary}
          value={searchKey}
          onChangeText={setSearchKey}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
          <Icon name="search" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.offsetContainer}>
        <Text style={styles.offsetLabel}>歌词偏移 (ms)</Text>
        <View style={styles.offsetControls}>
          <TouchableOpacity
            onPress={() => handleOffsetChange(lyricOffset - 500)}
            style={styles.offsetBtn}
          >
            <Icon name="remove" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.offsetValue}>{lyricOffset}</Text>
          <TouchableOpacity
            onPress={() => handleOffsetChange(lyricOffset + 500)}
            style={styles.offsetBtn}
          >
            <Icon name="add" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {showOptions && lyricOptions.length > 0 && (
        <View style={styles.optionsContainer}>
          <FlatList
            data={lyricOptions}
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  selectedOption?.key === item.key && styles.selectedOption,
                ]}
                onPress={() => selectLyricOption(item)}
              >
                <Text style={styles.optionText} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.optionsList}
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.toggleOptionsBtn}
        onPress={() => setShowOptions(!showOptions)}
      >
        <Text style={styles.toggleOptionsText}>
          {showOptions ? '收起选项' : '选择歌词'}
        </Text>
        <Icon
          name={showOptions ? 'expand-less' : 'expand-more'}
          size={20}
          color={COLORS.primary}
        />
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        style={styles.lyricScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.lyricPadding} />
        {lyricLines.map((line, index) => (
          <Text
            key={`${line.time}-${index}`}
            style={[
              styles.lyricLine,
              index === currentLineIndex && styles.activeLine,
            ]}
          >
            {line.text}
          </Text>
        ))}
        <View style={styles.lyricPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  cover: {
    width: 120,
    height: 120,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: COLORS.text,
    fontSize: 14,
  },
  searchBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginLeft: 8,
  },
  offsetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  offsetLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  offsetControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offsetBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
  },
  offsetValue: {
    color: COLORS.text,
    fontSize: 14,
    width: 60,
    textAlign: 'center',
  },
  optionsContainer: {
    maxHeight: 150,
    marginBottom: 12,
  },
  optionsList: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  optionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surfaceLight,
  },
  selectedOption: {
    backgroundColor: COLORS.surfaceLight,
  },
  optionText: {
    color: COLORS.text,
    fontSize: 14,
  },
  toggleOptionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  toggleOptionsText: {
    color: COLORS.primary,
    fontSize: 14,
    marginRight: 4,
  },
  lyricScroll: {
    flex: 1,
  },
  lyricPadding: {
    height: screenHeight / 4,
  },
  lyricLine: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 10,
    lineHeight: 24,
  },
  activeLine: {
    color: COLORS.primaryLight,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LyricDisplay;
