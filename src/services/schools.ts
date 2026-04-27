import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface School {
  id?: string;
  name: string;
  type?: 'school' | 'program';
  active?: boolean;
}

// Subscribe to active schools from app_schools Firestore collection in real time
export function subscribeToSchools(callback: (schools: School[]) => void): () => void {
  try {
    const q = query(
      collection(db, 'app_schools'),
      where('active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schools: School[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.deletedAt) {
          schools.push({
            id: doc.id,
            name: data.name || '',
            type: data.type || 'school',
            active: data.active !== false,
          });
        }
      });

      schools.sort((a, b) => a.name.localeCompare(b.name));
      callback(schools);
    }, (error) => {
      if (__DEV__) console.error('[Schools] Real-time listener error:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    if (__DEV__) console.error('[Schools] Error setting up listener:', error);
    callback([]);
    return () => {};
  }
}
