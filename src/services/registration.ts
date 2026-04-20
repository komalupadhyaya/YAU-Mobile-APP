import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Member, Student } from '../types';
import { generateGroupId, getGradeBand } from '../utils/group';
import { db } from './firebase';

export interface RegistrationData {
  parentFirstName: string;
  parentLastName: string;
  email: string;
  phone: string;
  location: string;
  sport: string;
  membershipType: 'paid' | 'free';
  students: {
    firstName: string;
    lastName: string;
    grade: string;
    schoolName: string;
    dob: string;
    ageGroup?: string;
    sport: string;
  }[];
  expoPushTokens?: string[];
}

function calculateAgeGroup(grade: string): string {
  const gradeNum = parseInt(grade);
  if (isNaN(gradeNum)) {
    // Handle K, 1st, 2nd, etc.
    const gradeLower = grade.toLowerCase();
    if (gradeLower.includes('k') || gradeLower.includes('kindergarten')) return 'Band 1';
    if (gradeLower.includes('1st') || gradeLower === '1') return 'Band 1';
    if (gradeLower.includes('2nd') || gradeLower === '2') return 'Band 2';
    if (gradeLower.includes('3rd') || gradeLower === '3') return 'Band 2';
    if (gradeLower.includes('4th') || gradeLower === '4') return 'Band 3';
    if (gradeLower.includes('5th') || gradeLower === '5') return 'Band 3';
    if (gradeLower.includes('6th') || gradeLower === '6') return 'Band 4';
    if (gradeLower.includes('7th') || gradeLower === '7') return 'Band 4';
    if (gradeLower.includes('8th') || gradeLower === '8') return 'Band 4';
    return 'Band 1'; // Default
  }
  
  if (gradeNum <= 1) return 'Band 1';
  if (gradeNum <= 3) return 'Band 2';
  if (gradeNum <= 5) return 'Band 3';
  return 'Band 4';
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 1, assume US and format as +1XXXXXXXXXX
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it already has 11 digits and starts with 1
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // Return as-is if it doesn't match expected patterns
  return phone;
}

function validateRegistrationData(data: RegistrationData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.parentFirstName.trim()) errors.push('Parent first name is required');
  if (!data.parentLastName.trim()) errors.push('Parent last name is required');
  if (!data.email.trim()) errors.push('Email is required');
  if (!data.phone.trim()) errors.push('Phone is required');
  if (!data.location.trim()) errors.push('Location is required');
  if (!data.sport.trim()) errors.push('Sport is required');
  
  if (data.students.length === 0) {
    errors.push('At least one student is required');
  } else {
    data.students.forEach((student, index) => {
      if (!student.firstName.trim()) errors.push(`Student ${index + 1} first name is required`);
      if (!student.lastName.trim()) errors.push(`Student ${index + 1} last name is required`);
      if (!student.grade.trim()) errors.push(`Student ${index + 1} grade is required`);
      if (!student.schoolName.trim()) errors.push(`Student ${index + 1} school name is required`);
      if (!student.dob.trim()) errors.push(`Student ${index + 1} date of birth is required`);
      
      // Validate that school, sport, and grade are present for groupId generation
      if (!student.schoolName.trim()) errors.push(`Student ${index + 1} school is required for group assignment`);
      if (!data.sport.trim()) errors.push(`Student ${index + 1} sport is required for group assignment`);
      if (!student.grade.trim()) errors.push(`Student ${index + 1} grade is required for group assignment`);
    });
  }
  
  return { valid: errors.length === 0, errors };
}

export async function registerMember(data: RegistrationData): Promise<{ success: boolean; error?: string; memberId?: string }> {
  try {
    // 1. Validate fields
    const validation = validateRegistrationData(data);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(', ') };
    }
    
    // 2. Transform UI data to backend structure
    const students: Student[] = data.students.map(student => {
      const schoolName = student.schoolName.trim();
      const grade = student.grade.trim();
      // Ensure sport consistency: use student's sport if available, otherwise use parent's sport
      const sport = (student.sport && student.sport.trim()) || data.sport.trim();
      
      // Generate groupId based on school, grade band, and sport
      const groupId = generateGroupId(schoolName, grade, sport);
      
      if (!groupId) {
        throw new Error(`Invalid grade for student ${student.firstName} ${student.lastName}. Please select a valid grade between Kindergarten and 8th Grade.`);
      }
      
      // Calculate grade_band from grade using getGradeBand utility
      const grade_band = getGradeBand(grade) || 'Band1';
      
      return {
        firstName: student.firstName.trim(),
        lastName: student.lastName.trim(),
        grade: grade,
        grade_band: grade_band,
        school_name: schoolName,
        dob: student.dob.trim(),
        ageGroup: student.ageGroup || calculateAgeGroup(grade),
        sport: sport,
        groupId
      };
    });
    
    const memberData: Omit<Member, 'createdAt'> = {
      firstName: data.parentFirstName.trim(),
      lastName: data.parentLastName.trim(),
      email: data.email.trim(),
      phone: formatPhoneNumber(data.phone),
      location: data.location.trim(),
      sport: data.sport.trim(),
      membershipType: data.membershipType,
      registrationSource: 'mobile',
      students
    };
    
    // Add Expo push tokens if available (support multiple devices)
    if (data.expoPushTokens && data.expoPushTokens.length > 0) {
      memberData.expoPushTokens = data.expoPushTokens;
    }
    
    // 3. Call addDoc with serverTimestamp
    const docRef = await addDoc(collection(db, 'members'), {
      ...memberData,
      createdAt: serverTimestamp()
    });
    
    return { success: true, memberId: docRef.id };
  } catch (error) {
    if (__DEV__) console.error('Registration error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Registration failed' 
    };
  }
}
