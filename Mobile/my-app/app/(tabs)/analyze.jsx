import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { API_BASE_URL, productsApi } from "../../api/api";
import MobileSidebar from "../../components/MobileSidebar";

const { width: SW } = Dimensions.get("window");

// ─── Constants ────────────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  { key: "uploading",    label: "Uploading file",               desc: "Saving to server",        color: "#6C63FF" },
  { key: "transcribing",label: "Transcribing with Groq Whisper",desc: "Speech to Text",          color: "#00D4AA" },
  { key: "analyzing",   label: "Analyzing with LLaMA-3.3-70b", desc: "GPT intelligence",         color: "#F59E0B" },
  { key: "done",        label: "Insights ready!",               desc: "Opening your results…",   color: "#10B981" },
];

const DETECTION_ITEMS = [
  { icon: "🎙️", label: "Full Transcript",        desc: "Groq Whisper STT",            color: "#6C63FF" },
  { icon: "📝", label: "Call Summary",            desc: "3-5 sentence overview",       color: "#00D4AA" },
  { icon: "✅", label: "Buying Signals",          desc: "Purchase intent indicators",  color: "#10B981" },
  { icon: "⚠️", label: "Objections",              desc: "Pricing & feature concerns",  color: "#F59E0B" },
  { icon: "😊", label: "Sentiment Analysis",      desc: "Positive / Neutral / Negative", color: "#EC4899" },
  { icon: "📊", label: "Deal Probability",        desc: "0–100% close likelihood",     color: "#8B5CF6" },
  { icon: "📧", label: "Follow-Up Action",        desc: "AI next-step suggestions",    color: "#06B6D4" },
  { icon: "⭐", label: "Salesperson Rating",      desc: "1-10 score + breakdown",      color: "#F97316" },
  { icon: "🎯", label: "Missed Opportunities",    desc: "Moments rep could leverage",  color: "#EF4444" },
  { icon: "🏁", label: "Competitor Mentions",     desc: "Alternative products discussed", color: "#84CC16" },
  { icon: "💡", label: "Coaching Tips",           desc: "Actionable performance tips", color: "#A78BFA" },
  { icon: "🔥", label: "Pain Points",             desc: "Customer frustrations",       color: "#FB923C" },
];

const PIPELINE_INFO = [
  "Audio uploaded to server",
  "Groq Whisper transcribes speech to text",
  "LLaMA-3.3-70b deep-analyzes conversation",
  "Signals, objections & sentiment detected",
  "Salesperson tone, EQ & performance scored",
  "11 skill scores + 5 call phase scores",
  "Talk ratio, questions & engagement analyzed",
  "Pain points, key topics & pricing extracted",
  "Objection responses rated for effectiveness",
  "Key moments & missed opportunities identified",
  "Deal probability & urgency calculated",
  "Follow-up email & action items generated",
  "Results saved to MongoDB Atlas",
];

