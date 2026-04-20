import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';

export default function ProfileScreen() {
  const { user, loading, clearUser } = useUser();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    await clearUser();
    router.replace('/auth/register');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (!user || !user.students || user.students.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 p-6 items-center justify-center">
        <MaterialIcons name="person-off" size={64} color="#9CA3AF" />
        <Text className="text-gray-700 text-lg font-semibold mt-4 mb-2">Profile incomplete</Text>
        <Text className="text-gray-500 text-center text-sm mb-6">
          Please complete your registration to access all features
        </Text>
        <TouchableOpacity 
          className="bg-blue-900 px-6 py-3 rounded-lg"
          onPress={() => router.replace('/auth/register')}
        >
          <Text className="text-white font-semibold">Complete Registration</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-6 items-center" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4 mt-6">
        <MaterialIcons name="person" size={48} color="#1E3A8A" />
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">
        {user?.firstName || 'N/A'} {user?.lastName || ''}
      </Text>
      <Text className="text-gray-500 mb-2">{user?.email || 'No email'}</Text>
      <Text className="text-gray-500 mb-8">
        {user?.students?.length || 0} {user?.students?.length === 1 ? 'child' : 'children'} registered
      </Text>

      <View className="w-full bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 mb-6">
        <Text className="text-gray-900 font-semibold p-4 border-b border-gray-100">Children</Text>
        {user?.students?.map((student, index) => (
          <View key={index} className="p-4 border-b border-gray-100">
            <Text className="text-gray-900 font-medium">
              {student?.firstName || 'N/A'} {student?.lastName || ''}
            </Text>
            <Text className="text-gray-500 text-sm">
              {student?.grade || 'Not assigned'} • {student?.sport || 'Not selected'}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              {student?.school_name || 'Not assigned'}
            </Text>
          </View>
        ))}
      </View>

      <View className="w-full bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
        <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100">
          <View className="flex-row items-center">
            <MaterialIcons name="settings" size={24} color="#6B7280" />
            <Text className="text-gray-900 text-base font-medium ml-3">Settings</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity className="flex-row items-center justify-between p-4" onPress={handleSignOut}>
          <View className="flex-row items-center">
            <MaterialIcons name="logout" size={24} color="#EF4444" />
            <Text className="text-red-500 text-base font-medium ml-3">Sign Out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
