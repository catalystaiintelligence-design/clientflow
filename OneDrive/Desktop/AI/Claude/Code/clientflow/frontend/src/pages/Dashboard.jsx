import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, CheckCircle, Clock, AlertCircle, TrendingUp, ArrowRight, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '../utils/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { formatDate } from '../utils/formatters';

const StatCard = ({ title, value, icon: Icon, iconBg, sub, trend }) => (
  <div className="bg-white rounded-lg border border-sf-border shadow-card hover:shadow-card-hover transition-shadow">
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-sf-muted uppercase tracking-wide">{title}</p>
        <div className={`w-9 h-9 rounded flex items-center justify-center ${iconBg}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-4xl font-bold text-sf-slate mb-1">{value}</p>
      {sub && <p className="text-xs text-sf-muted">{sub}</p>}
    </div>
    <div className="px-5 py-2 border-t border-sf-border bg-gray-50/50 rounded-b-lg">
      <span className="text-xs text-sf-muted flex items-center gap-1">
        <Activity className="w-3 h-3" />
        {trend || 'All time'}
      </span>
    </div>
  </div>
);

const STATUS_COLORS = {
  not_started: '#706E6B',
  in_progress: '#0176D3',
  submitted:   '#FE9339',
  completed:   '#2E844A',
};

const Dashboard = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clients')
      .then((res) => setClients(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total:      clients.length,
    completed:  clients.filter((c) => c.status === 'completed').length,
    inProgress: clients.filter((c) => c.status === 'in_progress' || c.status === 'submitted').length,
    notStarted: clients.filter((c) => c.status === 'not_started').length,
  };

  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100) : 0;

  const chartData = [
    { name: 'Not Started', value: stats.notStarted,  status: 'not_started' },
    { name: 'In Progress', value: stats.inProgress,  status: 'in_progress' },
    { name: 'Completed',   value: stats.completed,   status: 'completed'   },
  ];

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-white rounded-lg w-64 border border-sf-border" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-lg border border-sf-border" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-sf-muted mb-1">
            <span>Home</span>
            <span>/</span>
            <span className="text-sf-slate font-medium">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-sf-slate">Dashboard</h1>
          <p className="text-sf-muted text-sm mt-0.5">Client onboarding pipeline overview</p>
        </div>
        <Link
          to="/clients"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded border border-primary-600 shadow-sm transition-colors"
        >
          <Users className="w-4 h-4" />
          Manage Clients
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={stats.total}
          icon={Users}
          iconBg="bg-primary-500"
          sub="All clients"
          trend="Active pipeline"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          iconBg="bg-sf-success"
          sub={`${completionRate}% completion rate`}
          trend="Fully onboarded"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          iconBg="bg-sf-blue"
          sub="Submitted + active"
          trend="Awaiting action"
        />
        <StatCard
          title="Not Started"
          value={stats.notStarted}
          icon={AlertCircle}
          iconBg="bg-sf-muted"
          sub="Pending invite"
          trend="Need attention"
        />
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar Chart */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sf-muted" />
              <h2 className="text-sm font-semibold text-sf-slate">Status Breakdown</h2>
            </div>
          </Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDDBDA" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#706E6B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#706E6B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 4, border: '1px solid #DDDBDA', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#F3F2F2' }}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>

        {/* Recent Clients */}
        <Card className="lg:col-span-3">
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-sf-slate">Recent Clients</h2>
              <Link to="/clients" className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1 font-medium">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card.Header>
          <div className="divide-y divide-sf-border">
            {recentClients.length === 0 ? (
              <div className="px-5 py-10 text-center text-sf-muted text-sm">
                No clients yet.{' '}
                <Link to="/clients" className="text-primary-500 hover:underline">Add your first client</Link>
              </div>
            ) : (
              recentClients.map((client) => (
                <Link
                  key={client.id}
                  to={`/clients/${client.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-sf-neutral transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-sf-slate group-hover:text-primary-500 transition-colors">
                        {client.name}
                      </p>
                      <p className="text-xs text-sf-muted">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={client.status} />
                    <span className="text-xs text-sf-muted hidden sm:block">{formatDate(client.createdAt)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
