import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';
import { AdminPost, subscribeToMessages } from '../../src/services/messaging';

type MessageTab = 'team' | 'admin';

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MessageTab>('team');

  useEffect(() => {
    if (!user || !user.students || user.students.length === 0) {
      setLoading(false);
      return;
    }

    // Use student's grade for filtering (per confirmed backend schema)
    const userGrade = user.students[0]?.grade;
    
    const unsubscribe = subscribeToMessages([], user.sport, user.location, userGrade, (fetchedMessages: AdminPost[]) => {
      setMessages(fetchedMessages);
      setLoading(false);
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const filterMessages = (messages: AdminPost[], tab: MessageTab) => {
    if (tab === 'admin') {
      // Admin messages: global messages (no target fields OR all target fields are "all")
      return messages.filter(msg => {
        // No target fields at all → global message
        if (!msg.targetSport && !msg.targetAgeGroup && !msg.targetLocation) {
          return true;
        }
        // All target fields are "all" → global message
        const isAllGlobal = 
          (msg.targetSport === "all" || !msg.targetSport) &&
          (msg.targetLocation === "all" || !msg.targetLocation) &&
          (msg.targetAgeGroup === "all" || !msg.targetAgeGroup);
        return isAllGlobal;
      });
    } else {
      // Team messages: has at least one non-"all" target field
      return messages.filter(msg => {
        // No target fields → not a team message
        if (!msg.targetSport && !msg.targetAgeGroup && !msg.targetLocation) {
          return false;
        }
        // All target fields are "all" → not a team message (it's global)
        const isAllGlobal = 
          (msg.targetSport === "all" || !msg.targetSport) &&
          (msg.targetLocation === "all" || !msg.targetLocation) &&
          (msg.targetAgeGroup === "all" || !msg.targetAgeGroup);
        return !isAllGlobal;
      });
    }
  };

  const filteredMessages = filterMessages(messages, activeTab);

  const handleMessagePress = (message: AdminPost) => {
    router.push({
      pathname: '/messages/[id]' as any,
      params: { id: message.id, message: JSON.stringify(message) }
    });
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  const renderEmptyState = (tab: MessageTab) => {
    const message = tab === 'admin' 
      ? 'No admin notifications yet' 
      : 'No team messages yet';
    const subMessage = tab === 'admin'
      ? 'Check back later for updates'
      : 'Messages from your team will appear here';
    
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-gray-500 text-center text-lg">{message}</Text>
        <Text className="text-gray-400 text-center text-sm mt-2">{subMessage}</Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Tab Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-4">
        <View className="flex-row">
          <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-t-lg ${activeTab === 'team' ? 'bg-blue-500' : 'bg-gray-100'}`}
            onPress={() => setActiveTab('team')}
          >
            <Text className={`text-center font-semibold ${activeTab === 'team' ? 'text-white' : 'text-gray-600'}`}>
              Team Messages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-t-lg ${activeTab === 'admin' ? 'bg-blue-500' : 'bg-gray-100'}`}
            onPress={() => setActiveTab('admin')}
          >
            <Text className={`text-center font-semibold ${activeTab === 'admin' ? 'text-white' : 'text-gray-600'}`}>
              Admin Notifications
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredMessages.length === 0 ? (
        renderEmptyState(activeTab)
      ) : (
        <FlatList
          className="p-4"
          data={filteredMessages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-100"
              onPress={() => handleMessagePress(item)}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-3">
                  <Text className="text-lg font-bold text-gray-900 mb-1">{item.title || 'No title'}</Text>
                  <Text className="text-gray-700 text-sm mb-1" numberOfLines={2}>
                    {item.description || 'No description'}
                  </Text>
                </View>
                <View className={`px-2 py-1 rounded ${activeTab === 'admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                  <Text className={`text-xs font-semibold ${activeTab === 'admin' ? 'text-purple-600' : 'text-blue-600'}`}>
                    {activeTab === 'admin' ? 'Admin' : 'Team'}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xs mt-2">{formatTimestamp(item.timestamp)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
