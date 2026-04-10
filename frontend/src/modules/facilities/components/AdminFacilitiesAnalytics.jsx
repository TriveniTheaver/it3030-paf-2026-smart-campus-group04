import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BarChart3, Clock, TrendingUp, CheckCircle2, TimerReset } from 'lucide-react';

const fmtPct = (v) => `${Math.round((Number(v) || 0) * 100)}%`;

export default function AdminFacilitiesAnalytics() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const peakSeries = useMemo(() => {
    const arr = data?.peakHours || [];
    return Array.from({ length: 24 }, (_, hour) => {
      const hit = arr.find((x) => Number(x?.hour) === hour);
      return { hour, approved: Number(hit?.approvedBookings || 0) };
    });
  }, [data]);

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
    return peakSeries.reduce((m, x) => Math.max(m, Number(x?.approved || 0)), 0);
  }, [peakSeries]);

  const peakBest = useMemo(() => {
    if (peakSeries.length === 0) return null;
    return peakSeries.reduce((best, cur) => (cur.approved > best.approved ? cur : best), peakSeries[0]);
  }, [peakSeries]);

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
                    Approved booking start times across 24 hours (0–23) within the selected reporting window.
                  </p>
                  {peakBest && Number(peakBest?.approved || 0) > 0 ? (
                    <p className="sc-label mt-2">
                      Peak hour: <span className="font-semibold text-slate-700">{String(peakBest.hour).padStart(2, '0')}:00</span> •{' '}
                      <span className="font-semibold text-slate-700">{Number(peakBest.approved || 0)}</span> approved
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

              <div className="mt-3">
                {peakMax <= 0 ? (
                  <p className="sc-meta text-slate-500">No approved bookings to chart.</p>
                ) : (
                  (() => {
                    const w = 820;
                    const h = 180;
                    const padX = 26;
                    const padY = 18;
                    const innerW = w - padX * 2;
                    const innerH = h - padY * 2;

                    const xFor = (i) => padX + (i / 23) * innerW;
                    const yFor = (v) => padY + (1 - v / peakMax) * innerH;

                    const pts = peakSeries.map((p, i) => ({ ...p, x: xFor(i), y: yFor(p.approved) }));
                    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
                    const area = `${d} L ${xFor(23).toFixed(1)} ${(padY + innerH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(padY + innerH).toFixed(1)} Z`;

                    return (
                      <div className="w-full">
                        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[11rem]">
                          <defs>
                            <linearGradient id="scPeakFill" x1="0" x2="1" y1="0" y2="0">
                              <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.35" />
                              <stop offset="55%" stopColor="#002147" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#F39C12" stopOpacity="0.25" />
                            </linearGradient>
                          </defs>

                          {/* grid */}
                          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                            const y = padY + t * innerH;
                            return <line key={t} x1={padX} y1={y} x2={w - padX} y2={y} stroke="#E2E8F0" strokeWidth="1" />;
                          })}

                          {/* area + line */}
                          <path d={area} fill="url(#scPeakFill)" />
                          <path d={d} fill="none" stroke="#002147" strokeWidth="3" />

                          {/* points */}
                          {pts.map((p) => {
                            const isPeak = peakBest && p.hour === peakBest.hour && peakBest.approved > 0;
                            return (
                              <g key={p.hour}>
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r={isPeak ? 5 : 3.5}
                                  fill={isPeak ? '#F39C12' : '#0F172A'}
                                  opacity={p.approved > 0 ? 0.95 : 0.35}
                                >
                                  <title>{`${String(p.hour).padStart(2, '0')}:00 — ${p.approved} approved`}</title>
                                </circle>
                              </g>
                            );
                          })}

                          {/* x labels */}
                          {pts.filter((p) => p.hour % 3 === 0).map((p) => (
                            <text
                              key={p.hour}
                              x={p.x}
                              y={h - 6}
                              textAnchor="middle"
                              fontSize="11"
                              fill="#64748B"
                              fontWeight="600"
                            >
                              {String(p.hour).padStart(2, '0')}
                            </text>
                          ))}
                        </svg>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>

        </>
      )}
    </div>
  );
}

