import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dashboardApi } from "../../api/api";
import MobileSidebar from "../../components/MobileSidebar";

// ─── Badge ────────────────────────────────────────────────────────────────────

const Badge = ({ tone = "neutral", children }) => {
  const cfg = {
    positive: { color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.35)"  },
    negative: { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.35)" },
    neutral:  { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)"  },
  }[tone] || { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.35)" };

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{children}</Text>
    </View>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ iconName, label, value, colors }) => (
  <View style={styles.statCard}>
    <LinearGradient colors={colors} style={styles.statIconWrap}>
      <Ionicons name={iconName} size={20} color="#fff" />
    </LinearGradient>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

// ─── Section Card header ──────────────────────────────────────────────────────

const SectionHeader = ({ iconName, iconColor, iconBg, title, subtitle, badge, badgeTone }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <View style={[styles.sectionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
    {badge ? <Badge tone={badgeTone}>{badge}</Badge> : null}
  </View>
);

// ─── Insight Row ──────────────────────────────────────────────────────────────

const InsightRow = ({ text, count, maxCount, gradientColors, tone }) => {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <View style={styles.insightRow}>
      <View style={styles.insightRowTop}>
        <Text style={styles.insightText}>{text}</Text>
        <Badge tone={tone}>{count}×</Badge>
      </View>
      <View style={styles.insightBarBg}>
        <LinearGradient
          colors={gradientColors}
          start={[0, 0]}
          end={[1, 0]}
          style={[styles.insightBarFill, { width: `${pct}%` }]}
        />
      </View>
    </View>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = ({ message }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const Skeleton = ({ height }) => (
  <View style={[styles.skeleton, { height }]} />
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const router = useRouter();

  const [competitors, setCompetitors] = useState(null);
  const [calls, setCalls]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser]               = useState(null);
  const [error, setError]             = useState("");

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userData"),
      ]);

      if (userData) {
        try { setUser(JSON.parse(userData)); } catch {}
      }
      if (!token) { router.replace("/login"); return; }

      const [compRes, callsRes] = await Promise.all([
        dashboardApi.getCompetitors(token),
        dashboardApi.getCalls(token),
      ]);

      setCompetitors(compRes.competitorInsights);
      setCalls(callsRes.calls || []);
    } catch (err) {
      setError(`Failed to load insights: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(true); };

  // ── Aggregation ────────────────────────────────────────────────────────────
  const objectionMap    = {};
  const signalMap       = {};
  const improvementMap  = {};

  calls.forEach((call) => {
    const ins = call.aiInsights || {};
    (ins.objections        || []).forEach((o)  => { objectionMap[o]   = (objectionMap[o]   || 0) + 1; });
    (ins.buyingSignals     || []).forEach((s)  => { signalMap[s]      = (signalMap[s]      || 0) + 1; });
    (ins.improvementsNeeded|| []).forEach((im) => { improvementMap[im]= (improvementMap[im]|| 0) + 1; });
  });

  const objectionData   = Object.entries(objectionMap).sort((a,b)=>b[1]-a[1]).map(([_id,count])=>({_id,count}));
  const signalData      = Object.entries(signalMap).sort((a,b)=>b[1]-a[1]).map(([_id,count])=>({_id,count}));
  const improvementData = Object.entries(improvementMap).sort((a,b)=>b[1]-a[1]).map(([_id,count])=>({_id,count}));

  const comps      = competitors?.competitorsFrequency || [];
  const advantages = competitors?.topAdvantages        || [];

  const totalCalls      = calls.length;
  const avgDealProb     = totalCalls
    ? Math.round(calls.reduce((s, c) => s + (c.aiInsights?.dealProbability || c.dealProbability || 0), 0) / totalCalls)
    : 0;
  const totalSignals    = signalData.reduce((s, d) => s + d.count, 0);
  const totalObjections = objectionData.reduce((s, d) => s + d.count, 0);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#fff7ed", "#ffffff"]} style={styles.centerFlex}>
          <ActivityIndicator size="large" color="#fb923c" />
          <Text style={styles.loadingText}>Loading insights…</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Sidebar */}
      <MobileSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <LinearGradient colors={["#fff7ed", "#ffffff"]} style={styles.flex}>

        {/* Top Header bar */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            onPress={() => setSidebarOpen(true)}
            style={styles.menuBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={22} color="#6b7280" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Signal Insights</Text>
            <Text style={styles.headerSub}>
              {totalCalls} analyzed conversations
            </Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={20} color="#ea580c" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#fb923c"
              colors={["#fb923c"]}
            />
          }
        >
          {/* ── Hero label ── */}
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Ionicons name="sparkles" size={11} color="#ea580c" />
              <Text style={styles.pillText}>Live conversation intelligence</Text>
            </View>
          </View>

          <Text style={styles.pageDesc}>
            Strategic trends across {totalCalls} analyzed conversations — objections, buying signals, and competitor pressure.
          </Text>

          {/* ── Error Banner ── */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={14} color="#fca5a5" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Stat Cards ── */}
          <View style={styles.statsGrid}>
            <StatCard
              iconName="bar-chart"
              label="Calls Analyzed"
              value={totalCalls}
              colors={["#fb923c", "#8B5CF6"]}
            />
            <StatCard
              iconName="trending-up"
              label="Avg Deal Prob."
              value={`${avgDealProb}%`}
              colors={["#00D4AA", "#06B6D4"]}
            />
            <StatCard
              iconName="flash"
              label="Buying Signals"
              value={totalSignals}
              colors={["#10B981", "#84CC16"]}
            />
            <StatCard
              iconName="alert-circle"
              label="Total Objections"
              value={totalObjections}
              colors={["#FB923C", "#EF4444"]}
            />
          </View>

          {/* ── Buying Signals ── */}
          <View style={styles.card}>
            <SectionHeader
              iconName="trending-up"
              iconColor="#34d399"
              iconBg="rgba(52,211,153,0.15)"
              title="Top Buying Signals"
              subtitle="Positive purchase intent indicators"
              badge={`${signalData.length} types`}
              badgeTone="positive"
            />
            {signalData.length > 0 ? (
              signalData.slice(0, 6).map((item, i) => (
                <InsightRow
                  key={i}
                  text={item._id}
                  count={item.count}
                  maxCount={signalData[0].count}
                  gradientColors={["#00D4AA", "#06B6D4"]}
                  tone="positive"
                />
              ))
            ) : (
              <EmptyState message="No buying signals detected yet." />
            )}
          </View>

          {/* ── Customer Objections ── */}
          <View style={styles.card}>
            <SectionHeader
              iconName="trending-down"
              iconColor="#f87171"
              iconBg="rgba(248,113,113,0.15)"
              title="Customer Objections"
              subtitle="Pricing, timing & feature concerns"
              badge={`${objectionData.length} types`}
              badgeTone="negative"
            />
            {objectionData.length > 0 ? (
              objectionData.slice(0, 6).map((item, i) => (
                <InsightRow
                  key={i}
                  text={item._id}
                  count={item.count}
                  maxCount={objectionData[0].count}
                  gradientColors={["#FB923C", "#EF4444"]}
                  tone="negative"
                />
              ))
            ) : (
              <EmptyState message="No objections detected yet." />
            )}
          </View>

          {/* ── Product Improvements ── */}
          {improvementData.length > 0 && (
            <View style={styles.card}>
              <SectionHeader
                iconName="cube"
                iconColor="#ea580c"
                iconBg="rgba(99,102,241,0.15)"
                title="Product Improvements Needed"
                subtitle="Most-requested gaps from customer feedback"
                badge={`${improvementData.length} requests`}
                badgeTone="neutral"
              />
              {improvementData.map((item, i) => (
                <InsightRow
                  key={i}
                  text={item._id}
                  count={item.count}
                  maxCount={improvementData[0].count}
                  gradientColors={["#8B5CF6", "#D946EF"]}
                  tone="neutral"
                />
              ))}
            </View>
          )}

          {/* ── Competitor Mentions ── */}
          <View style={styles.card}>
            <SectionHeader
              iconName="alert-circle"
              iconColor="#fbbf24"
              iconBg="rgba(251,191,36,0.15)"
              title="Competitor Mentions"
              subtitle="How often alternatives were discussed"
              badge={comps.length > 0 ? `${comps.length} competitors` : null}
              badgeTone="neutral"
            />
            {comps.length > 0 ? (
              comps.map((c, i) => (
                <InsightRow
                  key={i}
                  text={c.name}
                  count={c.count}
                  maxCount={comps[0].count}
                  gradientColors={["#FFB347", "#FF8C42"]}
                  tone="neutral"
                />
              ))
            ) : (
              <EmptyState message="No competitor mentions detected yet." />
            )}
          </View>

          {/* ── Why Customers Prefer Competitors ── */}
          <View style={[styles.card, { marginBottom: 40 }]}>
            <SectionHeader
              iconName="people"
              iconColor="#f87171"
              iconBg="rgba(248,113,113,0.15)"
              title="Why Customers Prefer Competitors"
              subtitle="Top perceived advantages of competitors"
              badge={advantages.length > 0 ? `${advantages.length} reasons` : null}
              badgeTone="negative"
            />
            {advantages.length > 0 ? (
              advantages.map((a, i) => (
                <InsightRow
                  key={i}
                  text={a.advantage}
                  count={a.count}
                  maxCount={advantages[0].count}
                  gradientColors={["#FB7185", "#EF4444"]}
                  tone="negative"
                />
              ))
            ) : (
              <EmptyState message="No competitor advantage data yet." />
            )}
          </View>

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: "#fff7ed" },
  flex:      { flex: 1 },
  centerFlex:{ flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#9ca3af", marginTop: 14, fontSize: 14 },

  // ── Top header ──
  screenHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 12,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "rgba(249,115,22,0.10)",
    borderWidth: 1, borderColor: "rgba(249,115,22,0.18)",
    justifyContent: "center", alignItems: "center",
  },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "rgba(249,115,22,0.12)",
    borderWidth: 1, borderColor: "rgba(249,115,22,0.35)",
    justifyContent: "center", alignItems: "center",
  },
  h1:        { fontSize: 19, fontWeight: "800", color: "#111827", letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: "#6b7280", marginTop: 1 },

  scroll: { paddingHorizontal: 16, paddingBottom: 20 },

  // ── Hero labels ──
  pillRow: { marginBottom: 8 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(249,115,22,0.12)",
    borderColor: "rgba(249,115,22,0.35)", borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  pillText:  { color: "#ea580c", fontSize: 11, fontWeight: "600" },
  pageDesc:  { color: "#9ca3af", fontSize: 13, lineHeight: 19, marginBottom: 18 },

  // ── Error ──
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.25)", borderWidth: 1,
    borderRadius: 8, padding: 10, marginBottom: 14,
  },
  errorText: { color: "#fca5a5", fontSize: 12, flex: 1 },

  // ── Stat grid ──
  statsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "space-between", marginBottom: 18, gap: 0,
  },
  statCard: {
    width: "48.5%",
    backgroundColor: "#ffffff",
    borderColor: "rgba(249,115,22,0.10)", borderWidth: 1,
    borderRadius: 16, padding: 14, marginBottom: 12,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: "center", alignItems: "center", marginBottom: 10,
  },
  statLabel: { color: "#6b7280", fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { color: "#111827", fontSize: 24, fontWeight: "900", marginTop: 2 },

  // ── Section Card ──
  card: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(249,115,22,0.10)", borderWidth: 1,
    borderRadius: 18, padding: 16, marginBottom: 16,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderBottomWidth: 1, borderBottomColor: "rgba(249,115,22,0.07)",
    paddingBottom: 14, marginBottom: 14, gap: 8,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  sectionIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  sectionTitle:    { color: "#111827", fontSize: 14, fontWeight: "bold" },
  sectionSubtitle: { color: "#6b7280", fontSize: 11, marginTop: 1 },

  // ── Badge ──
  badge: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  // ── Insight Row ──
  insightRow: {
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.07)",
    backgroundColor: "rgba(249,115,22,0.05)",
    borderRadius: 12, padding: 12, marginBottom: 10,
  },
  insightRowTop: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", gap: 8, marginBottom: 10,
  },
  insightText: {
    color: "#111827", fontSize: 13, fontWeight: "500",
    lineHeight: 19, flex: 1,
  },
  insightBarBg: {
    height: 6, borderRadius: 3,
    backgroundColor: "rgba(249,115,22,0.08)", overflow: "hidden",
  },
  insightBarFill: { height: "100%", borderRadius: 3 },

  // ── Empty state ──
  emptyState: {
    borderWidth: 1, borderStyle: "dashed",
    borderColor: "#fed7aa",
    borderRadius: 12, paddingVertical: 28,
    alignItems: "center",
  },
  emptyText: { color: "#4b5563", fontSize: 13 },

  // ── Skeleton ──
  skeleton: {
    borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(249,115,22,0.08)",
    backgroundColor: "rgba(249,115,22,0.06)",
    marginBottom: 12,
  },
});
