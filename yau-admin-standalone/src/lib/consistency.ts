import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

export const getGradeBand = (grade: string): string => {
  if (!grade) return 'Band 1';
  const g = grade.toString().toLowerCase().trim();
  
  if (g.includes('k') || g.includes('kindergarten') || g.includes('pre')) return 'Band 1';
  
  const num = parseInt(g.replace(/\D/g, ''));
  if (!isNaN(num)) {
    if (num <= 1) return 'Band 1';
    if (num <= 3) return 'Band 2';
    if (num <= 5) return 'Band 3';
    if (num <= 8) return 'Band 4';
  }
  
  if (g.includes('1')) return 'Band 1';
  if (g.includes('2') || g.includes('3')) return 'Band 2';
  if (g.includes('4') || g.includes('5')) return 'Band 3';
  if (g.includes('6') || g.includes('7') || g.includes('8')) return 'Band 4';
  
  return 'Band 1';
};

export const migrateSchedules = async (): Promise<{ success: boolean; count: number }> => {
  try {
    const snapshot = await getDocs(collection(db, 'schedules'));
    let count = 0;
    const batch = writeBatch(db);
    
    snapshot.forEach((snapshotDoc) => {
      const data = snapshotDoc.data();
      if (!data.grade_band) {
        // Try to derive from ageGroup or ageGroups
        let gradeToMap = '';
        if (data.ageGroup) {
          gradeToMap = data.ageGroup;
        } else if (data.ageGroups && data.ageGroups.length > 0) {
          gradeToMap = data.ageGroups[0];
        }
        
        const band = getGradeBand(gradeToMap);
        batch.update(doc(db, 'schedules', snapshotDoc.id), {
          grade_band: band
        });
        count++;
      }
    });
    
    await batch.commit();
    return { success: true, count };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, count: 0 };
  }
};
