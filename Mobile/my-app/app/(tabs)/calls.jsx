import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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

// ─── Sentiment Badge ───────────────────────────────────────────────────────────

const SentimentBadge = ({ sentiment }) => {
  const s = (sentiment || "neutral").toLowerCase();
  const config = {
    positive: {
      color: "#34d399",
      bg: "rgba(52,211,153,0.12)",
      border: "rgba(52,211,153,0.25)",
      icon: "happy-outline",
      label: "Positive",
    },
    negative: {
      color: "#f87171",
      bg: "rgba(248,113,113,0.12)",
      border: "rgba(248,113,113,0.25)",
      icon: "sad-outline",
      label: "Negative",
    },
    neutral: {
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.12)",
      border: "rgba(251,191,36,0.25)",
      icon: "remove-circle-outline",
      label: "Neutral",
    },
  }[s] || {
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.25)",
    icon: "remove-circle-outline",
    label: "Neutral",
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
      ]}
    >
      <Ionicons name={config.icon} size={11} color={config.color} />
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

// ─── Urgency Badge ─────────────────────────────────────────────────────────────

const UrgencyBadge = ({ urgency }) => {
  if (!urgency) return <Text style={styles.dashText}>—</Text>;
  const norm = urgency.toLowerCase();
  const config =
    norm === "high"
      ? { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" }
      : norm === "low"
      ? { color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.25)" }
      : { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.25)" };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {norm.charAt(0).toUpperCase() + norm.slice(1)}
      </Text>
    </View>
  );
};

// ─── Mini progress bar ─────────────────────────────────────────────────────────

