import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
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
import { io } from "socket.io-client";
import * as Clipboard from "expo-clipboard";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../api/api";
import MobileSidebar from "../../components/MobileSidebar";

const SOCKET_URL = API_BASE_URL.replace("/api", "");
const HINT_DISMISS_MS = 12000;

const HINT_CONFIG = {
  OBJECTION: { label: "Objection", icon: "warning-outline", accent: "#ef4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.30)" },
  QUESTION: { label: "Question", icon: "help-circle-outline", accent: "#3b82f6", bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.30)" },
  BUYING_SIGNAL: { label: "Buying Signal", icon: "trending-up-outline", accent: "#10b981", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.30)" },
  COACHING: { label: "Coaching", icon: "bulb-outline", accent: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)" },
};

const CALL_TYPES = ["sales", "demo", "followup", "support"];

const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function StatCard({ label, value, icon }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statLabelRow}>
        <Ionicons name={icon} size={11} color="#64748b" />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function HintCard({ hint, onDismiss }) {
  const cfg = HINT_CONFIG[hint.type] || HINT_CONFIG.COACHING;

  useEffect(() => {
    const t = setTimeout(onDismiss, hint.talkTrack ? 20000 : HINT_DISMISS_MS);
    return () => clearTimeout(t);
  }, [hint.talkTrack, onDismiss]);

  const onCopy = async () => {
    if (!hint.talkTrack) return;
    await Clipboard.setStringAsync(hint.talkTrack);
  };

  return (
    <View style={[styles.hintCard, { borderColor: cfg.border, backgroundColor: cfg.bg }]}> 
      <TouchableOpacity style={styles.hintClose} onPress={onDismiss}>
        <Ionicons name="close" size={14} color="#64748b" />
      </TouchableOpacity>

      <View style={styles.hintBadgeRow}>
        <View style={[styles.hintBadge, { backgroundColor: cfg.accent }]}> 
          <Ionicons name={cfg.icon} size={11} color="#fff" />
          <Text style={styles.hintBadgeText}>{cfg.label}</Text>
        </View>
      </View>

      {hint.trigger ? <Text style={styles.hintTrigger}>{'"'}{hint.trigger}{'"'}</Text> : null}
      <Text style={[styles.hintText, { color: "#1f2937" }]}>{hint.hint}</Text>
      {hint.detail ? <Text style={styles.hintDetail}>{hint.detail}</Text> : null}

      {hint.talkTrack ? (
        <View style={styles.talkTrackBox}>
          <View style={styles.talkTrackTop}>
            <Text style={styles.talkTrackLabel}>Say This</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={onCopy}>
              <Ionicons name="copy-outline" size={12} color="#64748b" />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.talkTrackText}>{'"'}{hint.talkTrack}{'"'}</Text>
        </View>
      ) : null}
    </View>
  );
}

