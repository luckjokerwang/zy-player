import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '../components/Search';
import { MiniPlayer } from '../components/Player';
import { COLORS } from '../utils/constants';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const openPlayer = () => {
    navigation.navigate('Player');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SearchBar />
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

export default HomeScreen;
