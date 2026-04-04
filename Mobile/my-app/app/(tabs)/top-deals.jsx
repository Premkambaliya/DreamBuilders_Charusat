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
  const s = (sentiment || "neutral").toLowerCase();
  if (s === "positive") {
    return {
      bg: "rgba(52,211,153,0.15)",
      border: "rgba(52,211,153,0.35)",
      text: "#6ee7b7",
      label: "Positive",
    };
  }
  if (s === "negative") {
    return {
      bg: "rgba(244,63,94,0.15)",
      border: "rgba(244,63,94,0.35)",
      text: "#fda4af",
      label: "Negative",
    };
  }
  return {
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.35)",
    text: "#fcd34d",
    label: "Neutral",
  };
};

const rankLabel = (index) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
};

const probColor = (prob) => {
  if (prob >= 70) return "#34d399";
  if (prob >= 40) return "#fbbf24";
  return "#fb7185";
};

const SkeletonCard = () => <View style={styles.skeletonCard} />;

const DealCard = ({ deal, index, onPressDeal }) => {
  const probability = deal.dealProbability ?? 0;
  const pColor = probColor(probability);
  const sentiment = sentimentStyle(deal.sentiment);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => onPressDeal(deal.callId)}
    >
      <Text style={styles.rankStamp}>{rankLabel(index)}</Text>

      <View style={styles.cardTopRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {deal.callTitle || deal.productName || deal.product_name || "Sales Call"}
          </Text>

          <Text style={styles.cardSummary} numberOfLines={2}>
            {deal.summary || "No summary available."}
          </Text>

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

          <Text style={styles.typeText}>Type: {(deal.callType || "other").toLowerCase()}</Text>
        </View>

        <View style={styles.probWrap}>
          <Text style={[styles.probValue, { color: pColor }]}>{probability}%</Text>
          <Text style={styles.probLabel}>Deal Probability</Text>
        </View>
      </View>

      <View style={styles.probBarBg}>
        <View
          style={[styles.probBarFill, { width: `${probability}%`, backgroundColor: pColor }]}
        />
      </View>

      {Array.isArray(deal.aiInsights?.buyingSignals) && deal.aiInsights.buyingSignals.length > 0 ? (
        <View style={styles.signalWrap}>
          {deal.aiInsights.buyingSignals.slice(0, 2).map((signal, idx) => (
            <View key={`${deal.callId || index}-${idx}`} style={styles.signalPill}>
              <Text style={styles.signalText} numberOfLines={1}>
                {`✅ ${signal.substring(0, 40)}${signal.length > 40 ? "..." : ""}`}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.dateText}>
        {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString() : "-"}
      </Text>
    </TouchableOpacity>
  );
};

export default function TopDealsScreen() {
  const router = useRouter();

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const fetchTopDeals = useCallback(async (isRefresh = false) => {
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
      const sortedTopDeals = [...(response.calls || [])]
        .sort((a, b) => (b.dealProbability || 0) - (a.dealProbability || 0))
        .slice(0, 10);

      setDeals(sortedTopDeals);
    } catch (err) {
      setDeals([]);
      setError(`Failed to load top deals: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTopDeals();
  }, [fetchTopDeals]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTopDeals(true);
  };

  const openDeal = (callId) => {
    if (!callId) return;
    router.push("/(tabs)/calls");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#fff7ed", "#ffffff"]} style={styles.flex}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#fb923c" />
            <Text style={styles.loadingText}>Loading top opportunities...</Text>
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
            <Text style={styles.title}>Top Opportunities</Text>
            <Text style={styles.subtitle}>
              Prioritized calls ranked by close probability and buying momentum.
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

        {deals.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="trending-up-outline" size={50} color="#64748b" />
            <Text style={styles.emptyTitle}>No analyzed calls yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/(tabs)/analyze")}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Analyze your first call</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={deals}
            keyExtractor={(item, idx) => String(item.callId || item._id || idx)}
            renderItem={({ item, index }) => (
              <DealCard deal={item} index={index} onPressDeal={openDeal} />
            )}
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
    height: 160,
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
    fontSize: 23,
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
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
    backgroundColor: "#ffffff",
    padding: 14,
  },
  rankStamp: {
    position: "absolute",
    right: 12,
    top: 8,
    color: "rgba(226,232,240,0.35)",
    fontSize: 19,
    fontWeight: "900",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    paddingRight: 30,
  },
  cardSummary: {
    marginTop: 5,
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 17,
  },
  sentimentPill: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sentimentPillText: {
    fontSize: 11,
    fontWeight: "700",
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
    minWidth: 96,
  },
  probValue: {
    fontSize: 34,
    lineHeight: 34,
    fontWeight: "900",
  },
  probLabel: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 10,
    fontWeight: "600",
  },
  probBarBg: {
    marginTop: 14,
    width: "100%",
    height: 8,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: "rgba(249,115,22,0.18)",
  },
  probBarFill: {
    height: "100%",
    borderRadius: 99,
  },

  signalWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  signalPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.35)",
    backgroundColor: "rgba(52,211,153,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: "100%",
  },
  signalText: {
    color: "#047857",
    fontSize: 11,
    fontWeight: "700",
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
    paddingHorizontal: 34,
    gap: 10,
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyButton: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.35)",
    backgroundColor: "rgba(249,115,22,0.14)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyButtonText: {
    color: "#ea580c",
    fontSize: 13,
    fontWeight: "700",
  },
});
