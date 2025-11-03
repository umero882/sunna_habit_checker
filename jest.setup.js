// Polyfill for structuredClone (needed for Jest in Node < 17)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Mock Expo's winter runtime globals
global.__ExpoImportMetaRegistry = {
  resolve: jest.fn((name) => undefined),
  register: jest.fn(),
};

// Mock require.resolve for Expo modules
const originalResolve = require.resolve;
require.resolve = function (id, options) {
  if (id.includes('expo')) {
    return id;
  }
  return originalResolve(id, options);
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  Feather: 'Feather',
}));

// Mock expo-localization
jest.mock('expo-localization', () => ({
  locale: 'en-US',
  locales: ['en-US'],
  timezone: 'America/New_York',
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  AndroidImportance: {
    MAX: 5,
    HIGH: 4,
    DEFAULT: 3,
    LOW: 2,
    MIN: 1,
  },
}));

// Mock Expo AppRegistry
jest.mock('expo', () => ({
  registerRootComponent: jest.fn(),
  AppRegistry: {
    registerComponent: jest.fn(),
    getAppKeys: jest.fn(() => []),
  },
}));

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  cacheDirectory: 'file:///mock/cache/',
  Paths: {
    document: 'file:///mock/documents/',
    cache: 'file:///mock/cache/',
  },
  File: jest.fn().mockImplementation((path, name) => ({
    uri: `${path}${name}`,
    write: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    size: Promise.resolve(1000),
  })),
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execAsync: jest.fn().mockResolvedValue([]),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn().mockResolvedValue(undefined),
      localUri: 'file:///mock/asset.db',
    })),
  },
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const MockIcon = () => React.createElement('View', null, 'Icon');
  return new Proxy(
    {},
    {
      get: () => MockIcon,
    }
  );
});

// Mock React Query
jest.mock('@tanstack/react-query', () => {
  const actualReactQuery = jest.requireActual('@tanstack/react-query');
  return {
    ...actualReactQuery,
    useQuery: jest.fn((options) => ({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    })),
    useMutation: jest.fn(() => ({
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isLoading: false,
      isError: false,
      error: null,
    })),
  };
});

// Mock react-native AppRegistry and other problematic modules
jest.mock('react-native/Libraries/ReactNative/AppRegistry', () => ({
  registerComponent: jest.fn(),
  getAppKeys: jest.fn(() => []),
  unmountApplicationComponentAtRootTag: jest.fn(),
  registerRunnable: jest.fn(),
  registerSection: jest.fn(),
  registerHeadlessTask: jest.fn(),
  startHeadlessTask: jest.fn(),
}));
