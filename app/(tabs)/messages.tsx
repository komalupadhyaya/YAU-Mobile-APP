import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';
import { AdminPost, subscribeToMessages } from '../../src/services/messaging';

type MessageTab = 'team' | 'admin';

const SPORT_ICONS: Record<string, string> = {
  soccer: '⚽',
  basketball: '🏀',
  football: '🏈',
  cheer: '📣',
  volleyball: '🏐',
};

function getSportIcon(name: string) {
  const key = name?.toLowerCase() || '';
  for (const s of Object.keys(SPORT_ICONS)) {
    if (key.includes(s)) return SPORT_ICONS[s];
  }
  return '📢';
}

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

    const userGradeBand = user.students[0]?.grade_band;
    const unsubscribe = subscribeToMessages([], user.sport, user.location, userGradeBand, (fetchedMessages: AdminPost[]) => {
      setMessages(fetchedMessages);
      setLoading(false);
    });

    return () => { if (unsubscribe) unsubscribe(); };
  }, [user]);

  const filterMessages = (msgs: AdminPost[], tab: MessageTab) => {
    if (tab === 'admin') {
      return msgs.filter(msg => {
        if (!msg.targetSport && !msg.targetAgeGroup && !msg.targetLocation) return true;
        return (
          (msg.targetSport === 'all' || !msg.targetSport) &&
          (msg.targetLocation === 'all' || !msg.targetLocation) &&
          (msg.targetAgeGroup === 'all' || !msg.targetAgeGroup)
        );
      });
    }
    return msgs.filter(msg => {
      if (!msg.targetSport && !msg.targetAgeGroup && !msg.targetLocation) return false;
      return !(
        (msg.targetSport === 'all' || !msg.targetSport) &&
        (msg.targetLocation === 'all' || !msg.targetLocation) &&
        (msg.targetAgeGroup === 'all' || !msg.targetAgeGroup)
      );
    });
  };

  const filteredMessages = filterMessages(messages, activeTab);
  const teamMessages = filterMessages(messages, 'team');
  const unreadCount = teamMessages.length;

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
    if (diffDays === 1) return 'Yesterday';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (diffDays < 7) return days[date.getDay()];
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* Blue header */}
      <LinearGradient
        colors={['#1565C0', '#1976D2', '#42A5F5']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logoIcon} resizeMode="contain" />
          <Text style={styles.logoText}>YAU SPORTS</Text>
        </View>
        <Text style={styles.headerTitle}>Messages</Text>
      </LinearGradient>

      {/* Wave divider */}
      <View style={styles.wave} />

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'admin' && styles.tabActive]}
          onPress={() => setActiveTab('admin')}
        >
          <Text style={[styles.tabText, activeTab === 'admin' && styles.tabTextActive]}>
            📢 Announcements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'team' && styles.tabActive]}
          onPress={() => setActiveTab('team')}
        >
          <Text style={[styles.tabText, activeTab === 'team' && styles.tabTextActive]}>
            💬 Group Messages
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Admin announcements top card */}
      {activeTab === 'admin' && filteredMessages.length > 0 && (
        <TouchableOpacity
          style={styles.announcementCard}
          onPress={() => router.push({ pathname: '/messages/[id]' as any, params: { id: filteredMessages[0].id, message: JSON.stringify(filteredMessages[0]) } })}
        >
          <View style={styles.announcementInner}>
            <Text style={styles.announcementEmoji}>📢</Text>
            <View style={styles.announcementBody}>
              <Text style={styles.announcementTitle} numberOfLines={1}>{filteredMessages[0].title}</Text>
              <Text style={styles.announcementDesc} numberOfLines={2}>{filteredMessages[0].description}</Text>
              <Text style={styles.announcementTime}>{formatTimestamp(filteredMessages[0].timestamp)}</Text>
            </View>
            <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
          </View>
        </TouchableOpacity>
      )}

      <FlatList
        style={styles.list}
        data={activeTab === 'admin' ? filteredMessages.slice(1) : filteredMessages}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingTop: 4 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>{activeTab === 'admin' ? '📢' : '💬'}</Text>
            <Text style={styles.emptyText}>{activeTab === 'admin' ? 'No announcements yet' : 'No team messages yet'}</Text>
            <Text style={styles.emptySubtext}>Check back for updates from your team</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.messageCard}
            onPress={() => router.push({ pathname: '/messages/[id]' as any, params: { id: item.id, message: JSON.stringify(item) } })}
            activeOpacity={0.8}
          >
            <Text style={styles.messageEmoji}>{getSportIcon(item.targetSport || '')}</Text>
            <View style={styles.messageContent}>
              <View style={styles.messageTopRow}>
                <Text style={styles.messageTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.messageTime}>{formatTimestamp(item.timestamp)}</Text>
              </View>
              <Text style={styles.messageFrom}>YAU Admins</Text>
              <Text style={styles.messagePreview} numberOfLines={2}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F0F4FF' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4FF' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 44,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    alignSelf: 'center',
  },
  logoIcon: { width: 36, height: 36, borderRadius: 6 },
  logoText: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  wave: {
    height: 32,
    backgroundColor: '#F0F4FF',
    marginTop: -32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#1565C0',
  },
  tabText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#FFFFFF' },
  badge: {
    backgroundColor: '#E65100',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  announcementCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFF8E7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD580',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  announcementInner: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'flex-start',
    gap: 12,
  },
  announcementEmoji: { fontSize: 28 },
  announcementBody: { flex: 1 },
  announcementTitle: { fontWeight: '700', fontSize: 14, color: '#111827', marginBottom: 2 },
  announcementDesc: { fontSize: 12, color: '#4B5563', lineHeight: 18 },
  announcementTime: { fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  newBadge: { backgroundColor: '#E65100', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6 },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  list: { flex: 1 },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  messageEmoji: { fontSize: 34, marginTop: 2 },
  messageContent: { flex: 1 },
  messageTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  messageTitle: { fontWeight: '700', fontSize: 14, color: '#111827', flex: 1, marginRight: 8 },
  messageTime: { fontSize: 11, color: '#9CA3AF' },
  messageFrom: { fontSize: 11, color: '#6B7280', marginTop: 1, marginBottom: 4 },
  messagePreview: { fontSize: 12, color: '#4B5563', lineHeight: 18 },
  emptyContainer: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
