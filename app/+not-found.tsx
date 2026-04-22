import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-gray-50 items-center justify-center p-6" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Text className="text-gray-900 text-2xl font-bold mb-2">Page Not Found</Text>
      <Text className="text-gray-500 text-center mb-6">
        The page you&apos;re looking for doesn&apos;t exist.
      </Text>
      <TouchableOpacity
        className="bg-blue-900 px-6 py-3 rounded-lg"
        onPress={() => router.replace('/(tabs)/messages')}
      >
        <Text className="text-white font-semibold">Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}
