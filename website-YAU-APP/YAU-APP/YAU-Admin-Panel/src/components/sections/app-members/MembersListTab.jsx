import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Phone, Search, Filter, Mail, MapPin } from 'lucide-react';

const MembersListTab = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterAgeGroup, setFilterAgeGroup] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'members'), (snapshot) => {
      // Flatten members and their students for table display
      const flattenedData = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.students && Array.isArray(data.students)) {
          data.students.forEach((student, index) => {
            flattenedData.push({
               id: `${doc.id}_${index}`,
               memberId: doc.id,
               parentName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
               phone: data.phone || '',
               email: data.email || '',
               childName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
               grade: student.grade || '',
               school: student.school_name || data.location || '',
               sport: student.sport || data.sport || '',
               ageGroup: student.ageGroup || '',
               // Group assignment is a concept based on school + band + sport
               groupAssignment: `${student.school_name || ''} / ${student.ageGroup || ''} / ${student.sport || ''}`
            });
          });
        } else {
          // Parent without students array mapped (fallback)
          flattenedData.push({
            id: doc.id,
            memberId: doc.id,
            parentName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            phone: data.phone || '',
            email: data.email || '',
            childName: 'N/A',
            grade: 'N/A',
            school: data.location || 'N/A',
            sport: data.sport || 'N/A',
            ageGroup: 'N/A',
            groupAssignment: 'Unassigned'
          });
        }
      });
      setMembers(flattenedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredMembers = members.filter(m => {
    const searchMatch = m.parentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       m.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       m.phone.includes(searchTerm);
    const sportMatch = filterSport ? m.sport.toLowerCase() === filterSport.toLowerCase() : true;
    const schoolMatch = filterSchool ? m.school.toLowerCase().includes(filterSchool.toLowerCase()) : true;
    const ageGroupMatch = filterAgeGroup ? m.ageGroup === filterAgeGroup : true;
    
    return searchMatch && sportMatch && schoolMatch && ageGroupMatch;
  });

  const getUniqueValues = (key) => [...new Set(members.map(m => m[key]).filter(v => v !== 'N/A' && v !== ''))];

  if (loading) return <div className="text-center py-10">Loading Members...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">App Members & Registrations</h2>
        <p className="text-gray-500 text-sm mt-1">View all user registrations from the YAU Mobile App.</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        
        <select
          value={filterSchool}
          onChange={(e) => setFilterSchool(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded-lg outline-none text-sm bg-white"
        >
          <option value="">All Schools/Locations</option>
          {getUniqueValues('school').map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filterAgeGroup}
          onChange={(e) => setFilterAgeGroup(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded-lg outline-none text-sm bg-white"
        >
          <option value="">All Grade Bands</option>
          {getUniqueValues('ageGroup').map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select
          value={filterSport}
          onChange={(e) => setFilterSport(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded-lg outline-none text-sm bg-white"
        >
          <option value="">All Sports</option>
          {getUniqueValues('sport').map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Parent Details</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Child / Grade</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">School / Location</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sport</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Group Assignment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredMembers.map((member) => (
              <tr key={member.id} className="hover:bg-blue-50/50 transition">
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold text-gray-900">{member.parentName}</div>
                  <div className="mt-1 flex items-center text-xs text-blue-600">
                    <Phone size={12} className="mr-1" />
                    <a href={`tel:${member.phone}`} className="hover:underline">{member.phone}</a>
                  </div>
                  {member.email && (
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <Mail size={12} className="mr-1" />
                      {member.email}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-800">{member.childName}</div>
                  <div className="text-xs text-gray-500 mt-1">{member.grade} ({member.ageGroup})</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <MapPin size={14} className="mr-1 text-red-400" />
                    {member.school}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {member.sport}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                    {member.groupAssignment}
                  </div>
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  No members found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MembersListTab;
