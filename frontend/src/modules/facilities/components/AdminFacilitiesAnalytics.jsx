import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BarChart3, Clock, TrendingUp, CheckCircle2, TimerReset } from 'lucide-react';

const fmtPct = (v) => `${Math.round((Number(v) || 0) * 100)}%`;

export default function AdminFacilitiesAnalytics() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`/api/admin/facilities/analytics?days=${days}`);
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const peakMax = useMemo(() => {
    const arr = data?.peakHours || [];
    return arr.reduce((m, x) => Math.max(m, Number(x?.approvedBookings || 0)), 0);
  }, [data]);

  const peakBest = useMemo(() => {
    const arr = data?.peakHours || [];
    if (arr.length === 0) return null;
    return arr.reduce(
      (best, cur) =>
        Number(cur?.approvedBookings || 0) > Number(best?.approvedBookings || 0) ? cur : best,
      arr[0]
    );
  }, [data]);

  const summary = data?.summary;
  const fromLabel = data?.from ? new Date(data.from).toLocaleDateString() : '';
  const toLabel = data?.to ? new Date(data.to).toLocaleDateString() : '';

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-sliit-blue text-white rounded-2xl shadow-lg">
          <BarChart3 size={30} />
        </div>
        <div className="min-w-0">
          <h1 className="sc-page-title text-sliit-navy">Facilities analytics</h1>
          <p className="sc-meta">
            Decision-ready insights for campus resource demand (past window) + operational workload (upcoming).
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <label className="sc-label">Window</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center sc-meta text-slate-400">Loading analytics…</div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 font-semibold text-sm">
          {error}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0">
                <p className="sc-label text-slate-600">Reporting window</p>
                <p className="font-semibold text-slate-800 text-sm truncate">
                  {fromLabel} → {toLabel}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={16} />
                    <p className="sc-label">Approved</p>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{Number(summary?.approvedTotal || 0)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                  <div className="flex items-center gap-2 text-sliit-blue">
                    <TrendingUp size={16} />
                    <p className="sc-label">Pending</p>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{Number(summary?.pendingTotal || 0)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                  <div className="flex items-center gap-2 text-rose-700">
                    <TimerReset size={16} />
                    <p className="sc-label">Rejected</p>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{Number(summary?.rejectedTotal || 0)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <TimerReset size={16} />
                    <p className="sc-label">Cancelled</p>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{Number(summary?.cancelledTotal || 0)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl">
              <div className="flex items-center gap-3 mb-4 text-sliit-blue">
                <TrendingUp size={18} />
                <h2 className="sc-section-title text-sliit-navy">Top resources</h2>
              </div>
              <div className="space-y-4">
                {(data?.topResources || []).length === 0 ? (
                  <p className="sc-meta">No approved bookings found.</p>
                ) : (
                  (data?.topResources || []).map((r) => (
                    <div key={r.resourceId} className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{r.name}</p>
                        <p className="sc-label">Resource #{r.resourceId}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-slate-900 text-sm">{r.approvedBookings}</p>
                        <p className="sc-label">approved</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl lg:col-span-2">
              <div className="flex items-center gap-3 mb-4 text-sliit-blue">
                <Clock size={18} />
                <h2 className="sc-section-title text-sliit-navy">Peak booking hours</h2>
              </div>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
                <div>
                  <p className="sc-meta">
                    Heatmap of approved booking start times across 24 hours (0–23) across all approved bookings.
                  </p>
                  {peakBest && Number(peakBest?.approvedBookings || 0) > 0 ? (
                    <p className="sc-label mt-2">
                      Peak hour: <span className="font-semibold text-slate-700">{String(peakBest.hour).padStart(2, '0')}:00</span> •{' '}
                      <span className="font-semibold text-slate-700">{Number(peakBest.approvedBookings || 0)}</span> approved
                    </p>
                  ) : (
                    <p className="sc-label mt-2">No approved bookings in this window yet.</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="sc-label text-slate-500">Low</span>
                  <div className="h-2 w-28 rounded-full bg-gradient-to-r from-slate-200 via-sliit-blue to-sliit-orange" />
                  <span className="sc-label text-slate-500">High</span>
                </div>
              </div>

              <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-2">
                {(data?.peakHours || []).map((h) => {
                  const hour = Number(h.hour || 0);
                  const val = Number(h.approvedBookings || 0);
                  const pct = peakMax <= 0 ? 0 : val / peakMax;

                  const isPeak = peakBest && Number(peakBest.hour) === hour && Number(peakBest.approvedBookings || 0) > 0;
                  // Show a clearer gradient even for low counts:
                  // 0 -> slate, low-but-nonzero -> light blue, mid -> blue, high/peak -> orange.
                  const bg =
                    pct >= 0.85
                      ? 'bg-sliit-orange'
                      : pct >= 0.45
                        ? 'bg-sliit-blue'
                        : pct > 0
                          ? 'bg-blue-200'
                          : 'bg-slate-200';

                  const showLabel = hour % 3 === 0;
                  const dayPart = hour < 6 ? 'Night' : hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

                  return (
                    <div key={hour} className="flex flex-col items-center gap-2">
                      <div className="relative w-full">
                        <div
                          title={`${String(hour).padStart(2, '0')}:00 (${dayPart}) — ${val} approved`}
                          className={[
                            'h-10 w-full rounded-xl border transition-all',
                            bg,
                            isPeak ? 'border-sliit-orange shadow-md' : 'border-white/60',
                            val > 0 ? 'hover:brightness-110' : 'hover:bg-slate-300',
                          ].join(' ')}
                        />
                        {isPeak ? (
                          <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-sliit-orange text-white text-[10px] font-semibold shadow">
                            PEAK
                          </div>
                        ) : null}
                      </div>
                      <span className={['sc-label', showLabel ? 'text-slate-600' : 'text-transparent select-none'].join(' ')}>
                        {showLabel ? String(hour).padStart(2, '0') : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/40">
              <h2 className="sc-section-title text-sliit-navy">Utilization score (novel)</h2>
              <p className="sc-meta mt-1">
                Utilization score = booked minutes ÷ (available minutes per day × window days).
              </p>
            </div>
            <div className="p-8">
              {(data?.utilization || []).length === 0 ? (
                <p className="sc-meta">No resources found.</p>
              ) : (
                <div className="space-y-4">
                  {(data?.utilization || []).map((u) => {
                    const score = Number(u.utilizationScore || 0);
                    const bar = Math.max(0, Math.min(100, Math.round(score * 100)));
                    const color = bar >= 70 ? 'bg-emerald-600' : bar >= 35 ? 'bg-amber-500' : 'bg-slate-300';
                    return (
                      <div key={u.resourceId} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-4 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{u.name}</p>
                          <p className="sc-label">
                            {u.bookedMinutes} mins booked • {u.availableMinutesPerDay} mins/day
                          </p>
                        </div>
                        <div className="md:col-span-6">
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${color}`} style={{ width: `${bar}%` }} />
                          </div>
                        </div>
                        <div className="md:col-span-2 text-right">
                          <p className="font-semibold text-slate-900">{fmtPct(score)}</p>
                          <p className="sc-label">score</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

