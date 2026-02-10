import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Song } from '../utils/types';
import { COLORS } from '../utils/constants';

interface SongItemProps {
  song: Song;
  onPlay: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  onAddToFav?: (song: Song) => void;
  onDelete?: (song: Song) => void;
  showIndex?: number;
  isActive?: boolean;
}

export const SongItem: React.FC<SongItemProps> = ({
  song,
  onPlay,
  onAddToQueue,
  onAddToFav,
  onDelete,
  showIndex,
  isActive,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={() => onPlay(song)}
      activeOpacity={0.7}
    >
      {showIndex !== undefined && (
        <Text style={[styles.index, isActive && styles.activeText]}>
          {showIndex + 1}
        </Text>
      )}
      
      <Image source={{ uri: song.cover }} style={styles.cover} />
      
      <View style={styles.info}>
        <Text
          style={[styles.name, isActive && styles.activeText]}
          numberOfLines={1}
        >
          {song.name}
        </Text>
        <Text style={styles.singer} numberOfLines={1}>
          {song.singer}
        </Text>
      </View>

      <View style={styles.actions}>
        {onAddToQueue && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onAddToQueue(song)}
          >
            <Icon name="add" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
        
        {onAddToFav && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onAddToFav(song)}
          >
            <Icon name="playlist-add" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
        
        {onDelete && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete(song)}
          >
            <Icon name="delete-outline" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surfaceLight,
  },
  activeContainer: {
    backgroundColor: COLORS.surface,
  },
  index: {
    width: 28,
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  cover: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceLight,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  activeText: {
    color: COLORS.primary,
  },
  singer: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
});

export default SongItem;
