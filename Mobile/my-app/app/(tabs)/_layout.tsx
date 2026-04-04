import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: 'Analyze Call',
          tabBarIcon: ({ color }) => <Ionicons size={26} name="cloud-upload-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      {/* Sidebar-navigated screens — hidden from tab bar */}
      <Tabs.Screen
        name="calls"
        options={{ href: null, title: 'All Calls' }}
      />
      <Tabs.Screen
        name="insights"
        options={{ href: null, title: 'Insights' }}
      />
      <Tabs.Screen
        name="top-deals"
        options={{ href: null, title: 'Top Deals' }}
      />
      <Tabs.Screen
        name="high-risk"
        options={{ href: null, title: 'High Risk' }}
      />
      <Tabs.Screen
        name="employees"
        options={{ href: null, title: 'Employees' }}
      />
      <Tabs.Screen
        name="products"
        options={{ href: null, title: 'Products' }}
      />
      <Tabs.Screen
        name="call-detail"
        options={{ href: null, title: 'Call Detail', tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}
