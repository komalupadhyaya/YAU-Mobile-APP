import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';

export default function TabLayout() {
  const { user, loading } = useUser();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Navigation guard: only run after loading completes to prevent unmatched route errors
    if (loading) return;
    if (hasRedirected.current) return;
    
    if (!user || !user.students || user.students.length === 0) {
      if (__DEV__) {
        console.log('[TabLayout] No valid user data, redirecting to register');
      }
      hasRedirected.current = true;
      router.replace('/auth/register');
    }
  }, [user, loading, router]);

  if (loading) {
    return null; // Let root layout handle loading state
  }

  if (!user || !user.students || user.students.length === 0) {
    return null; // Redirecting to register
  }

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#1E3A8A',
      tabBarInactiveTintColor: '#6B7280',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 8,
        paddingBottom: 8 + insets.bottom,
        height: 60 + insets.bottom,
      },
      headerStyle: {
        backgroundColor: '#1E3A8A',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <MaterialIcons name="message" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <MaterialIcons name="event" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
