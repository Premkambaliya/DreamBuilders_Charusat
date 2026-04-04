import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dashboardApi } from "../../api/api";

const Section = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.sectionWrap}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.8}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name={icon} size={18} color="#a5b4fc" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#94a3b8"
        />
      </TouchableOpacity>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
};

const Chip = ({ label, type = "neutral", icon }) => {
  const colors = {
    positive: { text: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.28)" },
    negative: { text: "#fb7185", bg: "rgba(251,113,133,0.12)", border: "rgba(251,113,133,0.28)" },
    neutral: { text: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.28)" },
    info: { text: "#67e8f9", bg: "rgba(103,232,249,0.12)", border: "rgba(103,232,249,0.28)" },
    done: { text: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.28)" },
  };

  const c = colors[type] || colors.neutral;

  return (
    <View style={[styles.chip, { backgroundColor: c.bg, borderColor: c.border }]}>
      {icon ? <Ionicons name={icon} size={12} color={c.text} /> : null}
      <Text style={[styles.chipText, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const CallDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const callId = useMemo(() => String(id || ""), [id]);

  const goBackToCalls = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/calls");
  };

  const [loading, setLoading] = useState(true);
  const [call, setCall] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDetails = async () => {
      if (!callId) {
        setError("Call id missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          router.replace("/login");
          return;
        }

        const result = await dashboardApi.getCallDetails(callId, token);
        if (!result.call) {
          setError("Call details not found.");
        } else {
          setCall(result.call);
        }
      } catch (e) {
        setError(e?.message || "Failed to load call details.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [callId, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#fff7ed", "#ffffff"]} style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#fb923c" />
          <Text style={styles.loadingText}>Loading call detail...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error || !call) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#fff7ed", "#ffffff"]} style={styles.centerWrap}>
          <Ionicons name="alert-circle-outline" size={40} color="#fb7185" />
          <Text style={styles.errorText}>{error || "Call not found"}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={goBackToCalls}>
            <Ionicons name="arrow-back" size={16} color="#ea580c" />
            <Text style={styles.backBtnText}>Back to Calls</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const insights = call.aiInsights || {};
  const sentiment = (insights.sentiment || call.sentiment || "neutral").toLowerCase();
  const sentimentType = sentiment === "positive" ? "positive" : sentiment === "negative" ? "negative" : "neutral";

  const summary = insights.summary || call.summary || "No summary available.";
  const actionCenter = insights.actionCenter || [];
  const objectionPlaybook = insights.objectionPlaybook || [];
  const coaching = insights.coachingActions || {};
  const followUp = insights.followUpRecommendation || "No follow-up recommendation available.";
  const emailDraft = insights.emailDraft || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#fff7ed", "#ffffff"]} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={goBackToCalls} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={16} color="#ea580c" />
            <Text style={styles.backBtnText}>Back to Calls</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {call.call_title || insights.callTitle || call.callTitle || call.product_name || "Call Details"}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{insights.productName || call.product_name || "Product"}</Text>
            <Text style={styles.metaText}>{call.employeeName || "Unknown"}</Text>
            <Text style={styles.metaText}>{call.createdAt ? new Date(call.createdAt).toLocaleDateString() : "-"}</Text>
          </View>

          <View style={styles.chipsRow}>
            <Chip label={sentimentType === "positive" ? "Positive" : sentimentType === "negative" ? "Negative" : "Neutral"} type={sentimentType} icon={sentimentType === "positive" ? "happy-outline" : sentimentType === "negative" ? "sad-outline" : "remove-circle-outline"} />
            <Chip label="Analyzed" type="done" icon="checkmark-circle-outline" />
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() => Alert.alert("Report", "Download is available in Web dashboard currently.")}
            >
              <Ionicons name="download-outline" size={14} color="#ea580c" />
              <Text style={styles.downloadBtnText}>Download Report</Text>
            </TouchableOpacity>
          </View>

          <Section title="Action Center" icon="locate-outline" defaultOpen>
            {actionCenter.length ? (
              actionCenter.map((item, idx) => (
                <View key={`${item.action}-${idx}`} style={styles.actionCard}>
                  <Text style={styles.actionPriority}>{String(item.priority || "medium").toUpperCase()}</Text>
                  <Text style={styles.actionTitle}>{item.action}</Text>
                  {item.reason ? <Text style={styles.actionReason}>{item.reason}</Text> : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyStateText}>No actions available.</Text>
            )}
          </Section>

          <Section title="Objection Playbook" icon="shield-outline" defaultOpen>
            {objectionPlaybook.length ? (
              objectionPlaybook.map((obj, idx) => (
                <View key={`${obj.objection}-${idx}`} style={styles.objectionCard}>
                  <Text style={styles.objectionTitle}>{`"${obj.objection}"`}</Text>
                  {obj.suggestedResponse ? (
                    <View style={styles.quoteBox}>
                      <Text style={styles.quoteHead}>WHAT TO SAY</Text>
                      <Text style={styles.quoteBody}>{`"${obj.suggestedResponse}"`}</Text>
                    </View>
                  ) : null}
                  {(obj.actionItems || []).map((step, stepIdx) => (
                    <Text key={`${step}-${stepIdx}`} style={styles.listItem}>• {step}</Text>
                  ))}
                </View>
              ))
            ) : (
              <Text style={styles.emptyStateText}>No objections detected.</Text>
            )}
          </Section>

          <Section title="Coaching Corner" icon="school-outline" defaultOpen>
            {coaching.topSkillGap ? <Chip label={`Skill Gap: ${coaching.topSkillGap}`} type="negative" /> : null}
            {coaching.specificIssue ? (
              <View style={styles.alertCardBad}>
                <Text style={styles.alertHeadBad}>WHAT WENT WRONG</Text>
                <Text style={styles.alertBody}>{coaching.specificIssue}</Text>
              </View>
            ) : null}
            {coaching.coachingTip ? (
              <View style={styles.alertCardGood}>
                <Text style={styles.alertHeadGood}>HOW TO IMPROVE</Text>
                <Text style={styles.alertBody}>{coaching.coachingTip}</Text>
              </View>
            ) : null}
            {coaching.practiceExercise ? (
              <View style={styles.alertCardInfo}>
                <Text style={styles.alertHeadInfo}>PRACTICE EXERCISE</Text>
                <Text style={styles.alertBody}>{coaching.practiceExercise}</Text>
              </View>
            ) : null}
            {coaching.managerSummary ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryHead}>MANAGER SUMMARY</Text>
                <Text style={styles.alertBody}>{coaching.managerSummary}</Text>
              </View>
            ) : null}
          </Section>

          <Section title="AI Follow-Up Recommendation" icon="bulb-outline" defaultOpen>
            <Text style={styles.followText}>{followUp}</Text>
          </Section>

          <Section title="Generated Follow-Up Email" icon="mail-outline" defaultOpen>
            <Text style={styles.emailSubject}>Subject: {emailDraft.subject || "Follow-up after our call"}</Text>
            <View style={styles.emailBodyWrap}>
              <Text style={styles.emailBody}>{emailDraft.body || "No email draft generated."}</Text>
            </View>
          </Section>

          <Section title="AI Conversation Summary" icon="chatbubble-ellipses-outline" defaultOpen={false}>
            <Text style={styles.summaryText}>{summary}</Text>
          </Section>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff7ed" },
  flex: { flex: 1 },
  centerWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, paddingHorizontal: 24 },
  loadingText: { color: "#6b7280", fontSize: 14 },
  errorText: { color: "#fca5a5", fontSize: 14, textAlign: "center", marginBottom: 6 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 36, paddingTop: 8, gap: 12 },

  backBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
    backgroundColor: "rgba(249,115,22,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backBtnText: { color: "#111827", fontSize: 14, fontWeight: "700" },

  title: { color: "#111827", fontSize: 22, lineHeight: 28, fontWeight: "900", marginTop: 2 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  metaText: { color: "#6b7280", fontSize: 13 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontWeight: "700" },

  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(249,115,22,0.06)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  downloadBtnText: { color: "#111827", fontSize: 12, fontWeight: "700" },

  sectionWrap: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { color: "#111827", fontSize: 18, fontWeight: "900" },
  sectionBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },

  actionCard: {
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
    backgroundColor: "rgba(245,158,11,0.08)",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  actionPriority: { color: "#fbbf24", fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
  actionTitle: { color: "#111827", fontSize: 20, fontWeight: "900", lineHeight: 28 },
  actionReason: { color: "#374151", fontSize: 18, lineHeight: 26 },

  objectionCard: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
    backgroundColor: "rgba(249,115,22,0.04)",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  objectionTitle: { color: "#111827", fontSize: 18, fontWeight: "800", lineHeight: 25 },
  quoteBox: {
    borderLeftWidth: 3,
    borderLeftColor: "#ea580c",
    backgroundColor: "rgba(249,115,22,0.12)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  quoteHead: { color: "#ea580c", fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
  quoteBody: { color: "#111827", fontSize: 17, fontStyle: "italic", lineHeight: 25 },
  listItem: { color: "#374151", fontSize: 16, lineHeight: 22 },

  alertCardBad: {
    borderLeftWidth: 3,
    borderLeftColor: "#fb7185",
    backgroundColor: "rgba(251,113,133,0.12)",
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  alertHeadBad: { color: "#fda4af", fontSize: 13, fontWeight: "900" },
  alertCardGood: {
    borderLeftWidth: 3,
    borderLeftColor: "#34d399",
    backgroundColor: "rgba(52,211,153,0.1)",
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  alertHeadGood: { color: "#047857", fontSize: 13, fontWeight: "900" },
  alertCardInfo: {
    borderLeftWidth: 3,
    borderLeftColor: "#22d3ee",
    backgroundColor: "rgba(34,211,238,0.1)",
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  alertHeadInfo: { color: "#67e8f9", fontSize: 13, fontWeight: "900" },
  alertBody: { color: "#111827", fontSize: 19, lineHeight: 27 },

  summaryCard: {
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.35)",
    backgroundColor: "rgba(99,102,241,0.08)",
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  summaryHead: { color: "#ea580c", fontSize: 13, fontWeight: "900" },

  followText: {
    borderLeftWidth: 3,
    borderLeftColor: "#22d3ee",
    backgroundColor: "rgba(14,116,144,0.22)",
    color: "#111827",
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    lineHeight: 26,
  },

  emailSubject: { color: "#111827", fontSize: 20, fontWeight: "900" },
  emailBodyWrap: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.26)",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff7ed",
  },
  emailBody: { color: "#374151", fontSize: 18, lineHeight: 28 },
  summaryText: { color: "#374151", fontSize: 18, lineHeight: 28 },

  emptyStateText: { color: "#6b7280", fontSize: 14 },
});

export default CallDetailScreen;
