import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { db } from '../../src/services/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Standing {
  id: string;
  teamName: string;
  schoolName: string;
  gradeBand: string;
  sport: string;
  wins: number;
  losses: number;
  points: number;
}

const GRADE_BANDS = [
  'K / 1st Grade',
  '2nd / 3rd Grade',
  '4th / 5th Grade',
  'Middle School'
];

export default function StandingsScreen() {
  const insets = useSafeAreaInsets();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBand, setSelectedBand] = useState(GRADE_BANDS[0]);

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

  const filteredStandings = standings.filter(s =>
    s.gradeBand.includes(selectedBand) || selectedBand.includes(s.gradeBand)
  );

  const getRankColor = (index: number) => {
    if (index === 0) return '#FFD700'; // Gold
    if (index === 1) return '#C0C0C0'; // Silver
    if (index === 2) return '#CD7F32'; // Bronze
    return '#E5E7EB';
  };

  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerText, { flex: 0.8 }]}>RK</Text>
      <Text style={[styles.headerText, { flex: 3 }]}>TEAM</Text>
      <Text style={[styles.headerText, { flex: 0.7, textAlign: 'center' }]}>W</Text>
      <Text style={[styles.headerText, { flex: 0.7, textAlign: 'center' }]}>L</Text>
      <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>PTS</Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: Standing; index: number }) => (
    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
      <View style={{ flex: 0.8 }}>
        <View style={[styles.rankCircle, { backgroundColor: getRankColor(index) }]}>
          <Text style={[styles.rankText, index < 3 && { color: '#000' }]}>{index + 1}</Text>
        </View>
      </View>
      <View style={{ flex: 3 }}>
        <Text style={styles.teamName} numberOfLines={1}>{item.teamName}</Text>
        <Text style={styles.schoolName} numberOfLines={1}>{item.schoolName}</Text>
      </View>
      <Text style={[styles.cell, { flex: 0.7, textAlign: 'center' }]}>{item.wins}</Text>
      <Text style={[styles.cell, { flex: 0.7, textAlign: 'center' }]}>{item.losses}</Text>
      <Text style={[styles.points, { flex: 1, textAlign: 'right' }]}>{item.points}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#E31B23', '#961218']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Image source={require('../../assets/images/logo1.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerTitle}>LEAGUE STANDINGS</Text>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={GRADE_BANDS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedBand(item)}
              style={[styles.tab, selectedBand === item && styles.tabActive]}
            >
              <Text style={[styles.tabText, selectedBand === item && styles.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 5 }}
        />
      </LinearGradient>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#E31B23" /></View>
      ) : (
        <FlatList
          data={filteredStandings}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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

import { MaterialIcons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  logo: { width: 32, height: 32 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabActive: { backgroundColor: '#FFF' },
  tabText: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: '#E31B23' },
  listContent: { padding: 20, paddingBottom: 100 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#002C61', borderRadius: 12, marginBottom: 15 },
  headerText: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#FFF', borderRadius: 20, marginBottom: 12, borderWidth: 1.5, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  rankCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '900', color: '#6B7280' },
  teamName: { fontSize: 14, fontWeight: '900', color: '#111827' },
  schoolName: { fontSize: 11, color: '#9CA3AF', fontWeight: '700' },
  cell: { fontSize: 14, fontWeight: '800', color: '#4B5563' },
  points: { fontSize: 16, fontWeight: '900', color: '#002C61' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { paddingVertical: 80, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontWeight: '700', marginTop: 15 },
});
