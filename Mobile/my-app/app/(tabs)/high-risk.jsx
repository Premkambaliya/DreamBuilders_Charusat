import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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

const sentimentStyle = (sentiment) => {
  const s = (sentiment || "").toLowerCase();
  if (s === "negative") {
    return {
      bg: "rgba(244,63,94,0.15)",
      border: "rgba(244,63,94,0.35)",
      text: "#fda4af",
      label: "Negative",
    };
  }
  if (s === "positive") {
    return {
      bg: "rgba(52,211,153,0.15)",
      border: "rgba(52,211,153,0.35)",
      text: "#6ee7b7",
      label: "Positive",
    };
  }
  return {
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.35)",
    text: "#fcd34d",
    label: "Neutral",
  };
};

const getRiskMeta = (probability, sentiment) => {
  const s = (sentiment || "").toLowerCase();
  const critical = probability < 20 || s === "negative";
  return {
    color: critical ? "#ef4444" : "#f97316",
    label: critical ? "Critical" : "High",
  };
};

const SkeletonCard = () => <View style={styles.skeletonCard} />;

const RiskCard = ({ call, onPressCall }) => {
  const insights = call.aiInsights || {};
  const probability = call.dealProbability ?? 0;
  const sentiment = sentimentStyle(call.sentiment);
  const risk = getRiskMeta(probability, call.sentiment);
  const followUp = insights.followUpRecommendation || call.aiInsights?.followUpRecommendation;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.card, { borderColor: `${risk.color}99` }]}
      onPress={() => onPressCall(call.callId)}
    >
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={styles.pillsRow}>
            <View
              style={[
                styles.riskPill,
                {
                  backgroundColor: `${risk.color}22`,
                  borderColor: `${risk.color}44`,
                },
              ]}
            >
              <Ionicons name="warning-outline" size={12} color={risk.color} />
              <Text style={[styles.riskPillText, { color: risk.color }]}>
                {risk.label} Risk
              </Text>
            </View>

            <View
              style={[
                styles.sentimentPill,
                { backgroundColor: sentiment.bg, borderColor: sentiment.border },
              ]}
            >
              <Text style={[styles.sentimentPillText, { color: sentiment.text }]}>
                {sentiment.label}
              </Text>
            </View>
          </View>

          <Text style={styles.cardTitle} numberOfLines={1}>
            {call.callTitle || call.productName || call.product_name || "Sales Call"}
          </Text>

          <Text style={styles.cardSummary} numberOfLines={2}>
            {call.summary || "No summary available."}
          </Text>

          <Text style={styles.typeText}>Type: {(call.callType || "other").toLowerCase()}</Text>
        </View>

        <View style={styles.probWrap}>
          <Text style={[styles.probValue, { color: risk.color }]}>{probability}%</Text>
          <Text style={styles.probLabel}>Probability</Text>
        </View>
      </View>

      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${probability}%`, backgroundColor: risk.color },
          ]}
        />
      </View>

      {Array.isArray(insights.objections) && insights.objections.length > 0 ? (
        <View style={styles.objectionBlock}>
          <Text style={styles.objectionTitle}>Objections:</Text>
          <View style={styles.objectionWrap}>
            {insights.objections.slice(0, 2).map((obj, index) => (
              <View key={`${call.callId || "risk"}-${index}`} style={styles.objectionPill}>
                <Text style={styles.objectionText} numberOfLines={1}>
                  {`⚠️ ${obj.substring(0, 45)}${obj.length > 45 ? "..." : ""}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {followUp ? (
        <Text style={styles.followUpText} numberOfLines={2}>
          {`💡 ${followUp}`}
        </Text>
      ) : null}

      <Text style={styles.dateText}>
        {call.createdAt ? new Date(call.createdAt).toLocaleDateString() : "-"}
      </Text>
    </TouchableOpacity>
  );
};

