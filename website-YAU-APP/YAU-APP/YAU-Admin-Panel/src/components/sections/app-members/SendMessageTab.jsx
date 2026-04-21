import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, onSnapshot, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Send, Users } from 'lucide-react';

const SendMessageTab = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('');
  
  const [history, setHistory] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Distinct filters to populate dropdowns (mocked or loaded)
  const locations = ['Brandywine Elementary', 'New York', 'Other'];
  const sports = ['Basketball', 'Soccer', 'Football', 'Cheer'];
  const gradeBands = ['Band 1', 'Band 2', 'Band 3', 'Band 4'];

  useEffect(() => {
    // Determine how many members match this audience
    const fetchMemberCount = async () => {
      try {
        const snap = await getDocs(collection(db, 'members'));
        let count = 0;
        snap.forEach(doc => {
          const m = doc.data();
          const matchesLocation = locationFilter ? m.location === locationFilter : true;
          const matchesSport = sportFilter ? m.sport === sportFilter : true;
          let matchesAge = true;
          if (ageGroupFilter && m.students) {
            matchesAge = m.students.some(s => s.ageGroup === ageGroupFilter || s.grade === ageGroupFilter);
          }
          if (matchesLocation && matchesSport && matchesAge) count++;
        });
        setMemberCount(count);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMemberCount();
  }, [sportFilter, locationFilter, ageGroupFilter]);

  useEffect(() => {
    const q = query(collection(db, 'admin_posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(posts);
    });
    return () => unsubscribe();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !body) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'admin_posts'), {
        title,
        body,
        sport: sportFilter || null,
        location: locationFilter || null,
        ageGroup: ageGroupFilter || null,
        timestamp: serverTimestamp(),
      });
      setTitle('');
      setBody('');
      alert('Message sent successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Compose Form */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Compose Message</h2>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <form onSubmit={handleSend} className="space-y-4">
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                <Users size={16} className="mr-2" /> Target Audience
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={sportFilter}
                  onChange={e => setSportFilter(e.target.value)}
                  className="w-full text-sm p-2 border border-blue-200 rounded outline-none"
                >
                  <option value="">All Sports</option>
                  {sports.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  className="w-full text-sm p-2 border border-blue-200 rounded outline-none"
                >
                  <option value="">All Locations</option>
                  {locations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={ageGroupFilter}
                  onChange={e => setAgeGroupFilter(e.target.value)}
                  className="w-full text-sm p-2 border border-blue-200 rounded outline-none"
                >
                  <option value="">All Grade Bands</option>
                  {gradeBands.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="text-xs text-blue-600 mt-2 font-medium">
                Approximate Audience Size: {memberCount} families
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none block"
                placeholder="e.g. Practice Cancelled Today"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
              <textarea
                required
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[150px]"
                placeholder="Write your message here..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={18} className="mr-2" />
              {loading ? 'Sending...' : 'Send Push Notification'}
            </button>
          </form>
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Message History</h2>
        <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-y-auto max-h-[600px] p-4 space-y-4">
          {history.map(msg => (
            <div key={msg.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900">{msg.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{msg.body}</p>
              
              <div className="flex flex-wrap items-center mt-3 gap-2">
                {msg.sport && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{msg.sport}</span>}
                {msg.location && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">{msg.location}</span>}
                {msg.ageGroup && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">{msg.ageGroup}</span>}
                {!msg.sport && !msg.location && !msg.ageGroup && (
                  <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">All Members</span>
                )}
                
                <span className="text-gray-400 text-xs ml-auto">
                  {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleDateString() : 'Just now'}
                </span>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No messages sent yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendMessageTab;
