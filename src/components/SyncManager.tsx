import { useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useScheduleStore } from '../store/useScheduleStore';
import { useMessageStore } from '../store/useMessageStore';

export const SyncManager = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const initScheduleSync = useScheduleStore(state => state.initSync);
  const initMessageSync = useMessageStore(state => state.initSync);

  // Global Schedule Sync (Shared across all users)
  useEffect(() => {
    const unsub = initScheduleSync();
    return () => unsub();
  }, [initScheduleSync]);

  // User-Specific Message Sync (Depends on user students)
  useEffect(() => {
    if (user?.id) {
      const unsub = initMessageSync(user.students || [], user.id);
      return () => unsub();
    }
  }, [user, initMessageSync]);

  return <>{children}</>;
};