export default function HighRiskScreen() {
  const router = useRouter();

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const fetchRiskCalls = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");

    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userData"),
      ]);

      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch {}
      }

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await dashboardApi.getCalls(token);
      const riskyCalls = (response.calls || []).filter((call) => {
        const probability = call.dealProbability ?? 100;
        const sentiment = (call.sentiment || "").toLowerCase();
        return probability < 40 || sentiment === "negative";
      });

      setCalls(riskyCalls);
    } catch (err) {
      setCalls([]);
      setError(`Failed to load high-risk calls: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRiskCalls();
  }, [fetchRiskCalls]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRiskCalls(true);
  };

  const openCall = (callId) => {
    if (!callId) return;
    router.push("/(tabs)/calls");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#fff7ed", "#ffffff"]} style={styles.flex}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#fb923c" />
            <Text style={styles.loadingText}>Loading high-risk opportunities...</Text>
          </View>
          <View style={styles.skeletonWrap}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <MobileSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <LinearGradient colors={["#fff7ed", "#ffffff"]} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setSidebarOpen(true)}
            style={styles.menuBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={22} color="#6b7280" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>At-Risk Opportunities</Text>
            <Text style={styles.subtitle}>
              Calls flagged for low close probability or negative customer sentiment.
            </Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            style={styles.refreshBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color="#ea580c" />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={14} color="#fca5a5" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {calls.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="shield-checkmark-outline" size={52} color="#34d399" />
            <Text style={styles.emptyTitle}>No high-risk deals</Text>
            <Text style={styles.emptySub}>All analyzed calls look healthy.</Text>
          </View>
        ) : (
          <FlatList
            data={calls}
            keyExtractor={(item, idx) => String(item.callId || item._id || idx)}
            renderItem={({ item }) => <RiskCard call={item} onPressCall={openCall} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fb923c"
                colors={["#fb923c"]}
              />
            }
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff7ed" },
  flex: { flex: 1 },

  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 28,
    paddingBottom: 14,
  },
  loadingText: { color: "#9ca3af", marginTop: 12, fontSize: 14 },

  skeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  skeletonCard: {
    height: 168,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
    backgroundColor: "rgba(249,115,22,0.07)",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(249,115,22,0.10)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(249,115,22,0.12)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.35)",
  },
  title: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: "#6b7280",
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    paddingRight: 8,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.25)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  errorText: { color: "#fca5a5", fontSize: 12, flex: 1 },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 38,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "#ffffff",
    padding: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  riskPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  riskPillText: {
    fontSize: 11,
    fontWeight: "800",
  },

  sentimentPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sentimentPillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  cardTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "800",
    paddingRight: 8,
  },
  cardSummary: {
    marginTop: 4,
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 17,
  },
  typeText: {
    marginTop: 7,
    color: "#0284c7",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  probWrap: {
    alignItems: "flex-end",
    minWidth: 92,
  },
  probValue: {
    fontSize: 31,
    lineHeight: 31,
    fontWeight: "900",
  },
  probLabel: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 10,
    fontWeight: "600",
  },

  progressBg: {
    marginTop: 12,
    width: "100%",
    height: 8,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: "rgba(249,115,22,0.18)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },

  objectionBlock: {
    marginTop: 10,
  },
  objectionTitle: {
    marginBottom: 6,
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "700",
  },
  objectionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  objectionPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.35)",
    backgroundColor: "rgba(244,63,94,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: "100%",
  },
  objectionText: {
    color: "#fda4af",
    fontSize: 11,
    fontWeight: "700",
  },

  followUpText: {
    marginTop: 9,
    color: "#0284c7",
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 18,
  },

  dateText: {
    marginTop: 9,
    color: "#64748b",
    fontSize: 11,
  },

  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    gap: 8,
  },
  emptyTitle: {
    color: "#047857",
    fontSize: 18,
    fontWeight: "800",
  },
  emptySub: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
  },
});
