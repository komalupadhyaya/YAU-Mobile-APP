import { router } from 'expo-router';
import { useEffect } from 'react';
import { useUser } from '../src/context/UserContext';

export default function IndexScreen() {
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/(tabs)/messages');
      } else {
        router.replace('/auth/login' as any);
      }
    }
  }, [user, loading]);

  return null;
}
