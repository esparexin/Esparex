import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList, ROUTES } from './routes';
import { AppIcon } from '@esparex/mobile-ui';
import { MarketplaceScreen } from '../features/listings/presentation/screens/MarketplaceScreen';
import { SearchScreen } from '../features/listings/presentation/screens/SearchScreen';
import { PostAdProvider } from '../features/postAd/PostAdProvider';
import { PostAdScreen } from '../features/postAd/presentation/PostAdScreen';
import { ChatNavigator } from './ChatNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { useUnreadNotificationsCount } from '../features/notifications/presentation/hooks/useNotifications';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ---------------------------------------------------------------------------
// PostAdTab — scoped provider mounts/unmounts with the tab so the draft
// is discarded when the user navigates away.
// ---------------------------------------------------------------------------
const PostAdTab = () => (
  <PostAdProvider>
    <PostAdScreen />
  </PostAdProvider>
);

// ---------------------------------------------------------------------------
// MainTabs — bottom tab bar.
//
// Tabs:
//   Home      → MarketplaceScreen
//   Search    → SearchScreen
//   Post Ad   → PostAdScreen (scoped PostAdProvider)
//   Chat      → ChatNavigator (list → thread nested stack)
//   Profile   → ProfileNavigator (overview → settings nested stack)
// ---------------------------------------------------------------------------

export const MainTabs = () => {
  // Drives the unread-count badge on the Chat tab.
  const unreadCount = useUnreadNotificationsCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#020617', // slate-950
          borderTopColor: '#1e293b',  // slate-800
        },
        tabBarActiveTintColor: '#0ea5e9',   // sky-500
        tabBarInactiveTintColor: '#64748b', // slate-500
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof AppIcon>['name'] = 'Home';

          if (route.name === ROUTES.HOME_TAB)    iconName = 'Home';
          else if (route.name === ROUTES.SEARCH_TAB)  iconName = 'Search';
          else if (route.name === ROUTES.POST_AD_TAB) iconName = 'PlusCircle';
          else if (route.name === ROUTES.CHAT_TAB)    iconName = 'MessageCircle';
          else if (route.name === ROUTES.PROFILE_TAB) iconName = 'User';

          return <AppIcon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name={ROUTES.HOME_TAB}
        component={MarketplaceScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name={ROUTES.SEARCH_TAB}
        component={SearchScreen}
        options={{ title: 'Search' }}
      />
      <Tab.Screen
        name={ROUTES.POST_AD_TAB}
        component={PostAdTab}
        options={{ title: 'Post Ad' }}
      />
      <Tab.Screen
        name={ROUTES.CHAT_TAB}
        component={ChatNavigator}
        options={{
          title: 'Chat',
          // Show a badge when there are unread notifications
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ef4444', color: '#ffffff', fontSize: 10 },
        }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE_TAB}
        component={ProfileNavigator}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};
