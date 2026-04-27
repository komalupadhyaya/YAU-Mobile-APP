import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Edit2, Trash2, X, Loader2, Building2, GraduationCap, ToggleLeft, ToggleRight, Search, School as SchoolIcon } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import toast from 'react-hot-toast';

interface AppSchool {
  id: string;
  name: string;
  type: 'school' | 'program';
  active: boolean;
  deletedAt?: any;
}

const SchoolsManager: React.FC = () => {
  const [schools, setSchools] = useState<AppSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<AppSchool | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'school' as 'school' | 'program',
    active: true
  });

  useEffect(() => {
    const q = query(collection(db, 'app_schools'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: AppSchool[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.deletedAt) {
          docs.push({ id: doc.id, ...data } as AppSchool);
        }
      });
      setSchools(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Institution name is required.');
      return;
    }
    if (formData.name.trim().length < 3) {
      toast.error('Institution name must be at least 3 characters.');
      return;
    }

    setSaving(true);
    try {
      if (editingSchool) {
        await updateDoc(doc(db, 'app_schools', editingSchool.id), {
          ...formData,
          name: formData.name.trim(),
          updatedAt: serverTimestamp()
        });
        toast.success(`"${formData.name.trim()}" updated successfully.`);
      } else {
        await addDoc(collection(db, 'app_schools'), {
          ...formData,
          name: formData.name.trim(),
          createdAt: serverTimestamp()
        });
        toast.success(`"${formData.name.trim()}" added successfully.`);
      }
      setIsModalOpen(false);
      setEditingSchool(null);
      resetForm();
    } catch (error) {
      console.error('Error saving school:', error);
      toast.error('Failed to save institution. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'school', active: true });
  };

  const handleToggleActive = async (school: AppSchool) => {
    try {
      await updateDoc(doc(db, 'app_schools', school.id), {
        active: !school.active,
        updatedAt: serverTimestamp()
      });
      toast.success(school.active ? `"${school.name}" closed for registration.` : `"${school.name}" is now accepting registrations.`);
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update registration status.');
    }
  };

  const handleSoftDelete = async (school: AppSchool) => {
    if (window.confirm(`Archive "${school.name}"? It will no longer appear in registration lists.`)) {
      try {
        await updateDoc(doc(db, 'app_schools', school.id), {
          deletedAt: serverTimestamp(),
          active: false
        });
        toast.success(`"${school.name}" archived successfully.`);
      } catch (error) {
        console.error('Error deleting school:', error);
        toast.error('Failed to archive institution.');
      }
    }
  };

  const openEditModal = (school: AppSchool) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      type: school.type,
      active: school.active
    });
    setIsModalOpen(true);
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Institutions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Schools & Programs</h1>
          <p className="text-gray-500 dark:text-white/60 font-medium tracking-tight">Configure available institutions for member registration.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => { setEditingSchool(null); resetForm(); setIsModalOpen(true); }}
          leftIcon={<Plus size={18} />}
          className="h-12 shadow-lg"
        >
          Add Institution
        </Button>
      </div>

      <div className="bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="w-full sm:w-96">
              <Input 
                placeholder="Search institutions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={16} className="text-gray-400 dark:text-white/60" />}
              />
           </div>
           <Badge variant="secondary">{filteredSchools.length} Total Enrolled</Badge>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Institution Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Classification</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Registration Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {filteredSchools.map((school) => (
                <tr key={school.id} className="group hover:bg-indigo-50/30 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${school.type === 'school' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'}`}>
                        {school.type === 'school' ? <Building2 size={20} /> : <GraduationCap size={20} />}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-900 dark:group-hover:text-indigo-300">{school.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={school.type === 'school' ? 'success' : 'secondary'}>
                       {school.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleActive(school)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all
                        ${school.active 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100' 
                          : 'bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/20'}
                      `}
                    >
                      {school.active ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                      <span className="text-[10px] font-black uppercase tracking-tighter">{school.active ? 'Accepting Registrations' : 'Registration Closed'}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={() => openEditModal(school)}>
                        <Edit2 size={14} className="text-gray-400 dark:text-white/40 hover:text-indigo-600 dark:hover:text-white" />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={() => handleSoftDelete(school)}>
                        <Trash2 size={14} className="text-gray-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSchools.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <SchoolIcon size={48} className="text-gray-100 dark:text-indigo-900 mb-4" />
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">No institutions found</h3>
                      <p className="text-sm text-gray-400 dark:text-indigo-400 font-medium">Try adjusting your search criteria.</p>
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
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
          <Card 
            className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 overflow-visible"
            title={editingSchool ? 'Edit Institution' : 'Add New Institution'}
            headerAction={
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                <X size={20} />
              </button>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Institution Name"
                placeholder="e.g. Westside High School"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Classification</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'school'})}
                    className={`
                      p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2
                      ${formData.type === 'school' 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-white shadow-md scale-[1.02]' 
                        : 'border-gray-100 dark:border-white/5 text-gray-400 dark:text-indigo-500 hover:border-gray-200 dark:hover:border-white/10'}
                    `}
                  >
                    <Building2 size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">School</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'program'})}
                    className={`
                      p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2
                      ${formData.type === 'program' 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-white shadow-md scale-[1.02]' 
                        : 'border-gray-100 dark:border-white/5 text-gray-400 dark:text-indigo-500 hover:border-gray-200 dark:hover:border-white/10'}
                    `}
                  >
                    <GraduationCap size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Program</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-indigo-900/20 rounded-2xl border border-gray-100 dark:border-white/5">
                <div>
                   <p className="text-sm font-bold text-gray-700 dark:text-white">Accepting Registrations</p>
                   <p className="text-[10px] text-gray-400 dark:text-indigo-400 font-medium uppercase tracking-tighter">Toggle visibility in mobile app</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, active: !formData.active})}
                  className="text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform"
                >
                  {formData.active ? <ToggleRight size={36} /> : <ToggleLeft size={36} className="text-gray-300 dark:text-indigo-900" />}
                </button>
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
                  {editingSchool ? 'Update' : 'Save'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SchoolsManager;
