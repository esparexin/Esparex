import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList, ROUTES } from './routes';
import { MainTabs } from './MainTabs';
import { ListingDetailsScreen } from '../features/listings/presentation/screens/ListingDetailsScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();



export const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.MAIN_TABS} component={MainTabs} />
      <Stack.Screen 
        name={ROUTES.LISTING_DETAILS} 
        component={ListingDetailsScreen} 
        options={{ headerShown: true, title: 'Listing Details' }}
      />
    </Stack.Navigator>
  );
};
