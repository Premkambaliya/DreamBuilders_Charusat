import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(280, SCREEN_WIDTH * 0.82);

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard",    href: "/(tabs)",           icon: "grid-outline",          iconActive: "grid" },
  { label: "Analyze Call", href: "/(tabs)/analyze",   icon: "cloud-upload-outline",  iconActive: "cloud-upload" },
  { label: "All Calls",    href: "/(tabs)/calls",     icon: "call-outline",          iconActive: "call" },
  { label: "Insights",     href: "/(tabs)/insights",  icon: "bar-chart-outline",     iconActive: "bar-chart" },
  { label: "Top Deals",    href: "/(tabs)/top-deals", icon: "trending-up-outline",   iconActive: "trending-up" },
  { label: "High Risk",    href: "/(tabs)/high-risk", icon: "warning-outline",       iconActive: "warning" },
  { label: "Profile",      href: "/(tabs)/profile",   icon: "person-outline",        iconActive: "person" },
];

const ADMIN_ITEMS = [
  { label: "Employees", href: "/(tabs)/employees", icon: "people-outline", iconActive: "people" },
  { label: "Products",  href: "/(tabs)/products",  icon: "cube-outline",   iconActive: "cube" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MobileSidebar({ visible, onClose, user }) {
  const router   = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Starts fully off-screen to the LEFT (negative = left of screen)
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -SIDEBAR_WIDTH,
      tension: 85,
      friction: 13,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const handleNav = (href) => {
    onClose();
    setTimeout(() => router.push(href), 180);
  };

  const handleLogout = async () => {
    onClose();
    try { await AsyncStorage.multiRemove(["authToken", "userData"]); } catch {}
    router.replace("/login");
  };

  const isActive = (href) => {
    if (href === "/(tabs)") return pathname === "/" || pathname === "/(tabs)" || pathname === "/index";
    return pathname.includes(href.replace("/(tabs)/", ""));
  };

  const items = [...NAV_ITEMS, ...(user?.role === "admin" ? ADMIN_ITEMS : [])];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/*
        modalRoot = full screen, flexRow
        ┌────────────────┬────────────────────────┐
        │   DRAWER (L)   │   OVERLAY (R) → close  │
        └────────────────┴────────────────────────┘
      */}
      <View style={styles.modalRoot}>

        {/* ── LEFT: Sliding drawer ── */}
        <Animated.View
          style={[
            styles.drawer,
            { paddingTop: insets.top, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <ScrollView
            style={styles.drawerScroll}
            contentContainerStyle={[styles.drawerScrollContent, { paddingBottom: insets.bottom + 16 }]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <LinearGradient
              colors={["rgba(108,99,255,0.18)", "rgba(108,99,255,0.02)"]}
              style={styles.drawerHeader}
            >
              <LinearGradient colors={["#6C63FF", "#00D4AA"]} style={styles.logoBox}>
                <Ionicons name="flash" size={18} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.logoTitle}>SalesIQ</Text>
                <Text style={styles.logoSub}>Revenue Intelligence</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.6}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </LinearGradient>

            {/* User Info */}
            {user && (
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user.name || "User"}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user.email || ""}
                  </Text>
                </View>
              </View>
            )}

            {/* Nav List */}
            <View style={styles.navContent}>
              {items.map(({ label, href, icon, iconActive }) => {
                const active = isActive(href);
                return (
                  <TouchableOpacity
                    key={href}
                    onPress={() => handleNav(href)}
                    activeOpacity={0.7}
                    style={[styles.navItem, active && styles.navItemActive]}
                  >
                    {active && <View style={styles.activeBar} />}
                    <View style={[styles.navIconBox, active && styles.navIconBoxActive]}>
                      <Ionicons
                        name={active ? iconActive : icon}
                        size={18}
                        color={active ? "#818cf8" : "#6b7280"}
                      />
                    </View>
                    <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                      {label}
                    </Text>
                    {active && <View style={styles.activePip} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>System Status: Connected</Text>
            </View>
            <Text style={styles.statusSub}>Pull to refresh for latest data</Text>
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              style={styles.logoutRow}
            >
              <Ionicons name="log-out-outline" size={18} color="#f87171" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── RIGHT: Transparent overlay — tap to close ── */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Full-screen row: [drawer | overlay]
  modalRoot: {
    flex: 1,
    flexDirection: "row",
  },

  // Drawer on the LEFT
  drawer: {
    width: SIDEBAR_WIDTH,
    height: "100%",
    backgroundColor: "#10111e",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 24,
  },

  // Overlay fills the rest (right side), semi-transparent
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  // ── Header ──
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  drawerScroll: { flex: 1 },
  drawerScrollContent: { paddingBottom: 12 },
  logoBox: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  logoTitle: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  logoSub:   { color: "#64748b", fontSize: 10, marginTop: 1 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
    justifyContent: "center", alignItems: "center",
  },

  // ── User ──
  userRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(108,99,255,0.25)",
    borderWidth: 1, borderColor: "rgba(108,99,255,0.45)",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: "#818cf8", fontSize: 16, fontWeight: "bold" },
  userName:  { color: "#e2e8f0", fontSize: 13, fontWeight: "600" },
  userEmail: { color: "#64748b", fontSize: 11, marginTop: 1 },

  // ── Nav ──
  navContent: { paddingVertical: 10, paddingHorizontal: 10, gap: 3 },
  navItem: {
    flexDirection: "row", alignItems: "center", gap: 11,
    paddingHorizontal: 12, paddingVertical: 12,
    borderRadius: 11, position: "relative", overflow: "hidden",
  },
  navItemActive: {
    backgroundColor: "rgba(99,102,241,0.13)",
    borderWidth: 1, borderColor: "rgba(99,102,241,0.22)",
  },
  activeBar: {
    position: "absolute", left: 0, top: "15%",
    height: "70%", width: 3, borderRadius: 2,
    backgroundColor: "#818cf8",
  },
  navIconBox: {
    width: 30, height: 30, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  navIconBoxActive: { backgroundColor: "rgba(99,102,241,0.18)" },
  navLabel:       { flex: 1, color: "#6b7280", fontSize: 14, fontWeight: "500" },
  navLabelActive: { color: "#a5b4fc", fontWeight: "600" },
  activePip: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#818cf8",
  },

  // ── Footer ──
  footer: {
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)",
    padding: 16, gap: 5,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: "#34d399",
    shadowColor: "#34d399", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 5,
  },
  statusText: { color: "#cbd5e1", fontSize: 12, fontWeight: "600" },
  statusSub:  { color: "#4b5563", fontSize: 11, marginBottom: 6 },
  logoutRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: "rgba(248,113,113,0.09)",
    borderWidth: 1, borderColor: "rgba(248,113,113,0.18)",
    marginTop: 4,
  },
  logoutText: { color: "#f87171", fontSize: 14, fontWeight: "600" },
});
