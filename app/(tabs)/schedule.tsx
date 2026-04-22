import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../src/context/UserContext';
import { fetchSchedules, Schedule } from '../../src/services/schedule';

export default function ScheduleScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduleData();
  }, [user]);

  const fetchScheduleData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const fetchedSchedules = await fetchSchedules();
      
      if (__DEV__) console.log('[Schedule Screen] Total schedules fetched:', fetchedSchedules.length);
      if (__DEV__) console.log('[Schedule Screen] User sport:', user.sport);
      if (__DEV__) console.log('[Schedule Screen] User students:', user.students);
      
      // Filter schedules by user's sport and student's grade
      const filteredSchedules = fetchedSchedules.filter(schedule => {
        if (__DEV__) console.log('[Schedule Screen] Checking schedule:', schedule.id, schedule.sport, schedule.ageGroups);
        
        // Filter by sport (if user has sport)
        if (user.sport && schedule.sport) {
          if (schedule.sport.toLowerCase() !== user.sport.toLowerCase()) {
            if (__DEV__) console.log('[Schedule Screen] Skipped - sport mismatch:', schedule.sport, user.sport);
            return false;
          }
        }
        
        // Filter by ageGroups (student's grade band) - only if user has students
        if (user?.students && user.students.length > 0 && schedule.ageGroups && schedule.ageGroups.length > 0) {
          const studentGradeBand = user.students[0]?.grade_band;
          if (__DEV__) console.log('[Schedule Screen] Student grade band:', studentGradeBand, 'Schedule ageGroups:', schedule.ageGroups);
          
          // Check if student's grade band is in schedule's ageGroups array
          // Note: schedule.ageGroups might contain "Band1" or "Band 1", so we normalize
          const matchesGrade = studentGradeBand && schedule.ageGroups.some(ag => 
            ag.replace(/\s+/g, '').toLowerCase() === studentGradeBand.replace(/\s+/g, '').toLowerCase()
          );

          if (!matchesGrade) {
            if (__DEV__) console.log('[Schedule Screen] Skipped - grade band not in ageGroups');
            return false;
          }
        }
        
        return true;
      });
      
      if (__DEV__) console.log('[Schedule Screen] Filtered schedules:', filteredSchedules.length);
      setSchedules(filteredSchedules);
    } catch (error) {
      if (__DEV__) console.error('[Schedule Screen] Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUpcoming = (dateString: string) => {
    const gameDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return gameDate >= today;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (schedules.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-gray-500 text-center text-lg">No games scheduled</Text>
        <Text className="text-gray-400 text-center text-sm mt-2">Check back later for updates</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <FlatList
        data={schedules}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className={`bg-white p-4 rounded-xl shadow-sm mb-4 border ${isUpcoming(item.date) ? 'border-orange-200' : 'border-gray-100'} flex-row items-center`}>
            <View className="bg-blue-50 w-16 h-16 rounded-lg items-center justify-center mr-4">
              <Text className="text-blue-900 font-bold text-center text-xs">
                {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
              </Text>
              <Text className="text-blue-900 font-extrabold text-sm mt-1">{item.time || 'N/A'}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 mb-1 leading-snug">{item.team1Name || 'TBD'} vs {item.team2Name || 'TBD'}</Text>
              <View className="flex-row items-center mb-1">
                 <MaterialIcons name="sports-basketball" size={14} color="#6b7280" />
                 <Text className="text-gray-500 text-sm ml-1">{item.sport || 'Not specified'}</Text>
              </View>
              <View className="flex-row items-center mb-1">
                <MaterialIcons name="location-pin" size={14} color="#F97316" />
                <Text className="text-gray-500 text-sm ml-1">{item.location || 'Location TBD'}</Text>
              </View>
              {item.coachName && (
                <View className="flex-row items-center">
                  <MaterialIcons name="person" size={14} color="#6b7280" />
                  <Text className="text-gray-500 text-sm ml-1">{item.coachName}</Text>
                </View>
              )}
            </View>
            {isUpcoming(item.date) && (
              <View className="bg-orange-100 px-2 py-1 rounded ml-2">
                <Text className="text-orange-600 text-xs font-semibold">Upcoming</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}
