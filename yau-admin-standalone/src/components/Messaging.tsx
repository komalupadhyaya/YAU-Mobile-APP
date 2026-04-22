import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Send, AlertCircle, CheckCircle2, Loader2, Info, Target, Globe } from 'lucide-react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface Member {
  id: string;
  students: {
    school_name: string;
    grade_band: string;
    sport: string;
  }[];
}

const Messaging: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetSchool, setTargetSchool] = useState('all');
  const [targetGradeBand, setTargetGradeBand] = useState('all');
  const [targetSport, setTargetSport] = useState('all');
  
  const [schools, setSchools] = useState<string[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [gradeBands] = useState(['Band 1', 'Band 2', 'Band 3', 'Band 4']);
  
  const [targetUserCount, setTargetUserCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const schoolsSnapshot = await getDocs(collection(db, 'locations'));
      const schoolsList = schoolsSnapshot.docs.map(doc => doc.data().name).filter(Boolean);
      setSchools(Array.from(new Set(schoolsList)));
      
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const sportsList = membersSnapshot.docs.flatMap(doc => {
        const data = doc.data();
        return [data.sport, ...(data.students?.map((s: any) => s.sport) || [])];
      }).filter(Boolean);
      setSports(Array.from(new Set(sportsList)));
    };
    fetchData();
  }, []);

  useEffect(() => {
    const updateTargetCount = async () => {
      setFetchingUsers(true);
      try {
        const membersSnapshot = await getDocs(collection(db, 'members'));
        const members = membersSnapshot.docs.map(doc => doc.data() as Member);
        
        const filtered = members.filter(member => {
          const matchesSchool = targetSchool === 'all' || member.students?.some(s => s.school_name === targetSchool);
          const matchesGradeBand = targetGradeBand === 'all' || member.students?.some(s => s.grade_band === targetGradeBand);
          const matchesSport = targetSport === 'all' || member.students?.some(s => s.sport === targetSport);
          
          return matchesSchool && matchesGradeBand && matchesSport;
        });
        
        setTargetUserCount(filtered.length);
      } catch (error) {
        console.error('Error counting target users:', error);
      } finally {
        setFetchingUsers(false);
      }
    };
    
    updateTargetCount();
  }, [targetSchool, targetGradeBand, targetSport]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setStatus({ type: 'error', message: 'Please fill in both title and message body.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await addDoc(collection(db, 'admin_posts'), {
        title,
        description,
        targetLocation: targetSchool,
        targetAgeGroup: targetGradeBand,
        targetSport: targetSport,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        type: 'admin'
      });

      setStatus({ type: 'success', message: 'Message sent successfully! Push notifications will be triggered.' });
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus({ type: 'error', message: 'Failed to send message. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Messaging Center</h1>
          <p className="text-gray-500 dark:text-white/60 font-medium tracking-tight">Compose and broadcast push notifications to specific groups.</p>
        </div>
      </div>

      {status && (
        <div className={`
          p-4 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300 border
          ${status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-800 dark:text-red-400'}
        `}>
          <div className={`p-2 rounded-xl ${status.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
             {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm tracking-tight">{status.type === 'success' ? 'Broadcast Dispatched' : 'Dispatch Failed'}</div>
            <p className="text-xs font-medium opacity-80 mt-0.5">{status.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card 
            title="Compose Message" 
            subtitle="Write the content of your push notification."
          >
            <form onSubmit={handleSend} className="space-y-6">
              <Input
                label="Message Title"
                placeholder="e.g. Training Session Updated"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 dark:text-white/60 uppercase tracking-wider ml-1">Message Body</label>
                <textarea
                  rows={8}
                  placeholder="Type your announcement here..."
                  className={`
                    w-full px-4 py-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl text-sm text-gray-900 dark:text-white transition-all outline-none resize-none
                    focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder:text-gray-400 dark:placeholder:text-white/20
                    disabled:bg-gray-50 disabled:text-gray-500
                  `}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-14 uppercase tracking-widest font-black"
                loading={loading}
                disabled={targetUserCount === 0}
                leftIcon={<Send size={18} />}
              >
                Send Broadcast
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card 
            title="Target Audience" 
            headerAction={<Target className="w-5 h-5 text-white" />}
          >
            <div className="space-y-5">
              <Select 
                label="School / Placement"
                value={targetSchool}
                onChange={(e) => setTargetSchool(e.target.value)}
                options={[{label: 'All Schools', value: 'all'}, ...schools.map(s => ({label: s, value: s}))]}
                disabled={loading}
              />

              <Select 
                label="Grade Band"
                value={targetGradeBand}
                onChange={(e) => setTargetGradeBand(e.target.value)}
                options={[{label: 'All Grade Bands', value: 'all'}, ...gradeBands.map(b => ({label: b, value: b}))]}
                disabled={loading}
              />

              <Select 
                label="Sport Category"
                value={targetSport}
                onChange={(e) => setTargetSport(e.target.value)}
                options={[{label: 'All Sports', value: 'all'}, ...sports.map(s => ({label: s, value: s}))]}
                disabled={loading}
              />

              <div className="mt-8 pt-6 border-t border-gray-50 dark:border-white/5">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Calculated Reach</span>
                    <Badge variant={targetUserCount > 0 ? "success" : "error"}>
                       {fetchingUsers ? <Loader2 className="w-3 h-3 animate-spin" /> : `${targetUserCount} Active Users`}
                    </Badge>
                 </div>
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 flex items-start gap-4">
                     <div className="p-2 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white rounded-lg">
                        <Info size={18} />
                     </div>
                     <div>
                        <p className="text-xs font-bold text-gray-700 dark:text-white">FCM Delivery</p>
                        <p className="text-[10px] text-gray-500 dark:text-white/60 font-medium mt-0.5 leading-relaxed">
                           Push notifications are delivered via FCM. Users will receive this message as a high-priority alert.
                        </p>
                     </div>
                  </div>
              </div>
            </div>
          </Card>

          {targetSchool === 'all' && targetGradeBand === 'all' && targetSport === 'all' && (
            <div className="p-6 bg-amber-50 dark:bg-amber-500/10 rounded-3xl border border-amber-200/50 dark:border-amber-500/20 flex gap-4">
              <div className="p-3 bg-white dark:bg-black rounded-2xl shadow-sm self-start">
                 <Globe className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-white mb-1 leading-tight">Global Broadcast Warning</h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed opacity-80">
                   You are about to message <strong>every</strong> registered user. Please reserve global broadcasts for critical platform-wide updates only.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messaging;
