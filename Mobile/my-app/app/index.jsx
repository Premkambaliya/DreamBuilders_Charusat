import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const features = [
  {
    icon: "pulse",
    title: "Upload Any Sales Call",
    desc: "Drop audio files and let AI process every important moment from intro to close.",
  },
  {
    icon: "sparkles",
    title: "AI-Powered Deal Signals",
    desc: "Spot objections, buying intent, urgency, and competitor mentions in seconds.",
  },
  {
    icon: "stats-chart",
    title: "Team Performance Dashboard",
    desc: "Track sentiment, conversion probability, and coaching opportunities in one view.",
  },
  {
    icon: "mail",
    title: "Auto Follow-Up Email Drafts",
    desc: "Generate personalized follow-up emails from the conversation context in seconds.",
  },
];

export default function LandingPage() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#fff7ed", "#ffffff", "#fff7ed"]}
        locations={[0, 0.48, 1]}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["#10b981", "#059669"]}
                style={styles.logoDot}
              />
              <Text style={styles.logoText}>SalesIQ</Text>
            </View>

            <View style={styles.headerActions}>
              <Link href="/login" asChild>
                <TouchableOpacity style={styles.loginBtn}>
                  <Text style={styles.loginBtnText}>Login</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/signup" asChild>
                <TouchableOpacity style={styles.trialBtn}>
                  <Text style={styles.trialBtnText}>Start Free Trial</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.main}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Text style={styles.preTitle}>AI Sales Call Intelligence Platform</Text>
              <Text style={styles.h1}>
                Turn Raw Sales Calls Into{"\n"}
                <Text style={styles.h1Gradient}>Revenue Decisions</Text>
              </Text>
              <Text style={styles.heroDesc}>
                Analyze every sales conversation with transcription, risk scoring, and
                coaching insights. Your team gets clear next actions, not just call recordings.
              </Text>

              <Link href="/signup" asChild>
                <TouchableOpacity style={styles.ctaButton}>
                  <Text style={styles.ctaButtonText}>Launch Workspace</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </Link>
            </View>

            {/* List Breakdown Section */}
            <View style={styles.benefitsCard}>
              <Text style={styles.h3}>What you get after every call</Text>
              {[
                "Structured transcript with key moments highlighted.",
                "Clear objection and buying-intent summary for faster follow-up.",
                "Practical coaching suggestions reps can use in the next meeting.",
                "Team dashboard visibility to improve call quality over time.",
                "Auto-generated follow-up email drafts based on discussion context and next steps.",
              ].map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
              <View style={styles.metricsNotice}>
                <Text style={styles.metricsNoticeText}>
                  No vanity numbers on landing. Real metrics are shown inside the
                  product dashboard.
                </Text>
              </View>
            </View>

            {/* About / Problem Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.h2}>The Problem We Solve</Text>
            </View>
            <View style={styles.problemCard}>
              <Text style={styles.problemPreTitle}>PROBLEM STATEMENT</Text>
              <Text style={styles.problemDesc}>
                Sales teams spend too much time replaying calls, still miss critical
                objections, and often lose momentum before follow-up happens.
              </Text>
            </View>
            <View style={styles.solutionCard}>
              <Text style={styles.solutionPreTitle}>WHAT SALESIQ SOLVES</Text>
              {[
                "Converts raw call recordings into clear insights and next actions.",
                "Highlights objections, sentiment shifts, and buying intent for faster decision-making.",
                "Creates an auto follow-up email draft from the conversation so reps can respond immediately.",
              ].map((item, index) => (
                <View key={index} style={styles.solutionItem}>
                  <Text style={styles.solutionItemText}>• {item}</Text>
                </View>
              ))}
            </View>

            {/* Features Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.h2}>Everything your reps need after every call</Text>
              <Text style={styles.sectionSubtitle}>
                Built for sales teams that want faster deal movement and better coaching
                loops.
              </Text>
            </View>

            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <LinearGradient
                    colors={["#f97316", "#ea580c"]}
                    style={styles.featureIconWrap}
                  >
                    <Ionicons name={feature.icon} size={18} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              ))}
            </View>

            {/* Flow Section */}
            <View style={styles.flowSection}>
              <Text style={[styles.h2, { textAlign: "center", marginBottom: 24 }]}>
                How it works in 3 simple steps
              </Text>
              {[
                {
                  step: "01",
                  title: "Upload a Call",
                  desc: "Support common audio formats and start processing instantly.",
                },
                {
                  step: "02",
                  title: "AI Analyzes Context",
                  desc: "Extracts sentiment, objections, deal fit, and recommendations.",
                },
                {
                  step: "03",
                  title: "Act with Confidence",
                  desc: "Use dashboards, risks, and top-deal views for your next action.",
                },
              ].map((item, index) => (
                <View key={index} style={styles.flowCard}>
                  <View style={styles.flowStepBadge}>
                    <Text style={styles.flowStepText}>{item.step}</Text>
                  </View>
                  <Text style={styles.flowTitle}>{item.title}</Text>
                  <Text style={styles.flowDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>

            {/* Security Section */}
            <LinearGradient
              colors={["#ffffff", "#fffbf5"]}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.securitySection}
            >
              <View style={styles.securityTextWrap}>
                <Text style={styles.h3}>
                  Built with enterprise-grade security mindset
                </Text>
                <Text style={styles.securityDesc}>
                  Encrypted storage, role-based visibility, and controlled data access
                  for your team.
                </Text>
              </View>
              <View style={styles.securityBadge}>
                <Ionicons name="shield-checkmark" size={20} color="#34d399" />
                <Text style={styles.securityBadgeText}>Secure by design</Text>
              </View>
            </LinearGradient>

            {/* Bottom CTA Section */}
            <View style={styles.bottomCtaSection}>
              <Text style={[styles.h2, { textAlign: "center" }]}>
                Ready to analyze your first call?
              </Text>
              <Text style={styles.bottomCtaDesc}>
                Start your workspace in minutes and invite your team later.
              </Text>
              <View style={styles.bottomCtaButtons}>
                <Link href="/signup" asChild>
                  <TouchableOpacity style={[styles.ctaButton, { width: "100%", marginBottom: 12 }]}>
                    <Text style={styles.ctaButtonText}>Create Account</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="/login" asChild>
                  <TouchableOpacity style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Login</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff7ed",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  loginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4b5563",
  },
  trialBtn: {
    backgroundColor: "#f97316",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trialBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  main: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  heroSection: {
    marginBottom: 40,
  },
  preTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#f97316",
    marginBottom: 16,
  },
  h1: {
    fontSize: 36,
    fontWeight: "900",
    color: "#111827",
    lineHeight: 44,
  },
  h1Gradient: {
    color: "#ea580c",
  },
  heroDesc: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
    color: "#4b5563",
  },
  ctaButton: {
    marginTop: 24,
    backgroundColor: "#f97316",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  benefitsCard: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 48,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 20,
  },
  listItem: {
    backgroundColor: "#fffbf5",
    borderColor: "#fed7aa",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  listText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  metricsNotice: {
    marginTop: 12,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  metricsNoticeText: {
    fontSize: 14,
    color: "#047857",
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: 24,
    marginTop: 16,
  },
  h2: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
  },
  sectionSubtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
  },
  problemCard: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  problemPreTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f97316",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  problemDesc: {
    fontSize: 15,
    lineHeight: 24,
    color: "#4b5563",
  },
  solutionCard: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 48,
  },
  solutionPreTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ea580c",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  solutionItem: {
    marginBottom: 8,
  },
  solutionItemText: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 48,
  },
  featureCard: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    width: "100%",
    marginBottom: 16,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
  },
  flowSection: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 48,
  },
  flowCard: {
    backgroundColor: "#fffbf5",
    borderColor: "#fed7aa",
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  flowStepBadge: {
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  flowStepText: {
    color: "#ea580c",
    fontWeight: "bold",
    fontSize: 14,
  },
  flowTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  flowDesc: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  securitySection: {
    borderRadius: 16,
    borderColor: "#fed7aa",
    borderWidth: 1,
    padding: 24,
    marginBottom: 48,
  },
  securityTextWrap: {
    marginBottom: 16,
  },
  securityDesc: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
    marginTop: 8,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  securityBadgeText: {
    color: "#34d399",
    fontWeight: "600",
    fontSize: 14,
  },
  bottomCtaSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  bottomCtaDesc: {
    marginTop: 12,
    marginBottom: 24,
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  bottomCtaButtons: {
    width: "100%",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
});
