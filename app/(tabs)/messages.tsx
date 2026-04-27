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

type MessageTab = 'alerts' | 'personal';

function getInitials(title: string) {
  return title.slice(0, 2).toUpperCase();
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MessageTab>('alerts');

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#001A3D', '#002C61']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerTitle}>COMMUNICATION CENTER</Text>
        </View>

        <View style={styles.tabsRow}>
          {['alerts', 'personal'].map((t) => (
            <TouchableOpacity 
              key={t}
              style={[styles.tab, activeTab === t && styles.tabActive]} 
              onPress={() => setActiveTab(t as any)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#002C61" /></View>
      ) : (
        <FlatList
          data={messages}
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
            return (
              <TouchableOpacity style={[styles.card, !isRead && styles.unreadCard]} onPress={() => handleOpenMessage(item)}>
                <View style={styles.avatarRow}>
                  <View style={[styles.avatar, { backgroundColor: isRead ? '#F1F5F9' : '#002C61' }]}>
                    <Text style={[styles.avatarText, !isRead && { color: '#FFF' }]}>{getInitials(item.title)}</Text>
                  </View>
                  {!isRead && <View style={styles.unreadTag} />}
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.row}>
                    <Text style={[styles.msgTitle, !isRead && styles.boldText]} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
                  </View>
                  <Text style={styles.preview} numberOfLines={2}>{item.description}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
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
  header: { paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  logo: { width: 32, height: 32 },
  headerTitle: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabActive: { backgroundColor: '#E31B23' },
  tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: '#FFF' },
  listContent: { padding: 20, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 12, borderWidth: 1.5, borderColor: '#F3F4F6' },
  unreadCard: { borderColor: '#E31B23', borderLeftWidth: 4 },
  avatarRow: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '900', color: '#6B7280' },
  unreadTag: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E31B23', borderWidth: 1.5, borderColor: '#FFF' },
  cardContent: { flex: 1, paddingHorizontal: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  msgTitle: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 10 },
  boldText: { fontWeight: '900' },
  time: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  preview: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
  loading: { flex: 1, justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#9CA3AF', fontSize: 15, fontWeight: '700', marginTop: 15 },
});
