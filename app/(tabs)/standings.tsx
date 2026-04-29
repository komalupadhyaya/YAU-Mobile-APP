import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Modal } from 'react-native';
import { db } from '../../src/services/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

interface Standing {
  id: string;
  teamName: string;
  gradeBand: string;
  sport: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

type SportType = 'Soccer' | 'Flag Football' | 'Basketball';

const GRADE_BANDS = [
  'K - 1st Grade',
  '1st - 2nd Grade',
  '3rd - 4th Grade',
  '5th - 6th Grade',
  '7th - 8th Grade',
  'High School',
];



export default function StandingsScreen() {
  const insets = useSafeAreaInsets();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<SportType>('Soccer');
  const [selectedBand, setSelectedBand] = useState(GRADE_BANDS[1]); // 1st-2nd
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'standings'), orderBy('points', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Standing[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Standing);
      });
      setStandings(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filter real data
  const filteredData = standings.filter(s => 
    s.sport === selectedSport && 
    (s.gradeBand.includes(selectedBand.split(' ')[0]) || selectedBand.includes(s.gradeBand))
  );

  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, { width: 30 }]}>#</Text>
      <Text style={[styles.headerCell, { flex: 2.5 }]}>Club</Text>
      <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'center' }]}>GB</Text>
      <Text style={[styles.headerCell, { flex: 0.8, textAlign: 'center' }]}>W</Text>
      <Text style={[styles.headerCell, { flex: 0.8, textAlign: 'center' }]}>D</Text>
      <Text style={[styles.headerCell, { flex: 0.8, textAlign: 'center' }]}>L</Text>
      <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Pts</Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: Standing; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.rankText}>{index + 1}</Text>
      
      <View style={styles.clubCol}>
        <View style={styles.clubBadge}>
          <Text style={styles.clubInitials}>{getInitials(item.teamName)}</Text>
        </View>
        <Text style={styles.clubName}>{item.teamName}</Text>
      </View>

      <Text style={styles.gbText}>{item.gradeBand}</Text>
      <Text style={styles.winText}>{item.wins}</Text>
      <Text style={styles.drawText}>{item.draws}</Text>
      <Text style={styles.lossText}>{item.losses}</Text>
      <Text style={styles.pointsText}>{item.points}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#001A3D', '#002C61']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Image source={require('../../assets/favicon.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerTitle}>Standings</Text>
        </View>
        <Text style={styles.headerSubtitle}>Spring 2026 Season</Text>

        <View style={styles.tabsRow}>
          {['Soccer', 'Flag Football', 'Basketball'].map((sport) => (
            <TouchableOpacity
              key={sport}
              onPress={() => setSelectedSport(sport as SportType)}
              style={styles.tab}
            >
              <Text style={[styles.tabText, selectedSport === sport && styles.tabTextActive]}>{sport}</Text>
              {selectedSport === sport && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Select Grade Band</Text>
        <TouchableOpacity 
          style={styles.filterDropdown}
          onPress={() => setIsDropdownOpen(true)}
        >
          <Text style={styles.filterValue}>{selectedBand}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Grade Band Selection Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Grade Band</Text>
            {GRADE_BANDS.map((band) => (
              <TouchableOpacity
                key={band}
                style={[styles.modalItem, selectedBand === band && styles.modalItemActive]}
                onPress={() => {
                  setSelectedBand(band);
                  setIsDropdownOpen(false);
                }}
              >
                <Text style={[styles.modalItemText, selectedBand === band && styles.modalItemTextActive]}>
                  {band}
                </Text>
                {selectedBand === band && <MaterialIcons name="check" size={20} color="#002C61" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#002C61" /></View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={() => (
            <View style={styles.legendBox}>
              <View style={styles.legendRow}>
                <Text style={styles.legendItem}>GB = Grade Band</Text>
                <Text style={styles.legendItem}>W = Wins</Text>
                <Text style={styles.legendItem}>D = Draws</Text>
              </View>
              <View style={styles.legendRow}>
                <Text style={styles.legendItem}>L = Losses</Text>
                <Text style={styles.legendItem}>Pts = Points</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="leaderboard" size={60} color="#E5E7EB" />
              <Text style={styles.emptyText}>No rankings data available</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingBottom: 0 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 15 },
  logo: { width: 35, height: 35 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, paddingHorizontal: 20, marginBottom: 25 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 20, justifyContent: 'space-between' },
  tab: { paddingVertical: 12, alignItems: 'center', flex: 1, position: 'relative' },
  tabUnderline: { position: 'absolute', bottom: 0, width: '100%', height: 3, backgroundColor: '#E31B23' },
  tabText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: '#FFF' },
  filterSection: { padding: 20 },
  filterLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 8 },
  filterDropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  filterValue: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerCell: { fontSize: 12, fontWeight: '900', color: '#1E293B' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rankText: { width: 30, fontSize: 14, fontWeight: '900', color: '#4F46E5' },
  clubCol: { flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 10 },
  clubBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
  clubInitials: { fontSize: 12, fontWeight: '900', color: '#1E40AF' },
  clubName: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  gbText: { flex: 1.2, fontSize: 12, color: '#64748B', fontWeight: '600', textAlign: 'center' },
  winText: { flex: 0.8, fontSize: 14, fontWeight: '800', color: '#2563EB', textAlign: 'center' },
  drawText: { flex: 0.8, fontSize: 14, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  lossText: { flex: 0.8, fontSize: 14, fontWeight: '800', color: '#DC2626', textAlign: 'center' },
  pointsText: { flex: 1, fontSize: 14, fontWeight: '900', color: '#16A34A', textAlign: 'center' },
  legendBox: { marginTop: 30, padding: 15, backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 5 },
  legendItem: { fontSize: 11, fontWeight: '700', color: '#166534' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { paddingVertical: 80, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontWeight: '700', marginTop: 15 },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', width: '100%', borderRadius: 24, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 20, textAlign: 'center' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalItemActive: { backgroundColor: '#F8FAFC' },
  modalItemText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  modalItemTextActive: { color: '#002C61' },
});
