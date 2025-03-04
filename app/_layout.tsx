import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';

// SplashScreen.preventAutoHideAsync();
// SplashScreen.hideAsync();
export default function RootLayout() {
  return (
    <Stack>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="+not-found" />
  </Stack>
  )
}
