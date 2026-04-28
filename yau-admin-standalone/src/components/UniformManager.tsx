import React, { useState, useEffect } from 'react';
import { Shirt, Search, CheckCircle2, XCircle, Clock, Download, Loader2, User } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Select } from './ui/Select';
import { uniformService } from '../lib/api';
import type { UniformOrder } from '../lib/api';

const UniformManager: React.FC = () => {
  const [orders, setOrders] = useState<UniformOrder[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'received' | 'pending'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ordersData = await uniformService.getOrders();
      const summaryData = await uniformService.getSummary();
      setOrders(ordersData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching uniform data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleReceived = async (orderId: string, currentStatus: boolean) => {
    try {
      setActionLoading(orderId);
      await uniformService.updateStatus(orderId, !currentStatus);
      await fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch =
      (order.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.parentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.team || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'received' && order.received) ||
      (filterStatus === 'pending' && !order.received);

    return matchesSearch && matchesStatus;
  });

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Uniform Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Uniform Management</h1>
          <p className="text-gray-500 dark:text-white/60 font-medium tracking-tight">Track kit orders, sizes, and distribution status across teams.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="h-12" leftIcon={<Download size={18} />}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-indigo-50 dark:bg-indigo-900/20">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Shirt size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-2">Total Orders</p>
              <p className="text-3xl font-black text-indigo-900 dark:text-white">{summary?.totalOrders || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-emerald-50 dark:bg-emerald-500/20">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-2">Distributed</p>
              <p className="text-3xl font-black text-emerald-900 dark:text-white">{summary?.received || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-yellow-50 dark:bg-yellow-500/20">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500 text-white flex items-center justify-center shadow-lg shadow-yellow-500/20 shrink-0">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest leading-none mb-2">Pending Delivery</p>
              <p className="text-3xl font-black text-yellow-900 dark:text-white">{summary?.notReceived || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-rose-50 dark:bg-rose-500/20">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
              <XCircle size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none mb-2">Unpaid Orders</p>
              <p className="text-3xl font-black text-rose-900 dark:text-white">{summary?.pendingPayment || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white dark:bg-black rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="w-full lg:w-96">
            <Input
              placeholder="Search by student, parent or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} className="text-gray-400 dark:text-white/60" />}
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Select
              label=""
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              options={[
                { label: 'All Orders', value: 'all' },
                { label: 'Distributed', value: 'received' },
                { label: 'Pending', value: 'pending' }
              ]}
              className="w-full lg:w-48"
            />
            <Badge variant="info" className="px-4 py-2.5 text-xs whitespace-nowrap">{filteredOrders.length} Results Found</Badge>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Athlete & Parent</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Team / Age</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Kit Specs</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-white/60 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-indigo-50/30 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">
                        {order.studentName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-900 dark:group-hover:text-indigo-300">
                          {order.studentName}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-white/40 flex items-center mt-0.5">
                          <User size={10} className="mr-1" /> {order.parentName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-none font-bold w-fit">
                        {order.team.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] font-bold text-gray-400 flex items-center italic">
                        {order.ageGroup}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="text-center px-2 py-1 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                        <p className="text-[8px] font-black text-gray-400 uppercase">Top</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{order.uniformTop}</p>
                      </div>
                      <div className="text-center px-2 py-1 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                        <p className="text-[8px] font-black text-gray-400 uppercase">Bottom</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{order.uniformBottom}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <Badge variant={order.received ? 'success' : 'warning'}>
                        {order.received ? 'DISTRIBUTED' : 'PENDING'}
                      </Badge>
                      <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'error'} className="text-[8px] h-4">
                        {(order.paymentStatus || 'UNPAID').toUpperCase()}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant={order.received ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleReceived(order.id, order.received)}
                      loading={actionLoading === order.id}
                      className="text-[10px] font-black uppercase tracking-widest h-9"
                    >
                      {order.received ? 'Recall Item' : 'Distribute'}
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Shirt size={48} className="text-gray-100 dark:text-indigo-900 mb-4" />
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">No orders matched your filter</h3>
                      <p className="text-sm text-gray-400 dark:text-indigo-400 font-medium">Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UniformManager;