const ProbBar = ({ prob }) => {
  const color =
    prob >= 70 ? "#34d399" : prob >= 40 ? "#fbbf24" : "#f87171";
  return (
    <View style={styles.probRow}>
      <Text style={[styles.probText, { color }]}>{prob}%</Text>
      <View style={styles.probBarBg}>
        <View
          style={[styles.probBarFill, { width: `${prob}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
};

// ─── Call Card ─────────────────────────────────────────────────────────────────

const CallCard = ({ call, onPress }) => {
  const prob = call.dealProbability || 0;
  const spRating =
    call.salespersonRating ||
    call.aiInsights?.salespersonPerformance?.rating ||
    null;
  const engagement =
    call.customerEngagement ||
    call.aiInsights?.conversationAnalysis?.customerEngagementScore ||
    null;
  const urgency =
    call.urgencyLevel ||
    call.aiInsights?.conversationAnalysis?.urgencyLevel ||
    null;
  const spColor = spRating >= 7 ? "#34d399" : spRating >= 5 ? "#fbbf24" : "#f87171";
  const engColor = engagement >= 7 ? "#34d399" : engagement >= 5 ? "#fbbf24" : "#f87171";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(call.callId)}
      activeOpacity={0.75}
    >
      {/* Header Row */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {call.callTitle || call.productName || "Sales Call"}
          </Text>
          <Text style={styles.cardType}>
            <Text style={styles.typeLabel}>Type: </Text>
            {(call.callType || "other").toUpperCase()}
          </Text>
        </View>
        <View style={styles.analyzedBadge}>
          <Text style={styles.analyzedText}>✅ Analyzed</Text>
        </View>
      </View>

      {/* Summary */}
      {call.summary ? (
        <Text style={styles.cardSummary} numberOfLines={2}>
          {call.summary}
        </Text>
      ) : null}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Sentiment */}
        <View style={styles.statItem}>
          <Text style={styles.statKey}>Sentiment</Text>
          <SentimentBadge sentiment={call.sentiment} />
        </View>

        {/* Deal Probability */}
        <View style={[styles.statItem, { flex: 1.5 }]}>
          <Text style={styles.statKey}>Win Prob.</Text>
          <ProbBar prob={prob} />
        </View>

        {/* Urgency */}
        <View style={styles.statItem}>
          <Text style={styles.statKey}>Urgency</Text>
          <UrgencyBadge urgency={urgency} />
        </View>
      </View>

      {/* Second Stats Row */}
      <View style={[styles.statsRow, { marginTop: 10 }]}>
        {/* Owner */}
        <View style={styles.statItem}>
          <Text style={styles.statKey}>Owner</Text>
          <View style={styles.ownerRow}>
            <Ionicons name="person-outline" size={12} color="#9ca3af" />
            <Text style={styles.ownerText} numberOfLines={1}>
              {call.employeeName || "Unknown"}
            </Text>
          </View>
        </View>

        {/* Rep Rating */}
        <View style={styles.statItem}>
          <Text style={styles.statKey}>Rep Rating</Text>
          {spRating ? (
            <Text style={[styles.scoreText, { color: spColor }]}>
              {spRating}/10
            </Text>
          ) : (
            <Text style={styles.dashText}>—</Text>
          )}
        </View>

        {/* Engagement */}
        <View style={styles.statItem}>
          <Text style={styles.statKey}>Engagement</Text>
          {engagement ? (
            <Text style={[styles.scoreText, { color: engColor }]}>
              {engagement}/10
            </Text>
          ) : (
            <Text style={styles.dashText}>—</Text>
          )}
        </View>

        {/* Date */}
        <View style={styles.statItem}>
          <Text style={styles.statKey}>Date</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={11} color="#6b7280" />
            <Text style={styles.dateText}>
              {call.createdAt
                ? new Date(call.createdAt).toLocaleDateString()
                : "—"}
            </Text>
          </View>
        </View>
      </View>

      {/* Tap hint */}
      <View style={styles.tapRow}>
        <Text style={styles.tapHint}>Tap for full call details</Text>
        <Ionicons name="chevron-forward" size={14} color="#4f46e5" />
      </View>
    </TouchableOpacity>
  );
};

// ─── Filter Dropdown ─────────────────────────────────────────────────────────

const FilterDropdown = ({ label, value, options, isOpen, onToggle, onSelect }) => (
  <View style={styles.dropdownGroup}>
    <Text style={styles.filterLabel}>{label}</Text>
    <TouchableOpacity
      style={styles.dropdownButton}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <Text style={styles.dropdownButtonText}>{value}</Text>
      <Ionicons
        name={isOpen ? "chevron-up-outline" : "chevron-down-outline"}
        size={16}
        color="#9ca3af"
      />
    </TouchableOpacity>

    {isOpen ? (
      <View style={styles.dropdownMenu}>
        {options.map((option) => {
          const isSelected = option === value;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
              onPress={() => onSelect(option)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  isSelected && styles.dropdownItemTextSelected,
                ]}
              >
                {option}
              </Text>
              {isSelected ? (
                <Ionicons name="checkmark" size={14} color="#818cf8" />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    ) : null}
  </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────

const SENTIMENT_OPTIONS = ["All", "Positive", "Neutral", "Negative"];
const CALL_TYPE_OPTIONS = [
  "All", "Sales", "Service", "Enquiry", "Complaint", "Support", "Renewal", "Upsell", "Other",
];

export default function CallsScreen() {
  const router = useRouter();

  const [calls, setCalls]               = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [search, setSearch]             = useState("");
  const [sentimentFilter, setSentiment] = useState("All");
  const [callTypeFilter, setCallType]   = useState("All");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [user, setUser]                 = useState(null);
  const [error, setError]               = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCalls = useCallback(async (isRefresh = false) => {
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

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await dashboardApi.getCalls(token);
      setCalls(res.calls || []);
      setFiltered(res.calls || []);
    } catch (err) {
      setError(`Failed to load calls: ${err.message}`);
      setCalls([]);
      setFiltered([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  // ── Client-side filter ─────────────────────────────────────────────────────
  useEffect(() => {
    let data = [...calls];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (c) =>
          (c.callTitle || c.productName || "").toLowerCase().includes(q) ||
          (c.summary || "").toLowerCase().includes(q) ||
          (c.employeeName || "").toLowerCase().includes(q)
      );
    }
    if (sentimentFilter !== "All") {
      data = data.filter(
        (c) => c.sentiment?.toLowerCase() === sentimentFilter.toLowerCase()
      );
    }
    if (callTypeFilter !== "All") {
      data = data.filter(
        (c) =>
          (c.callType || "other").toLowerCase() === callTypeFilter.toLowerCase()
      );
    }
    setFiltered(data);
  }, [search, sentimentFilter, callTypeFilter, calls]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCalls(true);
  };

  const handleCardPress = (callId) => {
    if (!callId) return;
    router.push({
      pathname: "/call-detail",
      params: { id: String(callId) },
    });
  };

  // ── Empty / Loading states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#090b13", "#0f1222"]} style={styles.centerFlex}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading calls…</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Sidebar */}
      <MobileSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <LinearGradient colors={["#090b13", "#0f1222"]} style={styles.flex}>
        {/* ── Screen Header ── */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            onPress={() => setSidebarOpen(true)}
            style={styles.menuBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={22} color="#d1d5db" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Conversation Library</Text>
            <Text style={styles.subtitle}>
              {filtered.length} of {calls.length} analyzed calls
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color="#818cf8" />
          </TouchableOpacity>
        </View>

        {/* ── Error Banner ── */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={14} color="#fca5a5" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Search Bar ── */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color="#6b7280" style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, summary, owner…"
            placeholderTextColor="#4b5563"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} style={{ marginRight: 10 }}>
              <Ionicons name="close-circle" size={18} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Dropdown Filters ── */}
        <View style={styles.filtersWrap}>
          <FilterDropdown
            label="Sentiment"
            value={sentimentFilter}
            options={SENTIMENT_OPTIONS}
            isOpen={openDropdown === "sentiment"}
            onToggle={() =>
              setOpenDropdown((prev) => (prev === "sentiment" ? null : "sentiment"))
            }
            onSelect={(opt) => {
              setSentiment(opt);
              setOpenDropdown(null);
            }}
          />

          <FilterDropdown
            label="Type"
            value={callTypeFilter}
            options={CALL_TYPE_OPTIONS}
            isOpen={openDropdown === "type"}
            onToggle={() =>
              setOpenDropdown((prev) => (prev === "type" ? null : "type"))
            }
            onSelect={(opt) => {
              setCallType(opt);
              setOpenDropdown(null);
            }}
          />
        </View>

        {/* ── Call List ── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="call-outline" size={52} color="#374151" />
            <Text style={styles.emptyTitle}>No calls found</Text>
            <Text style={styles.emptySubtitle}>
              Adjust your filters or refresh to load new data.
            </Text>
            <TouchableOpacity
              style={styles.analyzeBtn}
              onPress={() => router.push("/(tabs)/analyze")}
              activeOpacity={0.75}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Text style={styles.analyzeBtnText}>Analyze New Call</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.callId || item._id)}
            renderItem={({ item }) => (
              <CallCard call={item} onPress={handleCardPress} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#6C63FF"
                colors={["#6C63FF"]}
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: "#090b13" },
  flex:      { flex: 1 },
  centerFlex:{ flex: 1, justifyContent: "center", alignItems: "center" },

  loadingText: { color: "#9ca3af", marginTop: 14, fontSize: 14 },

  // ── Header ──
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
    justifyContent: "center", alignItems: "center",
  },
  h1:       { fontSize: 19, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: "#6b7280", marginTop: 1 },

  // ── Error Banner ──
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.25)", borderWidth: 1,
    borderRadius: 8, padding: 10,
  },
  errorText: { color: "#fca5a5", fontSize: 12, flex: 1 },

  // ── Search ──
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 10,
    color: "#f1f5f9",
    fontSize: 14,
  },

  // ── Dropdown Filters ──
  filtersWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
    zIndex: 20,
  },
  dropdownGroup: { zIndex: 20 },
  filterLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  dropdownButton: {
    height: 42,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  dropdownButtonText: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "600",
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,18,34,0.98)",
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  dropdownItemSelected: {
    backgroundColor: "rgba(99,102,241,0.14)",
  },
  dropdownItemText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "500",
  },
  dropdownItemTextSelected: {
    color: "#a5b4fc",
    fontWeight: "700",
  },

  // ── List ──
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },

  // ── Card ──
  card: {
    backgroundColor: "rgba(18,21,39,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  cardTitle:  { color: "#f1f5f9", fontSize: 14, fontWeight: "800" },
  cardType:   { color: "#38bdf8", fontSize: 10, marginTop: 2, fontWeight: "600" },
  typeLabel:  { color: "#6b7280" },
  cardSummary:{ color: "#9ca3af", fontSize: 12, lineHeight: 17, marginBottom: 10 },

  analyzedBadge: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: "rgba(52,211,153,0.1)",
    borderWidth: 1, borderColor: "rgba(52,211,153,0.25)",
  },
  analyzedText: { color: "#34d399", fontSize: 10, fontWeight: "600" },

  divider: {
    height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 10,
  },

  // ── Stats ──
  statsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  statItem: { flex: 1, minWidth: 70 },
  statKey:  { color: "#6b7280", fontSize: 10, fontWeight: "600", marginBottom: 4, textTransform: "uppercase" },

  // Deal Probability
  probRow:    { flexDirection: "row", alignItems: "center", gap: 6 },
  probText:   { fontSize: 13, fontWeight: "800" },
  probBarBg: {
    flex: 1, height: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3, overflow: "hidden",
  },
  probBarFill: { height: "100%", borderRadius: 3 },

  // Scores
  scoreText: { fontSize: 14, fontWeight: "800" },
  dashText:  { color: "#4b5563", fontSize: 13 },

  // Owner
  ownerRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ownerText: { color: "#d1d5db", fontSize: 12, fontWeight: "500", flex: 1 },

  // Date
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { color: "#9ca3af", fontSize: 11 },

  // Tap hint
  tapRow:  { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 8, gap: 4 },
  tapHint: { color: "#4f46e5", fontSize: 11, fontWeight: "600" },

  // ── Badge ──
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  // ── Empty State ──
  emptyWrap: {
    flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10,
  },
  emptyTitle:    { color: "#e2e8f0", fontSize: 18, fontWeight: "bold" },
  emptySubtitle: { color: "#6b7280", fontSize: 13, textAlign: "center" },
  analyzeBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 12, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.25)",
    borderWidth: 1, borderColor: "rgba(99,102,241,0.5)",
  },
  analyzeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
