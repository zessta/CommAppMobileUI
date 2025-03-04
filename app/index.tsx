import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import LoginScreen from "./LoginScreen";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <LoginScreen />
    </View>
  );
}
