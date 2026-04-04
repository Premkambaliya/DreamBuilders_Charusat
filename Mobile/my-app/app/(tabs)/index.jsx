import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dashboardApi, API_BASE_URL } from "../../api/api";
import MobileSidebar from "../../components/MobileSidebar";

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ iconName, label, value, sub, gradientColors }) => (
  <View style={styles.statCard}>
    <LinearGradient colors={gradientColors} style={styles.statIconWrap}>
      <Ionicons name={iconName} size={20} color="#fff" />
    </LinearGradient>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    {sub ? (
      <Text style={styles.statSub} numberOfLines={2}>
        {sub}
      </Text>
    ) : null}
  </View>
);

const SentimentBadge = ({ sentiment }) => {
  const s = (sentiment || "neutral").toLowerCase();
  const config = {
    positive: { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", icon: "happy" },
    negative: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", icon: "sad" },
    neutral:  { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)",  icon: "ellipse" },
  }[s] || { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)", icon: "ellipse" };

  return (
    <View style={[styles.sentimentBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Ionicons name={config.icon} size={10} color={config.color} />
      <Text style={[styles.sentimentBadgeText, { color: config.color }]}>
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </Text>
    </View>
  );
};

const ProgressRow = ({ label, count, maxCount, barColors }) => {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <View style={styles.progressRow}>
      <Text style={styles.progressLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.progressBarBg}>
        <LinearGradient
          colors={barColors}
          start={[0, 0]}
          end={[1, 0]}
          style={[styles.progressBarFill, { width: `${pct}%` }]}
        />
      </View>
      <Text style={styles.progressCount}>{count}</Text>
    </View>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────

const DEFAULT_ANALYTICS = {
  totalCalls: 0,
  avgDealProbability: 0,
  positiveCalls: 0,
  neutralCalls: 0,
  negativeCalls: 0,
  avgRepRating: 0,
  avgCustomerEngagement: 0,
  statusBreakdown: { analyzed: 0, transcribed: 0, uploaded: 0 },
};

const DEFAULT_COMPETITORS = { competitorsFrequency: [], topAdvantages: [] };

export default function Dashboard() {
  const router = useRouter();

  const [analytics, setAnalytics]     = useState(null);
  const [competitors, setCompetitors] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [riskCalls, setRiskCalls]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState("");
  const [apiUrl, setApiUrl]           = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser]               = useState(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");

    try {
      // Get token & user data
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userData"),
      ]);
      console.log("[Dashboard] token present:", !!token);
      console.log("[Dashboard] API_BASE_URL:", API_BASE_URL);
      setApiUrl(API_BASE_URL);

      if (userData) {
        try { setUser(JSON.parse(userData)); } catch {}
      }

      if (!token) {
        router.replace("/login");
        return;
      }

      // Fetch all data in parallel
      const [anRes, cRes, compRes, riskRes] = await Promise.all([
        dashboardApi.getAnalytics(token),
        dashboardApi.getCalls(token),
        dashboardApi.getCompetitors(token),
        dashboardApi.getRiskRadar(token),
      ]);

      console.log("[Dashboard] analytics:", JSON.stringify(anRes));
      console.log("[Dashboard] calls count:", cRes?.calls?.length);

      if (anRes?.analytics) {
        setAnalytics(anRes.analytics);
      } else {
        setError("Analytics returned empty. Check your account has data in the database.");
      }

      if (Array.isArray(cRes?.calls)) setRecentCalls(cRes.calls.slice(0, 6));
      if (compRes?.competitorInsights)  setCompetitors(compRes.competitorInsights);
      if (Array.isArray(riskRes?.riskCalls)) setRiskCalls(riskRes.riskCalls);

    } catch (err) {
      console.error("[Dashboard] fetch error:", err);
      setError(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      console.log('[Dashboard] Logged out, token cleared');
    } catch (e) {
      console.warn('[Dashboard] Logout clear error:', e);
    }
    // Navigate back to the root landing page
    // Using href string forces expo-router to treat it as an absolute route
    router.replace('/');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const an   = analytics || DEFAULT_ANALYTICS;
  const comp = competitors || DEFAULT_COMPETITORS;
  const sentimentTotal = an.positiveCalls + an.neutralCalls + an.negativeCalls;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#090b13", "#0f1222"]} style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading dashboard data…</Text>
          {apiUrl ? <Text style={styles.loadingSubText}>{apiUrl}</Text> : null}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* ── Sidebar (renders on top via absolute positioning) ── */}
      <MobileSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <LinearGradient colors={["#090b13", "#0f1222"]} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6C63FF"
              colors={["#6C63FF"]}
            />
          }
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            {/* Menu button on the LEFT — opens the sidebar */}
            <TouchableOpacity
              onPress={() => setSidebarOpen(true)}
              style={styles.menuBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={22} color="#d1d5db" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>Command Center</Text>
              <Text style={styles.subtitle}>Real-time pipeline health</Text>
            </View>
          </View>

          {/* ── Error Banner ── */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={14} color="#fca5a5" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Stats Grid ── */}
          <View style={styles.statsGrid}>
            <StatCard
              iconName="call"
              label="Analyzed Calls"
              value={an.totalCalls}
              sub="Successfully processed"
              gradientColors={["#6C63FF", "#00D4AA"]}
            />
            <StatCard
              iconName="trending-up"
              label="Win Probability"
              value={`${an.avgDealProbability}%`}
              sub="Avg. across deals"
              gradientColors={["#FFB347", "#FF8C42"]}
            />
            <StatCard
              iconName="happy"
              label="Positive Calls"
              value={an.positiveCalls}
              sub={`${an.neutralCalls} neutral · ${an.negativeCalls} negative`}
              gradientColors={["#00D4AA", "#4CC9F0"]}
            />
            <StatCard
              iconName="people"
              label="Rep Rating"
              value={`${an.avgRepRating}/10`}
              sub="Salesperson score"
              gradientColors={["#A78BFA", "#6C63FF"]}
            />
            <StatCard
              iconName="pulse"
              label="Avg. Engagement"
              value={`${an.avgCustomerEngagement}/10`}
              sub="Customer engagement"
              gradientColors={["#F472B6", "#EC4899"]}
            />
            <StatCard
              iconName="stats-chart"
              label="Pipeline Status"
              value={`${an.statusBreakdown?.analyzed ?? 0} done`}
              sub={`${an.statusBreakdown?.transcribed ?? 0} transcribed · ${an.statusBreakdown?.uploaded ?? 0} uploaded`}
              gradientColors={["#4CC9F0", "#6C63FF"]}
            />
          </View>

          {/* ── Customer Sentiment ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Customer Sentiment</Text>
              <Ionicons name="pulse" size={18} color="#4cc9f0" />
            </View>
            <View style={styles.sentimentContainer}>
              <View style={styles.sentimentItem}>
                <Ionicons name="happy" size={28} color="#34d399" />
                <Text style={styles.sentimentVal}>{an.positiveCalls}</Text>
                <Text style={styles.sentimentName}>Positive</Text>
              </View>
              <View style={styles.sentimentItem}>
                <Ionicons name="ellipse" size={28} color="#fbbf24" />
                <Text style={styles.sentimentVal}>{an.neutralCalls}</Text>
                <Text style={styles.sentimentName}>Neutral</Text>
              </View>
              <View style={styles.sentimentItem}>
                <Ionicons name="sad" size={28} color="#f87171" />
                <Text style={styles.sentimentVal}>{an.negativeCalls}</Text>
                <Text style={styles.sentimentName}>Negative</Text>
              </View>
            </View>
            {sentimentTotal > 0 && (
              <Text style={styles.totalDisplay}>{sentimentTotal} total calls analysed</Text>
            )}
          </View>

          {/* ── Top Competitors ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Top Competitor Mentions</Text>
              <Ionicons name="people" size={18} color="#fbbf24" />
            </View>
            <View style={styles.progressContainer}>
              {comp.competitorsFrequency?.length > 0 ? (
                comp.competitorsFrequency.map((item, idx) => (
                  <ProgressRow
                    key={idx}
                    label={item.name}
                    count={item.count}
                    maxCount={comp.competitorsFrequency[0].count}
                    barColors={["#FFB347", "#FF8C42"]}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>No competitors mentioned yet.</Text>
              )}
            </View>
          </View>

          {/* ── Loss Reasons ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Why Customers Prefer Competitors</Text>
              <Ionicons name="warning" size={18} color="#f87171" />
            </View>
            <View style={styles.progressContainer}>
              {comp.topAdvantages?.length > 0 ? (
                comp.topAdvantages.map((item, idx) => (
                  <ProgressRow
                    key={idx}
                    label={item.advantage}
                    count={item.count}
                    maxCount={comp.topAdvantages[0].count}
                    barColors={["#FB7185", "#EF4444"]}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>No loss reason data yet.</Text>
              )}
            </View>
          </View>

          {/* ── Risk Radar ── */}
          {riskCalls.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>⚡ Risk Radar</Text>
                <Text style={styles.riskSubtitle}>{riskCalls.length} deal{riskCalls.length > 1 ? "s" : ""} at risk</Text>
              </View>
              <View style={styles.riskList}>
                {riskCalls.slice(0, 5).map((rc, idx) => {
                  const rColor =
                    rc.riskLevel === "critical" ? "#f87171" :
                    rc.riskLevel === "high"     ? "#fbbf24" : "#4CC9F0";
                  return (
                    <View key={idx} style={[styles.riskItem, { borderColor: `${rColor}33` }]}>
                      <View style={styles.riskItemHeader}>
                        <View style={styles.riskItemTitleWrap}>
                          <View style={[styles.riskDot, { backgroundColor: rColor }]} />
                          <Text style={styles.riskTitle} numberOfLines={1}>{rc.callTitle}</Text>
                        </View>
                        <Text style={[styles.riskProb, { color: rColor }]}>{rc.dealProbability}%</Text>
                      </View>
                      {rc.riskSummary ? (
                        <Text style={styles.riskSummary} numberOfLines={2}>{rc.riskSummary}</Text>
                      ) : null}
                      {rc.topAction ? (
                        <Text style={styles.riskAction}>→ {rc.topAction.action || rc.topAction}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Recent Analyzed Calls ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Analyzed Calls</Text>
              <Ionicons name="list" size={18} color="#9ca3af" />
            </View>
            <View style={styles.recentCallsContainer}>
              {recentCalls.length > 0 ? (
                recentCalls.map((call, idx) => {
                  const prob = call.dealProbability ?? 0;
                  const probColor = prob >= 70 ? "#34d399" : prob >= 40 ? "#fbbf24" : "#f87171";
                  return (
                    <View key={idx} style={styles.callItem}>
                      <View style={styles.callHeaderRow}>
                        <Text style={styles.callTitle} numberOfLines={1}>{call.productName}</Text>
                        <Text style={styles.callDate}>
                          {call.createdAt ? new Date(call.createdAt).toLocaleDateString() : "—"}
                        </Text>
                      </View>
                      <Text style={styles.callSummary} numberOfLines={2}>
                        {call.summary}
                      </Text>
                      <View style={styles.callFooterRow}>
                        <SentimentBadge sentiment={call.sentiment} />
                        <Text style={[styles.callProb, { color: probColor }]}>
                          {prob}% win
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>No analyzed calls found for your account.</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#090b13" },
  container: { flex: 1 },
  centerContent: { justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 48 },

  loadingText:    { color: "#d1d5db", marginTop: 16, fontSize: 15 },
  loadingSubText: { color: "#6b7280", marginTop: 6, fontSize: 11 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  h1:       { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 2 },
  subtitle: { fontSize: 12, color: "#9ca3af" },

  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.25)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: { color: "#fca5a5", fontSize: 12, flex: 1 },

  debugText: { color: "#374151", fontSize: 9, marginBottom: 12, fontFamily: "monospace" },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: "48.5%",
    backgroundColor: "rgba(18,21,39,0.9)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
    marginBottom: 10,
  },
  statLabel: { color: "#9ca3af", fontSize: 11, fontWeight: "500", marginBottom: 2 },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "900" },
  statSub:   { color: "#6b7280", fontSize: 10, marginTop: 3 },

  card: {
    backgroundColor: "rgba(18,21,39,0.9)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "bold" },

  sentimentContainer: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8 },
  sentimentItem:      { alignItems: "center" },
  sentimentVal:       { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 8 },
  sentimentName:      { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  totalDisplay:       { color: "#6b7280", fontSize: 11, textAlign: "center", marginTop: 12 },

  progressContainer: { gap: 12 },
  progressRow:       { flexDirection: "row", alignItems: "center" },
  progressLabel:     { width: 110, color: "#d1d5db", fontSize: 12 },
  progressBarBg: {
    flex: 1,
    height: 7,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 4 },
  progressCount: { width: 22, textAlign: "right", color: "#e5e7eb", fontSize: 12, fontWeight: "bold" },

  emptyText: { color: "#6b7280", fontSize: 13, textAlign: "center", paddingVertical: 12 },

  riskSubtitle: { color: "#9ca3af", fontSize: 11 },
  riskList: { gap: 10 },
  riskItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  riskItemHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  riskItemTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  riskDot:    { width: 8, height: 8, borderRadius: 4 },
  riskTitle:  { color: "#fff", fontSize: 13, fontWeight: "bold", flex: 1 },
  riskProb:   { fontSize: 12, fontWeight: "bold" },
  riskSummary:{ color: "#9ca3af", fontSize: 12, lineHeight: 17, marginBottom: 4 },
  riskAction: { color: "#d1d5db", fontSize: 11, fontWeight: "600" },

  recentCallsContainer: { gap: 14 },
  callItem: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
    paddingBottom: 14,
  },
  callHeaderRow:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  callTitle:      { color: "#fff", fontSize: 13, fontWeight: "bold", flex: 1, marginRight: 8 },
  callDate:       { color: "#6b7280", fontSize: 11 },
  callSummary:    { color: "#9ca3af", fontSize: 12, lineHeight: 18, marginBottom: 8 },
  callFooterRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  callProb:       { fontSize: 12, fontWeight: "700" },

  sentimentBadge: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3, gap: 4,
  },
  sentimentBadgeText: { fontSize: 10, fontWeight: "bold" },
});
