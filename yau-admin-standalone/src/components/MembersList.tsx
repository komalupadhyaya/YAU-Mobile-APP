import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { Activity, AlertTriangle, Calendar as CalendarIcon, Edit2, Eye, Loader2, Mail, MapPin, Phone, Save, Search, ShieldCheck, Shirt, Trash2, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { coachService } from '../lib/api';
import toast from 'react-hot-toast';

interface Student {
  firstName: string;
  lastName: string;
  grade: string;
  grade_band: string;
  school_name: string;
  sport: string;
  group_id?: string;
  ageGroup?: string;
  dob?: string;
  uid?: string;
  uniformBottom?: string;
  uniformTop?: string;
  coachId?: string;
  coachName?: string;
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location?: string;
  membershipType?: string;
  registrationPlan?: string;
  registrationSource?: string;
  isPaidMember?: boolean;
  paymentStatus?: string;
  sport?: string;
  students: Student[];
  createdAt?: any;
  updatedAt?: any;
}

const MembersList: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSchool, setFilterSchool] = useState('all');
  const [filterGradeBand, setFilterGradeBand] = useState('all');
  const [filterSport, setFilterSport] = useState('all');

  // Management State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Member>>({});
  const [saving, setSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const data = await coachService.getCoaches();
        setCoaches(data.map(c => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`.trim() || 'Unnamed Coach'
        })));
      } catch (error) {
        console.error('Error fetching coaches for assignment:', error);
      }
    };
    fetchCoaches();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('lastName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Member[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Member);
      });
      setMembers(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredMembers = members.filter(member => {
    const searchStr = `${member.firstName} ${member.lastName} ${member.email} ${member.students?.map(s => `${s.firstName} ${s.lastName}`).join(' ')}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());

    const matchesSchool = filterSchool === 'all' || member.students?.some(s => s.school_name === filterSchool);
    const matchesGradeBand = filterGradeBand === 'all' || member.students?.some(s => s.grade_band === filterGradeBand);
    const matchesSport = filterSport === 'all' || member.sport === filterSport || member.students?.some(s => s.sport === filterSport);

    return matchesSearch && matchesSchool && matchesGradeBand && matchesSport;
  });

  const uniqueSchools = Array.from(new Set(members.flatMap(m => m.students?.map(s => s.school_name) || []))).filter(Boolean).sort();
  const uniqueGradeBands = ['Band 1', 'Band 2', 'Band 3', 'Band 4'];
  const uniqueSports = Array.from(new Set([
    ...(members.map(m => m.sport) as string[]),
    ...members.flatMap(m => m.students?.map(s => s.sport) || [])
  ])).filter(Boolean).sort();

  const handleEditClick = (member: Member) => {
    setSelectedMember(member);
    setEditForm({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      email: member.email || '',
      phone: member.phone || '',
      location: member.location || '',
      membershipType: member.membershipType || '',
      registrationPlan: member.registrationPlan || '',
      sport: member.sport || '',
      students: member.students ? JSON.parse(JSON.stringify(member.students)) : []
    });
    setIsEditing(true);
  };

  const handleStudentFieldChange = (index: number, field: keyof Student, value: string) => {
    if (!editForm.students) return;
    const updatedStudents = [...editForm.students];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setEditForm({ ...editForm, students: updatedStudents });
  };

  const handleUpdate = async () => {
    if (!selectedMember || !editForm) return;

    // Validation
    if (!editForm.firstName?.trim() || !editForm.lastName?.trim() || !editForm.email?.trim()) {
      toast.error('First Name, Last Name, and Email are required.');
      return;
    }

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validateEmail(editForm.email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (editForm.phone && editForm.phone.trim().length < 10) {
      toast.error('Phone number should be at least 10 digits.');
      return;
    }

    setSaving(true);
    try {
      const memberRef = doc(db, 'members', selectedMember.id);
      await updateDoc(memberRef, {
        ...editForm,
        updatedAt: new Date()
      });
      toast.success('Member record updated successfully.');
      setSelectedMember(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'members', selectedMember.id));
      toast.success('Member record permanently removed.');
      setSelectedMember(null);
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Updating Member Directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">Registration Directory</h1>
          <p className="text-gray-500 dark:text-white/60 font-medium tracking-tight">Manage and monitor student athlete registrations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info" className="px-4 py-2 text-xs">{filteredMembers.length} Members Listed</Badge>
          <Button variant="outline" size="sm" onClick={() => {
            setSearchTerm('');
            setFilterSchool('all');
            setFilterGradeBand('all');
            setFilterSport('all');
          }}>Reset Filters</Button>
        </div>
      </div>

      <Card className="p-0 overflow-visible border border-gray-100 dark:border-white/10 bg-white dark:bg-black shadow-none">
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-96">
            <Input
              placeholder="Search by name, email or school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} className="text-gray-400 dark:text-white/60" />}
            />
          </div>
          <Badge variant="neutral" className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white border-none py-1.5 px-4 font-black tracking-widest uppercase">
            {filteredMembers.length} Total Records
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b border-gray-100 dark:border-white/10">
          <Select
            label="School"
            options={[{ label: 'All Schools', value: 'all' }, ...uniqueSchools.map(s => ({ label: s, value: s }))]}
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value)}
          />
          <Select
            label="Grade Band"
            options={[{ label: 'All Bands', value: 'all' }, ...uniqueGradeBands.map(b => ({ label: b, value: b }))]}
            value={filterGradeBand}
            onChange={(e) => setFilterGradeBand(e.target.value)}
          />
          <Select
            label="Sport Category"
            options={[{ label: 'All Sports', value: 'all' }, ...uniqueSports.map(s => ({ label: s, value: s }))]}
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
          />
        </div>

        <div className="bg-white dark:bg-black rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Account Holder</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Student Athletes</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Membership</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 dark:text-white font-black group-hover:scale-110 transition-transform">
                          {member.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                            {member.firstName} {member.lastName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-tighter">{member.email}</p>
                            {member.location && (
                              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-400/10 px-1 rounded flex items-center">
                                <MapPin size={8} className="mr-0.5" /> {member.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {member.students?.map((s, idx) => (
                          <div key={idx} className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-bold text-gray-700 dark:text-white">{s.firstName}</span>
                            <Badge variant="secondary" className="scale-75 origin-left py-0">{s.school_name || 'N/A'}</Badge>
                            <span className="text-[9px] font-black text-gray-400 uppercase">{s.sport}</span>
                          </div>
                        ))}
                        {(!member.students || member.students.length === 0) && (
                          <span className="text-[10px] font-black text-gray-300 dark:text-white/20 uppercase">No active registrations</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant={member.isPaidMember ? 'success' : 'neutral'} className="w-fit">
                          {member.membershipType?.toUpperCase() || (member.isPaidMember ? 'PAID' : 'FREE')}
                        </Badge>
                        {member.registrationPlan && (
                          <span className="text-[9px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest ml-1">{member.registrationPlan} Plan</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-indigo-50 dark:hover:bg-white/10 text-gray-400 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white p-2 h-auto rounded-lg"
                          onClick={() => {
                            setSelectedMember(member);
                            setIsEditing(false);
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-indigo-50 dark:hover:bg-white/10 text-gray-400 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white p-2 h-auto rounded-lg"
                          onClick={() => handleEditClick(member)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 dark:text-white/60 hover:text-red-500 p-2 h-auto rounded-lg"
                          onClick={() => {
                            setSelectedMember(member);
                            setIsDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="px-6 py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center text-gray-200 dark:text-white/10 mb-4">
                <Search size={32} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">No matches found</h3>
              <p className="text-sm text-gray-500 dark:text-white/40 font-medium max-w-xs mx-auto">
                We couldn't find any members matching your search or filter criteria.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-6"
                onClick={() => {
                  setSearchTerm('');
                  setFilterSchool('all');
                  setFilterGradeBand('all');
                  setFilterSport('all');
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Member Details / Edit Modal */}
      {selectedMember && !isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md" onClick={() => setSelectedMember(null)} />
          <Card className="relative w-full max-w-4xl bg-white dark:bg-black overflow-hidden shadow-2xl border-none animate-in fade-in zoom-in duration-300">
            <div className="p-6 bg-white dark:bg-black border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  {isEditing ? 'Modify Admin Record' : 'Full Member Analytics'}
                </h2>
                <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest mt-0.5">
                  UID: {selectedMember.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 dark:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-0 max-h-[75vh] overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-black">
              {isEditing ? (
                <div className="p-8 space-y-12">
                  {/* Basic Info Section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-[0.2em] mb-4">Identity & Contact</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="First Name" value={editForm.firstName || ''} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
                      <Input label="Last Name" value={editForm.lastName || ''} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
                    </div>
                    <Input label="Email Address" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} leftIcon={<Mail size={16} />} />
                    <Input label="Phone Number" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} leftIcon={<Phone size={16} />} />
                  </div>

                  {/* Operational Section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-[0.2em] mb-4">Membership & Location</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Location" value={editForm.location || ''} onChange={e => setEditForm({ ...editForm, location: e.target.value })} leftIcon={<MapPin size={16} />} />
                      <Input label="Primary Sport" value={editForm.sport || ''} onChange={e => setEditForm({ ...editForm, sport: e.target.value })} leftIcon={<Activity size={16} />} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Membership Type"
                        value={editForm.membershipType || ''}
                        onChange={e => setEditForm({ ...editForm, membershipType: e.target.value })}
                        options={[
                          { label: 'Select Type', value: '' },
                          { label: 'Paid Member', value: 'paid' },
                          { label: 'Guest', value: 'guest' },
                          { label: 'Staff', value: 'staff' }
                        ]}
                      />
                      <Select
                        label="Registration Plan"
                        value={editForm.registrationPlan || ''}
                        onChange={e => setEditForm({ ...editForm, registrationPlan: e.target.value })}
                        options={[
                          { label: 'Select Plan', value: '' },
                          { label: 'Monthly', value: 'monthly' },
                          { label: 'Seasonal', value: 'seasonal' },
                          { label: 'Annual', value: 'annual' }
                        ]}
                      />
                    </div>
                  </div>

                  {/* Student Editing Section */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-[0.2em] mb-4">Athlete Uniform Sizes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {editForm.students?.map((student, idx) => (
                        <Card key={idx} className="p-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2rem]">
                          <p className="text-xs font-black text-gray-900 dark:text-white mb-4 flex items-center">
                            <User size={14} className="mr-2 text-indigo-500" /> {student.firstName} {student.lastName}
                          </p>
                          <div className="space-y-4">
                            <Input
                              label="Uniform Top"
                              placeholder="e.g. Youth M"
                              value={student.uniformTop || ''}
                              onChange={e => handleStudentFieldChange(idx, 'uniformTop', e.target.value)}
                              leftIcon={<Shirt size={16} />}
                            />
                            <Input
                              label="Uniform Bottom"
                              placeholder="e.g. Youth M"
                              value={student.uniformBottom || ''}
                              onChange={e => handleStudentFieldChange(idx, 'uniformBottom', e.target.value)}
                              leftIcon={<Shirt size={16} />}
                            />
                            <Select
                              label="Assigned Coach"
                              value={student.coachId || ''}
                              onChange={e => {
                                const coach = coaches.find(c => c.id === e.target.value);
                                handleStudentFieldChange(idx, 'coachId', e.target.value);
                                handleStudentFieldChange(idx, 'coachName', coach?.name || '');
                              }}
                              options={[
                                { label: 'No Coach Assigned', value: '' },
                                ...coaches.map(c => ({ label: c.name, value: c.id }))
                              ]}
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {/* Header Profile */}
                  <div className="p-8 bg-white dark:bg-black border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-500/30">
                      {(selectedMember.firstName && selectedMember.firstName[0]) || 'U'}
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedMember.firstName} {selectedMember.lastName}</h3>
                        <Badge variant={selectedMember.isPaidMember ? 'primary' : 'neutral'} className="rounded-full px-4 h-6 text-[10px] font-black uppercase tracking-widest">
                          {selectedMember.membershipType || (selectedMember.isPaidMember ? 'Paid' : 'Standard')}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <div className="flex items-center text-xs font-bold text-gray-500 dark:text-white/60">
                          <Mail size={14} className="mr-1.5 text-indigo-400" />
                          {selectedMember.email}
                        </div>
                        <div className="flex items-center text-xs font-bold text-gray-500 dark:text-white/60">
                          <Phone size={14} className="mr-1.5 text-indigo-400" />
                          {selectedMember.phone || 'No direct dial'}
                        </div>
                        <div className="flex items-center text-xs font-bold text-indigo-500 dark:text-indigo-400">
                          <MapPin size={14} className="mr-1.5" />
                          {selectedMember.location || 'Remote/Unknown'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Billing & Stats Grid */}
                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 bg-white dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10">
                      <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest mb-3">Billing Status</p>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{selectedMember.paymentStatus || 'Verified'}</p>
                          <p className="text-[9px] font-bold text-gray-400 dark:text-white/30">{selectedMember.registrationPlan || 'Basic'} Plan</p>
                        </div>
                      </div>
                      <Badge variant="success" className="w-full justify-center py-2 rounded-xl text-[10px] uppercase font-black border-none">
                        {selectedMember.isPaidMember ? 'Account in Good Standing' : 'Free Tier'}
                      </Badge>
                    </div>

                    <div className="p-5 bg-white dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10">
                      <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest mb-3">Account Metrics</p>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-500 dark:text-white/40">Athletes</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white">{selectedMember.students?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-500 dark:text-white/40">Source</span>
                          <span className="text-[10px] font-black text-indigo-500 uppercase">{selectedMember.registrationSource || 'Web'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-500 dark:text-white/40">Joined</span>
                          <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase">Feb 2026</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-white dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10">
                      <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest mb-3">Primary Sport</p>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-2xl">
                          <Activity size={24} />
                        </div>
                        <p className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">{selectedMember.sport || 'MULTISPORT'}</p>
                      </div>
                    </div>
                  </div>

                  {/* RESTRICTED VIEWS SECIONS */}
                  <div className="px-8 pb-12 space-y-12">
                    {/* Student Records Section */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.2em]">Athlete Profiles</h4>
                        <Badge variant="neutral" className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-none font-black px-3">
                          {selectedMember.students?.length || 0} Records
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        {selectedMember.students?.map((student, idx) => (
                          <div key={idx} className="p-6 bg-white dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/10 flex flex-col md:flex-row md:items-center gap-6">
                            <div className="w-14 h-14 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                              <User size={24} className="text-gray-400" />
                            </div>
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Athlete Name</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white">{student.firstName} {student.lastName}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Affiliation</p>
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{student.school_name || 'Individual'}</p>
                                <p className="text-[9px] font-bold text-gray-400">{student.grade_band || student.grade}</p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bio Data</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500 dark:text-white/60 flex items-center">
                                    <CalendarIcon size={10} className="mr-1" /> {student.ageGroup || 'N/A'}
                                  </span>
                                  <span className="text-[10px] font-bold bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500 dark:text-white/60">
                                    DOB: {student.dob || '--'}
                                  </span>
                                </div>
                                {student.coachName && (
                                  <div className="mt-2 flex items-center">
                                    <Badge variant="info" className="text-[9px] font-black uppercase py-0.5">
                                      Coach: {student.coachName}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Uniform & Kit Section */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.2em]">Uniform & Kit Sizes</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedMember.students?.map((student, idx) => (
                          <div key={idx} className="p-6 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                                <Shirt size={20} />
                              </div>
                              <div>
                                <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase leading-none">{student.firstName} {student.lastName}</p>
                                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Official Team Wear</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <div className="px-3 py-1.5 bg-white dark:bg-black rounded-xl border border-indigo-100 dark:border-white/10 text-center">
                                <p className="text-[8px] font-black text-gray-400 dark:text-white/40 uppercase leading-none mb-1">Top</p>
                                <p className="text-xs font-black text-indigo-600 dark:text-white">{student.uniformTop || '--'}</p>
                              </div>
                              <div className="px-3 py-1.5 bg-white dark:bg-black rounded-xl border border-indigo-100 dark:border-white/10 text-center">
                                <p className="text-[8px] font-black text-gray-400 dark:text-white/40 uppercase leading-none mb-1">BTM</p>
                                <p className="text-xs font-black text-indigo-600 dark:text-white">{student.uniformBottom || '--'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white dark:bg-black border-t border-gray-100 dark:border-white/10 flex items-center justify-between sticky bottom-0 z-10">
              {isEditing ? (
                <>
                  <Button variant="ghost" className="font-bold text-gray-400" onClick={() => setIsEditing(false)} disabled={saving}>Cancel Changes</Button>
                  <Button variant="primary" className="px-8 shadow-lg shadow-indigo-500/20" onClick={handleUpdate} loading={saving} leftIcon={<Save size={18} />}>Commit Updates</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="text-red-500 border-red-100 font-bold" onClick={() => setIsDeleteConfirmOpen(true)}>Delete Record</Button>
                  <Button variant="ghost" className="font-bold text-gray-400" onClick={() => setSelectedMember(null)}>Close</Button>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-950/20 backdrop-blur-sm" onClick={() => setIsDeleteConfirmOpen(false)} />
          <Card className="relative w-full max-w-sm bg-white dark:bg-black shadow-2xl border-none p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Confirm Purge</h2>
            <p className="text-sm text-gray-500 dark:text-white/60 font-medium mb-8">
              Are you absolute about deleting <strong className="text-gray-900 dark:text-white">{selectedMember?.firstName} {selectedMember?.lastName}</strong>? This will expunge all associated student records and billing history.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/20 w-full h-14 uppercase tracking-widest font-black"
                onClick={handleDelete}
                loading={saving}
              >
                Permanently Delete
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-400 font-bold"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={saving}
              >
                Abort Deletion
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MembersList;
