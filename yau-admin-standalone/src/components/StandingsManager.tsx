import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy, deleteDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Edit2, Trash2, X, Loader2, Trophy, Search } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import toast from 'react-hot-toast';

interface Standing {
  id: string;
  teamName: string;
  schoolName: string;
  gradeBand: string;
  sport: string;
  wins: number;
  losses: number;
  points: number;
  deletedAt?: any;
}

interface AppSchool {
  id: string;
  name: string;
  active: boolean;
}

const GRADE_BANDS = [
  'K / 1st Grade',
  '2nd / 3rd Grade',
  '4th / 5th Grade',
  'Middle School (6th, 7th, 8th Grade)'
];

const SPORTS = [
  'Flag Football',
  'Soccer',
  'Cheer',
  'Basketball'
];

const StandingsManager: React.FC = () => {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [schools, setSchools] = useState<AppSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStanding, setEditingStanding] = useState<Standing | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    teamName: '',
    schoolName: '',
    gradeBand: GRADE_BANDS[0],
    sport: SPORTS[0],
    wins: 0,
    losses: 0,
    points: 0
  });

  useEffect(() => {
    // Subscribe to standings
    const standingsQ = query(collection(db, 'standings'), orderBy('points', 'desc'));
    const unsubStandings = onSnapshot(standingsQ, (snapshot) => {
      const docs: Standing[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.deletedAt) {
          docs.push({ id: doc.id, ...data } as Standing);
        }
      });
      setStandings(docs);
      setLoading(false);
    });

    // Subscribe to schools for dropdown
    const schoolsQ = query(collection(db, 'app_schools'), where('active', '==', true), orderBy('name', 'asc'));
    const unsubSchools = onSnapshot(schoolsQ, (snapshot) => {
      const docs: AppSchool[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, name: doc.data().name, active: doc.data().active });
      });
      setSchools(docs);
    });

    return () => {
      unsubStandings();
      unsubSchools();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.teamName.trim()) {
      toast.error('Team name is required.');
      return;
    }
    if (!formData.schoolName) {
      toast.error('School selection is required.');
      return;
    }

    setSaving(true);
    try {
      if (editingStanding) {
        await updateDoc(doc(db, 'standings', editingStanding.id), {
          ...formData,
          teamName: formData.teamName.trim(),
          updatedAt: serverTimestamp()
        });
        toast.success(`Standing for "${formData.teamName}" updated.`);
      } else {
        await addDoc(collection(db, 'standings'), {
          ...formData,
          teamName: formData.teamName.trim(),
          createdAt: serverTimestamp()
        });
        toast.success(`Standing for "${formData.teamName}" added.`);
      }
      setIsModalOpen(false);
      setEditingStanding(null);
      resetForm();
    } catch (error) {
      console.error('Error saving standing:', error);
      toast.error('Failed to save standing.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      teamName: '',
      schoolName: schools[0]?.name || '',
      gradeBand: GRADE_BANDS[0],
      sport: SPORTS[0],
      wins: 0,
      losses: 0,
      points: 0
    });
  };

  const handleDelete = async (standing: Standing) => {
    if (window.confirm(`Are you sure you want to delete the standing for "${standing.teamName}"?`)) {
      try {
        await deleteDoc(doc(db, 'standings', standing.id));
        toast.success(`Standing for "${standing.teamName}" deleted.`);
      } catch (error) {
        console.error('Error deleting standing:', error);
        toast.error('Failed to delete standing.');
      }
    }
  };

  const openEditModal = (standing: Standing) => {
    setEditingStanding(standing);
    setFormData({
      teamName: standing.teamName,
      schoolName: standing.schoolName,
      gradeBand: standing.gradeBand,
      sport: standing.sport,
      wins: standing.wins,
      losses: standing.losses,
      points: standing.points
    });
    setIsModalOpen(true);
  };

  const filteredStandings = standings.filter(s => 
    s.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Standings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Standings Manager</h1>
          <p className="text-gray-500 dark:text-white/60 font-medium tracking-tight">Manage team rankings, wins, losses, and total points across grade bands.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => { setEditingStanding(null); resetForm(); setIsModalOpen(true); }}
          leftIcon={<Plus size={18} />}
          className="h-12 shadow-lg"
        >
          Add Standing
        </Button>
      </div>

      <div className="bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="w-full sm:w-96">
              <Input 
                placeholder="Search teams or schools..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={16} className="text-gray-400 dark:text-white/60" />}
              />
           </div>
           <Badge variant="secondary">{filteredStandings.length} Teams Ranked</Badge>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Team / School</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Grade Band & Sport</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">W - L</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Points</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {filteredStandings.map((standing) => (
                <tr key={standing.id} className="group hover:bg-indigo-50/30 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white block">{standing.teamName}</span>
                        <span className="text-xs text-gray-400 dark:text-white/40 block">{standing.schoolName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-[10px]">{standing.gradeBand}</Badge>
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{standing.sport}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-gray-700 dark:text-white/80">{standing.wins} - {standing.losses}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{standing.points}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={() => openEditModal(standing)}>
                        <Edit2 size={14} className="text-gray-400 dark:text-white/40 hover:text-indigo-600 dark:hover:text-white" />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={() => handleDelete(standing)}>
                        <Trash2 size={14} className="text-gray-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStandings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Trophy size={48} className="text-gray-100 dark:text-indigo-900 mb-4" />
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">No standings found</h3>
                      <p className="text-sm text-gray-400 dark:text-indigo-400 font-medium">Add a team standing to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200 overflow-y-auto">
          <Card 
            className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 my-auto"
            title={editingStanding ? 'Edit Standing' : 'Add New Standing'}
            headerAction={
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                <X size={20} />
              </button>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Team Name"
                  placeholder="e.g. Westside Warriors"
                  required
                  value={formData.teamName}
                  onChange={(e) => setFormData({...formData, teamName: e.target.value})}
                />

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Allocated School</label>
                  <select
                    className="w-full h-12 px-4 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all appearance-none"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                    required
                  >
                    <option value="" disabled>Select School</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.name}>{school.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Grade Band</label>
                  <select
                    className="w-full h-12 px-4 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all appearance-none"
                    value={formData.gradeBand}
                    onChange={(e) => setFormData({...formData, gradeBand: e.target.value})}
                  >
                    {GRADE_BANDS.map(band => (
                      <option key={band} value={band}>{band}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Discipline / Sport</label>
                  <select
                    className="w-full h-12 px-4 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all appearance-none"
                    value={formData.sport}
                    onChange={(e) => setFormData({...formData, sport: e.target.value})}
                  >
                    {SPORTS.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-indigo-900/10 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="space-y-2">
                  <label className="block text-center text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Wins</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full h-12 text-center rounded-xl bg-white dark:bg-black border border-gray-100 dark:border-white/10 font-black text-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.wins}
                    onChange={(e) => setFormData({...formData, wins: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-center text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Losses</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full h-12 text-center rounded-xl bg-white dark:bg-black border border-gray-100 dark:border-white/10 font-black text-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    value={formData.losses}
                    onChange={(e) => setFormData({...formData, losses: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-center text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Points</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full h-12 text-center rounded-xl bg-white dark:bg-black border border-indigo-600/30 dark:border-indigo-400/30 font-black text-lg text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.points}
                    onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-50 dark:border-white/5">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1" 
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="flex-1 h-12 shadow-lg uppercase tracking-widest font-black"
                  loading={saving}
                >
                  {editingStanding ? 'Update Standing' : 'Save Standing'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StandingsManager;
