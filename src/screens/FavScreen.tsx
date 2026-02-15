import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FavListManager } from '../components/FavList';
import { MiniPlayer } from '../components/Player';
import { COLORS } from '../utils/constants';

interface FavScreenProps {
  navigation: any;
}

export const FavScreen: React.FC<FavScreenProps> = ({ navigation }) => {
  const openPlayer = () => {
    navigation.navigate('Player');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FavListManager />
      <MiniPlayer onPress={openPlayer} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default FavScreen;