function AnalyticsDashboard({ summary, fullTranscript, elapsed, hints }) {
  const hintCount = hints.length;

  const copyTranscript = async () => {
    await Clipboard.setStringAsync(fullTranscript || "");
    Alert.alert("Copied", "Transcript copied to clipboard.");
  };

  const copyFollowup = async () => {
    const email = `Subject: ${summary?.followUpEmail?.subject || "Follow-up"}\n\n${summary?.followUpEmail?.body || ""}`;
    await Clipboard.setStringAsync(email);
    Alert.alert("Copied", "Follow-up email copied.");
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.analyticsHead}>
        <View style={styles.analyticsTitleWrap}>
          <LinearGradient colors={["#fb923c", "#f97316"]} style={styles.analyticsIcon}>
            <Ionicons name="bar-chart-outline" size={16} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.analyticsTitle}>Session Analytics</Text>
            <Text style={styles.analyticsSub}>AI-powered post-call intelligence</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.copyBtn} onPress={copyTranscript}>
          <Ionicons name="copy-outline" size={12} color="#64748b" />
          <Text style={styles.copyBtnText}>Transcript</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricGrid}>
        <View style={styles.metricCard}><Text style={styles.metricBig}>{summary?.sentiment || "neutral"}</Text><Text style={styles.metricSmall}>Sentiment</Text></View>
        <View style={styles.metricCard}><Text style={styles.metricBig}>{summary?.dealProbability ?? 0}%</Text><Text style={styles.metricSmall}>Deal Probability</Text></View>
        <View style={styles.metricCard}><Text style={styles.metricBig}>{summary?.repPerformance?.score ?? 0}/10</Text><Text style={styles.metricSmall}>Rep Performance</Text></View>
        <View style={styles.metricCard}><Text style={styles.metricBig}>{formatTime(elapsed)}</Text><Text style={styles.metricSmall}>Duration</Text></View>
      </View>

      <View style={styles.blockCard}>
        <Text style={styles.blockTitle}>Executive Summary</Text>
        <Text style={styles.blockText}>{summary?.executiveSummary || "No summary available."}</Text>
      </View>

      <View style={styles.blockCard}>
        <Text style={styles.blockTitle}>Hints Triggered</Text>
        <Text style={styles.blockText}>{hintCount} live hints detected during this session.</Text>
      </View>

      {summary?.nextBestAction ? (
        <View style={[styles.blockCard, styles.nextActionCard]}>
          <Text style={styles.blockTitle}>Next Best Action</Text>
          <Text style={styles.blockText}>{summary.nextBestAction}</Text>
        </View>
      ) : null}

      {summary?.followUpEmail ? (
        <View style={styles.blockCard}>
          <View style={styles.followupHead}>
            <Text style={styles.blockTitle}>Follow-Up Email Draft</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={copyFollowup}>
              <Ionicons name="copy-outline" size={12} color="#64748b" />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.followupSubject}>Subject: {summary.followUpEmail.subject}</Text>
          <View style={styles.followupBodyBox}>
            <Text style={styles.blockText}>{summary.followUpEmail.body}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function LiveCopilotScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [connected, setConnected] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const sessionActiveRef = useRef(false);

  const [elapsed, setElapsed] = useState(0);
  const [chunksCount, setChunksCount] = useState(0);
  const [liveStatus, setLiveStatus] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [productName, setProductName] = useState("");
  const [callType, setCallType] = useState("sales");

  const [transcripts, setTranscripts] = useState([]);
  const [activeHints, setActiveHints] = useState([]);
  const [hintHistory, setHintHistory] = useState([]);

  const [sessionEnded, setSessionEnded] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const socketRef = useRef(null);
  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const cycleTimeoutRef = useRef(null);
  const hintIdRef = useRef(0);

  const showAnalytics = !sessionActive && (aiSummary || summaryLoading);

  useEffect(() => {
    const loadUser = async () => {
      const [authToken, userData] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userData"),
      ]);
      setToken(authToken);
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch {
          setUser(null);
        }
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (sessionActive) {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionActive]);

  const dismissHint = useCallback((id) => {
    setActiveHints((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const connectSocket = useCallback(() => {
    if (!token) return null;
    if (socketRef.current?.connected) return socketRef.current;

    const socket = io(`${SOCKET_URL}/copilot`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("transcript:final", (d) => {
      setTranscripts((prev) => [...prev, { text: d.text, time: new Date().toLocaleTimeString() }]);
      setLiveStatus("listening");
    });

    socket.on("transcript:status", (d) => setLiveStatus(d.status));
    socket.on("session:ready", () => setLiveStatus("listening"));

    socket.on("copilot:hint", (hint) => {
      const h = { ...hint, id: ++hintIdRef.current };
      setActiveHints((prev) => [h, ...prev].slice(0, 4));
      setHintHistory((prev) => [...prev, h]);
    });

    socket.on("session:ended", (d) => {
      setLiveStatus(null);
      setSessionEnded(d);
      setSummaryLoading(true);
    });

    socket.on("session:summary", (d) => {
      setAiSummary(d);
      setSummaryLoading(false);
    });

    socket.on("summary:status", (d) => {
      if (d.status === "failed") setSummaryLoading(false);
    });

    socket.on("error:copilot", (d) => {
      Alert.alert("Copilot Error", d?.message || "Live copilot failed.");
    });

    socketRef.current = socket;
    return socket;
  }, [token]);

  const stopCurrentRecording = useCallback(async () => {
    if (!recordingRef.current) return null;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      return uri;
    } catch {
      recordingRef.current = null;
      return null;
    }
  }, []);

  const sendRecordingChunk = useCallback(async (uri, socket) => {
    if (!uri || !socket?.connected) return;
    try {
      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      socket.emit("audio:chunk", b64);
      setChunksCount((c) => c + 1);
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      // keep session running if one chunk fails
    }
  }, []);

  const startRecordingCycle = useCallback(async (socket) => {
    if (!sessionActiveRef.current || !socket?.connected) return;

    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;

      cycleTimeoutRef.current = setTimeout(async () => {
        const uri = await stopCurrentRecording();
        await sendRecordingChunk(uri, socket);
        if (sessionActiveRef.current) startRecordingCycle(socket);
      }, 4000);
    } catch {
      Alert.alert("Microphone", "Could not start recording cycle.");
      sessionActiveRef.current = false;
      setSessionActive(false);
    }
  }, [sendRecordingChunk, stopCurrentRecording]);

  const startSession = useCallback(async () => {
    if (!token) {
      Alert.alert("Auth", "Please login again.");
      return;
    }

    try {
      const socket = connectSocket();
      if (!socket) return;

      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Microphone permission is required for Live Copilot.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      socket.emit("session:start", {
        callContext: {
          customerName: customerName || "Unknown",
          productName: productName || "General",
          callType,
        },
      });

      setSessionActive(true);
      sessionActiveRef.current = true;
      setElapsed(0);
      setTranscripts([]);
      setChunksCount(0);
      setActiveHints([]);
      setHintHistory([]);
      setSessionEnded(null);
      setAiSummary(null);
      setSummaryLoading(false);
      setLiveStatus("listening");

      await startRecordingCycle(socket);
    } catch {
      Alert.alert("Live Copilot", "Could not start session.");
    }
  }, [callType, connectSocket, customerName, productName, startRecordingCycle, token]);

  const stopSession = useCallback(async () => {
    sessionActiveRef.current = false;
    setSessionActive(false);
    setLiveStatus(null);

    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    const uri = await stopCurrentRecording();
    await sendRecordingChunk(uri, socketRef.current);
    socketRef.current?.emit("session:stop");
  }, [sendRecordingChunk, stopCurrentRecording]);

  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
      stopCurrentRecording();
      socketRef.current?.disconnect();
    };
  }, [stopCurrentRecording]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <MobileSidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <LinearGradient colors={["#fff7ed", "#ffffff"]} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
              <Ionicons name="menu" size={22} color="#6b7280" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Live Sales Copilot</Text>
              <Text style={styles.subtitle}>Real-time AI assistant for your calls</Text>
            </View>
            <View style={[styles.statusBadge, connected ? styles.statusOk : styles.statusBad]}>
              <Ionicons name={connected ? "wifi" : "wifi-outline"} size={12} color={connected ? "#16a34a" : "#dc2626"} />
              <Text style={[styles.statusText, { color: connected ? "#16a34a" : "#dc2626" }]}>{connected ? "Connected" : "Disconnected"}</Text>
            </View>
          </View>

          {!sessionActive && !showAnalytics ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Call Context (optional)</Text>

              <Text style={styles.fieldLabel}>Customer Name</Text>
              <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="e.g. John Doe" placeholderTextColor="#94a3b8" />

              <Text style={styles.fieldLabel}>Product</Text>
              <TextInput style={styles.input} value={productName} onChangeText={setProductName} placeholder="e.g. Enterprise Plan" placeholderTextColor="#94a3b8" />

              <Text style={styles.fieldLabel}>Call Type</Text>
              <View style={styles.typeRow}>
                {CALL_TYPES.map((type) => {
                  const active = callType === type;
                  return (
                    <TouchableOpacity key={type} onPress={() => setCallType(type)} style={[styles.typeChip, active && styles.typeChipActive]}>
                      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {!showAnalytics ? (
            <View style={styles.micWrap}>
              <TouchableOpacity onPress={sessionActive ? stopSession : startSession} style={[styles.micBtn, sessionActive && styles.micBtnActive]}>
                <Ionicons name={sessionActive ? "mic-off" : "mic"} size={34} color={sessionActive ? "#fff" : "#ea580c"} />
              </TouchableOpacity>
              <Text style={styles.micCaption}>{sessionActive ? "Listening... tap to stop" : "Tap mic to start"}</Text>
            </View>
          ) : null}

          {!showAnalytics ? (
            <View style={styles.statsRow}>
              <StatCard label="Duration" value={formatTime(elapsed)} icon="time-outline" />
              <StatCard label="Transcripts" value={transcripts.length} icon="chatbubble-ellipses-outline" />
              <StatCard label="AI Hints" value={hintHistory.length} icon="sparkles-outline" />
              <StatCard label="Chunks" value={chunksCount} icon="pulse-outline" />
            </View>
          ) : null}

          {sessionActive ? (
            <>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Live Transcript</Text>
                {transcripts.length === 0 ? (
                  <Text style={styles.emptyText}>Waiting for speech...</Text>
                ) : (
                  transcripts.map((t, idx) => (
                    <View key={`${t.time}-${idx}`} style={styles.transcriptRow}>
                      <Text style={styles.transcriptTime}>{t.time}</Text>
                      <Text style={styles.transcriptText}>{t.text}</Text>
                    </View>
                  ))
                )}
                {liveStatus === "processing" ? <Text style={styles.processingText}>Processing...</Text> : null}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>AI Copilot Hints</Text>
                {activeHints.length === 0 ? (
                  <Text style={styles.emptyText}>Hints will appear when signals are detected.</Text>
                ) : (
                  <View style={{ gap: 10 }}>
                    {activeHints.map((h) => (
                      <HintCard key={h.id} hint={h} onDismiss={() => dismissHint(h.id)} />
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : null}

          {showAnalytics ? (
            <>
              {summaryLoading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="large" color="#ea580c" />
                  <Text style={styles.loadingText}>Generating session analytics...</Text>
                </View>
              ) : null}

              {aiSummary ? (
                <AnalyticsDashboard
                  summary={aiSummary}
                  fullTranscript={sessionEnded?.fullTranscript || ""}
                  elapsed={elapsed}
                  hints={hintHistory}
                />
              ) : null}

              <TouchableOpacity
                style={styles.newSessionBtn}
                onPress={() => {
                  setSessionEnded(null);
                  setAiSummary(null);
                  setSummaryLoading(false);
                }}
              >
                <Ionicons name="mic-outline" size={18} color="#ea580c" />
                <Text style={styles.newSessionText}>Start New Session</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff7ed" },
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
    backgroundColor: "rgba(249,115,22,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 1, fontSize: 12, color: "#64748b" },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  statusOk: { backgroundColor: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.25)" },
  statusBad: { backgroundColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.25)" },
  statusText: { fontSize: 11, fontWeight: "700" },

  card: {
    backgroundColor: "#fffaf5",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.14)",
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#334155", marginBottom: 2 },

  fieldLabel: { fontSize: 11, color: "#64748b", fontWeight: "700", textTransform: "uppercase", marginTop: 6 },
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    color: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },

  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  typeChip: {
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
  },
  typeChipActive: { backgroundColor: "rgba(249,115,22,0.12)", borderColor: "rgba(249,115,22,0.35)" },
  typeChipText: { fontSize: 12, color: "#64748b", fontWeight: "600", textTransform: "capitalize" },
  typeChipTextActive: { color: "#ea580c" },

  micWrap: { alignItems: "center", paddingVertical: 12 },
  micBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffedd5",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.30)",
    shadowColor: "#fb923c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 7,
  },
  micBtnActive: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  micCaption: { marginTop: 10, fontSize: 12, color: "#64748b", fontWeight: "600" },

  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  statCard: {
    minWidth: "47%",
    backgroundColor: "#fffaf5",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.14)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "800", color: "#111827" },
  statLabelRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  statLabel: { fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: "700" },

  transcriptRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.12)",
    borderRadius: 10,
    padding: 10,
  },
  transcriptTime: { fontSize: 10, color: "#ea580c", fontWeight: "700", marginTop: 2 },
  transcriptText: { flex: 1, fontSize: 13, color: "#1f2937", lineHeight: 18 },

  emptyText: { fontSize: 12, color: "#64748b", fontStyle: "italic", paddingVertical: 8 },
  processingText: { fontSize: 12, color: "#ea580c", fontStyle: "italic", marginTop: 6 },

  hintCard: { borderWidth: 1, borderRadius: 12, padding: 12, position: "relative" },
  hintClose: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.12)",
  },
  hintBadgeRow: { marginBottom: 6, marginRight: 26 },
  hintBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  hintBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  hintTrigger: { fontSize: 11, color: "#64748b", fontStyle: "italic", marginBottom: 3 },
  hintText: { fontSize: 13, fontWeight: "700", lineHeight: 18, marginBottom: 2 },
  hintDetail: { fontSize: 12, color: "#64748b", lineHeight: 17 },

  talkTrackBox: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.20)",
    backgroundColor: "#ffffff",
    padding: 10,
    gap: 6,
  },
  talkTrackTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  talkTrackLabel: { fontSize: 10, color: "#ea580c", fontWeight: "800", textTransform: "uppercase" },
  talkTrackText: { fontSize: 13, color: "#1f2937", fontStyle: "italic", lineHeight: 18 },

  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.20)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(249,115,22,0.06)",
  },
  copyBtnText: { fontSize: 11, color: "#64748b", fontWeight: "700" },

  loadingWrap: { alignItems: "center", gap: 10, paddingVertical: 26 },
  loadingText: { fontSize: 13, color: "#64748b" },

  analyticsHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  analyticsTitleWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  analyticsIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  analyticsTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  analyticsSub: { marginTop: 1, fontSize: 11, color: "#64748b" },

  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.14)",
    borderRadius: 12,
    backgroundColor: "#fffaf5",
    padding: 12,
    alignItems: "center",
  },
  metricBig: { fontSize: 18, fontWeight: "800", color: "#111827", textTransform: "capitalize" },
  metricSmall: { marginTop: 2, fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: "700" },

  blockCard: {
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.14)",
    borderRadius: 12,
    backgroundColor: "#fffaf5",
    padding: 12,
  },
  blockTitle: { fontSize: 13, fontWeight: "800", color: "#334155", marginBottom: 6 },
  blockText: { fontSize: 12, color: "#475569", lineHeight: 18 },
  nextActionCard: { backgroundColor: "rgba(249,115,22,0.07)" },

  followupHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  followupSubject: { marginBottom: 6, fontSize: 12, color: "#ea580c", fontWeight: "700" },
  followupBodyBox: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.12)",
    borderRadius: 10,
    padding: 10,
  },

  newSessionBtn: {
    marginTop: 14,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.30)",
    borderRadius: 12,
    backgroundColor: "rgba(249,115,22,0.10)",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexDirection: "row",
  },
  newSessionText: { color: "#ea580c", fontSize: 14, fontWeight: "700" },
});
