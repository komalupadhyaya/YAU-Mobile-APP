import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppInput from '../../src/components/AppInput';
import { useUser } from '../../src/context/UserContext';
import { registerForPushNotificationsAsync } from '../../src/services/notifications';
import { registerMember, RegistrationData } from '../../src/services/registration';
import { School, subscribeToSchools } from '../../src/services/schools';
import { Member } from '../../src/types';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
];

interface StudentForm {
  firstName: string;
  lastName: string;
  grade: string;
  schoolName: string;
  dob: string;
  sport: string;
  school?: School;
  availableSports?: string[];
  errors?: {
    grade?: string;
    school?: string;
    sport?: string;
  };
}

const GRADE_OPTIONS = [
  'Pre-K',
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade'
];

const getAgeGroup = (grade: string): string => {
  const gradeMap: { [key: string]: string } = {
    'Pre-K': 'Band 1',
    'Kindergarten': 'Band 1',
    '1st Grade': 'Band 1',
    '2nd Grade': 'Band 2',
    '3rd Grade': 'Band 2',
    '4th Grade': 'Band 3',
    '5th Grade': 'Band 3',
    '6th Grade': 'Band 4',
    '7th Grade': 'Band 4',
    '8th Grade': 'Band 4'
  };
  return gradeMap[grade] || '';
};

