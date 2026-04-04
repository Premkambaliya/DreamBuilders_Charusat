import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
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
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../../api/api";
import MobileSidebar from "../../components/MobileSidebar";

const AlertBar = ({ type = "error", text }) => {
  const isSuccess = type === "success";
  return (
    <View
      style={[
        styles.alert,
        isSuccess ? styles.alertSuccess : styles.alertError,
      ]}
    >
      <Ionicons
        name={isSuccess ? "checkmark-circle-outline" : "warning-outline"}
        size={14}
        color={isSuccess ? "#6ee7b7" : "#fda4af"}
      />
      <Text style={[styles.alertText, { color: isSuccess ? "#6ee7b7" : "#fda4af" }]}>
        {text}
      </Text>
    </View>
  );
};

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState(null);

  const initials = useMemo(() => {
    const n = user?.name || "";
    if (!n.trim()) return "U";
    return n
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user]);

  const hydrateUser = async () => {
    try {
      const [storedToken, userData] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userData"),
      ]);

      if (!storedToken) {
        router.replace("/login");
        return;
      }

      setToken(storedToken);

      let parsedUser = null;
      if (userData) {
        try {
          parsedUser = JSON.parse(userData);
        } catch {}
      }

      if (parsedUser) {
        setUser(parsedUser);
        setName(parsedUser.name || "");
        setEmail(parsedUser.email || "");
        setCompanyName(parsedUser.company_name || parsedUser.companyName || "");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    hydrateUser();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    hydrateUser();
  };

  const handleProfileSave = async () => {
    if (!name.trim() || !email.trim()) {
      setProfileMsg({ type: "error", text: "Name and email are required." });
      return;
    }

    setProfileSaving(true);
    setProfileMsg(null);

    try {
      const res = await authApi.updateProfile(
        { name: name.trim(), email: email.trim(), company_name: companyName.trim() },
        token
      );

      const updatedUser = res?.data || res?.user || {};
      const merged = { ...(user || {}), ...updatedUser };

      setUser(merged);
      setName(merged.name || "");
      setEmail(merged.email || "");
      setCompanyName(merged.company_name || merged.companyName || "");
      await AsyncStorage.setItem("userData", JSON.stringify(merged));

      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPwdMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }

    setPwdSaving(true);
    setPwdMsg(null);

    try {
      await authApi.updateProfile({ currentPassword, newPassword }, token);
      setPwdMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwdMsg({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setPwdSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteMsg({ type: "error", text: 'Please type "DELETE" to confirm.' });
      return;
    }

    setDeleting(true);
    setDeleteMsg(null);

    try {
      await authApi.deleteAccount(token);
      await AsyncStorage.multiRemove(["authToken", "userData"]);
      setDeleteOpen(false);
      router.replace("/login");
    } catch (err) {
      setDeleteMsg({ type: "error", text: err.message || "Failed to delete account." });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#090b13", "#0f1222"]} style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <MobileSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <LinearGradient colors={["#090b13", "#0f1222"]} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setSidebarOpen(true)}
            style={styles.menuBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={22} color="#d1d5db" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Account & Profile</Text>
            <Text style={styles.subtitle}>Manage identity, password, and account settings.</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6C63FF"
              colors={["#6C63FF"]}
            />
          }
        >
          <View style={styles.summaryCard}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nameText}>{user?.name || "Unknown"}</Text>
              <Text style={styles.emailText}>{user?.email || "-"}</Text>
              {!!(user?.company_name || user?.companyName) && (
                <View style={styles.companyPill}>
                  <Ionicons name="business-outline" size={12} color="#a5b4fc" />
                  <Text style={styles.companyPillText}>{user.company_name || user.companyName}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Information</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor="#64748b" />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Your company"
              placeholderTextColor="#64748b"
            />

            {profileMsg ? <AlertBar type={profileMsg.type} text={profileMsg.text} /> : null}

            <TouchableOpacity
              style={[styles.primaryBtn, profileSaving && styles.btnDisabled]}
              onPress={handleProfileSave}
              disabled={profileSaving}
              activeOpacity={0.8}
            >
              {profileSaving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="save-outline" size={15} color="#fff" />}
              <Text style={styles.primaryBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Change Password</Text>

            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Your current password"
              placeholderTextColor="#64748b"
              secureTextEntry
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor="#64748b"
              secureTextEntry
            />

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat new password"
              placeholderTextColor="#64748b"
              secureTextEntry
            />

            {pwdMsg ? <AlertBar type={pwdMsg.type} text={pwdMsg.text} /> : null}

            <TouchableOpacity
              style={[styles.cyanBtn, pwdSaving && styles.btnDisabled]}
              onPress={handlePasswordSave}
              disabled={pwdSaving}
              activeOpacity={0.8}
            >
              {pwdSaving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="key-outline" size={15} color="#fff" />}
              <Text style={styles.primaryBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <Text style={styles.dangerSub}>This action is irreversible and deletes all account data.</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => {
                setDeleteOpen(true);
                setDeleteConfirmText("");
                setDeleteMsg(null);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={15} color="#fda4af" />
              <Text style={styles.deleteBtnText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Delete Account Permanently</Text>
              <TouchableOpacity onPress={() => setDeleteOpen(false)} style={styles.modalClose}>
                <Ionicons name="close" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>
              This will delete your account and all analyzed call data. Type DELETE to confirm.
            </Text>

            <TextInput
              style={styles.input}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
            />

            {deleteMsg ? <AlertBar type={deleteMsg.type} text={deleteMsg.text} /> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setDeleteOpen(false)}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmBtn, (deleting || deleteConfirmText !== "DELETE") && styles.btnDisabled]}
                onPress={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== "DELETE"}
              >
                {deleting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="trash-outline" size={15} color="#fff" />}
                <Text style={styles.deleteConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#090b13" },
  flex: { flex: 1 },
  centerWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#9ca3af", marginTop: 12 },

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
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "900" },
  subtitle: { color: "#94a3b8", marginTop: 2, fontSize: 12 },

  content: { paddingHorizontal: 16, paddingBottom: 36, gap: 12 },

  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(18,21,39,0.9)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    width: 66,
    height: 66,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
  },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "900" },
  nameText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  emailText: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  companyPill: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.3)",
    backgroundColor: "rgba(99,102,241,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  companyPillText: { color: "#a5b4fc", fontSize: 11, fontWeight: "700" },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(18,21,39,0.9)",
    padding: 14,
  },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "800", marginBottom: 10 },
  label: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 5,
    marginTop: 4,
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#fff",
    paddingHorizontal: 12,
    fontSize: 13,
  },

  alert: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  alertSuccess: {
    borderColor: "rgba(52,211,153,0.35)",
    backgroundColor: "rgba(52,211,153,0.12)",
  },
  alertError: {
    borderColor: "rgba(244,63,94,0.35)",
    backgroundColor: "rgba(244,63,94,0.12)",
  },
  alertText: { fontSize: 12, flex: 1 },

  primaryBtn: {
    marginTop: 12,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  cyanBtn: {
    marginTop: 12,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#0891b2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  btnDisabled: { opacity: 0.55 },

  dangerCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.25)",
    backgroundColor: "rgba(244,63,94,0.08)",
    padding: 14,
  },
  dangerTitle: { color: "#fda4af", fontSize: 15, fontWeight: "800" },
  dangerSub: { color: "#94a3b8", marginTop: 4, fontSize: 12 },
  deleteBtn: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.35)",
    backgroundColor: "rgba(244,63,94,0.14)",
    height: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
  deleteBtnText: { color: "#fda4af", fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#161829",
    padding: 14,
  },
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { color: "#fff", fontSize: 16, fontWeight: "800", flex: 1, paddingRight: 8 },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modalText: { color: "#94a3b8", fontSize: 12, lineHeight: 18, marginBottom: 10 },
  modalActions: { marginTop: 12, flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: "#cbd5e1", fontWeight: "700", fontSize: 12 },
  deleteConfirmBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  deleteConfirmText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
