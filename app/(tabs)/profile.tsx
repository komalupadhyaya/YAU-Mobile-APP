import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/services/firebase';

const SPORT_ICONS: Record<string, string> = {
  soccer: '⚽', basketball: '🏀', football: '🏈', cheer: '📣', volleyball: '🏐',
};
function getSportIcon(sport: string) {
  const key = sport?.toLowerCase() || '';
  for (const s of Object.keys(SPORT_ICONS)) { if (key.includes(s)) return SPORT_ICONS[s]; }
  return '🏆';
}

export default function ProfileScreen() {
  const { user, loading, clearUser } = useUser();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    try { await signOut(auth); } catch (_) {}
    await clearUser();
    router.replace('/auth/login' as any);
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1565C0" /></View>;
  }

  const firstName = user?.firstName || 'Member';
  const lastName = user?.lastName || '';;
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?';

  return (
    <View style={styles.flex}>
      {/* Blue header */}
      <LinearGradient
        colors={['#1565C0', '#1976D2', '#42A5F5']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerLogoRow}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logoIcon} resizeMode="contain" />
          <Text style={styles.logoText}>YAU SPORTS</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{firstName} {lastName}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>
      </LinearGradient>

      {/* Wave */}
      <View style={styles.wave} />

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingHorizontal: 16 }}
      >
        {/* My Teams */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="groups" size={20} color="#1565C0" />
            <Text style={styles.sectionTitle}>My Teams</Text>
          </View>

          {user?.students?.length ? (
            user.students.map((student, i) => (
              <View key={i} style={[styles.teamRow, i > 0 && styles.teamRowBorder]}>
                <View style={styles.teamIcon}>
                  <Text style={styles.teamEmoji}>{getSportIcon(student.sport || '')}</Text>
                </View>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>
                    {student.school_name || 'School N/A'} – {student.grade_band || student.grade || 'Grade N/A'}
                  </Text>
                  <Text style={styles.teamSub}>
                    {student.firstName || 'Child'} {student.lastName || ''} · {student.sport || 'Sport N/A'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyTeamText}>No teams assigned yet</Text>
          )}
        </View>

        {/* Announcements preview */}
        <TouchableOpacity
          style={styles.announcementCard}
          onPress={() => router.push('/(tabs)/messages' as any)}
        >
          <MaterialIcons name="campaign" size={22} color="#E65100" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.announcementTitle}>Announcements</Text>
            <Text style={styles.announcementSub}>Tap to view latest updates from YAU</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Settings & Sign Out */}
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuIconBox}>
              <MaterialIcons name="settings" size={20} color="#1565C0" />
            </View>
            <Text style={styles.menuRowText}>Settings</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuRow} onPress={handleSignOut}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FEF2F2' }]}>
              <MaterialIcons name="logout" size={20} color="#DC2626" />
            </View>
            <Text style={[styles.menuRowText, { color: '#DC2626' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F0F4FF' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4FF' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 56,
    alignItems: 'center',
  },
  headerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    alignSelf: 'center',
  },
  logoIcon: { width: 36, height: 36, borderRadius: 6 },
  logoText: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  avatarContainer: { alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitials: { fontSize: 30, fontWeight: '900', color: '#FFFFFF' },
  userName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 3 },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  wave: {
    height: 32,
    backgroundColor: '#F0F4FF',
    marginTop: -32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  body: { flex: 1 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: { fontWeight: '700', fontSize: 14, color: '#111827' },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  teamRowBorder: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  teamIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamEmoji: { fontSize: 24 },
  teamInfo: { flex: 1 },
  teamName: { fontWeight: '600', fontSize: 14, color: '#111827' },
  teamSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  emptyTeamText: { color: '#9CA3AF', fontSize: 13, padding: 14, textAlign: 'center' },
  announcementCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  announcementTitle: { fontWeight: '700', fontSize: 14, color: '#92400E' },
  announcementSub: { fontSize: 12, color: '#B45309', marginTop: 2 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 14 },
});
