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

  const firstName = user?.firstName || 'Sports';

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <LinearGradient colors={['#001A3D', '#002C61']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.headerBrand}>YOUTH ATHLETE UNIVERSITY</Text>
            <Text style={styles.headerWelcome}>Welcome, {firstName}!</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Action Tiles */}
        <View style={styles.tilesGrid}>
          <TouchableOpacity 
            style={[styles.tile, { backgroundColor: '#002C61' }]} 
            onPress={() => router.push('/(tabs)/messages' as any)}
          >
            <MaterialIcons name="chat-bubble" size={28} color="#FFF" />
            <Text style={styles.tileTitle}>Messages</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tile, { backgroundColor: '#002C61' }]} 
            onPress={() => router.push('/(tabs)/schedule' as any)}
          >
            <MaterialIcons name="event" size={28} color="#FFF" />
            <Text style={styles.tileTitle}>Schedule</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tile, { backgroundColor: '#E31B23' }]} 
            onPress={() => router.push('/(tabs)/standings' as any)}
          >
            <MaterialIcons name="leaderboard" size={28} color="#FFF" />
            <Text style={styles.tileTitle}>Standings</Text>
          </TouchableOpacity>
        </View>

        {/* Vertical Feed: Upcoming Match */}
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Upcoming Match</Text>
          <TouchableOpacity><Text style={styles.viewAll}>See All</Text></TouchableOpacity>
        </View>

        <View style={styles.matchCard}>
          <View style={styles.matchTag}><Text style={styles.matchTagText}>Game — Today, 4:00 PM</Text></View>
          <View style={styles.teamsRow}>
            <View style={styles.team}>
              <View style={[styles.teamIcon, { backgroundColor: '#002C61' }]}><Text style={styles.teamInit}>Y</Text></View>
              <Text style={styles.teamName}>YAU Kings</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.team}>
              <View style={[styles.teamIcon, { backgroundColor: '#E31B23' }]}><Text style={styles.teamInit}>H</Text></View>
              <Text style={styles.teamName}>High Flyers</Text>
            </View>
          </View>
          <View style={styles.matchFooter}>
            <MaterialIcons name="location-on" size={14} color="#6B7280" />
            <Text style={styles.locationText}>Central Stadium, Pitch 4</Text>
          </View>
        </View>

        <View style={styles.matchCard}>
          <View style={[styles.matchTag, { backgroundColor: '#F3F4F6' }]}><Text style={[styles.matchTagText, { color: '#6B7280' }]}>Game — Sat, 10:00 AM</Text></View>
          <View style={styles.teamsRow}>
            <View style={styles.team}>
              <View style={[styles.teamIcon, { backgroundColor: '#002C61' }]}><Text style={styles.teamInit}>Y</Text></View>
              <Text style={styles.teamName}>YAU Titans</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.team}>
              <View style={[styles.teamIcon, { backgroundColor: '#4B5563' }]}><Text style={styles.teamInit}>S</Text></View>
              <Text style={styles.teamName}>Street Bulls</Text>
            </View>
          </View>
          <View style={styles.matchFooter}>
            <MaterialIcons name="location-on" size={14} color="#6B7280" />
            <Text style={styles.locationText}>West Side Arena</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 36, height: 36 },
  headerBrand: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1, opacity: 0.8 },
  headerWelcome: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  tilesGrid: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  tile: { flex: 1, height: 110, borderRadius: 20, padding: 15, justifyContent: 'flex-end', position: 'relative', elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10 },
  tileTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', marginTop: 10 },
  badge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#E31B23', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFF' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  feedTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  viewAll: { fontSize: 13, fontWeight: '700', color: '#0047AB' },
  matchCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  matchTag: { alignSelf: 'flex-start', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 15 },
  matchTagText: { color: '#0047AB', fontSize: 11, fontWeight: '800' },
  teamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  team: { alignItems: 'center', flex: 1 },
  teamIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  teamInit: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  teamName: { fontSize: 13, fontWeight: '800', color: '#111827' },
  vs: { fontSize: 16, fontWeight: '900', color: '#9CA3AF' },
  matchFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  locationText: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
});
