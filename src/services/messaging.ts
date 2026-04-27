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
  description: string;
  imageUrl?: string;
  timestamp: any;
  createdAt?: any;
  targetSport?: string;
  targetLocation?: string;
  targetAgeGroup?: string;
  targetGroups?: { school: string; gradeBand: string; sport: string }[];
  readBy?: string[]; // Array of user UIDs who have read this
  type?: 'admin' | 'team';
  replyCount?: number;
}

export interface MessageReply {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userRole: 'parent' | 'coach' | 'admin';
  content: string;
  timestamp: any;
}

export const sendReply = async (postId: string, userId: string, userName: string, userRole: 'parent' | 'coach' | 'admin', content: string) => {
  try {
    const { collection, addDoc, serverTimestamp, increment, updateDoc, doc } = await import('firebase/firestore');
    
    // 1. Add reply to sub-collection
    const repliesRef = collection(db, "admin_posts", postId, "replies");
    await addDoc(repliesRef, {
      userId,
      userName,
      userRole,
      content,
      timestamp: serverTimestamp()
    });

    // 2. Increment reply count on parent post
    const postRef = doc(db, "admin_posts", postId);
    await updateDoc(postRef, {
      replyCount: increment(1)
    });
  } catch (error) {
    console.error("Error sending reply:", error);
    throw error;
  }
};

export const subscribeToReplies = (postId: string, callback: (replies: MessageReply[]) => void) => {
  const { collection, query, orderBy, onSnapshot } = require('firebase/firestore');
  const repliesRef = collection(db, "admin_posts", postId, "replies");
  const q = query(repliesRef, orderBy("timestamp", "asc"));

  return onSnapshot(q, (snapshot: any) => {
    const replies: MessageReply[] = [];
    snapshot.forEach((doc: any) => {
      replies.push({ id: doc.id, postId, ...doc.data() } as MessageReply);
    });
    callback(replies);
  });
};

export const markMessageAsRead = async (messageId: string, userId: string) => {
  try {
    const { arrayUnion, updateDoc, doc } = await import('firebase/firestore');
    const docRef = doc(db, "admin_posts", messageId);
    await updateDoc(docRef, {
      readBy: arrayUnion(userId)
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
  }
};

export const subscribeToMessages = (userGroupIds: string[], userSport?: string, userLocation?: string, userGrade?: string, callback?: (messages: AdminPost[]) => void) => {
  const messagesRef = collection(db, "admin_posts");
  const q = query(
    messagesRef,
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const msgs: AdminPost[] = [];
    
    const normalizedUserSport = userSport ? normalize(userSport) : '';
    const normalizedUserLocation = userLocation ? normalize(userLocation) : '';
    const normalizedUserGrade = userGrade ? normalize(userGrade) : '';
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      
      // 1. Check Multi-Group Targeting (New)
      if (data.targetGroups && Array.isArray(data.targetGroups)) {
        const matches = data.targetGroups.some((g: any) => {
          const mSchool = g.school === 'all' || !!(normalizedUserLocation && normalize(normalizedUserLocation).includes(normalize(g.school)));
          const mGrade = g.gradeBand === 'all' || !!(normalizedUserGrade && normalize(normalizedUserGrade) === normalize(g.gradeBand));
          const mSport = g.sport === 'all' || !!(normalizedUserSport && normalize(normalizedUserSport) === normalize(g.sport));
          return mSchool && mGrade && mSport;
        });
        if (matches) {
          msgs.push({ id, ...data } as AdminPost);
        }
        return;
      }

      // 2. Check Legacy Target Fields (Fallback)
      const targetSport = data.targetSport ?? 'all';
      const targetLocation = data.targetLocation ?? 'all';
      const targetAgeGroup = data.targetAgeGroup ?? 'all';

      if (targetSport !== 'all' || targetLocation !== 'all' || targetAgeGroup !== 'all') {
        let matches = true;
        if (targetSport && targetSport !== "all") {
          matches = matches && (normalizedUserSport === normalize(targetSport));
        }
        if (targetLocation && targetLocation !== "all") {
          matches = matches && !!(normalizedUserLocation && normalize(normalizedUserLocation).includes(normalize(targetLocation)));
        }
        if (targetAgeGroup && targetAgeGroup !== "all") {
          matches = matches && !!(normalizedUserGrade && normalize(normalizedUserGrade) === normalize(targetAgeGroup));
        }
        if (matches) {
          msgs.push({ id, ...data } as AdminPost);
        }
        return;
      }
      
      // 3. Global Message
      msgs.push({ id, ...data } as AdminPost);
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
