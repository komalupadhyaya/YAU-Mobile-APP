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
  role?: 'admin' | 'coach';
  replyCount?: number;
  unreadCount?: number;
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

export const MOCK_ADMIN_POSTS: AdminPost[] = [
  {
    id: 'mock1',
    title: 'Summer Season Update',
    description: 'Registration for the summer basketball season is now open. Sign up early for discounts!',
    timestamp: { toDate: () => new Date(Date.now() - 3600000) } as any,
    role: 'admin',
    readBy: [],
    unreadCount: 3
  },
  {
    id: 'mock2',
    title: 'Game Time Changed',
    description: 'The game scheduled for Saturday has been moved to 2 PM.',
    timestamp: { toDate: () => new Date(Date.now() - 86400000) } as any,
    role: 'coach',
    readBy: [],
    unreadCount: 0
  },
  {
    id: 'mock3',
    title: 'Uniform Distribution',
    description: 'Please pick up your uniforms at the main gym today.',
    timestamp: { toDate: () => new Date(Date.now() - 172800000) } as any,
    role: 'admin',
    readBy: [],
    unreadCount: 1
  },
  {
    id: 'mock4',
    title: 'Practice Canceled',
    description: 'Due to rain, today\'s field practice is canceled. See you on Monday!',
    timestamp: { toDate: () => new Date(Date.now() - 259200000) } as any,
    role: 'coach',
    readBy: [],
    unreadCount: 5
  }
];

// In-memory storage for mock replies (demo persistence)
const mockRepliesStore: Record<string, MessageReply[]> = {
  'mock1': [
    { id: 'm1', postId: 'mock1', content: 'Thank you for the update! We will be there.', userName: 'Test Parent', userId: 'other', timestamp: Date.now() - 100000, userRole: 'parent' },
    { id: 'm2', postId: 'mock1', content: 'Great, see you then!', userName: 'Coach Smith', userId: 'coach1', timestamp: Date.now() - 50000, userRole: 'coach' }
  ],
  'mock2': [
    { id: 'm1', postId: 'mock2', content: 'Can we move it to 3 PM?', userName: 'Test Parent', userId: 'other', timestamp: Date.now() - 100000, userRole: 'parent' }
  ],
  'mock3': [],
  'mock4': []
};

const mockReadState: Record<string, string[]> = {}; // { postId: [userIds] }

export const sendReply = async (postId: string, userId: string, userName: string, userRole: 'parent' | 'coach' | 'admin', content: string) => {
  try {
    const { collection, addDoc, serverTimestamp, increment, updateDoc, doc } = await import('firebase/firestore');
    
    // 1. Add reply to sub-collection
    if (!postId.startsWith('mock')) {
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
    } else {
      // Persist mock reply in memory for the session
      if (!mockRepliesStore[postId]) mockRepliesStore[postId] = [];
      mockRepliesStore[postId].push({
        id: Date.now().toString(),
        postId,
        userId,
        userName,
        userRole,
        content,
        timestamp: Date.now()
      });
      console.log("[Mock Message] Simulation of sending reply to:", postId);
    }
  } catch (error) {
    console.error("Error sending reply:", error);
    throw error;
  }
};

export const subscribeToReplies = (postId: string, callback: (replies: MessageReply[]) => void) => {
  if (postId.startsWith('mock')) {
    callback(mockRepliesStore[postId] || []);
    return () => {};
  }
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
  if (!messageId || !userId) return;
  if (messageId.startsWith('mock')) {
    if (!mockReadState[messageId]) mockReadState[messageId] = [];
    if (!mockReadState[messageId].includes(userId)) {
      mockReadState[messageId].push(userId);
    }
    return;
  }
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

export const isMessageRead = (message: AdminPost, userId: string) => {
  if (!userId) return false;
  if (message.id.startsWith('mock')) {
    return mockReadState[message.id]?.includes(userId) || message.readBy?.includes(userId);
  }
  return message.readBy?.includes(userId);
};

export const getTotalUnreadCount = (realMessages: AdminPost[], userId: string) => {
  if (!userId) return 0;
  
  // Use real messages if they exist, otherwise use mocks
  const pool = realMessages.length > 0 ? realMessages : MOCK_ADMIN_POSTS;
  
  return pool.reduce((acc, msg) => {
    if (!isMessageRead(msg, userId)) {
      return acc + (msg.unreadCount || 1);
    }
    return acc;
  }, 0);
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
