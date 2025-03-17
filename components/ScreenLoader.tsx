import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoaderProps {
  loadingText?: string;
}

const ScreenLoader: React.FC<LoaderProps> = ({
  loadingText = 'loading...',
}: {
  loadingText?: string;
}) => {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loaderText}>{loadingText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%',
    height: '100%',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default ScreenLoader;
