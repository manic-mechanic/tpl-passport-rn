import { createAuthClient } from 'better-auth/react'
import { expoClient } from '@better-auth/expo/client'
import * as SecureStore from 'expo-secure-store'

const BASE_URL = __DEV__
  ? 'https://dev.librarypassport.ca'
  : 'https://librarypassport.ca'

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  plugins: [
    expoClient({
      scheme: 'tplpassportrn',
      storagePrefix: 'tplpassport',
      storage: SecureStore,
    }),
  ],
})
