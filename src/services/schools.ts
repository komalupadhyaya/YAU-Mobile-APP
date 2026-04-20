import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';

const DEV = __DEV__;

export interface School {
  id?: string;
  name: string;
  schoolKey: string; // Confirmed backend field
  location: string; // REQUIRED per confirmed schema
  sports: string[];
  isActive: boolean;
}

// Fetch schools from Firestore app_schools collection (one-time fetch)
export async function fetchSchools(): Promise<School[]> {
  try {
    const schoolsRef = collection(db, 'app_schools');
    const q = query(schoolsRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    const schools: School[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      schools.push({
        id: doc.id,
        name: data.name || '',
        schoolKey: data.schoolKey || data.name || '',
        location: data.location || data.name || '',
        sports: data.sports || [],
        isActive: data.isActive !== false
      });
    });
    
    // Sort alphabetically
    schools.sort((a: School, b: School) => a.name.localeCompare(b.name));
    
    return schools;
  } catch (error) {
    if (DEV) console.error('[Schools Firestore] Error fetching schools:', error);
    return [];
  }
}

// Subscribe to schools from Firestore app_schools collection with real-time listener
export function subscribeToSchools(callback: (schools: School[]) => void): () => void {
  try {
    const schoolsRef = collection(db, 'app_schools');
    const q = query(schoolsRef, where('isActive', '==', true));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schools: School[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        schools.push({
          id: doc.id,
          name: data.name || '',
          schoolKey: data.schoolKey || data.name || '',
          location: data.location || data.name || '',
          sports: data.sports || [],
          isActive: data.isActive !== false
        });
      });
      
      // Sort alphabetically
      schools.sort((a: School, b: School) => a.name.localeCompare(b.name));
      
      callback(schools);
    }, (error) => {
      if (DEV) console.error('[Schools Firestore] Real-time listener error:', error);
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    if (DEV) console.error('[Schools Firestore] Error setting up real-time listener:', error);
    callback([]);
    return () => {};
  }
}
