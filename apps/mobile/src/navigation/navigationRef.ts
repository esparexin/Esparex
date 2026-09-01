import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from './routes';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.navigate(name as string, params));
  }
}
