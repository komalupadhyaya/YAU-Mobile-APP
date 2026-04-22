
// DEV mode check for safe logging
const DEV = __DEV__;

// Normalize string for consistent groupId generation
const normalize = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_");
};

export const getGradeBand = (grade: string): string | null => {
  if (!grade) {
    if (DEV) console.error('getGradeBand: Grade is empty');
    return null;
  }
  
  const g = grade.toLowerCase().trim();
  
  // Try to extract numeric grade first
  const gradeNum = parseInt(g.replace(/[^0-9]/g, ''));
  
  if (!isNaN(gradeNum)) {
    if (gradeNum <= 1) return 'Band 1';
    if (gradeNum <= 3) return 'Band 2';
    if (gradeNum <= 5) return 'Band 3';
    if (gradeNum <= 8) return 'Band 4';
  }
  
  // Fallback to string matching for grades like "Kindergarten", "Pre-K"
  if (g.includes('k') || g.includes('kindergarten') || g.includes('pre')) return 'Band 1';
  if (g.includes('1')) return 'Band 1';
  if (g.includes('2') || g.includes('3')) return 'Band 2';
  if (g.includes('4') || g.includes('5')) return 'Band 3';
  if (g.includes('6') || g.includes('7') || g.includes('8')) return 'Band 4';

  if (DEV) console.error('getGradeBand: Invalid grade', { grade });
  return null;
};

export const generateGroupId = (school: string, grade: string, sport: string): string | null => {
  // Validation
  if (!school || !grade || !sport) {
    if (DEV) console.error('generateGroupId: Missing required fields', { school, grade, sport });
    return null;
  }
  
  const band = getGradeBand(grade);
  if (!band) {
    if (DEV) console.error('generateGroupId: Invalid grade', { grade });
    return null;
  }
  
  // Normalize all components
  const normalizedSchool = normalize(school);
  const normalizedSport = normalize(sport);
  
  // Generate groupId with consistent format
  const groupId = `${normalizedSchool}_${band}_${normalizedSport}`;
  
  if (DEV) console.log("Generated groupId:", groupId);
  
  return groupId;
};
