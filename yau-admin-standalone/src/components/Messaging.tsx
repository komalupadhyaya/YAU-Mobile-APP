import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit, where, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Send, Target, Plus, Trash2, History, ChevronDown, ChevronUp, MessageSquare, X } from 'lucide-react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TargetGroup {
  school: string;
  gradeBand: string;
  sport: string;
}

interface SentMessage {
  id: string;
  title: string;
  description: string;
  targetGroups?: TargetGroup[];
  createdAt: any;
  replyCount?: number;
}

interface MessageReply {
  id: string;
  userId: string;
  userName: string;
  userRole: 'parent' | 'coach' | 'admin';
  content: string;
  timestamp: any;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GRADE_BANDS = ['K / 1st Grade', '2nd / 3rd Grade', '4th / 5th Grade', 'Middle School'];
const SPORTS = ['Flag Football', 'Soccer', 'Cheer', 'Basketball'];

// ─── Component ────────────────────────────────────────────────────────────────
const Messaging: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Builder state
  const [currentSchool, setCurrentSchool] = useState('all');
  const [currentGradeBand, setCurrentGradeBand] = useState('all');
  const [currentSport, setCurrentSport] = useState('all');
  const [targetGroups, setTargetGroups] = useState<TargetGroup[]>([]);
  
  // Metadata state
  const [schools, setSchools] = useState<{id: string, name: string}[]>([]);
  const [history, setHistory] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  // Reply state
  const [selectedPost, setSelectedPost] = useState<SentMessage | null>(null);
  const [replies, setReplies] = useState<MessageReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    const qSchools = query(collection(db, 'app_schools'), where('active', '==', true), orderBy('name', 'asc'));
    const unsubSchools = onSnapshot(qSchools, (snap) => {
      setSchools(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });

    const qHistory = query(collection(db, 'admin_posts'), orderBy('createdAt', 'desc'), limit(15));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SentMessage)));
    });

    return () => { unsubSchools(); unsubHistory(); };
  }, []);

  useEffect(() => {
    if (selectedPost) {
      const qReplies = query(collection(db, 'admin_posts', selectedPost.id, 'replies'), orderBy('timestamp', 'asc'));
      const unsub = onSnapshot(qReplies, (snap) => {
        setReplies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageReply)));
      });
      return () => unsub();
    }
  }, [selectedPost]);

  const addGroup = () => {
    if (targetGroups.some(g => g.school === currentSchool && g.gradeBand === currentGradeBand && g.sport === currentSport)) {
      toast.error('Group already added.'); return;
    }
    setTargetGroups([...targetGroups, { school: currentSchool, gradeBand: currentGradeBand, sport: currentSport }]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || targetGroups.length === 0) {
      toast.error('Required fields missing.'); return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'admin_posts'), {
        title: title.trim(),
        description: description.trim(),
        targetGroups,
        createdAt: serverTimestamp(),
        type: 'admin',
        replyCount: 0
      });
      toast.success('Broadcast sent!');
      setTitle(''); setDescription(''); setTargetGroups([]);
    } catch (error) {
      toast.error('Failed to send broadcast.');
    } finally { setLoading(false); }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedPost || sendingReply) return;

    setSendingReply(true);
    try {
      await addDoc(collection(db, 'admin_posts', selectedPost.id, 'replies'), {
        userId: 'admin',
        userName: 'YAU Administrator',
        userRole: 'admin',
        content: replyText.trim(),
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, 'admin_posts', selectedPost.id), {
        replyCount: increment(1)
      });
      setReplyText('');
      toast.success('Reply sent.');
    } catch (error) {
      toast.error('Failed to send reply.');
    } finally { setSendingReply(false); }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Messaging Center</h1>
          <p className="text-gray-500 dark:text-white/60 font-medium tracking-tight">Broadcast alerts and manage two-way conversations with members.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Compose Broadcast">
            <form onSubmit={handleSend} className="space-y-6">
              <Input label="Subject" placeholder="e.g. Game Rescheduled" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} required />
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Message Body</label>
                <textarea rows={4} className="w-full px-4 py-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all resize-none" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <Button type="submit" variant="primary" className="w-full h-14 uppercase font-black tracking-widest" loading={loading} disabled={targetGroups.length === 0} leftIcon={<Send size={18} />}>Dispatach Broadcast</Button>
            </form>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2"><History size={20} className="text-indigo-600" /><h2 className="text-lg font-black text-gray-900 dark:text-white uppercase">History & Replies</h2></div>
              <Button variant="ghost" size="sm" onClick={() => setIsHistoryOpen(!isHistoryOpen)}>{isHistoryOpen ? <ChevronUp /> : <ChevronDown />}</Button>
            </div>

            {isHistoryOpen && (
              <div className="space-y-3">
                {history.map(msg => (
                  <div key={msg.id} className="p-5 bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><h4 className="font-bold text-gray-900 dark:text-white">{msg.title}</h4><Badge variant="neutral" className="text-[10px]">{msg.createdAt?.toDate().toLocaleDateString()}</Badge></div>
                      <p className="text-xs text-gray-500 line-clamp-1">{msg.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <Button variant="ghost" size="sm" onClick={() => setSelectedPost(msg)} className="relative h-10 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border-none">
                          <MessageSquare size={16} className="mr-2" /> 
                          {msg.replyCount || 0} Replies
                          {msg.replyCount! > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-sm" />}
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card title="Audience Targeting" headerAction={<Target className="w-5 h-5 text-red-500" />}>
            <div className="space-y-4">
              <Select label="School" value={currentSchool} onChange={(e) => setCurrentSchool(e.target.value)} options={[{label: 'All Schools', value: 'all'}, ...schools.map(s => ({label: s.name, value: s.name}))]} />
              <Select label="Grade Band" value={currentGradeBand} onChange={(e) => setCurrentGradeBand(e.target.value)} options={[{label: 'All Grades', value: 'all'}, ...GRADE_BANDS.map(b => ({label: b, value: b}))]} />
              <Select label="Sport" value={currentSport} onChange={(e) => setCurrentSport(e.target.value)} options={[{label: 'All Sports', value: 'all'}, ...SPORTS.map(s => ({label: s, value: s}))]} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 font-black text-[10px]" onClick={() => setTargetGroups([{school: 'all', gradeBand: 'all', sport: 'all'}])}>Select All</Button>
                <Button variant="primary" className="flex-1 font-black text-[10px]" onClick={addGroup} leftIcon={<Plus size={14} />}>Add Group</Button>
              </div>
              <div className="space-y-2 mt-4">
                {targetGroups.map((g, i) => (
                  <div key={i} className="flex justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-[11px] font-bold border border-gray-100 dark:border-white/10 uppercase">
                    <span>{g.school === 'all' ? '🌎 Global' : `${g.school} · ${g.gradeBand}`}</span>
                    <button onClick={() => setTargetGroups(targetGroups.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Reply Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <Card className="w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden border-none p-0"
            title={`Conversation: ${selectedPost.title}`}
            headerAction={<button onClick={() => setSelectedPost(null)}><X size={24} className="text-gray-400 hover:text-red-500" /></button>}
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar">
              <div className="p-4 bg-white border border-indigo-100 rounded-2xl shadow-sm mb-6">
                 <div className="flex items-center gap-2 mb-2"><Badge variant="primary" className="uppercase text-[9px]">Original Broadcast</Badge><span className="text-[10px] text-gray-400 font-bold">{selectedPost.createdAt?.toDate().toLocaleString()}</span></div>
                 <p className="text-sm font-bold text-gray-900">{selectedPost.title}</p>
                 <p className="text-xs text-gray-600 mt-2 leading-relaxed">{selectedPost.description}</p>
              </div>

              {replies.map(reply => (
                <div key={reply.id} className={`flex ${reply.userRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${reply.userRole === 'admin' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${reply.userRole === 'admin' ? 'text-indigo-100' : 'text-indigo-600'}`}>{reply.userName}</span>
                      <span className="text-[8px] opacity-60 font-bold">{reply.timestamp?.toDate().toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{reply.content}</p>
                  </div>
                </div>
              ))}
              {replies.length === 0 && <div className="text-center py-20 text-gray-400 italic">No member replies yet.</div>}
            </div>

            <form onSubmit={handleSendAdminReply} className="p-4 bg-white border-t border-gray-100 flex gap-4">
              <input type="text" placeholder="Type an official response..." className="flex-1 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              <Button type="submit" variant="primary" loading={sendingReply} disabled={!replyText.trim()} className="px-8 font-black uppercase tracking-widest">Reply</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Messaging;
