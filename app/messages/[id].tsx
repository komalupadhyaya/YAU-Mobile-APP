import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';
import { db } from '../../src/services/firebase';
import { AdminPost } from '../../src/services/messaging';

const DEV = __DEV__;

const styles = StyleSheet.create({
  messageImage: {
    width: 350,
    height: 200,
    borderRadius: 12,
  },
  imageErrorContainer: {
    width: 350,
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});

// Helper function to encode forward slashes in Firebase Storage URL path
const encodeFirebaseStoragePath = (url: string): string => {
  if (!url) return url;
  try {
    // Only encode the path AFTER /o/, not the entire URL
    // Firebase Storage requires encoded paths for the object path
    const oIndex = url.indexOf('/o/');
    if (oIndex === -1) return url;

    // Split the URL into: prefix (up to /o/) + object path + query params
    const prefix = url.substring(0, oIndex + 3); // include /o/
    const afterO = url.substring(oIndex + 3);

    // Split object path and query params
    const queryIndex = afterO.indexOf('?');
    let objectPath = afterO;
    let queryParams = '';

    if (queryIndex !== -1) {
      objectPath = afterO.substring(0, queryIndex);
      queryParams = afterO.substring(queryIndex);
    }

    // Encode forward slashes in the object path only
    const encodedPath = objectPath.replace(/\//g, '%2F');

    // Reassemble URL
    return prefix + encodedPath + queryParams;
  } catch (error) {
    if (DEV) console.error('[MessageDetail] Error encoding path:', error);
    return url;
  }
};

// Helper function to validate Firebase Storage URL format
const isValidFirebaseUrl = (url: string): boolean => {
  if (!url) return false;
  // Firebase Storage URL should contain:
  // - firebasestorage.googleapis.com
  // - /o/ (object path separator)
  // - ?alt=media (media query parameter)
  // - token parameter
  const hasDomain = url.includes('firebasestorage.googleapis.com');
  const hasObjectPath = url.includes('/o/');
  const hasAltMedia = url.includes('?alt=media');
  const hasToken = url.includes('token=');

  const isValid = hasDomain && hasObjectPath && hasAltMedia && hasToken;

  if (DEV && !isValid) {
    console.log('[MessageDetail] Invalid Firebase URL:', url);
    console.log('[MessageDetail] Validation:', { hasDomain, hasObjectPath, hasAltMedia, hasToken });
  }

  return isValid;
};

export default function MessageDetailScreen() {
  const { id, message: messageParam } = useLocalSearchParams<{ id: string; message?: string }>();
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<AdminPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Navigation guard: redirect to register if user has no valid data
    if (user && (!user.students || user.students.length === 0)) {
      if (__DEV__) console.log('[MessageDetail] No valid user data, redirecting to register');
      router.replace('/auth/register');
    }
  }, [user, router]);

  useEffect(() => {
    const loadMessage = async () => {
      if (messageParam) {
        try {
          const parsedMessage = JSON.parse(messageParam);
          setMessage(parsedMessage);
          if (DEV) console.log('[MessageDetail] Message loaded from params, imageUrl:', parsedMessage.imageUrl);
        } catch (error) {
          if (DEV) console.error('Error parsing message:', error);
        } finally {
          setLoading(false);
        }
      } else if (id) {
        // Fetch message from Firestore if not provided in params
        try {
          const docRef = doc(db, "admin_posts", id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const messageData = { id: docSnap.id, ...docSnap.data() } as AdminPost;
            setMessage(messageData);
            if (DEV) console.log('[MessageDetail] Message loaded from Firestore, imageUrl:', messageData.imageUrl);
          }
        } catch (error) {
          if (DEV) console.error('Error fetching message by ID:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadMessage();
  }, [id, messageParam]);

  useEffect(() => {
    if (message) {
      if (DEV) {
        console.log('[MessageDetail] Message loaded');
        console.log('[MessageDetail] Original Image URL:', message.imageUrl);
        console.log('[MessageDetail] Encoded Image URL:', message.imageUrl ? encodeFirebaseStoragePath(message.imageUrl) : 'N/A');
        console.log('[MessageDetail] URL is valid:', isValidFirebaseUrl(message.imageUrl || ''));
      }
    }
  }, [message]);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (!message) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-gray-500 text-center text-lg">Message not found</Text>
        <TouchableOpacity 
          className="mt-4 bg-blue-500 px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold text-center">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-blue-600 text-lg font-semibold">← Back</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2">{message.title || 'No Title'}</Text>
        <View className="flex-row items-center">
          <Text className="text-gray-500 text-sm">{formatTimestamp(message.timestamp || message.createdAt)}</Text>
        </View>
      </View>
      
      {/* Image */}
      {message.imageUrl && isValidFirebaseUrl(message.imageUrl) ? (
        <View className="p-6 bg-white border-b border-gray-100">
          {imageError ? (
            <View style={styles.imageErrorContainer}>
              <Text style={styles.imageErrorText}>Image not available</Text>
            </View>
          ) : (
            <Image
              source={{ uri: encodeFirebaseStoragePath(message.imageUrl) }}
              style={styles.messageImage}
              contentFit="cover"
              onError={(error) => {
                setImageError(true);
                if (DEV) {
                  console.error('[MessageDetail] Image load error:', error);
                  console.error('[MessageDetail] Original URL:', message.imageUrl);
                  console.error('[MessageDetail] Encoded URL:', message.imageUrl ? encodeFirebaseStoragePath(message.imageUrl) : 'N/A');
                }
              }}
            />
          )}
        </View>
      ) : message.imageUrl ? (
        <View className="p-6 bg-white border-b border-gray-100">
          <View style={styles.imageErrorContainer}>
            <Text style={styles.imageErrorText}>Invalid image URL</Text>
          </View>
        </View>
      ) : null}
      
      {/* Description */}
      <View className="p-6 bg-white">
        <Text className="text-gray-700 leading-6 text-base">
          {message.description || 'No message content'}
        </Text>
      </View>

      {/* Target Audience */}
      {(message.targetSport || message.targetLocation || message.targetAgeGroup) && (
        <View className="mx-6 my-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <Text className="text-sm font-semibold text-blue-900 mb-2">Target Audience</Text>
          {message.targetSport && (
            <Text className="text-blue-700 text-sm mb-1">Sport: {message.targetSport}</Text>
          )}
          {message.targetLocation && (
            <Text className="text-blue-700 text-sm mb-1">Location: {message.targetLocation}</Text>
          )}
          {message.targetAgeGroup && (
            <Text className="text-blue-700 text-sm">Age Group: {message.targetAgeGroup}</Text>
          )}
        </View>
      )}

      {/* Message Type Badge */}
      {message.type && (
        <View className="mx-6 mb-6">
          <View className={`px-3 py-2 rounded-lg self-start ${message.type === 'admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
            <Text className={`text-sm font-semibold ${message.type === 'admin' ? 'text-purple-700' : 'text-blue-700'}`}>
              {message.type === 'admin' ? 'Admin Notification' : 'Team Message'}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
