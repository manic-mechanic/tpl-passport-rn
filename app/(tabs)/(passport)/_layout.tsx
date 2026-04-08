import { Stack } from 'expo-router'

export default function PassportLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="branch/[id]" options={{ headerShown: false }} />
    </Stack>
  )
}
