import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePlayer } from '../contexts/PlayerContext';
import { COLORS, PLAY_MODES, PlayMode } from '../utils/constants';

const { width: screenWidth } = Dimensions.get('window');

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getPlayModeIcon = (mode: PlayMode): string => {
  switch (mode) {
    case PLAY_MODES.SINGLE_LOOP:
      return 'repeat-one';
    case PLAY_MODES.LIST_LOOP:
      return 'repeat';
    case PLAY_MODES.SHUFFLE:
      return 'shuffle';
    default:
      return 'format-list-numbered';
  }
};

const getNextPlayMode = (current: PlayMode): PlayMode => {
  const modes = [PLAY_MODES.ORDER, PLAY_MODES.LIST_LOOP, PLAY_MODES.SINGLE_LOOP, PLAY_MODES.SHUFFLE];
  const currentIndex = modes.indexOf(current);
  return modes[(currentIndex + 1) % modes.length];
};

interface MiniPlayerProps {
  onPress: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress }) => {
  const { currentSong, isPlaying, togglePlayPause, skipNext, skipPrevious, position, duration } = usePlayer();

  if (!currentSong) return null;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <TouchableOpacity style={styles.miniContainer} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      <Image source={{ uri: currentSong.cover }} style={styles.miniCover} />
      <View style={styles.miniInfo}>
        <Text style={styles.miniTitle} numberOfLines={1}>{currentSong.name}</Text>
        <Text style={styles.miniArtist} numberOfLines={1}>{currentSong.singer}</Text>
      </View>
      <TouchableOpacity onPress={skipPrevious} style={styles.miniButton}>
        <Icon name="skip-previous" size={28} color={COLORS.text} />
      </TouchableOpacity>
      <TouchableOpacity onPress={togglePlayPause} style={styles.miniButton}>
        <Icon name={isPlaying ? 'pause' : 'play-arrow'} size={32} color={COLORS.text} />
      </TouchableOpacity>
      <TouchableOpacity onPress={skipNext} style={styles.miniButton}>
        <Icon name="skip-next" size={28} color={COLORS.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export const FullPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    playMode,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seekTo,
    setPlayMode,
  } = usePlayer();

  if (!currentSong) {
    return (
      <View style={styles.fullContainer}>
        <Text style={styles.emptyText}>暂无播放歌曲</Text>
      </View>
    );
  }

  const handlePlayModeChange = () => {
    setPlayMode(getNextPlayMode(playMode));
  };

  return (
    <View style={styles.fullContainer}>
      <Image source={{ uri: currentSong.cover }} style={styles.fullCover} />
      
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={2}>{currentSong.name}</Text>
        <Text style={styles.songArtist}>{currentSong.singer}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={position}
          onSlidingComplete={seekTo}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor={COLORS.surfaceLight}
          thumbTintColor={COLORS.primary}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={handlePlayModeChange} style={styles.controlButton}>
          <Icon name={getPlayModeIcon(playMode)} size={28} color={COLORS.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={skipPrevious} style={styles.controlButton}>
          <Icon name="skip-previous" size={40} color={COLORS.text} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
          <Icon name={isPlaying ? 'pause' : 'play-arrow'} size={48} color={COLORS.background} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={skipNext} style={styles.controlButton}>
          <Icon name="skip-next" size={40} color={COLORS.text} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <Icon name="queue-music" size={28} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    backgroundColor: COLORS.primary,
  },
  miniCover: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  miniInfo: {
    flex: 1,
    marginLeft: 12,
  },
  miniTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  miniArtist: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  miniButton: {
    padding: 8,
  },
  fullContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  fullCover: {
    width: screenWidth - 80,
    height: screenWidth - 80,
    borderRadius: 12,
    marginBottom: 32,
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  songTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  songArtist: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 8,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
});

export default FullPlayer;
