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
    
    // If no user is logged in, send to login screen
    if (!user) {
      if (__DEV__) console.log('[TabLayout] No user, redirecting to login');
      hasRedirected.current = true;
      router.replace('/auth/login' as any);
      return;
    }

    // If user is a parent (default) but has no students, they might need to complete registration
    // However, if they are a coach, they don't have students.
    const isCoach = user.role === 'coach';
    const hasStudents = user.students && user.students.length > 0;

    if (!isCoach && !hasStudents) {
      if (__DEV__) console.log('[TabLayout] Parent with no students, redirecting to register');
      hasRedirected.current = true;
      router.replace('/auth/register' as any);
    }
  }, [user, loading, router]);

  if (loading) {
    return null; // Let root layout handle loading state
  }

  if (!user || (user.role !== 'coach' && (!user.students || user.students.length === 0))) {
    return null; // Redirecting in useEffect
  }

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#1565C0',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 6,
        paddingBottom: 6 + insets.bottom,
        height: 58 + insets.bottom,
      },
      headerShown: false,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="home" size={focused ? 28 : 26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="chat-bubble" size={focused ? 26 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="event" size={focused ? 26 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="person" size={focused ? 26 : 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