export default function RegisterScreen() {
  const { setUser } = useUser();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [parentFirstName, setParentFirstName] = useState('');
  const [parentLastName, setParentLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [sport, setSport] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [isSchoolModalVisible, setIsSchoolModalVisible] = useState(false);
  const [isSportModalVisible, setIsSportModalVisible] = useState(false);
  const [isGradeModalVisible, setIsGradeModalVisible] = useState(false);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState<number | null>(null);
  const [availableSportsForModal, setAvailableSportsForModal] = useState<string[]>([]);
  const [datePickerIndex, setDatePickerIndex] = useState<number | null>(null);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  
  useEffect(() => {
    const unsubscribe = loadSchools();
    setupPushNotifications();
    
    // Cleanup schools listener on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  
  const setupPushNotifications = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setPushToken(token);
        if (__DEV__) console.log('[Register Screen] Push token registered:', token);
      }
    } catch (error) {
      if (__DEV__) console.error('[Register Screen] Error registering push notifications:', error);
    }
  };
  
  const loadSchools = () => {
    setSchoolsLoading(true);
    try {
      const unsubscribe = subscribeToSchools((fetchedSchools: School[]) => {
        setSchools(fetchedSchools);
        setSchoolsLoading(false);
      });
      
      // Store unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      if (__DEV__) console.error('[Register Screen] Error loading schools:', error);
      setSchoolsLoading(false);
      return () => {};
    }
  };
  
  const handleSchoolSelect = (school: School) => {
    if (selectedStudentIndex === null) return;
    
    const updatedStudents = [...students];
    updatedStudents[selectedStudentIndex].school = school;
    updatedStudents[selectedStudentIndex].schoolName = school.name;
    updatedStudents[selectedStudentIndex].availableSports = school.sports;
    updatedStudents[selectedStudentIndex].sport = ''; // Reset sport when school changes
    setStudents(updatedStudents);
    
    // Auto-fill parent location from school location
    setLocation(school.location);
    
    setIsSchoolModalVisible(false);
  };

  const handleSportModalOpen = (index: number) => {
    const student = students[index];
    if (student.availableSports && student.availableSports.length > 0) {
      setSelectedStudentIndex(index);
      setAvailableSportsForModal(student.availableSports);
      setIsSportModalVisible(true);
    }
  };

  const handleSportSelect = (sportName: string) => {
    if (selectedStudentIndex === null) return;
    
    const updatedStudents = [...students];
    updatedStudents[selectedStudentIndex].sport = sportName;
    setStudents(updatedStudents);
    
    setIsSportModalVisible(false);
  };

  const handleGradeModalOpen = (index: number) => {
    setSelectedStudentIndex(index);
    setIsGradeModalVisible(true);
  };

  const handleGradeSelect = (grade: string) => {
    if (selectedStudentIndex === null) return;
    
    const updatedStudents = [...students];
    updatedStudents[selectedStudentIndex].grade = grade;
    setStudents(updatedStudents);
    
    setIsGradeModalVisible(false);
  };

  const handleDatePickerOpen = (index: number) => {
    setDatePickerIndex(index);
    setIsDatePickerVisible(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // iOS fires onChange twice: once for dismissal, once for selection
    // We need to handle both cases
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setIsDatePickerVisible(false);
      return;
    }
    
    if (datePickerIndex === null) {
      setIsDatePickerVisible(false);
      return;
    }
    
    const updatedStudents = [...students];
    
    if (selectedDate) {
      updatedStudents[datePickerIndex].dob = selectedDate.toISOString().split('T')[0];
      setStudents(updatedStudents);
    }
    
    // On iOS, keep the picker open until user dismisses it
    // On Android, close it immediately after selection
    if (Platform.OS === 'android') {
      setIsDatePickerVisible(false);
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsCountryModalVisible(false);
  };
  
  const [students, setStudents] = useState<StudentForm[]>([
    { firstName: '', lastName: '', grade: '', schoolName: '', dob: '', sport: '', errors: {} }
  ]);

  const handleRegister = async () => {
    // Clear all errors
    const clearedStudents = students.map(s => ({ ...s, errors: {} }));
    setStudents(clearedStudents);

    // 1. Validate parent fields
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!parentFirstName.trim() || !parentLastName.trim() || !email.trim() || !password || !confirmPassword || !phone.trim() || !location.trim()) {
      Alert.alert('Required Fields', 'Please fill in all parent information fields.');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please check and try again.');
      return;
    }

    if (phone.trim().length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return;
    }

    // 2. Validate students with field-level errors
    let hasErrors = false;
    let firstErrorIndex = -1;

    const validatedStudents = students.map((student, index) => {
      const errors: StudentForm['errors'] = {};

      // Validate Names
      if (!student.firstName.trim()) {
        (errors as any).firstName = 'First name is required';
        hasErrors = true;
      }
      if (!student.lastName.trim()) {
        (errors as any).lastName = 'Last name is required';
        hasErrors = true;
      }

      // Validate grade
      if (!student.grade) {
        errors.grade = 'Grade is required';
        hasErrors = true;
        if (firstErrorIndex === -1) firstErrorIndex = index;
      } else if (!GRADE_OPTIONS.includes(student.grade)) {
        errors.grade = 'Invalid grade';
        hasErrors = true;
        if (firstErrorIndex === -1) firstErrorIndex = index;
      }

      // Validate school
      if (!student.schoolName) {
        errors.school = 'School is required';
        hasErrors = true;
        if (firstErrorIndex === -1) firstErrorIndex = index;
      }

      // Validate sport
      if (!student.sport) {
        errors.sport = 'Sport is required';
        hasErrors = true;
        if (firstErrorIndex === -1) firstErrorIndex = index;
      }

      // Validate DOB
      if (!student.dob) {
        (errors as any).dob = 'DOB is required';
        hasErrors = true;
      }

      return { ...student, errors };
    });

    if (hasErrors) {
      setStudents(validatedStudents);
      Alert.alert('Required Fields', 'Please fix the highlighted errors for the students.');
      return;
    }

    // 3. Check for complete students
    const validStudents = students.filter(s => 
      s.firstName && s.lastName && s.grade && s.schoolName && s.dob && s.sport
    );
    if (validStudents.length === 0) {
      Alert.alert('Error', 'Please add at least one student with all required fields');
      return;
    }

    setLoading(true);

    try {
      // 3. Prepare data for backend
      const firstStudentSport = validStudents[0]?.sport || '';
      const registrationData: RegistrationData = {
        parentFirstName,
        parentLastName,
        firstName: parentFirstName,
        lastName: parentLastName,
        email,
        password,
        phone,
        location,
        sport: firstStudentSport,
        membershipType: 'free',
        students: validStudents.map(s => ({
          firstName: s.firstName,
          lastName: s.lastName,
          grade: s.grade,
          schoolName: s.schoolName,
          dob: s.dob,
          ageGroup: getAgeGroup(s.grade),
          sport: s.sport
        })),
        expoPushTokens: pushToken ? [pushToken] : undefined
      };

      // 4. Call registerMember function
      const result = await registerMember(registrationData);

      if (result.success) {
        // Save user data to context
        const memberData: Member = {
          firstName: parentFirstName,
          lastName: parentLastName,
          email,
          phone,
          location,
          sport: firstStudentSport,
          membershipType: 'free',
          registrationSource: 'mobile',
          createdAt: new Date(),
          students: validStudents.map(s => ({
            firstName: s.firstName,
            lastName: s.lastName,
            grade: s.grade,
            grade_band: getAgeGroup(s.grade).replace(' ', ''), // Convert "Band 1" to "Band1"
            school_name: s.schoolName,
            dob: s.dob,
            ageGroup: getAgeGroup(s.grade),
            sport: s.sport
          }))
        };
        
        await setUser(memberData);
        
        Alert.alert(
          'Success',
          'Registration completed successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(tabs)/messages');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      if (__DEV__) console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addStudent = () => {
    setStudents([...students, { firstName: '', lastName: '', grade: '', schoolName: '', dob: '', sport: '', errors: {} }]);
  };

  const removeStudent = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const updateStudent = (index: number, field: keyof StudentForm, value: string | School | string[]) => {
    const updatedStudents = [...students];
    (updatedStudents[index] as any)[field] = value;
    // Clear error for this field when user updates it
    if (updatedStudents[index].errors && field in updatedStudents[index].errors) {
      (updatedStudents[index].errors as any)[field] = undefined;
    }
    setStudents(updatedStudents);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F4FF' }}>
      <LinearGradient
        colors={['#1565C0', '#1976D2', '#42A5F5']}
        style={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 48, alignItems: 'center' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: 44, height: 44, borderRadius: 8 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 }}>YAU SPORTS</Text>
        </View>

        <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>Register!</Text>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>Create a new account</Text>
        
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={{ fontSize: 40 }}>🏟️</Text>
          <Text style={{ fontSize: 40 }}>🥇</Text>
        </View>
      </LinearGradient>

      {/* Wave divider */}
      <View style={{ height: 36, backgroundColor: '#F0F4FF', marginTop: -36, borderTopLeftRadius: 36, borderTopRightRadius: 36 }} />

      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Parent Information Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Parent Information</Text>
          
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <AppInput placeholder="First Name" value={parentFirstName} onChangeText={setParentFirstName} />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput placeholder="Last Name" value={parentLastName} onChangeText={setParentLastName} />
            </View>
          </View>

          <View style={{ marginBottom: 10 }}>
            <AppInput placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          </View>

          <View style={{ marginBottom: 10 }}>
            <AppInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
          </View>

          <View style={{ marginBottom: 10 }}>
            <AppInput placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10, paddingHorizontal: 4 }}>
            <TouchableOpacity onPress={() => setIsCountryModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>{selectedCountry.flag}</Text>
              <Text style={{ fontSize: 14, color: '#374151', marginRight: 4 }}>{selectedCountry.dialCode}</Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>▼</Text>
            </TouchableOpacity>
            <View style={{ width: 1, height: 24, backgroundColor: '#D1D5DB', marginHorizontal: 4 }} />
            <AppInput
              style={{ flex: 1, borderBottomWidth: 0, paddingLeft: 8, height: 48 }}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <AppInput placeholder="Location" value={location} onChangeText={setLocation} />
        </View>

        {/* Student Information Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Student Information</Text>
            <TouchableOpacity onPress={addStudent} style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: '#1565C0', fontWeight: '700', fontSize: 12 }}>+ Add Student</Text>
            </TouchableOpacity>
          </View>

          {students.map((student, index) => (
            <View key={index} style={{ borderBottomWidth: index === students.length - 1 ? 0 : 1, borderBottomColor: '#F3F4F6', paddingBottom: index === students.length - 1 ? 0 : 16, marginBottom: index === students.length - 1 ? 0 : 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#4B5563' }}>Student {index + 1}</Text>
                {students.length > 1 && (
                  <TouchableOpacity onPress={() => removeStudent(index)}>
                    <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppInput placeholder="First Name" value={student.firstName} onChangeText={(value) => updateStudent(index, 'firstName', value)} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppInput placeholder="Last Name" value={student.lastName} onChangeText={(value) => updateStudent(index, 'lastName', value)} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    style={{ backgroundColor: student.errors?.grade ? '#FEF2F2' : '#F9FAFB', borderWidth: 1, borderColor: student.errors?.grade ? '#F87171' : '#E5E7EB', borderRadius: 12, height: 48, justifyContent: 'center', paddingHorizontal: 14 }}
                    onPress={() => handleGradeModalOpen(index)}
                  >
                    <Text style={{ color: student.grade ? '#111827' : '#9CA3AF', fontSize: 14 }}>{student.grade || 'Select Grade'}</Text>
                  </TouchableOpacity>
                  {student.errors?.grade && <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{student.errors.grade}</Text>}
                </View>
                
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, height: 48, justifyContent: 'center', paddingHorizontal: 14 }}
                    onPress={() => handleDatePickerOpen(index)}
                  >
                    <Text style={{ color: student.dob ? '#111827' : '#9CA3AF', fontSize: 14 }}>{student.dob || 'Date of Birth'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginBottom: 10 }}>
                <TouchableOpacity
                  style={{ backgroundColor: student.errors?.school ? '#FEF2F2' : '#F9FAFB', borderWidth: 1, borderColor: student.errors?.school ? '#F87171' : '#E5E7EB', borderRadius: 12, height: 48, justifyContent: 'center', paddingHorizontal: 14 }}
                  onPress={() => { setSelectedStudentIndex(index); setIsSchoolModalVisible(true); }}
                >
                  <Text style={{ color: student.schoolName ? '#111827' : '#9CA3AF', fontSize: 14 }}>{student.schoolName || 'Select School'}</Text>
                </TouchableOpacity>
                {student.errors?.school && <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{student.errors.school}</Text>}
              </View>

              {student.availableSports && student.availableSports.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <TouchableOpacity
                    style={{ backgroundColor: student.errors?.sport ? '#FEF2F2' : '#F9FAFB', borderWidth: 1, borderColor: student.errors?.sport ? '#F87171' : '#E5E7EB', borderRadius: 12, height: 48, justifyContent: 'center', paddingHorizontal: 14 }}
                    onPress={() => handleSportModalOpen(index)}
                  >
                    <Text style={{ color: student.sport ? '#111827' : '#9CA3AF', fontSize: 14 }}>{student.sport || 'Select Sport'}</Text>
                  </TouchableOpacity>
                  {student.errors?.sport && <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{student.errors.sport}</Text>}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Complete button */}
        <TouchableOpacity 
          style={{ backgroundColor: '#E65100', borderRadius: 14, height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 3, shadowColor: '#E65100', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, opacity: loading ? 0.6 : 1 }}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 18, letterSpacing: 0.5 }}>Complete Registration</Text>
          )}
        </TouchableOpacity>
        
        {/* Already have an account */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 18 }}>
          <Text style={{ color: '#6B7280', fontSize: 14 }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login' as any)}>
            <Text style={{ color: '#1565C0', fontWeight: '700', fontSize: 14 }}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={{ paddingVertical: 12 }}
          onPress={async () => {
             await router.replace('/auth/login' as any);
          }}
        >
          <Text style={{ textAlign: 'center', color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Clear Session & Return to Login</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginTop: 12, paddingHorizontal: 16 }}>
          By registering, you agree to the YAU Terms of Service and Privacy Policy.
        </Text>


      {/* School Selection Modal */}
      <Modal
        visible={isSchoolModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSchoolModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[70%] p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Select School</Text>
              <TouchableOpacity onPress={() => setIsSchoolModalVisible(false)}>
                <Text className="text-blue-600 font-semibold text-lg">Close</Text>
              </TouchableOpacity>
            </View>
            
            {schools.length === 0 ? (
              <Text className="text-gray-500 text-center py-8">No schools available</Text>
            ) : (
              <FlatList
                data={schools}
                keyExtractor={(item: School, index: number) => item.id || item.name || index.toString()}
                renderItem={({ item }: { item: School }) => (
                  <TouchableOpacity
                    className="p-4 border-b border-gray-100"
                    onPress={() => handleSchoolSelect(item)}
                  >
                    <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
                    <Text className="text-sm text-gray-500">{item.location}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Sport Selection Modal */}
      <Modal
        visible={isSportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSportModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[70%] p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Select Sport</Text>
              <TouchableOpacity onPress={() => setIsSportModalVisible(false)}>
                <Text className="text-blue-600 font-semibold text-lg">Close</Text>
              </TouchableOpacity>
            </View>
            
            {availableSportsForModal.length === 0 ? (
              <Text className="text-gray-500 text-center py-8">No sports available</Text>
            ) : (
              <FlatList
                data={availableSportsForModal}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="p-4 border-b border-gray-100"
                    onPress={() => handleSportSelect(item)}
                  >
                    <Text className="text-base font-semibold text-gray-900">{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Grade Selection Modal */}
      <Modal
        visible={isGradeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsGradeModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[70%] p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Select Grade</Text>
              <TouchableOpacity onPress={() => setIsGradeModalVisible(false)}>
                <Text className="text-blue-600 font-semibold text-lg">Close</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={GRADE_OPTIONS}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="p-4 border-b border-gray-100"
                  onPress={() => handleGradeSelect(item)}
                >
                  <Text className="text-base font-semibold text-gray-900">{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Country Selection Modal */}
      <Modal
        visible={isCountryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCountryModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[70%] p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Select Country</Text>
              <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                <Text className="text-blue-600 font-semibold text-lg">Close</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="p-4 border-b border-gray-100"
                  onPress={() => handleCountrySelect(item)}
                >
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">{item.flag}</Text>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
                      <Text className="text-sm text-gray-500">{item.dialCode}</Text>
                    </View>
                    {selectedCountry.code === item.code && (
                      <Text className="text-blue-600 text-lg">✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal for iOS */}
      {Platform.OS === 'ios' && isDatePickerVisible && datePickerIndex !== null && (
        <Modal
          visible={isDatePickerVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsDatePickerVisible(false)}
        >
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-3xl p-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-900">Select Date of Birth</Text>
                <TouchableOpacity onPress={() => setIsDatePickerVisible(false)}>
                  <Text className="text-blue-600 font-semibold text-lg">Cancel</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={students[datePickerIndex].dob ? new Date(students[datePickerIndex].dob) : new Date()}
                mode="date"
                onChange={handleDateChange}
                maximumDate={new Date()}
                display="spinner"
                style={{ width: '100%' }}
              />
              <TouchableOpacity
                className="bg-blue-500 py-3 rounded-xl mt-4"
                onPress={() => setIsDatePickerVisible(false)}
              >
                <Text className="text-white font-semibold text-center">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker for Android */}
      {Platform.OS === 'android' && isDatePickerVisible && datePickerIndex !== null && (
        <DateTimePicker
          value={students[datePickerIndex].dob ? new Date(students[datePickerIndex].dob) : new Date()}
          mode="date"
          onChange={handleDateChange}
          maximumDate={new Date()}
          display="default"
        />
      )}
      </ScrollView>
    </View>
  );
}
