import * as Location from 'expo-location'

/** Requests foreground location permission and returns coords, or null if denied. */
export async function requestLocation(): Promise<{ latitude: number; longitude: number } | null> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') return null
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
  return pos.coords
}
