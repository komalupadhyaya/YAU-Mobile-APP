import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import MembersListTab from './MembersListTab';
import SendMessageTab from './SendMessageTab';
import GameScheduleTab from './GameScheduleTab';
import SchoolsProgramsTab from './SchoolsProgramsTab';

const AppMembersManager = () => {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || '';

  const tabs = [
    { id: 'list', label: 'App Members List', path: 'list' },
    { id: 'message', label: 'Send Message', path: 'message' },
    { id: 'schedule', label: 'Game Schedule', path: 'schedule' },
    { id: 'schools', label: 'Schools & Programs', path: 'schools' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h1 className="text-2xl font-bold text-gray-900">YAU App Members</h1>
          <p className="text-gray-500 text-sm mt-1">Manage mobile app registrations, messages, and configurations.</p>
        </div>
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = currentPath === tab.path || (currentPath === 'app-members' && tab.path === 'list');
            return (
              <Link
                key={tab.id}
                to={`/admin/app-members/${tab.path}`}
                className={`flex-1 min-w-[150px] text-center py-4 px-6 text-sm font-medium transition-all duration-200 border-b-2 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full min-h-[500px]">
        <Routes>
          <Route path="/" element={<Navigate to="list" replace />} />
          <Route path="list" element={<MembersListTab />} />
          <Route path="message" element={<SendMessageTab />} />
          <Route path="schedule" element={<GameScheduleTab />} />
          <Route path="schools" element={<SchoolsProgramsTab />} />
        </Routes>
      </div>
    </div>
  );
};

export default AppMembersManager;
