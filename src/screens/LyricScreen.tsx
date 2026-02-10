import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LyricDisplay } from '../components/LyricDisplay';
import { COLORS } from '../utils/constants';

interface LyricScreenProps {
  navigation: any;
}

export const LyricScreen: React.FC<LyricScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <LyricDisplay />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: 16,
  },
});

export default LyricScreen;
