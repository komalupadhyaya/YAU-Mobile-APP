import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
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
import { AdminPost, subscribeToMessages, markMessageAsRead } from '../../src/services/messaging';

type MessageTab = 'all' | 'admin' | 'coaches';

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MessageTab>('all');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const unsub = subscribeToMessages([], '', '', '', (fetched: AdminPost[]) => {
      setMessages(fetched);
      setLoading(false);
    });
    return () => { if (unsub) unsub(); };
  }, [user]);

  const handleOpenMessage = (msg: AdminPost) => {
    if (user?.id && (!msg.readBy || !msg.readBy.includes(user.id))) {
      markMessageAsRead(msg.id, user.id);
    }
    router.push({ pathname: '/messages/[id]' as any, params: { id: msg.id, message: JSON.stringify(msg) } });
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (diff < 7 * oneDay) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredMessages = messages.filter(m => {
    if (activeTab === 'all') return true;
    if (activeTab === 'admin') return m.role === 'admin';
    if (activeTab === 'coaches') return m.role === 'coach';
    return true;
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#001A3D', '#002C61']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Image source={require('../../assets/images/logo1.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <Text style={styles.headerSubtitle}>Stay up to date with important updates from your coaches and YAU</Text>

        <View style={styles.tabsRow}>
          {[
            { id: 'all', label: 'All Messages' },
            { id: 'admin', label: 'From Admin' },
            { id: 'coaches', label: 'From Coaches' }
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, activeTab === t.id && styles.tabActive]}
              onPress={() => setActiveTab(t.id as any)}
            >
              <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#002C61" /></View>
      ) : (
        <FlatList
          data={filteredMessages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="mail-outline" size={60} color="#E5E7EB" />
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isRead = item.readBy?.includes(user?.id || '');
            const isCoach = item.role === 'coach';

            return (
              <TouchableOpacity style={styles.messageItem} onPress={() => handleOpenMessage(item)}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarBg}>
                    <Image source={require('../../assets/images/logo1.png')} style={styles.avatarLogo} resizeMode="contain" />
                  </View>
                </View>

                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <View style={[styles.roleTag, isCoach ? styles.coachTag : styles.adminTag]}>
                      <Text style={[styles.roleTagText, isCoach ? styles.coachTagText : styles.adminTagText]}>
                        {item.role?.toUpperCase() || 'ADMIN'}
                      </Text>
                    </View>
                    <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
                  </View>

                  <View style={styles.titleRow}>
                    <Text style={styles.messageTitle} numberOfLines={1}>{item.title}</Text>
                    {!isRead && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>9</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.messagePreview} numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingBottom: 0 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 10 },
  logo: { width: 32, height: 32 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, paddingHorizontal: 20, marginBottom: 20, lineHeight: 18 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 10 },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'
  },
  tabActive: { borderBottomColor: '#E31B23' },
  tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#FFF' },
  listContent: { paddingBottom: 100 },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center'
  },
  avatarContainer: { marginRight: 16 },
  avatarBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarLogo: { width: 24, height: 24 },
  messageContent: { flex: 1 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1
  },
  adminTag: { borderColor: '#0047AB', backgroundColor: '#EFF6FF' },
  coachTag: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  roleTagText: { fontSize: 10, fontWeight: '800' },
  adminTagText: { color: '#0047AB' },
  coachTagText: { color: '#10B981' },
  messageTime: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  messageTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', flex: 1, marginRight: 10 },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E31B23',
    alignItems: 'center',
    justifyContent: 'center'
  },
  unreadCount: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  messagePreview: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  loading: { flex: 1, justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#94A3B8', fontSize: 15, fontWeight: '700', marginTop: 15 },
});
