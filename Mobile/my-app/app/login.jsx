import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/api';

export default function Login({ isAuthenticated }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token || isAuthenticated) {
        router.replace("/(tabs)");
      }
    };
    checkAuth();
  }, [isAuthenticated]);

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const res = await authApi.login({
        email: form.email,
        password: form.password,
      });

      // Backend wraps token inside res.data
      const token = res?.data?.token || res?.token;
      console.log('[Login] API response keys:', Object.keys(res || {}));
      console.log('[Login] token found:', !!token);

      if (!token) {
        throw new Error('Login succeeded but no token was returned. Check backend.');
      }

      await AsyncStorage.setItem('authToken', token);
      // Also save user info for sidebar display
      if (res?.data?.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(res.data.user));
      }
      console.log('[Login] token saved to AsyncStorage');

      // Small delay to ensure AsyncStorage write is flushed before navigation
      await new Promise((r) => setTimeout(r, 100));
      router.replace('/(tabs)');
    } catch (submitError) {
      console.error('[Login] error:', submitError.message);
      setError(submitError.message || 'Unable to login right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <LinearGradient
          colors={["#0a0b14", "#0f1221", "#0a0b14"]}
          style={styles.gradientBg}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header / Brand */}
            <View style={styles.brandContainer}>
              <View style={styles.logoDot} />
              <Text style={styles.brandText}>SALESIQ</Text>
            </View>

            {/* Intro Content */}
            <View style={styles.introSection}>
              <Text style={styles.h1}>Welcome back to your workspace</Text>
              <Text style={styles.introDesc}>
                Continue tracking deal momentum, rep performance, and customer sentiment in real-time.
              </Text>
            </View>

            {/* Main Form Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Login</Text>
              <Text style={styles.cardSubtitle}>Sign in to continue your analysis workflow.</Text>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Work Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@company.com"
                    placeholderTextColor="#6b7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={form.email}
                    onChangeText={(text) => onChange("email", text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    value={form.password}
                    onChangeText={(text) => onChange("password", text)}
                  />
                </View>

                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => onChange("remember", !form.remember)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        form.remember && styles.checkboxActive,
                      ]}
                    >
                      {form.remember && (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Remember me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity>
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitBtnText}>
                    {isSubmitting ? "Signing in..." : "Login to Dashboard"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footerLinks}>
                <Text style={styles.footerText}>New here? </Text>
                <Link href="/signup" asChild>
                  <TouchableOpacity>
                    <Text style={styles.footerLinkBold}>Create an account</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <Link href="/" asChild>
                <TouchableOpacity style={styles.backBtn}>
                  <Text style={styles.backBtnText}>Back to landing page</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a0b14",
  },
  container: {
    flex: 1,
  },
  gradientBg: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    marginTop: 12,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10b981", // emerald-500
    marginRight: 8,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  brandText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1.2,
  },
  introSection: {
    marginBottom: 40,
  },
  h1: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    lineHeight: 34,
    marginBottom: 12,
  },
  introDesc: {
    fontSize: 15,
    color: "#d1d5db",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "rgba(22, 24, 41, 0.9)",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#d1d5db",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#161829",
    borderColor: "#374151",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 15,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#4f46e5",
    borderRadius: 4,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#4f46e5",
  },
  checkboxLabel: {
    color: "#9ca3af",
    fontSize: 13,
  },
  forgotPasswordText: {
    color: "#818cf8",
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: "#f87171",
    fontSize: 13,
    marginBottom: 8,
  },
  submitBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  footerLinkBold: {
    color: "#34d399",
    fontSize: 14,
    fontWeight: "600",
  },
  backBtn: {
    marginTop: 16,
  },
  backBtnText: {
    color: "#9ca3af",
    fontSize: 14,
  },
});
