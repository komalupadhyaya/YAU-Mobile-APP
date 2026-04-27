import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Calendar, Plus, Edit2, Trash2, X, Loader2, MapPin, Clock, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import toast from 'react-hot-toast';

interface Schedule {
  id: string;
  team1Name: string;
  team2Name: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  grade_band: string;
}

const ScheduleManager: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    team1Name: '',
    team2Name: '',
    sport: 'Basketball',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00 AM',
    location: '',
    grade_band: 'Band 1'
  });

  const gradeBands = ['Band 1', 'Band 2', 'Band 3', 'Band 4'];
  const sportsList = ['Basketball', 'Volleyball', 'Soccer', 'Football'];

  useEffect(() => {
    const q = query(collection(db, 'schedules'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Schedule[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({ 
          id: doc.id, 
          ...data,
          grade_band: data.grade_band || (data.ageGroup?.includes('Band') ? data.ageGroup : 'Band 1')
        } as Schedule);
      });
      setSchedules(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.team1Name.trim() || !formData.team2Name.trim()) {
      toast.error('Both team names are required.');
      return;
    }
    if (!formData.location.trim()) {
      toast.error('Location is required.');
      return;
    }
    if (!formData.date || !formData.time) {
      toast.error('Date and time are required.');
      return;
    }

    setSaving(true);
    try {
      if (editingSchedule) {
        await updateDoc(doc(db, 'schedules', editingSchedule.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success('Game schedule updated successfully.');
      } else {
        await addDoc(collection(db, 'schedules'), {
          ...formData,
          createdAt: serverTimestamp()
        });
        toast.success('New game scheduled successfully.');
      }
      setIsModalOpen(false);
      setEditingSchedule(null);
      resetForm();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      team1Name: '',
      team2Name: '',
      sport: 'Basketball',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '10:00 AM',
      location: '',
      grade_band: 'Band 1'
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this game schedule? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'schedules', id));
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      team1Name: schedule.team1Name,
      team2Name: schedule.team2Name,
      sport: schedule.sport,
      date: schedule.date,
      time: schedule.time,
      location: schedule.location,
      grade_band: schedule.grade_band
    });
    setIsModalOpen(true);
  };

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center h-64 space-y-4">
         <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
         <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Game Schedules...</p>
       </div>
     );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Game Schedules</h1>
          <p className="text-gray-500 dark:text-white/60 font-medium tracking-tight">Schedule games, practices, and season events.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => { setEditingSchedule(null); resetForm(); setIsModalOpen(true); }}
          leftIcon={<Plus size={18} />}
          className="h-12 shadow-lg"
        >
          Add New Game
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="group hover:shadow-xl transition-all hover:-translate-y-2 relative overflow-visible">
             <div className="flex justify-between items-start mb-6">
                <Badge variant="secondary">
                   {schedule.sport}
                </Badge>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={() => openEditModal(schedule)}>
                      <Edit2 size={12} className="text-gray-400 dark:text-white/40 hover:text-indigo-600 dark:hover:text-white" />
                   </Button>
                   <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={() => handleDelete(schedule.id)}>
                      <Trash2 size={12} className="text-gray-400 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400" />
                   </Button>
                 </div>
              </div>

              <div className="flex items-center justify-between mb-8 px-2">
                 <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-indigo-50 dark:group-hover:bg-white/10 transition-colors">
                       <Trophy size={20} className="text-gray-400 dark:text-white/40 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <span className="font-black text-gray-900 dark:text-white text-center truncate w-full">{schedule.team1Name || 'HOME'}</span>
                    <span className="text-[10px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest mt-1">Home Team</span>
                 </div>
                 
                 <div className="px-4 text-center">
                    <div className="text-sm font-black text-indigo-100 dark:text-white/10 uppercase italic">VS</div>
                 </div>
 
                 <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-indigo-50 dark:group-hover:bg-white/10 transition-colors">
                       <Trophy size={20} className="text-gray-400 dark:text-white/40 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <span className="font-black text-gray-900 dark:text-white text-center truncate w-full">{schedule.team2Name || 'AWAY'}</span>
                    <span className="text-[10px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest mt-1">Away Team</span>
                 </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-white/10">
                 <div className="flex items-center text-xs font-bold text-gray-500 dark:text-white/60">
                    <Calendar size={14} className="mr-2.5 text-indigo-400 dark:text-white/40" />
                    {format(new Date(schedule.date), 'EEEE, MMMM do')}
                 </div>
                 <div className="flex items-center text-xs font-bold text-gray-500 dark:text-white/60">
                    <Clock size={14} className="mr-2.5 text-indigo-400 dark:text-white/40" />
                    {schedule.time}
                 </div>
                 <div className="flex items-center text-xs font-bold text-gray-500 dark:text-white/60">
                    <MapPin size={14} className="mr-2.5 text-indigo-400 dark:text-white/40" />
                    {schedule.location}
                 </div>
              </div>

             <div className="absolute -bottom-3 right-6">
                <Badge variant="warning" className="bg-amber-400 text-amber-950 border-amber-500 shadow-md h-7 flex items-center px-4">
                   {schedule.grade_band}
                </Badge>
             </div>
          </Card>
        ))}

        {schedules.length === 0 && (
          <div className="col-span-full py-20 bg-white dark:bg-black rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-gray-50 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-gray-200 dark:text-indigo-800 mb-6">
                <Calendar size={40} />
             </div>
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Scheduled Games</h3>
             <p className="text-sm text-gray-400 dark:text-indigo-400 font-medium max-w-sm">
                The schedule directory is currently empty. Start by adding a game or season event.
             </p>
             <Button 
               variant="primary" 
               size="sm" 
               className="mt-8"
               onClick={() => { setEditingSchedule(null); resetForm(); setIsModalOpen(true); }}
             >
               Add First Game
             </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
          <Card 
            className="w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-300"
            title={editingSchedule ? 'Edit Game Schedule' : 'Schedule New Game'}
            headerAction={
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                <X size={20} />
              </button>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Home Team"
                  placeholder="YAU Basketball A"
                  required
                  value={formData.team1Name}
                  onChange={(e) => setFormData({...formData, team1Name: e.target.value})}
                />
                <Input
                  label="Away Team"
                  placeholder="City Eagles"
                  required
                  value={formData.team2Name}
                  onChange={(e) => setFormData({...formData, team2Name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Sport"
                  options={sportsList.map(s => ({label: s, value: s}))}
                  value={formData.sport}
                  onChange={(e) => setFormData({...formData, sport: e.target.value})}
                />
                <Select
                  label="Grade Band"
                  options={gradeBands.map(b => ({label: b, value: b}))}
                  value={formData.grade_band}
                  onChange={(e) => setFormData({...formData, grade_band: e.target.value})}
                />
              </div>

              <Input
                label="Location / Venue"
                placeholder="Central Park Sports Complex - Court 1"
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
                <Input
                  label="Time"
                  placeholder="e.g. 10:30 AM"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-50 dark:border-white/5">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Discard Changes
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="flex-1 h-12 shadow-lg"
                  loading={saving}
                >
                  {editingSchedule ? 'Update Game' : 'Schedule Game'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;
