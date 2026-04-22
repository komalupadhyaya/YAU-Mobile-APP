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

// Fetch locations from Firestore locations collection (one-time fetch)
export async function fetchSchools(): Promise<School[]> {
  try {
    const locationsRef = collection(db, 'locations');
    const snapshot = await getDocs(locationsRef);
    
    const schools: School[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      schools.push({
        id: doc.id,
        name: data.name || '',
        schoolKey: data.name || '',
        location: data.city || data.address || data.location || '',
        sports: data.sports || ['Basketball', 'Volleyball'], // Default sports if not specified
        isActive: data.isActive !== false
      });
    });
    
    // Sort alphabetically
    schools.sort((a: School, b: School) => a.name.localeCompare(b.name));
    
    return schools;
  } catch (error) {
    if (DEV) console.error('[Schools Firestore] Error fetching locations:', error);
    return [];
  }
}

// Subscribe to locations from Firestore locations collection with real-time listener
export function subscribeToSchools(callback: (schools: School[]) => void): () => void {
  try {
    const locationsRef = collection(db, 'locations');
    
    const unsubscribe = onSnapshot(locationsRef, (snapshot) => {
      const schools: School[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        schools.push({
          id: doc.id,
          name: data.name || '',
          schoolKey: data.name || '',
          location: data.city || data.address || data.location || '',
          sports: data.sports || ['Basketball', 'Volleyball'],
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
