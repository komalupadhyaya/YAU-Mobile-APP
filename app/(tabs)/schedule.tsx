import { MaterialIcons } from '@expo/vector-icons';
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

const TEAM_COLORS = ['#1565C0', '#2E7D32', '#C62828', '#6A1B9A', '#E65100', '#00695C'];
function getTeamColor(name: string) {
  let hash = 0;
  for (const c of name || '') hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
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
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchScheduleData();
  }, [user]);

  const fetchScheduleData = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const fetched = await fetchSchedules();
      const filtered = fetched.filter(schedule => {
        if (user.sport && schedule.sport) {
          if (schedule.sport.toLowerCase() !== user.sport.toLowerCase()) return false;
        }
        if (user?.students?.length > 0 && (schedule.ageGroups?.length ?? 0) > 0) {
          const studentGradeBand = user.students[0]?.grade_band;
          const matchesGrade = studentGradeBand && (schedule.ageGroups ?? []).some(ag =>
            ag.replace(/\s+/g, '').toLowerCase() === studentGradeBand.replace(/\s+/g, '').toLowerCase()
          );
          if (!matchesGrade) return false;
        }
        return true;
      });
      setSchedules(filtered);
    } catch (e) { } finally { setLoading(false); }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isUpcoming = (d: string) => new Date(d) >= today;

  const filtered = schedules.filter(s => activeTab === 'upcoming' ? isUpcoming(s.date) : !isUpcoming(s.date));

  // Group by date
  const grouped: Record<string, Schedule[]> = {};
  for (const s of filtered) {
    const key = s.date || 'Unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  const sections = Object.entries(grouped)
    .sort(([a], [b]) => activeTab === 'upcoming' ? a.localeCompare(b) : b.localeCompare(a))
    .map(([date, data]) => ({ title: date, data }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* Blue gradient header */}
      <LinearGradient
        colors={['#1565C0', '#1976D2', '#42A5F5']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logoIcon} resizeMode="contain" />
          <Text style={styles.logoText}>YAU SPORTS</Text>
          <MaterialIcons name="calendar-today" size={24} color="#fff" style={{ marginLeft: 'auto' }} />
        </View>
        <Text style={styles.headerTitle}>Game Schedule</Text>

        {/* Upcoming / Past tab */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'upcoming' && styles.segmentActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.segmentText, activeTab === 'upcoming' && styles.segmentTextActive]}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'past' && styles.segmentActive]}
            onPress={() => setActiveTab('past')}
          >
            <Text style={[styles.segmentText, activeTab === 'past' && styles.segmentTextActive]}>Past</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Wave */}
      <View style={styles.wave} />

      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>No {activeTab} games</Text>
          <Text style={styles.emptySubtext}>Check back later for schedule updates</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingHorizontal: 16 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{formatSectionDate(title)}</Text>
          )}
          renderItem={({ item }) => {
            const teamColor = getTeamColor(item.team1Name || '');
            return (
              <View style={styles.gameCard}>
                {/* Team 1 */}
                <View style={styles.gameRow}>
                  <View style={[styles.teamBadge, { backgroundColor: teamColor }]}>
                    <Text style={styles.teamInitials}>{getInitials(item.team1Name)}</Text>
                  </View>
                  <View style={styles.gameInfo}>
                    <Text style={styles.gameName} numberOfLines={1}>
                      {item.team1Name || 'TBD'} vs. {item.team2Name || 'TBD'}
                    </Text>
                    <Text style={styles.gameMeta}>
                      {item.time || 'TBD'}  |  {item.location || 'Location TBD'}
                    </Text>
                  </View>
                  <Text style={styles.sportIcon}>{getSportIcon(item.sport || '')}</Text>
                </View>
                {/* VS row */}
                <View style={styles.vsRow}>
                  <View style={[styles.teamBadge, { backgroundColor: getTeamColor(item.team2Name || '') }]}>
                    <Text style={styles.teamInitials}>{getInitials(item.team2Name)}</Text>
                  </View>
                  <View style={styles.vsBadge}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  <Text style={styles.team2Name} numberOfLines={1}>{item.team2Name || 'TBD'}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F0F4FF' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4FF' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 52,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  logoIcon: { width: 36, height: 36, borderRadius: 6 },
  logoText: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 14 },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: { backgroundColor: '#E65100' },
  segmentText: { color: 'rgba(255,255,255,0.75)', fontWeight: '600', fontSize: 14 },
  segmentTextActive: { color: '#FFFFFF', fontWeight: '800' },
  wave: {
    height: 32,
    backgroundColor: '#F0F4FF',
    marginTop: -32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  teamBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInitials: { color: '#fff', fontWeight: '800', fontSize: 14 },
  gameInfo: { flex: 1 },
  gameName: { fontWeight: '700', fontSize: 14, color: '#111827' },
  gameMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  sportIcon: { fontSize: 28 },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  vsBadge: {
    backgroundColor: '#E65100',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: { color: '#fff', fontWeight: '900', fontSize: 11 },
  team2Name: { flex: 1, fontWeight: '700', fontSize: 14, color: '#111827' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
