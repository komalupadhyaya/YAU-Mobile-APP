import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import {
  Activity,
  Bell,
  Calendar,
  MessageSquare,
  School,
  Trophy,
  Users,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Link } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCard { label: string; value: number | string; icon: React.ReactNode; color: string; bg: string; }
interface RecentReg {
  id: string; parentName: string; school: string; sport: string; createdAt: any;
}
interface RecentMsg {
  id: string; title: string; targetLocation: string; targetAgeGroup: string; createdAt: any;
}
interface UpcomingGame {
  id: string; team1Name: string; team2Name: string; sport: string; date: string; time: string; grade_band: string;
}
interface SportBreakdown { sport: string; count: number; }
interface GradeBreakdown { band: string; count: number; }
interface SchoolBreakdown { school: string; count: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(ts: any): string {
  if (!ts) return '';
  const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

function isThisWeek(ts: any): boolean {
  if (!ts) return false;
  const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  const now = Date.now();
  return now - date.getTime() < 7 * 24 * 60 * 60 * 1000;
}

const SPORT_COLORS: Record<string, string> = {
  'Flag Football': '#1565C0',
  'Soccer': '#2E7D32',
  'Cheer': '#AD1457',
  'Basketball': '#E65100',
};

// ─── Dashboard Component ──────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalSchools, setTotalSchools] = useState(0);
  const [messagesThisWeek, setMessagesThisWeek] = useState(0);
  const [upcomingGamesCount, setUpcomingGamesCount] = useState(0);
  const [recentRegs, setRecentRegs] = useState<RecentReg[]>([]);
  const [recentMsgs, setRecentMsgs] = useState<RecentMsg[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);
  const [sportBreakdown, setSportBreakdown] = useState<SportBreakdown[]>([]);
  const [gradeBreakdown, setGradeBreakdown] = useState<GradeBreakdown[]>([]);
  const [schoolBreakdown, setSchoolBreakdown] = useState<SchoolBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Members
    const membersUnsub = onSnapshot(collection(db, 'members'), (snap) => {
      setTotalMembers(snap.size);

      // Recent registrations (last 5)
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .sort((a, b) => {
          const at = a.createdAt?.seconds ?? 0;
          const bt = b.createdAt?.seconds ?? 0;
          return bt - at;
        })
        .slice(0, 5);
      setRecentRegs(docs.map((d: any) => ({
        id: d.id,
        parentName: `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Unknown',
        school: d.students?.[0]?.school_name || '—',
        sport: d.students?.[0]?.sport || d.sport || '—',
        createdAt: d.createdAt,
      })));

      // Sport breakdown
      const sportMap: Record<string, number> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        const sport = data.students?.[0]?.sport || data.sport || 'Other';
        sportMap[sport] = (sportMap[sport] || 0) + 1;
      });
      setSportBreakdown(Object.entries(sportMap).map(([sport, count]) => ({ sport, count })).sort((a, b) => b.count - a.count));

      // Grade breakdown
      const gradeMap: Record<string, number> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        const band = data.students?.[0]?.grade_band || data.students?.[0]?.ageGroup || 'Unknown';
        gradeMap[band] = (gradeMap[band] || 0) + 1;
      });
      setGradeBreakdown(Object.entries(gradeMap).map(([band, count]) => ({ band, count })).sort((a, b) => a.band.localeCompare(b.band)));

      // School breakdown
      const schoolMap: Record<string, number> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        const school = data.students?.[0]?.school_name || 'Other';
        schoolMap[school] = (schoolMap[school] || 0) + 1;
      });
      setSchoolBreakdown(Object.entries(schoolMap).map(([school, count]) => ({ school, count })).sort((a, b) => b.count - a.count));

      setLoading(false);
    });
    unsubs.push(membersUnsub);

    // Schools
    const schoolsUnsub = onSnapshot(query(collection(db, 'app_schools'), where('active', '==', true)), snap => {
      setTotalSchools(snap.size);
    });
    unsubs.push(schoolsUnsub);

    // Messages
    const msgsUnsub = onSnapshot(query(collection(db, 'admin_posts'), orderBy('createdAt', 'desc'), limit(20)), snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setMessagesThisWeek(docs.filter(d => isThisWeek(d.createdAt)).length);
      setRecentMsgs(docs.slice(0, 3).map(d => ({
        id: d.id,
        title: d.title || 'Untitled',
        targetLocation: d.targetLocation || 'All',
        targetAgeGroup: d.targetAgeGroup || 'All',
        createdAt: d.createdAt,
      })));
    });
    unsubs.push(msgsUnsub);

    // Schedules — upcoming this week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const nextWeek = new Date(today.getTime() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

    getDocs(query(collection(db, 'schedules'), orderBy('date', 'asc'), limit(50))).then(snap => {
      const upcoming = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(d => d.date >= todayStr)
        .slice(0, 5);
      setUpcomingGamesCount(snap.docs.filter(d => { const dt = d.data().date; return dt >= todayStr && dt <= nextWeek; }).length);
      setUpcomingGames(upcoming);
    });

    return () => unsubs.forEach(f => f());
  }, []);

  const stats: StatCard[] = [
    { label: 'Total Members',    value: totalMembers,      icon: <Users size={22} />,        color: '#1565C0', bg: '#EFF6FF' },
    { label: 'Active Schools',   value: totalSchools,      icon: <School size={22} />,       color: '#2E7D32', bg: '#F0FDF4' },
    { label: 'Messages / Week',  value: messagesThisWeek,  icon: <MessageSquare size={22} />, color: '#AD1457', bg: '#FDF2F8' },
    { label: 'Games This Week',  value: upcomingGamesCount, icon: <Calendar size={22} />,    color: '#E65100', bg: '#FFF7ED' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Command Center</h1>
        <p className="text-gray-500 dark:text-white/60 font-medium">Your YAU program at a glance</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-black rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: s.bg, color: s.color }}>{s.icon}</div>
            </div>
            <div className="text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-bold text-gray-400 dark:text-white/50 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Activity Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations */}
        <div className="lg:col-span-2">
          <Card title="Recent Registrations" subtitle="Last 5 new members" headerAction={<Activity size={18} className="text-indigo-600" />}>
            {recentRegs.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No registrations yet</p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {recentRegs.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm">
                        {(r.parentName[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{r.parentName}</p>
                        <p className="text-xs text-gray-400 dark:text-white/40">{r.school} · {r.sport}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-white/30">{timeAgo(r.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card title="Quick Actions">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Send Message', icon: <Bell size={20} />, color: '#1565C0', bg: '#EFF6FF', href: '/messaging' },
                { label: 'Add Game',     icon: <Calendar size={20} />, color: '#2E7D32', bg: '#F0FDF4', href: '/schedules?action=add' },
                { label: 'Add School',  icon: <School size={20} />, color: '#AD1457', bg: '#FDF2F8', href: '/schools' },
                { label: 'View Members', icon: <Users size={20} />, color: '#E65100', bg: '#FFF7ED', href: '/members' },
              ].map(a => (
                <Link
                  key={a.label}
                  to={a.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 dark:border-white/10 hover:shadow-md transition-all cursor-pointer"
                  style={{ backgroundColor: a.bg + '33' }}
                >
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: a.bg, color: a.color }}>{a.icon}</div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-white/60 text-center leading-tight">{a.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Recent Messages + Upcoming Games ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <Card title="Recent Broadcasts" subtitle="Last 3 admin messages" headerAction={<MessageSquare size={18} className="text-pink-600" />}>
          {recentMsgs.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No messages sent yet</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {recentMsgs.map(m => (
                <div key={m.id} className="py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{m.title}</p>
                      <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                        {m.targetLocation === 'all' ? 'All Schools' : m.targetLocation} ·{' '}
                        {m.targetAgeGroup === 'all' ? 'All Grades' : m.targetAgeGroup}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-white/30 ml-2 shrink-0">{timeAgo(m.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Games */}
        <Card title="Upcoming Games" subtitle="Next scheduled games" headerAction={<Trophy size={18} className="text-orange-500" />}>
          {upcomingGames.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No upcoming games</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {upcomingGames.map(g => (
                <div key={g.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{g.team1Name} <span className="text-gray-400 font-normal">vs</span> {g.team2Name}</p>
                      <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{g.date} · {g.time} · {g.sport}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{g.grade_band || '—'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Membership Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Sport */}
        <Card title="Members by Sport">
          <div className="space-y-3">
            {sportBreakdown.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No data</p> : sportBreakdown.map(({ sport, count }) => {
              const pct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
              const color = SPORT_COLORS[sport] || '#6366F1';
              return (
                <div key={sport}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-bold text-gray-700 dark:text-white">{sport}</span>
                    <span className="font-black" style={{ color }}>{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* By Grade Band */}
        <Card title="Members by Grade Band">
          <div className="space-y-3">
            {gradeBreakdown.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No data</p> : gradeBreakdown.map(({ band, count }) => {
              const pct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
              return (
                <div key={band}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-bold text-gray-700 dark:text-white">{band}</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-2 bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Membership by School ── */}
      <div className="grid grid-cols-1 gap-6">
        <Card title="Members by School">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schoolBreakdown.length === 0 ? <p className="text-sm text-gray-400 text-center py-4 col-span-full">No data</p> : schoolBreakdown.map(({ school, count }) => {
              const pct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
              return (
                <div key={school} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-bold text-gray-700 dark:text-white truncate flex-1 mr-2">{school}</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">{count}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-2 bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 w-8">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
