import DateTimePicker from '@react-native-community/datetimepicker';
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
    '1st Grade': 'Band 2',
    '2nd Grade': 'Band 2',
    '3rd Grade': 'Band 3',
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
    const updatedStudents = students.map(s => ({ ...s, errors: {} }));
    setStudents(updatedStudents);

    // 1. Validate parent fields
    if (!parentFirstName || !parentLastName || !email || !phone || !location) {
      Alert.alert('Error', 'Please fill in all parent fields');
      return;
    }

    // 2. Validate students with field-level errors
    let hasErrors = false;
    let firstErrorIndex = -1;

    const validatedStudents = students.map((student, index) => {
      const errors: { grade?: string; school?: string; sport?: string } = {};

      // Validate grade
      if (!student.grade) {
        errors.grade = 'Grade is required';
        hasErrors = true;
        if (firstErrorIndex === -1) firstErrorIndex = index;
      } else if (!GRADE_OPTIONS.includes(student.grade)) {
        errors.grade = 'Please select a valid grade between Kindergarten and 8th Grade';
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

      return { ...student, errors };
    });

    if (hasErrors) {
      setStudents(validatedStudents);
      Alert.alert('Error', 'Please fix the highlighted errors');
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
        email,
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
        
        setUser(memberData);
        
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
    <ScrollView 
      className="flex-1 bg-gray-50 p-6" 
      keyboardShouldPersistTaps="handled"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="mb-8 mt-12 items-center">
        <Image 
          source={require('../../assets/images/icon.png')}
          style={{ width: 80, height: 80, borderRadius: 16, marginBottom: 16 }}
          resizeMode="cover"
        />
        <Text className="text-3xl font-bold text-blue-900 mb-2">Register</Text>
        <Text className="text-gray-600 text-base text-center">Setup your Youth Athlete profile.</Text>
      </View>

      {/* Parent Information */}
      <View className="bg-white p-4 rounded-2xl shadow-sm mb-6 border border-gray-100">
        <Text className="text-lg font-semibold text-gray-800 mb-4">Parent Information</Text>
        
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <AppInput
              placeholder="First Name"
              value={parentFirstName}
              onChangeText={setParentFirstName}
            />
          </View>
          <View className="flex-1">
            <AppInput
              placeholder="Last Name"
              value={parentLastName}
              onChangeText={setParentLastName}
            />
          </View>
        </View>

        <AppInput
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          className="mb-4"
        />

        <View className="bg-gray-50 p-4 mt-1 rounded-xl mb-4 border border-gray-200 flex-row items-center">
          <TouchableOpacity 
            onPress={() => setIsCountryModalVisible(true)}
            className="flex-row items-center"
          >
            <Text className="text-gray-600 mr-1">{selectedCountry.flag}</Text>
            <Text className="text-gray-600 mr-2">{selectedCountry.dialCode}</Text>
            <Text className="text-gray-400">▼</Text>
          </TouchableOpacity>
          <View className="w-px h-6 bg-gray-300 mx-2" />
          <AppInput
            className="flex-1"
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Location (manual entry) */}
        <AppInput
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      {/* Students Section */}
      <View className="bg-white p-4 rounded-2xl shadow-sm mb-6 border border-gray-100">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold text-gray-800">Student Information</Text>
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-lg"
            onPress={addStudent}
          >
            <Text className="text-white font-semibold text-sm">+ Add Student</Text>
          </TouchableOpacity>
        </View>

        {students.map((student, index) => (
          <View key={index} className="border-b border-gray-100 pb-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-medium text-gray-700">Student {index + 1}</Text>
              {students.length > 1 && (
                <TouchableOpacity
                  className="text-red-500 text-sm"
                  onPress={() => removeStudent(index)}
                >
                  <Text>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <AppInput
                  placeholder="First Name"
                  value={student.firstName}
                  onChangeText={(value) => updateStudent(index, 'firstName', value)}
                />
              </View>
              <View className="flex-1">
                <AppInput
                  placeholder="Last Name"
                  value={student.lastName}
                  onChangeText={(value) => updateStudent(index, 'lastName', value)}
                />
              </View>
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <TouchableOpacity
                  className={`p-3 rounded-xl text-sm border ${student.errors?.grade ? 'border-red-500 bg-red-50' : 'bg-gray-50 border-gray-200'}`}
                  onPress={() => handleGradeModalOpen(index)}
                >
                  <Text className={student.grade ? 'text-sm text-gray-800' : 'text-sm text-gray-400'}>
                    {student.grade || 'Select Grade'}
                  </Text>
                </TouchableOpacity>
                {student.errors?.grade && (
                  <Text className="text-red-500 text-xs mt-1">{student.errors.grade}</Text>
                )}
              </View>
              <View className="flex-1">
                <TouchableOpacity
                  className="bg-gray-50 p-3 rounded-xl text-sm border border-gray-200 flex-row items-center"
                  onPress={() => handleDatePickerOpen(index)}
                >
                  <Text className="flex-1 text-sm text-gray-800">
                    {student.dob || 'Date of Birth'}
                  </Text>
                  <Text className="text-gray-500"></Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className={`p-3 rounded-xl text-sm border mb-3 ${student.errors?.school ? 'border-red-500 bg-red-50' : 'bg-gray-50 border-gray-200'}`}
              onPress={() => {
                setSelectedStudentIndex(index);
                setIsSchoolModalVisible(true);
              }}
            >
              <Text className={student.schoolName ? 'text-sm text-gray-800' : 'text-sm text-gray-400'}>
                {student.schoolName || 'Select School'}
              </Text>
            </TouchableOpacity>
            {student.errors?.school && (
              <Text className="text-red-500 text-xs mb-3">{student.errors.school}</Text>
            )}

            {student.availableSports && student.availableSports.length > 0 && (
              <>
                <TouchableOpacity
                  className={`p-3 rounded-xl text-sm border ${student.errors?.sport ? 'border-red-500 bg-red-50' : 'bg-gray-50 border-gray-200'}`}
                  onPress={() => handleSportModalOpen(index)}
                >
                  <Text className={student.sport ? 'text-sm text-gray-800' : 'text-sm text-gray-400'}>
                    {student.sport || 'Select Sport'}
                  </Text>
                </TouchableOpacity>
                {student.errors?.sport && (
                  <Text className="text-red-500 text-xs">{student.errors.sport}</Text>
                )}
              </>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity 
        className="bg-[#F97316] py-4 rounded-2xl shadow-md align-middle flex items-center justify-center"
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg text-center">Complete Registration</Text>
        )}
      </TouchableOpacity>
      
      <Text className="text-center text-textSecondary text-xs mt-6 pb-40 px-4">
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
  );
}
