import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';
import { fetchSchedules, Schedule } from '../../src/services/schedule';

const SPORT_ICONS: Record<string, string> = {
  soccer: '⚽',
  basketball: '🏀',
  football: '🏈',
  cheer: '📣',
  volleyball: '🏐',
};

function getSportIcon(sport: string) {
  const key = sport?.toLowerCase() || '';
  for (const s of Object.keys(SPORT_ICONS)) {
    if (key.includes(s)) return SPORT_ICONS[s];
  }
  return '🏆';
}

function getInitials(name: string) {
  return (name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatSectionDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export default function ScheduleScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchScheduleData();
  }, [user]);

  const fetchScheduleData = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const fetched = await fetchSchedules();
      // Filtering logic remains the same
      setSchedules(fetched); 
    } catch (e) { } finally { setLoading(false); }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isUpcoming = (d: string) => new Date(d) >= today;

  const filtered = schedules.filter(s => {
    if (activeTab === 'live') return false; // Mocking live as empty for now
    return activeTab === 'upcoming' ? isUpcoming(s.date) : !isUpcoming(s.date);
  });

  const grouped: Record<string, Schedule[]> = {};
  for (const s of filtered) {
    const key = s.date || 'Unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  const sections = Object.entries(grouped)
    .sort(([a], [b]) => activeTab === 'upcoming' ? a.localeCompare(b) : b.localeCompare(a))
    .map(([date, data]) => ({ title: date, data }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#001A3D', '#002C61']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerTitle}>GAME SCHEDULE</Text>
          <TouchableOpacity style={styles.filterBtn}><MaterialIcons name="filter-list" size={20} color="#FFF" /></TouchableOpacity>
        </View>

        {/* Custom Tabs */}
        <View style={styles.tabsRow}>
          {['live', 'upcoming', 'past'].map((t) => (
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
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.dateHeader}>{formatSectionDate(title)}</Text>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="event-busy" size={60} color="#E5E7EB" />
              <Text style={styles.emptyText}>No {activeTab} games found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.gameCard}>
              <View style={styles.cardLeft}>
                <Text style={styles.gameTime}>{item.time || '10:00'}</Text>
                <Text style={styles.gameAmPm}>{item.time?.includes('PM') ? 'PM' : 'AM'}</Text>
              </View>
              <View style={styles.cardMid}>
                <Text style={styles.teamPair} numberOfLines={1}>
                  {item.team1Name || 'TBD'} <Text style={styles.vs}>VS</Text> {item.team2Name || 'TBD'}
                </Text>
                <View style={styles.locRow}>
                  <MaterialIcons name="location-on" size={12} color="#9CA3AF" />
                  <Text style={styles.locText} numberOfLines={1}>{item.location || 'Central Park'}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <View style={styles.sportBadge}>
                  <Text style={styles.sportText}>{getSportIcon(item.sport || '')}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  logo: { width: 32, height: 32 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  filterBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabActive: { backgroundColor: '#E31B23' },
  tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: '#FFF' },
  loading: { flex: 1, justifyContent: 'center' },
  dateHeader: { fontSize: 14, fontWeight: '800', color: '#111827', marginTop: 15, marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  gameCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#F3F4F6' },
  cardLeft: { paddingRight: 15, borderRightWidth: 1, borderRightColor: '#F3F4F6', alignItems: 'center', minWidth: 60 },
  gameTime: { fontSize: 16, fontWeight: '900', color: '#111827' },
  gameAmPm: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', marginTop: 1 },
  cardMid: { flex: 1, paddingHorizontal: 15 },
  teamPair: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 6 },
  vs: { color: '#E31B23', fontSize: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  cardRight: { paddingLeft: 10 },
  sportBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  sportText: { fontSize: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#9CA3AF', fontSize: 15, fontWeight: '700', marginTop: 15 },
});
