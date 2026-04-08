import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { colors, dark } from '@/src/theme';
import { authClient } from '@/src/lib/auth-client';
import { usePassportStore } from '@/src/stores/passport';
import { migrateLocalPhotos } from '@/src/lib/upload';

WebBrowser.maybeCompleteAuthSession();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fraunces:        require('../assets/fonts/Fraunces.ttf'),
    Roboto:          require('../assets/fonts/Roboto-Regular.ttf'),
    RobotoCondensed: require('../assets/fonts/RobotoCondensed-Bold.ttf'),
    SpecialElite:    require('../assets/fonts/SpecialElite-Regular.ttf'),
    AllertaStencil:  require('../assets/fonts/AllertaStencil-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const navyBg = colorScheme === 'dark' ? dark.tplNavy : colors.tplNavy;
  const { data: session } = authClient.useSession();
  const checkIns = usePassportStore(s => s.checkIns);
  const setCheckInPhoto = usePassportStore(s => s.setCheckInPhoto);

  // When the user signs in, migrate any locally-stored photos to R2.
  useEffect(() => {
    if (!session?.user) return;
    migrateLocalPhotos(checkIns, setCheckInPhoto);
  }, [session?.user?.id]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: navyBg }}>
      <StatusBar style="light" />
      <BottomSheetModalProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
<Stack.Screen name="sign-in" options={{ presentation: 'modal', headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
