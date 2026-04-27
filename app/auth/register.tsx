import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppInput from '../../src/components/AppInput';
import { useUser } from '../../src/context/UserContext';
import { registerForPushNotificationsAsync } from '../../src/services/notifications';
import { GRADE_BANDS, registerMember, SPORTS } from '../../src/services/registration';
import { School, subscribeToSchools } from '../../src/services/schools';
import { Member } from '../../src/types';

const { width, height } = Dimensions.get('window');

// ─── Grade band → Band key ────────────────────────────────────────────────────
const GRADE_BAND_TO_KEY: Record<string, string> = {
  'K / 1st Grade': 'Band 1',
  '2nd / 3rd Grade': 'Band 2',
  '4th / 5th Grade': 'Band 3',
  'Middle School': 'Band 4',
};

// ─── Phone masking ─────────────────────────────────────────────────────────────
function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)})-${d.slice(3)}`;
  return `(${d.slice(0, 3)})-${d.slice(3, 6)}-${d.slice(6)}`;
}

// ─── Terms & Conditions text ───────────────────────────────────────────────────
const TERMS_TEXT = `Youth Athlete University (YAU) Terms of Service...`; // Truncated for brevity, normally full text

interface StudentForm {
  firstName: string;
  lastName: string;
  gradeBand: string;
  schoolName: string;
  sports: string[];
  errors?: Record<string, string>;
}

function emptyStudent(): StudentForm {
  return { firstName: '', lastName: '', gradeBand: '', schoolName: '', sports: [], errors: {} };
}

export default function RegisterScreen() {
  const { setUser } = useUser();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // Parent fields
  const [parentFirstName, setParentFirstName] = useState('');
  const [parentLastName, setParentLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');

  // Consent/T&C
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);

  // Modals
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [modalStudentIndex, setModalStudentIndex] = useState<number | null>(null);

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [students, setStudents] = useState<StudentForm[]>([emptyStudent()]);

  useEffect(() => {
    const unsub = subscribeToSchools((s) => { setSchools(s); setSchoolsLoading(false); });
    registerForPushNotificationsAsync().then(t => { if (t) setPushToken(t); });
    return () => unsub();
  }, []);

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setPhoneDigits(digits);
  };

  const updateStudent = (index: number, patch: Partial<StudentForm>) => {
    setStudents(prev => prev.map((s, i) => i === index ? { ...s, ...patch, errors: { ...s.errors, ...Object.fromEntries(Object.keys(patch).map(k => [k, ''])) } } : s));
  };

  const toggleSport = (index: number, sport: string) => {
    setStudents(prev => prev.map((s, i) => {
      if (i !== index) return s;
      const has = s.sports.includes(sport);
      return { ...s, sports: has ? s.sports.filter(sp => sp !== sport) : [...s.sports, sport] };
    }));
  };

  const handleRegister = async () => {
    const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    if (!parentFirstName.trim() || !parentLastName.trim() || !email.trim() || !password || !confirmPassword || !phoneDigits) {
      Alert.alert('Required Fields', 'Please fill in all parent information fields.');
      return;
    }
    if (!validateEmail(email.trim())) { Alert.alert('Invalid Email', 'Please enter a valid email address.'); return; }
    if (password.length < 6) { Alert.alert('Weak Password', 'Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { Alert.alert('Password Mismatch', 'Passwords do not match.'); return; }
    if (phoneDigits.length < 10) { Alert.alert('Invalid Phone', 'Please enter a 10-digit phone number.'); return; }

    setLoading(true);
    try {
      const result = await registerMember({
        parentFirstName: parentFirstName.trim(),
        parentLastName: parentLastName.trim(),
        email: email.trim(),
        password,
        phone: phoneDigits,
        sport: students[0]?.sports?.[0] || '',
        membershipType: 'free',
        smsConsent,
        students: students.map(s => ({
          firstName: s.firstName.trim(),
          lastName: s.lastName.trim(),
          gradeBand: s.gradeBand,
          schoolName: s.schoolName,
          sports: s.sports,
          ageGroup: GRADE_BAND_TO_KEY[s.gradeBand] || 'Band 1',
        })),
        expoPushTokens: pushToken ? [pushToken] : undefined,
      });

      if (result.success) {
        await setUser({
          firstName: parentFirstName.trim(),
          lastName: parentLastName.trim(),
          email: email.trim(),
          phone: phoneDigits,
          students: [], // Simplified for local context update
        } as any);
        Alert.alert('Welcome to YAU! 🏆', 'Registration complete!', [{ text: 'Get Started', onPress: () => router.replace('/(tabs)/' as any) }]);
      } else {
        Alert.alert('Registration Failed', result.error);
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#001A3D', '#002C61']} style={styles.gradientBg}>
        <View style={[styles.headerSection, { paddingTop: insets.top + 40 }]}>
          <Image source={require('../../assets/images/logo1.png')} style={styles.logoIcon} resizeMode="contain" />
          <Text style={styles.yauHeaderText}>YOUTH ATHLETE UNIVERSITY</Text>
          <Text style={styles.mainTitle}>Create Your Account</Text>
          <Text style={styles.subTitle}>Let’s get started with your information</Text>
        </View>
      </LinearGradient>

      <View style={styles.cardContainer}>
        {/* Progress Indicator */}
        <View style={styles.progressWrapper}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}><Text style={[styles.stepNum, step >= 1 && styles.stepNumActive]}>01</Text></View>
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}><Text style={[styles.stepNum, step >= 2 && styles.stepNumActive]}>02</Text></View>
          </View>
          <Text style={styles.stepText}>STEP {step} OF 2</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Text style={styles.sectionTitle}>{step === 1 ? 'Parent Information' : 'Child Information'}</Text>

            {step === 1 ? (
              <View>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>First Name</Text>
                    <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Niki" value={parentFirstName} onChangeText={setParentFirstName} /></View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Last Name</Text>
                    <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Zefanya" value={parentLastName} onChangeText={setParentLastName} /></View>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="zefanya@niki.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></View>

                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Text style={{ marginRight: 8 }}>🇺🇸</Text>
                  <TextInput style={styles.input} placeholder="(333) 123 - 4567" value={formatPhoneDisplay(phoneDigits)} onChangeText={handlePhoneChange} keyboardType="phone-pad" />
                </View>

                <Text style={styles.inputLabel}>Create Password</Text>
                <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="*******" secureTextEntry value={password} onChangeText={setPassword} /></View>
                <Text style={styles.hintText}>Must be at least 8 characters</Text>

                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="*******" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} /></View>

                <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {students.map((student, idx) => (
                  <View key={idx}>
                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Child First Name</Text>
                        <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Niki" value={student.firstName} onChangeText={v => updateStudent(idx, { firstName: v })} /></View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Child Last Name</Text>
                        <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Zefanya" value={student.lastName} onChangeText={v => updateStudent(idx, { lastName: v })} /></View>
                      </View>
                    </View>

                    <Text style={styles.inputLabel}>School</Text>
                    <TouchableOpacity style={styles.inputWrapper} onPress={() => { setModalStudentIndex(idx); setIsSchoolModalOpen(true); }}>
                      <Text style={{ color: student.schoolName ? '#111827' : '#9CA3AF' }}>{student.schoolName || 'Select School'}</Text>
                    </TouchableOpacity>

                    <Text style={styles.inputLabel}>Grade Band</Text>
                    <TouchableOpacity style={styles.inputWrapper} onPress={() => { setModalStudentIndex(idx); setIsGradeModalOpen(true); }}>
                      <Text style={{ color: student.gradeBand ? '#111827' : '#9CA3AF' }}>{student.gradeBand || 'Select Grade Band'}</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addChildBtn}
                  onPress={() => setStudents(prev => [...prev, emptyStudent()])}
                >
                  <MaterialIcons name="add-circle-outline" size={20} color="#0047AB" />
                  <Text style={styles.addChildText}>Add Another Child</Text>
                </TouchableOpacity>

                <View style={styles.termsRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                  >
                    {termsAccepted && <MaterialIcons name="check" size={14} color="#FFF" />}
                  </TouchableOpacity>
                  <Text style={styles.termsText}>
                    I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, (!termsAccepted || loading) && styles.btnDisabled]}
                  onPress={handleRegister}
                  disabled={!termsAccepted || loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}><Text style={styles.backBtnText}>Back</Text></TouchableOpacity>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login' as any)}><Text style={styles.loginLink}>Log In</Text></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </View>

      {/* Re-use existing Modals (Grade, School) from legacy code */}
      <Modal visible={isGradeModalOpen} transparent animationType="slide">
        <View style={styles.modalBg}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Grade Band</Text>
          <FlatList data={GRADE_BANDS} keyExtractor={i => i.value} renderItem={({ item }) => (
            <TouchableOpacity style={styles.modalItem} onPress={() => { updateStudent(modalStudentIndex!, { gradeBand: item.value }); setIsGradeModalOpen(false); }}>
              <Text style={styles.modalItemText}>{item.label}</Text>
            </TouchableOpacity>
          )} />
          <TouchableOpacity onPress={() => setIsGradeModalOpen(false)}><Text style={styles.closeModal}>Close</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={isSchoolModalOpen} transparent animationType="slide">
        <View style={styles.modalBg}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select School</Text>
          <FlatList data={schools} keyExtractor={i => i.id!} renderItem={({ item }) => (
            <TouchableOpacity style={styles.modalItem} onPress={() => { updateStudent(modalStudentIndex!, { schoolName: item.name }); setIsSchoolModalOpen(false); }}>
              <Text style={styles.modalItemText}>{item.name}</Text>
            </TouchableOpacity>
          )} />
          <TouchableOpacity onPress={() => setIsSchoolModalOpen(false)}><Text style={styles.closeModal}>Close</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  gradientBg: { height: height * 0.4, width: width, position: 'absolute', top: 0 },
  headerSection: { alignItems: 'center', paddingHorizontal: 30 },
  logoIcon: { width: 40, height: 40, marginBottom: 8 },
  yauHeaderText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  mainTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 10 },
  subTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  cardContainer: { flex: 1, marginTop: height * 0.28, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FFFFFF', elevation: 20 },
  progressWrapper: { alignItems: 'center', marginTop: 20 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  stepCircleActive: { backgroundColor: '#0047AB', borderColor: '#0047AB' },
  stepNum: { color: '#9CA3AF', fontSize: 13, fontWeight: '700' },
  stepNumActive: { color: '#FFFFFF' },
  stepLine: { width: 40, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#0047AB' },
  stepText: { fontSize: 12, fontWeight: '700', color: '#0047AB', marginTop: 8 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inputLabel: { fontSize: 12, color: '#6B7280', fontWeight: '700', marginBottom: 6, marginTop: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, height: 50 },
  input: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500' },
  hintText: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  primaryBtn: { backgroundColor: '#002C61', borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  backBtn: { alignItems: 'center', marginTop: 16 },
  backBtnText: { color: '#6B7280', fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#F3F4F6' },
  chipSel: { borderColor: '#0047AB', backgroundColor: '#EFF6FF' },
  chipText: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  chipTextSel: { color: '#0047AB' },
  addChildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0047AB',
    marginTop: 10,
    backgroundColor: '#F0F7FF',
  },
  addChildText: {
    color: '#0047AB',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginRight: 10,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  linkText: {
    color: '#0047AB',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280', fontSize: 14 },
  loginLink: { color: '#0047AB', fontWeight: '800', fontSize: 14 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalItemText: { fontSize: 15, fontWeight: '600' },
  closeModal: { textAlign: 'center', color: '#0047AB', fontWeight: '800', marginTop: 16 },
});
