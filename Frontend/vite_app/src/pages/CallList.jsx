import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Phone, Search, RefreshCw, Calendar, User,
  Smile, Meh, Frown
} from "lucide-react";
import { dashboardApi } from "../api/api";

const SentimentBadge = ({ s }) => {
  const map = {
    positive: {
      cls: "border-emerald-500/20 bg-emerald-500/12 text-emerald-300",
      icon: <Smile size={12} />,
      label: "Positive",
    },
    negative: {
      cls: "border-rose-500/20 bg-rose-500/12 text-rose-300",
      icon: <Frown size={12} />,
      label: "Negative",
    },
    neutral: {
      cls: "border-amber-500/20 bg-amber-500/12 text-amber-300",
      icon: <Meh size={12} />,
      label: "Neutral",
    },
  };
  const m = map[s?.toLowerCase()] || map.neutral;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${m.cls}`}>
      {m.icon} {m.label}
    </span>
  );
};

const UrgencyBadge = ({ urgency }) => {
  if (!urgency) {
    return <span className="text-[0.8rem] text-slate-500">-</span>;
  }

  const normalized = urgency.toLowerCase();
  const className =
    normalized === "high"
      ? "border-rose-500/20 bg-rose-500/12 text-rose-300"
      : normalized === "low"
      ? "border-emerald-500/20 bg-emerald-500/12 text-emerald-300"
      : "border-amber-500/20 bg-amber-500/12 text-amber-300";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.75rem] font-semibold capitalize ${className}`}>
      {normalized}
    </span>
  );
};

