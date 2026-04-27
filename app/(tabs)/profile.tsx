import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/services/firebase';

export default function ProfileScreen() {
  const { user, loading, clearUser } = useUser();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    try { await signOut(auth); } catch (_) {}
    await clearUser();
    router.replace('/auth/login' as any);
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#002C61" /></View>;
  }

  const firstName = user?.firstName || 'Member';
  const lastName = user?.lastName || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#001A3D', '#002C61']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerTitle}>MY ACCOUNT</Text>
        </View>
        
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{firstName} {lastName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>MY ATHLETES</Text>
        {user?.students?.length ? (
          user.students.map((student, i) => (
            <View key={i} style={styles.athleteCard}>
              <View style={styles.athleteIcon}><MaterialIcons name="person" size={24} color="#002C61" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.athleteName}>{student.firstName} {student.lastName}</Text>
                <Text style={styles.athleteDetails}>{student.school_name} • {student.grade_band || student.grade}</Text>
              </View>
              <View style={styles.sportTag}><Text style={styles.sportTagText}>{student.sport}</Text></View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>No athletes registered</Text></View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>PREFERENCES</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="notifications" size={22} color="#002C61" />
            <Text style={styles.settingLabel}>Notifications</Text>
            <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="security" size={22} color="#002C61" />
            <Text style={styles.settingLabel}>Security & Privacy</Text>
            <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={20} color="#E31B23" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.version}>Version 2.0.4 Premium</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 30 },
  logo: { width: 32, height: 32 },
  headerTitle: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  userCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, gap: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  userName: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  userEmail: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', marginBottom: 12, letterSpacing: 1 },
  athleteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 12, borderWidth: 1.5, borderColor: '#F3F4F6' },
  athleteIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  athleteName: { fontSize: 14, fontWeight: '900', color: '#111827', marginBottom: 2 },
  athleteDetails: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  sportTag: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sportTagText: { color: '#0047AB', fontSize: 10, fontWeight: '900' },
  emptyCard: { padding: 20, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 20 },
  emptyText: { color: '#9CA3AF', fontSize: 13, fontWeight: '700' },
  settingsGroup: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1.5, borderColor: '#F3F4F6', overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1.5, borderBottomColor: '#F3F4F6' },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: '800', color: '#111827' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 30, paddingVertical: 15, borderRadius: 16, backgroundColor: '#FEF2F2' },
  signOutText: { color: '#E31B23', fontSize: 14, fontWeight: '900' },
  version: { textAlign: 'center', marginTop: 30, fontSize: 11, color: '#D1D5DB', fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
