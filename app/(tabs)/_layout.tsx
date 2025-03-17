import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarShowLabel: false,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="chatListScreen"
        options={{
          // title: 'Chat',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={'#A08E67'} />,
        }}
      />
      <Tabs.Screen
        name="ContactScreen"
        options={{
          // title: 'Contacts',

          tabBarIcon: ({ color }) => <AntDesign name="contacts" size={28} color="#A08E67" />,
        }}
      />
      <Tabs.Screen
        name="GroupListScreen"
        options={{
          // title: 'Groups',
          tabBarIcon: ({ color }) => <MaterialIcons name="groups" size={32} color="#A08E67" />,
        }}
      />
      <Tabs.Screen
        name="AboutScreen"
        options={{
          // title: 'About',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person" color={'#A08E67'} />,
        }}
      />
    </Tabs>
  );
}
