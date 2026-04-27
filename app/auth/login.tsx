import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';
import apiService from '../../src/services/api';
import { auth } from '../../src/services/firebase';

export default function LoginScreen() {
  const { setUser } = useUser();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required Fields', 'Please enter both email and password.');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      try {
        const response = await apiService.getMemberByEmail(email.trim());
        const member = response.data;

        if (!member) {
          Alert.alert('Profile Not Found', 'We couldn\'t find a member profile associated with this account. Please contact support.');
          await auth.signOut();
          setLoading(false);
          return;
        }

        if (member.role && member.role !== 'parent' && member.role !== 'member' && member.role !== 'user') {
          Alert.alert('Unauthorized', "Only registered members and parents can access the mobile app.");
          await auth.signOut();
          setLoading(false);
          return;
        }

        // Success - context will be updated and user redirected
        await setUser(member);
        router.replace('/(tabs)/' as any);
      } catch (apiError: any) {
        console.error('[Login] API Error:', apiError);
        Alert.alert('System Error', 'Unable to retrieve your profile. Please try again later.');
        await auth.signOut();
      }
    } catch (authError: any) {
      console.log('[Login] Auth Error:', authError.code);
      let title = 'Login Failed';
      let message = 'Invalid email or password.';
      
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message = 'Invalid email or password. Please try again.';
          break;
        case 'auth/invalid-email':
          message = 'The email address is not valid.';
          break;
        case 'auth/user-disabled':
          message = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your internet connection.';
          break;
      }
      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#1565C0', '#1976D2', '#42A5F5']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>YAU SPORTS</Text>
        </View>

        <Text style={styles.welcomeTitle}>Welcome Back!</Text>
        <Text style={styles.welcomeSub}>Sign in to your account</Text>

        {/* Sports illustration row */}
        <View style={styles.illustrationRow}>
          <Text style={styles.sportEmoji}>📅</Text>
          <Text style={[styles.sportEmoji, styles.sportEmojiCenter]}>⚽</Text>
          <Text style={styles.sportEmoji}>🏈</Text>
        </View>
      </LinearGradient>

      {/* White wave divider */}
      <View style={styles.waveDivider} />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Email field */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={22} color="#1565C0" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email or Username"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>

        {/* Password field */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={22} color="#1565C0" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.inputFlex]}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Remember / Forgot row */}
        <View style={styles.rememberRow}>
          <Text style={styles.rememberText}>Remember Me</Text>
          <TouchableOpacity>
            <Text style={styles.forgotLink}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In button */}
        <TouchableOpacity
          style={[styles.signInBtn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signInBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Create Account */}
        <TouchableOpacity style={styles.guestBtn} onPress={() => router.push('/auth/register' as any)}>
          <MaterialIcons name="group" size={20} color="#1565C0" />
          <Text style={styles.guestBtnText}>Create an Account</Text>
        </TouchableOpacity>

        {/* <View style={styles.signUpRow}>
          <Text style={styles.signUpText}>New to YAU Sports? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register' as any)}>
            <Text style={styles.signUpLink}>Create an Account</Text>
          </TouchableOpacity>
        </View> */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F0F4FF' },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  illustrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sportEmoji: {
    fontSize: 42,
  },
  sportEmojiCenter: {
    fontSize: 56,
    marginHorizontal: 4,
  },
  waveDivider: {
    height: 36,
    backgroundColor: '#F0F4FF',
    marginTop: -36,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  body: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  bodyContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 58,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  inputFlex: {
    flex: 1,
  },
  eyeBtn: {
    padding: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 2,
  },
  rememberText: {
    color: '#374151',
    fontSize: 13,
  },
  forgotLink: {
    color: '#1565C0',
    fontWeight: '600',
    fontSize: 13,
  },
  signInBtn: {
    backgroundColor: '#E65100',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#E65100',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  btnDisabled: {
    opacity: 0.6,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#1565C0',
    borderRadius: 14,
    height: 56,
    backgroundColor: '#FFFFFF',
    marginBottom: 28,
  },
  guestBtnText: {
    color: '#1565C0',
    fontWeight: '700',
    fontSize: 16,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signUpText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signUpLink: {
    color: '#1565C0',
    fontWeight: '700',
    fontSize: 14,
  },
});
