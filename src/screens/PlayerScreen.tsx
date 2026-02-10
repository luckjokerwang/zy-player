import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FullPlayer } from '../components/Player';
import { COLORS } from '../utils/constants';

interface PlayerScreenProps {
  navigation: any;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="keyboard-arrow-down" size={32} color={COLORS.text} />
      </TouchableOpacity>
      <FullPlayer />
      <TouchableOpacity 
        style={styles.lyricButton} 
        onPress={() => navigation.navigate('Lyric')}
      >
        <Icon name="lyrics" size={24} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  lyricButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
});

export default PlayerScreen;
