import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Guest User';

  return (
    <View style={styles.container}>
      {/* Figma Header Style */}
      <LinearGradient colors={['#001A3D', '#002C61']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Image source={require('../../assets/images/logo1.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerBrand}>YOUTH ATHLETE UNIVERSITY</Text>
        </View>
        <View style={styles.welcomeSection}>
          <Text style={styles.greetingText}>Good Evening 👋</Text>
          <Text style={styles.userNameText}>{fullName}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Action Tiles - White Card Style */}
        <View style={styles.tilesGrid}>
          <TouchableOpacity
            style={styles.tile}
            onPress={() => router.push('/(tabs)/messages' as any)}
          >
            <View style={styles.tileIconBg}>
              <MaterialIcons name="chat-bubble" size={24} color="#0047AB" />
              <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
            </View>
            <Text style={styles.tileTitle}>Messages</Text>
            <Text style={styles.tileSubtext}>2 New Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={() => router.push('/(tabs)/schedule' as any)}
          >
            <View style={styles.tileIconBg}>
              <MaterialIcons name="event" size={24} color="#0047AB" />
            </View>
            <Text style={styles.tileTitle}>Schedule</Text>
            <Text style={styles.tileSubtext}>Upcoming Games</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={() => router.push('/(tabs)/standings' as any)}
          >
            <View style={styles.tileIconBg}>
              <MaterialIcons name="emoji-events" size={24} color="#0047AB" />
            </View>
            <Text style={styles.tileTitle}>Standings</Text>
            <Text style={styles.tileSubtext}>Team Ranking</Text>
          </TouchableOpacity>
        </View>

        {/* Vertical Feed: Upcoming Match */}
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Upcoming Match</Text>
          <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>

        <View style={styles.matchCard}>
          <View style={styles.matchDateHeader}>
            <Text style={styles.matchDateText}>SATURDAY, 19 AUGUST 2024</Text>
          </View>
          <View style={styles.matchBody}>
            <Text style={styles.leagueName}>Junior Fun League</Text>
            <Text style={styles.locationSubtext}>Green Park Field</Text>

            <View style={styles.teamsVerticalRow}>
              <View style={styles.team}>
                <View style={[styles.teamCircle, { backgroundColor: '#E0E7FF' }]}><Text style={styles.teamInit}>TK</Text></View>
                <Text style={styles.teamLabel}>Tiny Kicks</Text>
              </View>

              <View style={styles.timeContainer}>
                <Text style={styles.matchTime}>07:30</Text>
                <Text style={styles.matchAmPm}>PM</Text>
              </View>

              <View style={styles.team}>
                <View style={[styles.teamCircle, { backgroundColor: '#E0E7FF' }]}><Text style={styles.teamInit}>RS</Text></View>
                <Text style={styles.teamLabel}>Rising Stars</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.matchCard}>
          <View style={styles.matchDateHeader}>
            <Text style={styles.matchDateText}>SATURDAY, 19 AUGUST 2024</Text>
          </View>
          <View style={styles.matchBody}>
            <Text style={styles.leagueName}>Junior Fun League</Text>
            <Text style={styles.locationSubtext}>Green Park Field</Text>

            <View style={styles.teamsVerticalRow}>
              <View style={styles.team}>
                <View style={[styles.teamCircle, { backgroundColor: '#E0E7FF' }]}><Text style={styles.teamInit}>HF</Text></View>
                <Text style={styles.teamLabel}>Happy Feet</Text>
              </View>

              <View style={styles.timeContainer}>
                <Text style={styles.matchTime}>08:00</Text>
                <Text style={styles.matchAmPm}>PM</Text>
              </View>

              <View style={styles.team}>
                <View style={[styles.teamCircle, { backgroundColor: '#E0E7FF' }]}><Text style={styles.teamInit}>LT</Text></View>
                <Text style={styles.teamLabel}>Luton Town</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  logo: { width: 30, height: 30 },
  headerBrand: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  welcomeSection: { marginTop: 10 },
  greetingText: { color: '#FFF', fontSize: 16, opacity: 0.9 },
  userNameText: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 4 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  tilesGrid: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  tile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  tileIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative'
  },
  tileTitle: { color: '#1E293B', fontSize: 13, fontWeight: '800' },
  tileSubtext: { color: '#64748B', fontSize: 10, marginTop: 2, fontWeight: '500' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E31B23',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF'
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  feedTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  viewAll: { fontSize: 13, fontWeight: '700', color: '#0047AB' },
  matchCard: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: '#F1F5F9' },
  matchDateHeader: { backgroundColor: '#F1F5F9', paddingVertical: 8, alignItems: 'center' },
  matchDateText: { fontSize: 11, fontWeight: '800', color: '#475569', letterSpacing: 0.5 },
  matchBody: { padding: 15, alignItems: 'center' },
  leagueName: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  locationSubtext: { fontSize: 12, color: '#64748B', marginBottom: 20 },
  teamsVerticalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 },
  team: { alignItems: 'center', width: 80 },
  teamCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  teamInit: { color: '#0047AB', fontSize: 16, fontWeight: '900' },
  teamLabel: { fontSize: 11, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  timeContainer: { alignItems: 'center' },
  matchTime: { fontSize: 18, fontWeight: '900', color: '#001A3D' },
  matchAmPm: { fontSize: 12, fontWeight: '800', color: '#001A3D' },
});