const CallList = ({ token }) => {
	const location = useLocation();
	const initialQuery = useMemo(() => new URLSearchParams(location.search).get("q") || "", [location.search]);
  const [calls, setCalls]           = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState(initialQuery);
  const [sentimentFilter, setSentiment] = useState("");
  const [callTypeFilter, setCallType] = useState("");

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getCalls(token);
      setCalls(res.calls || []);
      setFiltered(res.calls || []);
    } catch {
      setCalls([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
	fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
	setSearch(initialQuery);
  }, [initialQuery]);

  // Client-side filter
  useEffect(() => {
    let data = [...calls];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((c) =>
        (c.callTitle || c.productName || c.product_name || "").toLowerCase().includes(q) ||
        (c.summary || "").toLowerCase().includes(q)
      );
    }
    if (sentimentFilter) {
      data = data.filter(
        (c) => c.sentiment?.toLowerCase() === sentimentFilter.toLowerCase()
      );
    }
    if (callTypeFilter) {
      data = data.filter(
        (c) => (c.callType || "other").toLowerCase() === callTypeFilter.toLowerCase()
      );
    }
    setFiltered(data);
  }, [search, sentimentFilter, callTypeFilter, calls]);

  return (
    <div className="py-8 text-slate-200">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Conversation Library</h1>
          <p className="mt-2 text-sm text-slate-400 md:text-base">Review every analyzed customer conversation with sentiment, risk, and rep performance context.</p>
        </div>
        <Link
          to="/dashboard/analyze"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-500/45 bg-indigo-500/22 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-indigo-500/30"
        >
          <Phone size={16} /> Analyze New Call
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 gap-2.5 xl:grid-cols-[2fr_1fr_1fr_auto]">
        <div className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/3 px-3 text-slate-400">
          <Search size={15} className="shrink-0" />
          <input
            type="text"
            placeholder="Search by account, product, summary, or call title..."
            className="h-10 w-full border-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-500"
          value={sentimentFilter}
          onChange={(e) => setSentiment(e.target.value)}
        >
          <option className="bg-[#0f1222] text-slate-200" value="">All Sentiments</option>
          <option className="bg-[#0f1222] text-slate-200" value="positive">Positive</option>
          <option className="bg-[#0f1222] text-slate-200" value="neutral">Neutral</option>
          <option className="bg-[#0f1222] text-slate-200" value="negative">Negative</option>
        </select>
        <select
          className="rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-500"
          value={callTypeFilter}
          onChange={(e) => setCallType(e.target.value)}
        >
          <option className="bg-[#0f1222] text-slate-200" value="">All Call Types</option>
          <option className="bg-[#0f1222] text-slate-200" value="sales">Sales</option>
          <option className="bg-[#0f1222] text-slate-200" value="service">Service</option>
          <option className="bg-[#0f1222] text-slate-200" value="enquiry">Enquiry</option>
          <option className="bg-[#0f1222] text-slate-200" value="complaint">Complaint</option>
          <option className="bg-[#0f1222] text-slate-200" value="support">Support</option>
          <option className="bg-[#0f1222] text-slate-200" value="renewal">Renewal</option>
          <option className="bg-[#0f1222] text-slate-200" value="upsell">Upsell</option>
          <option className="bg-[#0f1222] text-slate-200" value="other">Other</option>
        </select>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/12 bg-white/2 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/6"
          onClick={fetchCalls}
          type="button"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="grid gap-2.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-white/8 bg-white/4"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 py-12 text-center text-slate-400">
          <Phone size={48} className="text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-200">No calls found</h3>
          <p>Adjust your filters or upload a new call.</p>
          <Link
            to="/dashboard/analyze"
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-500/45 bg-indigo-500/22 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-indigo-500/30"
          >
            Analyze Your First Call
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#121527eb]">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.8fr_0.7fr_0.7fr_0.8fr_0.8fr] items-center gap-3 border-b border-white/8 bg-white/3 px-4 py-3 text-[0.68rem] uppercase tracking-[0.08em] text-slate-400">
              <span>Product / Summary</span>
              <span>Owner</span>
              <span>Sentiment</span>
              <span>Deal Prob.</span>
              <span>Rep Rating</span>
              <span>Engagement</span>
              <span>Urgency</span>
              <span>Status</span>
              <span>Date</span>
            </div>

            {filtered.map((call, index) => {
              const prob = call.dealProbability || 0;
              const probColor =
                prob >= 70 ? "#34d399"
                : prob >= 40 ? "#fbbf24"
                : "#fb7185";

              const spRating = call.salespersonRating || call.aiInsights?.salespersonPerformance?.rating || null;
              const spColor = spRating >= 7 ? "#34d399" : spRating >= 5 ? "#fbbf24" : "#fb7185";

              const engagement = call.customerEngagement || call.aiInsights?.conversationAnalysis?.customerEngagementScore || null;
              const engColor = engagement >= 7 ? "#34d399" : engagement >= 5 ? "#fbbf24" : "#fb7185";

              const urgency = call.urgencyLevel || call.aiInsights?.conversationAnalysis?.urgencyLevel || null;

              return (
                <div
                  key={call.callId}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr_0.8fr_0.7fr_0.7fr_0.8fr_0.8fr] items-center gap-3 px-4 py-3 text-sm text-slate-300 transition hover:bg-indigo-500/4 ${index < filtered.length - 1 ? "border-b border-white/6" : ""}`}
                >
                  <div>
                    <Link
                      to={`/dashboard/calls/${call.callId}`}
                      className="text-[0.875rem] font-bold text-slate-50 transition hover:text-indigo-300"
                    >
                      {call.callTitle || call.productName || call.product_name || "Sales Call"}
                    </Link>
                    <p className="mt-0.5 text-[0.78rem] text-slate-500">
                      {call.summary?.substring(0, 70)}{call.summary?.length > 70 ? "..." : ""}
                    </p>
                    <p className="mt-1 text-[0.72rem] capitalize text-sky-400">
                      Type: {call.callType || "other"}
                    </p>
                  </div>

                  <div>
                     <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                       <User size={13} className="text-slate-500"/>
                       {call.employeeName || "Unknown"}
                     </span>
                  </div>

                  <div>
                    <SentimentBadge s={call.sentiment} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[0.9rem] font-bold" style={{ color: probColor }}>
                        {prob}%
                      </span>
                      <div className="h-1.5 w-17.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${prob}%`, background: probColor }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    {spRating ? (
                      <span className="text-[0.9rem] font-bold" style={{ color: spColor }}>
                        {spRating}/10
                      </span>
                    ) : (
                      <span className="text-[0.8rem] text-slate-500">-</span>
                    )}
                  </div>

                  <div>
                    {engagement ? (
                      <span className="text-[0.9rem] font-bold" style={{ color: engColor }}>
                        {engagement}/10
                      </span>
                    ) : (
                      <span className="text-[0.8rem] text-slate-500">-</span>
                    )}
                  </div>

                  <div>
                    <UrgencyBadge urgency={urgency} />
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      ✅ Analyzed
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-[0.78rem] text-slate-400">
                    <Calendar size={12} />
                    {call.createdAt ? new Date(call.createdAt).toLocaleDateString() : "-"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-4 text-right text-[0.8rem] text-slate-500">
        Showing {filtered.length} of {calls.length} analyzed calls
      </p>
    </div>
  );
};

export default CallList;
