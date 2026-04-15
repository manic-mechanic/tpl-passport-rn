import { colors, dark } from '@/src/theme'
import { useTheme } from '@/src/hooks/useTheme'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs'
import { Tabs, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Polyline } from 'react-native-svg'

function CheckInIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Circle cx={12} cy={12} r={5.5} strokeDasharray="2.5,2" />
      <Polyline points="9.5,12 11,13.5 14.5,10" strokeWidth={2} />
    </Svg>
  )
}

function CheckInTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected
  const theme = useTheme()
  const isDark = theme === dark
  const orbColor = focused
    ? isDark ? '#8bbcfa' : '#4d8fd3'
    : theme.tplBlue

  return (
    <Pressable onPress={onPress} style={styles.checkInButton} accessibilityRole="button">
      <View style={[styles.checkInOrb, { backgroundColor: orbColor }]}>
        <CheckInIcon color="#fff" />
      </View>
      <Text style={[styles.checkInLabel, { color: focused ? '#ffffff' : 'rgba(255,255,255,0.4)' }]}>
        Check in
      </Text>
    </Pressable>
  )
}

export const unstable_settings = {
  initialRouteName: '(home)',
}

export default function TabLayout() {
  const theme = useTheme()
  const router = useRouter()

  // On cold launch (no incoming deep link), always land on home.
  // iOS Expo Go caches the last route in AsyncStorage across launches and
  // a simulator restart doesn't clear it, so initialRouteName alone isn't enough.
  useEffect(() => {
    if (Platform.OS === 'web') return
    Linking.getInitialURL().then(url => {
      if (!url?.startsWith('tplpassportrn://')) {
        router.navigate('/(tabs)/(home)')
      }
    })
  }, [])

  return (
    <Tabs
      initialRouteName="(home)"
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: { backgroundColor: theme.tplNavy, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 8 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(explore)"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(check-in)"
        options={{
          title: 'Check In',
          tabBarButton: (props) => <CheckInTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="(passport)"
        options={{
          title: 'Passport',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  checkInButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    gap: 4,
  },
  checkInOrb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
})
