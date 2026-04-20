import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";

const DEV = __DEV__;

// Normalize string for consistent comparison
const normalize = (str: string | any): string => {
  if (!str) return '';
  // Handle arrays by joining them
  if (Array.isArray(str)) {
    str = str.join('_');
  }
  // Convert to string if not already
  const strValue = String(str);
  return strValue
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_");
};

export interface AdminPost {
  id: string;
  title: string;
  description: string; // Confirmed backend field (was body)
  imageUrl?: string; // Confirmed backend field (was image)
  timestamp: any; // Firestore Timestamp
  createdAt?: any; // Firestore Timestamp (alternative field)
  targetSport?: string; // Target sport for filtering
  targetLocation?: string; // Target location for filtering
  targetAgeGroup?: string; // Target age group for filtering
  type?: 'admin' | 'team'; // Message type (derived from target fields)
}

export const getMessagesForGroup = async (userGroupIds: string[], userSport?: string, userLocation?: string, userGrade?: string): Promise<AdminPost[]> => {
  try {
    const messagesRef = collection(db, "admin_posts");
    const q = query(
      messagesRef,
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    const messages: AdminPost[] = [];
    
    // Normalize user data for consistent comparison
    const normalizedUserSport = userSport ? normalize(userSport) : '';
    const normalizedUserLocation = userLocation ? normalize(userLocation) : '';
    const normalizedUserGrade = userGrade ? normalize(userGrade) : '';
    
    if (DEV) console.log("User sport:", normalizedUserSport);
    if (DEV) console.log("User location:", normalizedUserLocation);
    if (DEV) console.log("User grade:", normalizedUserGrade);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Normalize data with fallbacks to prevent undefined values
      const normalizedData = {
        title: data.title || 'Untitled',
        description: data.description || '',
        imageUrl: data.imageUrl || undefined,
        timestamp: data.timestamp,
        createdAt: data.createdAt,
        targetSport: data.targetSport ?? 'all',
        targetLocation: data.targetLocation ?? 'all',
        targetAgeGroup: data.targetAgeGroup ?? 'all',
      };
      
      if (DEV) console.log("Message:", data.id, normalizedData.title, normalizedData.targetSport, normalizedData.targetLocation, normalizedData.targetAgeGroup);
      
      // Check if message has target fields (confirmed backend schema)
      if (normalizedData.targetSport !== 'all' || normalizedData.targetLocation !== 'all' || normalizedData.targetAgeGroup !== 'all') {
        let matches = true;
        
        // Sport match (skip if "all")
        if (normalizedData.targetSport && normalizedData.targetSport !== "all") {
          if (normalizedUserSport) {
            matches = matches && normalizedUserSport === normalize(normalizedData.targetSport);
          } else {
            matches = false;
          }
        }
        
        // Location match (skip if "all")
        if (normalizedData.targetLocation && normalizedData.targetLocation !== "all") {
          if (normalizedUserLocation) {
            const normalizedMsgLocation = normalize(normalizedData.targetLocation);
            const normalizedUserLocationLower = normalizedUserLocation.toLowerCase();
            matches = matches && normalizedUserLocationLower.includes(normalizedMsgLocation);
          } else {
            matches = false;
          }
        }
        
        // AgeGroup/grade match (skip if "all")
        if (normalizedData.targetAgeGroup && normalizedData.targetAgeGroup !== "all") {
          if (normalizedUserGrade) {
            const normalizedAgeGroup = normalize(normalizedData.targetAgeGroup);
            matches = matches && normalizedUserGrade === normalizedAgeGroup;
          } else {
            matches = false;
          }
        }
        
        if (matches) {
          messages.push({ id: doc.id, ...normalizedData } as AdminPost);
        }
        return;
      }
      
      // GLOBAL MESSAGE: no target fields (visible to all users)
      messages.push({ id: doc.id, ...normalizedData } as AdminPost);
    });
    
    return messages;
  } catch (error) {
    if (DEV) console.error("Error fetching messages:", error);
    return [];
  }
};

export const subscribeToMessages = (userGroupIds: string[], userSport?: string, userLocation?: string, userGrade?: string, callback?: (messages: AdminPost[]) => void) => {
  const messagesRef = collection(db, "admin_posts");
  const q = query(
    messagesRef,
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const msgs: AdminPost[] = [];
    
    // Normalize user data for consistent comparison
    const normalizedUserSport = userSport ? normalize(userSport) : '';
    const normalizedUserLocation = userLocation ? normalize(userLocation) : '';
    const normalizedUserGrade = userGrade ? normalize(userGrade) : '';
    
    if (DEV) console.log("User sport:", normalizedUserSport);
    if (DEV) console.log("User location:", normalizedUserLocation);
    if (DEV) console.log("User grade:", normalizedUserGrade);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Normalize data with fallbacks to prevent undefined values
      const normalizedData = {
        title: data.title || 'Untitled',
        description: data.description || '',
        imageUrl: data.imageUrl || undefined,
        timestamp: data.timestamp,
        createdAt: data.createdAt,
        targetSport: data.targetSport ?? 'all',
        targetLocation: data.targetLocation ?? 'all',
        targetAgeGroup: data.targetAgeGroup ?? 'all',
      };
      
      if (DEV) console.log("Message:", data.id, normalizedData.title, normalizedData.targetSport, normalizedData.targetLocation, normalizedData.targetAgeGroup);
      
      // Check if message has target fields (confirmed backend schema)
      if (normalizedData.targetSport !== 'all' || normalizedData.targetLocation !== 'all' || normalizedData.targetAgeGroup !== 'all') {
        let matches = true;
        
        // Sport match (skip if "all")
        if (normalizedData.targetSport && normalizedData.targetSport !== "all") {
          if (normalizedUserSport) {
            matches = matches && normalizedUserSport === normalize(normalizedData.targetSport);
          } else {
            matches = false;
          }
        }
        
        // Location match (skip if "all")
        if (normalizedData.targetLocation && normalizedData.targetLocation !== "all") {
          if (normalizedUserLocation) {
            const normalizedMsgLocation = normalize(normalizedData.targetLocation);
            const normalizedUserLocationLower = normalizedUserLocation.toLowerCase();
            matches = matches && normalizedUserLocationLower.includes(normalizedMsgLocation);
          } else {
            matches = false;
          }
        }
        
        // AgeGroup/grade match (skip if "all")
        if (normalizedData.targetAgeGroup && normalizedData.targetAgeGroup !== "all") {
          if (normalizedUserGrade) {
            const normalizedAgeGroup = normalize(normalizedData.targetAgeGroup);
            matches = matches && normalizedUserGrade === normalizedAgeGroup;
          } else {
            matches = false;
          }
        }
        
        if (matches) {
          msgs.push({ id: doc.id, ...normalizedData } as AdminPost);
        }
        return;
      }
      
      // GLOBAL MESSAGE: no target fields (visible to all users)
      msgs.push({ id: doc.id, ...normalizedData } as AdminPost);
    });
    
    if (callback) callback(msgs);
  });
};

export const getMessageById = async (messageId: string): Promise<AdminPost | null> => {
  try {
    const docRef = doc(db, "admin_posts", messageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AdminPost;
    }
    
    return null;
  } catch (error) {
    if (DEV) console.error("Error fetching message by ID:", error);
    return null;
  }
};
