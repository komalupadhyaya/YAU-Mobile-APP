import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';

export default function HomeScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const firstName = user?.firstName || 'Member';

  // My Teams info from first student
  const student = user?.students?.[0];
  const myTeamLabel = student
    ? `${student.school_name || 'School'} — ${student.grade_band || student.grade || 'Grade'} ${student.sport || ''}`
    : 'No team assigned';

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Blue gradient header */}
      <LinearGradient
        colors={['#1565C0', '#1976D2', '#42A5F5']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        {/* Logo row */}
        <View style={styles.logoRow}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>YAU SPORTS</Text>
        </View>

        {/* Welcome */}
        <Text style={styles.welcomeText}>Welcome, {firstName}!</Text>
      </LinearGradient>

      {/* Wave divider */}
      <View style={styles.wave} />

      {/* Content */}
      <View style={styles.content}>
        {/* Row 1: Messages + Game Schedule */}
        <View style={styles.tileRow}>
          {/* Messages tile — blue */}
          <TouchableOpacity
            style={styles.tileHalf}
            onPress={() => router.push('/(tabs)/messages' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#1565C0', '#1976D2']} style={styles.tileGradient}>
              <View style={styles.tileBadgeWrapper}>
                <Text style={styles.tileEmoji}>💬</Text>
                {/* Unread badge — static visual */}
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>2</Text>
                </View>
              </View>
              <Text style={styles.tileLabel}>Messages</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Game Schedule tile — green */}
          <TouchableOpacity
            style={styles.tileHalf}
            onPress={() => router.push('/(tabs)/schedule' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.tileGradient}>
              <Text style={styles.tileEmoji}>📅⚽🏈</Text>
              <Text style={styles.tileLabel}>Game Schedule</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Row 2: Standings — full width orange */}
        <TouchableOpacity style={styles.tileFull} activeOpacity={0.85}>
          <LinearGradient colors={['#E65100', '#EF6C00']} style={styles.tileGradientFull}>
            <Text style={styles.standingsEmoji}>🏆</Text>
            <View style={styles.podium}>
              <View style={[styles.podiumBlock, styles.podiumSilver]}>
                <Text style={styles.podiumNum}>2</Text>
              </View>
              <View style={[styles.podiumBlock, styles.podiumGold]}>
                <Text style={styles.podiumNum}>1</Text>
              </View>
              <View style={[styles.podiumBlock, styles.podiumBronze]}>
                <Text style={styles.podiumNum}>3</Text>
              </View>
            </View>
            <Text style={styles.tileLabel}>Standings</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Row 3: My Teams + Announcements info cards */}
        <View style={styles.infoRow}>
          {/* My Teams */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <MaterialIcons name="groups" size={18} color="#1565C0" />
              <Text style={styles.infoCardTitle}>My Teams</Text>
            </View>
            <Text style={styles.infoCardBody} numberOfLines={2}>{myTeamLabel}</Text>
          </View>

          {/* Announcements */}
          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => router.push('/(tabs)/messages' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.infoCardHeader}>
              <MaterialIcons name="campaign" size={18} color="#E65100" />
              <Text style={styles.infoCardTitle}>Announcements</Text>
            </View>
            <Text style={styles.infoCardBody} numberOfLines={2}>
              Tap to view the latest updates from YAU
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F0F4FF' },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 52,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  logoIcon: { width: 40, height: 40, borderRadius: 8 },
  logoText: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  wave: {
    height: 36,
    backgroundColor: '#F0F4FF',
    marginTop: -36,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Tiles
  tileRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  tileHalf: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  tileGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
    gap: 10,
  },
  tileFull: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#E65100',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  tileGradientFull: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 140,
  },
  tileBadgeWrapper: {
    position: 'relative',
  },
  tileEmoji: { fontSize: 36 },
  tileLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  unreadBadge: {
    position: 'absolute',
    top: -6,
    right: -12,
    backgroundColor: '#E65100',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1565C0',
    paddingHorizontal: 4,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  // Standings podium
  standingsEmoji: { fontSize: 40, marginBottom: 4 },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 4,
  },
  podiumBlock: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 4,
    paddingBottom: 4,
  },
  podiumGold: { height: 44, backgroundColor: 'rgba(255,255,255,0.35)' },
  podiumSilver: { height: 34, backgroundColor: 'rgba(255,255,255,0.2)' },
  podiumBronze: { height: 26, backgroundColor: 'rgba(255,255,255,0.15)' },
  podiumNum: { color: '#fff', fontWeight: '900', fontSize: 16 },

  // Info cards
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoCardTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: '#111827',
  },
  infoCardBody: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});
