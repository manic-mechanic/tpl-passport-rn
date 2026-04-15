import { Stack } from 'expo-router'

export default function ExploreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="branch/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="branches" options={{ headerShown: false }} />
      <Stack.Screen name="day-trip/[id]" options={{ headerShown: false }} />
    </Stack>
  )
}
