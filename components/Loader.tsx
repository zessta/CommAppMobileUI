import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoaderProps {
  loadingText?: string; // Optional prop to customize the loading text
}

const Loader: React.FC<LoaderProps> = ({ loadingText = 'Loading...' }) => {
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
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
});

export default Loader;
