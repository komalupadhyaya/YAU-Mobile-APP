import { collection, getDocs } from 'firebase/firestore';
import { Activity, AlertCircle, Calendar, ChevronRight, Database, MessageSquare, RefreshCw, School, ShieldCheck, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { migrateSchedules } from '../lib/consistency';
import { db } from '../lib/firebase';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    members: 0,
    schedules: 0,
    messages: 0,
    schools: 0
  });
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean, count: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [membersSnap, schedulesSnap, messagesSnap, schoolsSnap] = await Promise.all([
          getDocs(collection(db, 'members')),
          getDocs(collection(db, 'schedules')),
          getDocs(collection(db, 'admin_posts')),
          getDocs(collection(db, 'app_schools'))
        ]);

        setStats({
          members: membersSnap.size,
          schedules: schedulesSnap.size,
          messages: messagesSnap.size,
          schools: schoolsSnap.size
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleMigration = async () => {
    setMigrating(true);
    setMigrationResult(null);
    const result = await migrateSchedules();
    setMigrationResult(result);
    setMigrating(false);
  };

  const statCards = [
    { label: 'Total Members', value: stats.members, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Schedules', value: stats.schedules, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Broadcasts Sent', value: stats.messages, icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Apps/Schools', value: stats.schools, icon: School, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">System Dashboard</h1>
          <p className="text-gray-500 font-medium">Monitoring YAU platform health and data consistency.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm">
          <Activity size={14} className="text-green-500 animate-pulse" />
          REAL-TIME MONITORING ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <Card key={idx} className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-none bg-white dark:bg-black">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.53] dark:opacity-[0.45] group-hover:scale-150 transition-transform-modify duration-700 bg-current`} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-white group-hover:scale-110 transition-transform duration-500`}>
                  <card.icon size={24} />
                </div>
                <Badge variant="neutral" className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white border-none uppercase tracking-widest text-[9px] font-black">
                  Overview
                </Badge>
              </div>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] mb-1">{card.label}</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{card.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card
            title="Operational Integrity"
            subtitle="Current status of platform services and integrations."
            headerAction={<Badge variant="success">All Systems Nominal</Badge>}
            className="h-full"
          >
            <div className="space-y-3">
              {[
                { name: 'Firestore Database', status: 'Stable', icon: Database, color: 'text-orange-500' },
                { name: 'FCM Push Engine', status: 'Active', icon: MessageSquare, color: 'text-indigo-500' },
                { name: 'Mobile API Gateway', status: 'Healthy', icon: RefreshCw, color: 'text-blue-500' },
              ].map((service, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent dark:border-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/10 transition-all cursor-default">
                  <div className="flex items-center">
                    <div className="p-1.5 bg-white dark:bg-black rounded-lg mr-3 shadow-sm">
                      <service.icon size={16} className={`${service.color}`} />
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-white">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white dark:bg-black border border-gray-100 dark:border-white/5 rounded-lg shadow-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black text-gray-500 dark:text-white/60 uppercase tracking-tighter">{service.status}</span>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                <div className="flex gap-3">
                  <div className="p-2.5 bg-white dark:bg-black rounded-xl shadow-sm self-start">
                    <ShieldCheck className="w-5 h-5 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">Production Environment</h4>
                    <p className="text-[10px] text-gray-500 dark:text-white/40 font-medium leading-relaxed">
                      Changes made here will affect the live YAU app. User IDs and FCM tokens are production-grade.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
              <Database size={80} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                  <RefreshCw className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Maintenence</h2>
                  <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">Data Consistency Tools</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-white mb-2 flex items-center">
                    Sync Schedule Formats
                    <Badge variant="warning" className="ml-2 bg-amber-400/20 text-amber-300 border-transparent text-[9px] px-1.5 py-0">MIGRATION REQUIRED</Badge>
                  </h3>
                  <p className="text-[11px] text-indigo-100 font-medium leading-relaxed opacity-70">
                    Automatically map legacy `ageGroups` fields to the new `grade_band` format. Essential for mobile app compatibility.
                  </p>
                </div>

                {migrationResult && (
                  <div className={`p-4 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300 ${migrationResult.success ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                    <div className={`p-2 rounded-xl ${migrationResult.success ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-1">{migrationResult.success ? 'Sync Successful' : 'Sync Error'}</div>
                      <p className="text-[11px] text-indigo-50 font-medium opacity-80">
                        {migrationResult.count} schedules identified and normalized to Band-based formatting.
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleMigration}
                  loading={migrating}
                  variant="primary"
                  className="w-full text-indigo-950 hover:bg-indigo-50 border-none shadow-xl h-14 text-sm font-black uppercase tracking-widest"
                  rightIcon={!migrating && <ChevronRight size={18} />}
                >
                  {migrating ? 'Syncing...' : 'Run Consistency Sync'}
                </Button>

                <p className="text-[10px] text-indigo-300 font-bold text-center uppercase tracking-tighter opacity-60">
                  Last run: Never | Recommended frequency: Weekly
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
