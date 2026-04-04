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

const initialForm = {
  fullName: "",
  email: "",
  companyName: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

export default function Signup({ isAuthenticated }) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
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
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!form.acceptTerms) {
      setError('Please accept Terms and Privacy Policy to continue.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await authApi.signup({
        name: form.fullName,
        email: form.email,
        company_name: form.companyName,   // backend expects company_name not companyName
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      // Backend wraps token inside res.data
      const token = res?.data?.token || res?.token;
      console.log('[Signup] token found:', !!token);

      if (!token) {
        throw new Error('Account created but no token returned. Please log in.');
      }

      await AsyncStorage.setItem('authToken', token);
      await new Promise((r) => setTimeout(r, 100));
      router.replace('/(tabs)');
    } catch (submitError) {
      console.error('[Signup] error:', submitError.message);
      setError(submitError.message || 'Unable to create account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <LinearGradient
          colors={["#fff7ed", "#ffffff", "#fff7ed"]}
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
              <Text style={styles.h1}>Start your AI sales workspace</Text>
              <Text style={styles.introDesc}>
                Create an account in under a minute and analyze your first call right away.
              </Text>
            </View>

            {/* Main Form Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create Account</Text>
              <Text style={styles.cardSubtitle}>Set up your workspace details to begin.</Text>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor="#6b7280"
                    value={form.fullName}
                    onChangeText={(text) => onChange("fullName", text)}
                  />
                </View>

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
                  <Text style={styles.label}>Company</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Company name"
                    placeholderTextColor="#6b7280"
                    value={form.companyName}
                    onChangeText={(text) => onChange("companyName", text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 8 characters"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    value={form.password}
                    onChangeText={(text) => onChange("password", text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    value={form.confirmPassword}
                    onChangeText={(text) => onChange("confirmPassword", text)}
                  />
                </View>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => onChange("acceptTerms", !form.acceptTerms)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      form.acceptTerms && styles.checkboxActive,
                    ]}
                  >
                    {form.acceptTerms && (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I agree to Terms of Service and Privacy Policy.
                  </Text>
                </TouchableOpacity>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitBtnText}>
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footerLinks}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.footerLinkBold}>Login</Text>
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
    backgroundColor: "#fff7ed",
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
    color: "#111827",
    lineHeight: 34,
    marginBottom: 12,
  },
  introDesc: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6b7280",
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
    color: "#4b5563",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fffbf5",
    borderColor: "#fdba74",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#111827",
    fontSize: 15,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    paddingRight: 20, // ensure text doesn't overflow container edge
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#f97316",
    borderRadius: 4,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#f97316",
  },
  checkboxLabel: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: "#f87171",
    fontSize: 13,
    marginBottom: 4,
  },
  submitBtn: {
    backgroundColor: "#f97316",
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
    color: "#6b7280",
    fontSize: 14,
  },
  footerLinkBold: {
    color: "#ea580c",
    fontSize: 14,
    fontWeight: "600",
  },
  backBtn: {
    marginTop: 16,
  },
  backBtnText: {
    color: "#6b7280",
    fontSize: 14,
  },
});