const ACCEPTED_TYPES = ["audio/mpeg","audio/wav","audio/m4a","audio/ogg","audio/webm","audio/flac","audio/aac","video/mp4","audio/x-m4a","audio/*","video/*"];
const MAX_SIZE = 50 * 1024 * 1024;

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const CardHeader = ({ iconName, iconColor, iconBg, title, badge }) => (
  <View style={styles.cardHeaderRow}>
    <View style={[styles.cardIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={iconName} size={16} color={iconColor} />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    {badge ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    ) : null}
  </View>
);

const StyledInput = ({ placeholder, value, onChangeText, keyboardType, secureTextEntry, multiline, numberOfLines }) => (
  <TextInput
    style={[styles.input, multiline && { height: numberOfLines ? numberOfLines * 22 + 24 : 160, textAlignVertical: "top" }]}
    placeholder={placeholder}
    placeholderTextColor="#6b7280"
    value={value}
    onChangeText={onChangeText}
    keyboardType={keyboardType || "default"}
    secureTextEntry={secureTextEntry}
    multiline={multiline}
    autoCapitalize="none"
  />
);

// ─── Pipeline Progress Screen ─────────────────────────────────────────────────

function PipelineScreen({ step, completedSteps, inputType }) {
  const progress =
    step === "done"
      ? 100
      : Math.round((completedSteps.length / (PIPELINE_STEPS.length - 1)) * 100);

  return (
    <ScrollView
      contentContainerStyle={styles.pipelineScroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Icon */}
      <View style={styles.pipelineIconWrap}>
        {step === "done" ? (
          <LinearGradient colors={["#10B981", "#059669"]} style={styles.pipelineOrb}>
            <Ionicons name="checkmark-circle" size={52} color="#fff" />
          </LinearGradient>
        ) : (
          <LinearGradient colors={["#6C63FF", "#4f46e5"]} style={styles.pipelineOrb}>
            <ActivityIndicator size={52} color="#fff" />
          </LinearGradient>
        )}
      </View>

      <Text style={styles.pipelineTitle}>
        {step === "done" ? "Analysis Complete!" : "AI Pipeline Running…"}
      </Text>
      <Text style={styles.pipelineSubtitle}>
        {step === "done"
          ? "Opening your call insights…"
          : "LLMs are working their magic. Please wait."}
      </Text>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressLabel}>{progress}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={["#6C63FF", "#00D4AA", "#10B981"]}
            start={[0, 0]}
            end={[1, 0]}
            style={[styles.progressBarFill, { width: `${progress}%` }]}
          />
        </View>
      </View>

      {/* Steps */}
      <View style={styles.stepsWrap}>
        {PIPELINE_STEPS.map((ps, idx) => {
          const isDone = completedSteps.includes(ps.key);
          const isCurrent = step === ps.key && !isDone;
          return (
            <View
              key={ps.key}
              style={[
                styles.stepItem,
                isDone && styles.stepDone,
                isCurrent && styles.stepCurrent,
                !isDone && !isCurrent && styles.stepPending,
              ]}
            >
              <View
                style={[
                  styles.stepBadge,
                  isDone && { backgroundColor: "rgba(16,185,129,0.2)" },
                  isCurrent && { backgroundColor: "rgba(108,99,255,0.2)" },
                  !isDone && !isCurrent && { backgroundColor: "rgba(255,255,255,0.07)" },
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color="#34d399" />
                ) : isCurrent ? (
                  <ActivityIndicator size={13} color="#818cf8" />
                ) : (
                  <Text style={styles.stepNum}>{idx + 1}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.stepLabel,
                    isDone && { color: "#34d399" },
                    isCurrent && { color: "#a5b4fc" },
                    !isDone && !isCurrent && { color: "#6b7280" },
                  ]}
                >
                  {ps.label}
                </Text>
                <Text style={styles.stepDesc}>{ps.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AnalyzeCallScreen() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [user, setUser]                 = useState(null);
  const [inputType, setInputType]       = useState("audio");
  const [audioFile, setAudioFile]       = useState(null);
  const [textContent, setTextContent]   = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [products, setProducts]         = useState([]);
  const [productId, setProductId]       = useState("");
  const [showProducts, setShowProducts] = useState(false);
  const [step, setStep]                 = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [feedback, setFeedback]         = useState(null);
  const [showDetections, setShowDetections] = useState(false);
  const [showPipelineInfo, setShowPipelineInfo] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [token, userData] = await Promise.all([
          AsyncStorage.getItem("authToken"),
          AsyncStorage.getItem("userData"),
        ]);
        if (userData) {
          try { setUser(JSON.parse(userData)); } catch {}
        }
        if (!token) { router.replace("/login"); return; }
        const res = await productsApi.getProducts(token);
        if (res.products?.length > 0) setProducts(res.products);
      } catch {}
    };
    loadInitialData();
  }, []);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPTED_TYPES,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_SIZE) {
        setFeedback({ type: "error", message: "File too large. Max 50MB." });
        return;
      }
      setFeedback(null);
      setAudioFile(asset);
    } catch (err) {
      setFeedback({ type: "error", message: "Could not pick file. Try again." });
    }
  };

  const resetPipeline = () => {
    setStep(null);
    setCompletedSteps([]);
  };

  const runPipeline = async () => {
    if (inputType === "audio" && !audioFile) {
      setFeedback({ type: "error", message: "Please select an audio or video file." });
      return;
    }
    if (inputType === "text" && !textContent.trim()) {
      setFeedback({ type: "error", message: "Please enter the transcript text." });
      return;
    }
    if (!customerEmail) {
      setFeedback({ type: "error", message: "Customer email is required." });
      return;
    }

    setFeedback(null);
    resetPipeline();
    setStep("uploading");

    try {
      const token = await AsyncStorage.getItem("authToken");
      const headers = { Authorization: `Bearer ${token}` };

      let callId;

      if (inputType === "audio") {
        // Build FormData for audio upload
        const formData = new FormData();
        formData.append("audio", {
          uri: audioFile.uri,
          type: audioFile.mimeType || "audio/mpeg",
          name: audioFile.name || "audio.mp3",
        });
        formData.append("customer_name",  customerName || "Unknown");
        formData.append("customer_email", customerEmail);
        formData.append("customer_phone", customerPhone || "");
        formData.append("productId",      productId || "");

        const upRes = await fetch(`${API_BASE_URL}/audio/upload`, {
          method: "POST",
          headers: { ...headers },
          body: formData,
        });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.message || "Upload failed");
        callId = upData.callId;
      } else {
        // Text upload
        const txRes = await fetch(`${API_BASE_URL}/audio/upload-text`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            text: textContent,
            customer_name:  customerName || "Unknown",
            customer_email: customerEmail,
            customer_phone: customerPhone || "",
            productId:      productId || "",
          }),
        });
        const txData = await txRes.json();
        if (!txRes.ok) throw new Error(txData.message || "Upload failed");
        callId = txData.callId;
      }

      setCompletedSteps(["uploading"]);

      if (inputType === "audio") {
        setStep("transcribing");
        const trRes = await fetch(`${API_BASE_URL}/transcription/transcribe/${callId}`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
        });
        const trData = await trRes.json();
        if (!trRes.ok) throw new Error(trData.message || "Transcription failed");
        setCompletedSteps(["uploading", "transcribing"]);
      }

      setStep("analyzing");
      const aiRes = await fetch(`${API_BASE_URL}/ai/analyze/${callId}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.message || "Analysis failed");

      setCompletedSteps(["uploading", "transcribing", "analyzing", "done"]);
      setStep("done");

      setTimeout(() => router.replace("/login"), 1200);
    } catch (err) {
      resetPipeline();
      setFeedback({ type: "error", message: err.message });
    }
  };

  // ── Pipeline screen ──
  if (step) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#090b13", "#0f1222"]} style={styles.container}>
          <PipelineScreen step={step} completedSteps={completedSteps} inputType={inputType} />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const selectedProduct = products.find((p) => p._id === productId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Sidebar */}
      <MobileSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <LinearGradient colors={["#090b13", "#0f1222"]} style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Screen Top Header with Menu Button ── */}
            <View style={styles.screenHeader}>
              <TouchableOpacity
                onPress={() => setSidebarOpen(true)}
                style={styles.menuBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="menu" size={22} color="#d1d5db" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.h1}>Analyze Call</Text>
                <Text style={styles.headerSub}>AI-powered conversation intelligence</Text>
              </View>
            </View>

            {/* ── Page Header ── */}
            <View style={styles.pageHeader}>
              <View style={styles.aiPill}>
                <Ionicons name="sparkles" size={11} color="#818cf8" />
                <Text style={styles.aiPillText}>Groq Whisper + LLaMA-3.3-70b</Text>
              </View>
              <Text style={styles.pageTitle}>Conversation Analysis Studio</Text>
              <Text style={styles.pageDesc}>
                Upload a recording or paste a transcript to generate structured call intelligence, rep coaching, and next-step actions.
              </Text>
            </View>

            {/* ── Tab Switch ── */}
            <View style={styles.tabBar}>
              {[
                { key: "audio", icon: "musical-notes", label: "Audio / Video" },
                { key: "text",  icon: "document-text",  label: "Paste Text" },
              ].map(({ key, icon, label }) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setInputType(key)}
                  activeOpacity={0.8}
                  style={[styles.tabBtn, inputType === key && styles.tabBtnActive]}
                >
                  <Ionicons
                    name={icon}
                    size={14}
                    color={inputType === key ? "#fff" : "#6b7280"}
                  />
                  <Text style={[styles.tabText, inputType === key && styles.tabTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Error Banner ── */}
            {feedback ? (
              <View style={[styles.feedbackBanner, feedback.type === "error" ? styles.feedbackError : styles.feedbackSuccess]}>
                <Ionicons
                  name={feedback.type === "error" ? "alert-circle-outline" : "checkmark-circle-outline"}
                  size={15}
                  color={feedback.type === "error" ? "#fca5a5" : "#6ee7b7"}
                />
                <Text style={[styles.feedbackText, { color: feedback.type === "error" ? "#fca5a5" : "#6ee7b7" }]}>
                  {feedback.message}
                </Text>
              </View>
            ) : null}

            {/* ── Customer Details ── */}
            <SectionCard>
              <CardHeader iconName="mic" iconColor="#818cf8" iconBg="rgba(108,99,255,0.15)" title="Customer Details" />
              <View style={styles.formFields}>
                <StyledInput placeholder="Customer Name" value={customerName} onChangeText={setCustomerName} />
                <StyledInput placeholder="Customer Email *" value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" />
                <StyledInput placeholder="Customer Phone (optional)" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />

                {/* Product selector */}
                {products.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowProducts(!showProducts)}
                    style={styles.productBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="cube-outline" size={15} color="#9ca3af" />
                    <Text style={styles.productBtnText} numberOfLines={1}>
                      {selectedProduct ? selectedProduct.productName : "✨ Auto-detect Product using AI"}
                    </Text>
                    <Ionicons name={showProducts ? "chevron-up" : "chevron-down"} size={14} color="#9ca3af" />
                  </TouchableOpacity>
                )}
                {showProducts && (
                  <View style={styles.productDropdown}>
                    <TouchableOpacity
                      onPress={() => { setProductId(""); setShowProducts(false); }}
                      style={[styles.productOption, productId === "" && styles.productOptionActive]}
                    >
                      <Text style={[styles.productOptionText, productId === "" && styles.productOptionTextActive]}>
                        ✨ Auto-detect using AI
                      </Text>
                    </TouchableOpacity>
                    {products.map((p) => (
                      <TouchableOpacity
                        key={p._id}
                        onPress={() => { setProductId(p._id); setShowProducts(false); }}
                        style={[styles.productOption, productId === p._id && styles.productOptionActive]}
                      >
                        <Text style={[styles.productOptionText, productId === p._id && styles.productOptionTextActive]}>
                          {p.productName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </SectionCard>

            {/* ── Upload / Text ── */}
            <SectionCard>
              {inputType === "audio" ? (
                <>
                  <CardHeader iconName="musical-notes" iconColor="#22d3ee" iconBg="rgba(6,182,212,0.15)" title="Audio / Video File" />
                  {!audioFile ? (
                    <TouchableOpacity onPress={pickFile} style={styles.dropZone} activeOpacity={0.8}>
                      <LinearGradient colors={["rgba(108,99,255,0.12)", "rgba(108,99,255,0.04)"]} style={styles.dropZoneInner}>
                        <View style={styles.dropIconWrap}>
                          <Ionicons name="cloud-upload" size={32} color="#818cf8" />
                        </View>
                        <Text style={styles.dropTitle}>Tap to select file</Text>
                        <Text style={styles.dropSub}>MP3 · WAV · M4A · OGG · MP4 · Max 50MB</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.fileBox}>
                      <View style={styles.fileIconWrap}>
                        <Ionicons name="musical-notes" size={24} color="#818cf8" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fileName} numberOfLines={2}>{audioFile.name}</Text>
                        <Text style={styles.fileSize}>
                          {audioFile.size ? `${(audioFile.size / 1048576).toFixed(2)} MB` : ""}
                        </Text>
                        {audioFile.name?.toLowerCase().endsWith(".mp4") && (
                          <View style={styles.mp4Badge}>
                            <Text style={styles.mp4BadgeText}>Video — audio extracted automatically</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => { setAudioFile(null); setFeedback(null); }}
                        style={styles.fileRemoveBtn}
                      >
                        <Ionicons name="close" size={14} color="#f87171" />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <CardHeader iconName="document-text" iconColor="#34d399" iconBg="rgba(16,185,129,0.15)" title="Text Transcript" />
                  <StyledInput
                    placeholder="Paste the transcription or call speech text here…"
                    value={textContent}
                    onChangeText={setTextContent}
                    multiline
                    numberOfLines={8}
                  />
                </>
              )}

              {/* Submit */}
              <TouchableOpacity
                onPress={runPipeline}
                activeOpacity={0.85}
                style={styles.submitBtn}
              >
                <LinearGradient
                  colors={["#6C63FF", "#4f46e5"]}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.submitGradient}
                >
                  <Ionicons name="flash" size={17} color="#fff" />
                  <Text style={styles.submitText}>Run AI Analysis Pipeline</Text>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </SectionCard>

            {/* ── What AI Detects (collapsible) ── */}
            <SectionCard>
              <TouchableOpacity
                onPress={() => setShowDetections(!showDetections)}
                style={styles.collapsibleHeader}
                activeOpacity={0.8}
              >
                <CardHeader
                  iconName="hardware-chip"
                  iconColor="#fbbf24"
                  iconBg="rgba(245,158,11,0.15)"
                  title="What AI Detects"
                  badge={`${DETECTION_ITEMS.length}+ signals`}
                />
                <Ionicons name={showDetections ? "chevron-up" : "chevron-down"} size={18} color="#6b7280" />
              </TouchableOpacity>

              {showDetections && (
                <View style={styles.detectionGrid}>
                  {DETECTION_ITEMS.map((item) => (
                    <View key={item.label} style={styles.detectionItem}>
                      <Text style={styles.detectionEmoji}>{item.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detectionLabel}>{item.label}</Text>
                        <Text style={styles.detectionDesc}>{item.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>

            {/* ── AI Pipeline Steps (collapsible) ── */}
            <SectionCard style={{ marginBottom: 32 }}>
              <TouchableOpacity
                onPress={() => setShowPipelineInfo(!showPipelineInfo)}
                style={styles.collapsibleHeader}
                activeOpacity={0.8}
              >
                <CardHeader
                  iconName="git-branch"
                  iconColor="#34d399"
                  iconBg="rgba(16,185,129,0.15)"
                  title="AI Pipeline Steps"
                />
                <Ionicons name={showPipelineInfo ? "chevron-up" : "chevron-down"} size={18} color="#6b7280" />
              </TouchableOpacity>

              {showPipelineInfo && (
                <View style={styles.pipelineInfoList}>
                  {PIPELINE_INFO.map((item, idx) => (
                    <View key={idx} style={styles.pipelineInfoRow}>
                      <View style={styles.pipelineInfoNum}>
                        <Text style={styles.pipelineInfoNumText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.pipelineInfoText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: "#090b13" },
  container: { flex: 1 },
  scroll:    { padding: 20, paddingBottom: 40 },

  // Screen header with menu button
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    gap: 12,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  h1:        { fontSize: 19, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: "#6b7280", marginTop: 1 },

  // Pipeline screen
  pipelineScroll: { alignItems: "center", padding: 24, paddingTop: 48 },
  pipelineIconWrap: { marginBottom: 24 },
  pipelineOrb: {
    width: 112, height: 112, borderRadius: 56,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
  },
  pipelineTitle: { fontSize: 26, fontWeight: "900", color: "#fff", textAlign: "center" },
  pipelineSubtitle: { fontSize: 13, color: "#9ca3af", marginTop: 8, textAlign: "center" },
  progressWrap: { width: "100%", marginTop: 24, marginBottom: 8 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { color: "#6b7280", fontSize: 11 },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  stepsWrap: { width: "100%", marginTop: 16, gap: 10 },
  stepItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  stepDone:    { borderColor: "rgba(16,185,129,0.25)", backgroundColor: "rgba(16,185,129,0.08)" },
  stepCurrent: { borderColor: "rgba(108,99,255,0.35)", backgroundColor: "rgba(108,99,255,0.10)" },
  stepPending: { borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)", opacity: 0.55 },
  stepBadge: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  stepNum:   { color: "#6b7280", fontSize: 12, fontWeight: "bold" },
  stepLabel: { fontSize: 13, fontWeight: "600" },
  stepDesc:  { fontSize: 11, color: "#6b7280", marginTop: 1 },

  // Page header
  pageHeader: { marginBottom: 20 },
  aiPill: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
    backgroundColor: "rgba(99,102,241,0.12)", borderColor: "rgba(99,102,241,0.25)", borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12,
  },
  aiPillText:  { color: "#818cf8", fontSize: 11, fontWeight: "600" },
  pageTitle:   { fontSize: 24, fontWeight: "900", color: "#fff", marginBottom: 6 },
  pageDesc:    { fontSize: 13, color: "#9ca3af", lineHeight: 20 },

  // Tabs
  tabBar: {
    flexDirection: "row", gap: 6,
    backgroundColor: "rgba(15,17,32,0.9)",
    borderColor: "rgba(255,255,255,0.08)", borderWidth: 1,
    borderRadius: 14, padding: 5, marginBottom: 16,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderRadius: 10, paddingVertical: 9,
  },
  tabBtnActive: {
    backgroundColor: "#4f46e5",
    shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  tabText:       { color: "#6b7280", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff" },

  // Feedback
  feedbackBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 14,
  },
  feedbackError:   { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" },
  feedbackSuccess: { backgroundColor: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)" },
  feedbackText:    { flex: 1, fontSize: 13 },

  // Card
  card: {
    backgroundColor: "rgba(18,21,39,0.9)",
    borderColor: "rgba(255,255,255,0.08)", borderWidth: 1,
    borderRadius: 16, padding: 16, marginBottom: 14,
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  cardIcon:      { width: 30, height: 30, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  cardTitle:     { flex: 1, color: "#fff", fontSize: 14, fontWeight: "bold" },
  badge: {
    backgroundColor: "rgba(99,102,241,0.12)", borderColor: "rgba(99,102,241,0.25)", borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { color: "#818cf8", fontSize: 10, fontWeight: "700" },

  // Form fields
  formFields: { gap: 10 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)", borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    color: "#fff", fontSize: 14,
  },

  // Product selector
  productBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)", borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
  },
  productBtnText: { flex: 1, color: "#d1d5db", fontSize: 14 },
  productDropdown: {
    backgroundColor: "#161829",
    borderColor: "rgba(255,255,255,0.1)", borderWidth: 1,
    borderRadius: 10, overflow: "hidden", marginTop: 4,
  },
  productOption: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  productOptionActive: { backgroundColor: "rgba(99,102,241,0.12)" },
  productOptionText: { color: "#9ca3af", fontSize: 14 },
  productOptionTextActive: { color: "#a5b4fc", fontWeight: "600" },

  // Drop zone
  dropZone: { borderRadius: 12, overflow: "hidden", marginTop: 4 },
  dropZoneInner: {
    borderRadius: 12, borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center", paddingVertical: 36, paddingHorizontal: 20,
  },
  dropIconWrap: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: "rgba(108,99,255,0.12)",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  dropTitle: { color: "#fff", fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  dropSub:   { color: "#6b7280", fontSize: 11 },

  // Selected file
  fileBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: "rgba(108,99,255,0.08)",
    borderColor: "rgba(108,99,255,0.22)", borderWidth: 1,
    borderRadius: 12, padding: 12, marginTop: 4,
  },
  fileIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(108,99,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  fileName:     { color: "#fff", fontSize: 13, fontWeight: "600" },
  fileSize:     { color: "#9ca3af", fontSize: 11, marginTop: 2 },
  fileRemoveBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "rgba(248,113,113,0.1)",
    borderColor: "rgba(248,113,113,0.2)", borderWidth: 1,
    justifyContent: "center", alignItems: "center",
  },
  mp4Badge: {
    backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.2)", borderWidth: 1,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, alignSelf: "flex-start",
  },
  mp4BadgeText: { color: "#fbbf24", fontSize: 10 },

  // Submit
  submitBtn: { marginTop: 14, borderRadius: 12, overflow: "hidden" },
  submitGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14,
    shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "bold" },

  // Collapsible
  collapsibleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  // Detection grid
  detectionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  detectionItem: {
    flexDirection: "row", alignItems: "center", gap: 8,
    width: (SW - 80) / 2,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.06)", borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
  },
  detectionEmoji: { fontSize: 16 },
  detectionLabel: { color: "#e2e8f0", fontSize: 11, fontWeight: "600" },
  detectionDesc:  { color: "#6b7280", fontSize: 10, marginTop: 1 },

  // Pipeline info
  pipelineInfoList: { gap: 0, marginTop: 4 },
  pipelineInfoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 7 },
  pipelineInfoNum: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(108,99,255,0.15)",
    justifyContent: "center", alignItems: "center", marginTop: 1,
  },
  pipelineInfoNumText: { color: "#818cf8", fontSize: 9, fontWeight: "bold" },
  pipelineInfoText:    { flex: 1, color: "#9ca3af", fontSize: 12, lineHeight: 18 },
});
