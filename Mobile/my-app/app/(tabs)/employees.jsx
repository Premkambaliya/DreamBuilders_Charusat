import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { employeeIntelligenceApi, usersApi } from "../../api/api";
import MobileSidebar from "../../components/MobileSidebar";

const AccessDenied = () => (
  <View style={styles.emptyWrap}>
    <Ionicons name="shield-outline" size={52} color="#f87171" />
    <Text style={styles.emptyTitle}>Access Denied</Text>
    <Text style={styles.emptySub}>Only company administrators can access this workspace.</Text>
  </View>
);

const StatCard = ({ iconName, label, value, gradientColors, sub }) => (
  <View style={styles.statCard}>
    <LinearGradient colors={gradientColors} style={styles.statIconWrap}>
      <Ionicons name={iconName} size={18} color="#fff" />
    </LinearGradient>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
  </View>
);

const SectionCard = ({ title, subtitle, badge, badgeColor = "#ea580c", children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeaderRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View style={[styles.sectionBadge, { borderColor: `${badgeColor}40`, backgroundColor: `${badgeColor}1A` }]}>
          <Text style={[styles.sectionBadgeText, { color: badgeColor }]}>{badge}</Text>
        </View>
      ) : null}
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const ProgressRow = ({ label, count, maxCount, color, tone = "neutral" }) => {
  const percent = maxCount > 0 ? Math.max((count / maxCount) * 100, 5) : 0;
  return (
    <View style={styles.progressItem}>
      <View style={styles.progressTopRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <View style={[styles.miniPill, tone === "positive" ? styles.miniPositive : tone === "negative" ? styles.miniNegative : styles.miniNeutral]}>
          <Text style={styles.miniPillText}>{count}x</Text>
        </View>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const InsightRow = ({ text, count, maxCount, color, tone = "neutral" }) => {
  const percent = maxCount > 0 ? Math.max((count / maxCount) * 100, 5) : 0;
  return (
    <View style={styles.insightRow}>
      <View style={styles.insightRowTop}>
        <Text style={styles.insightText}>{text}</Text>
        <View style={[styles.miniPill, tone === "positive" ? styles.miniPositive : tone === "negative" ? styles.miniNegative : styles.miniNeutral]}>
          <Text style={styles.miniPillText}>{count}x</Text>
        </View>
      </View>
      <View style={styles.progressBgThin}>
        <View style={[styles.progressFillThin, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const sentimentLabel = (value) => {
  const key = (value || "neutral").toLowerCase();
  return key.charAt(0).toUpperCase() + key.slice(1);
};

const EmployeeIntelligenceView = ({ employee, token, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [intel, setIntel] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await employeeIntelligenceApi.getEmployeeIntelligence(employee._id, token);
        setIntel(data);
        if (!data) {
          setError("No intelligence data available for this employee.");
        }
        if (data?.success === false) {
          setError("Could not load employee intelligence.");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [employee?._id, token]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color="#cbd5e1" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.agentPill}>Agent Intelligence</Text>
          <Text style={styles.detailTitle} numberOfLines={1}>{employee.name}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrapInner}>
          <ActivityIndicator size="large" color="#fb923c" />
          <Text style={styles.loadingText}>Loading employee intelligence...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="warning-outline" size={18} color="#fca5a5" />
          <Text style={styles.errorWrapText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeaderCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {(employee.name || employee.email || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nameLarge}>{employee.name}</Text>
              <View style={styles.roleRow}>
                <View style={styles.roleChipSoft}>
                  <Ionicons name="briefcase-outline" size={11} color="#cbd5e1" />
                  <Text style={styles.roleChipSoftText}>{employee.designation || "Sales Representative"}</Text>
                </View>
                <View style={styles.roleChipGreen}>
                  <Ionicons name="shield-checkmark-outline" size={11} color="#6ee7b7" />
                  <Text style={styles.roleChipGreenText}>{employee.role || "employee"}</Text>
                </View>
              </View>
              <Text style={styles.emailText}>{employee.email}</Text>
            </View>
          </View>

          <View style={styles.summaryStrip}>
            <Text style={styles.summaryStripText}>
              Server-aggregated performance data from <Text style={styles.summaryStripStrong}>{intel?.summary?.totalCalls ?? 0}</Text> calls handled.
            </Text>
          </View>

          {intel?.summary?.latestPerformanceSummary ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardTop}>
                <View style={styles.summaryIconWrap}>
                  <Ionicons name="star-outline" size={16} color="#a5b4fc" />
                </View>
                <Text style={styles.summaryCardTitle}>Overall Agent Performance Summary</Text>
              </View>
              <Text style={styles.summaryCardText}>{intel.summary.latestPerformanceSummary}</Text>
            </View>
          ) : null}

          <View style={styles.statsGrid}>
            <StatCard
              iconName="call-outline"
              label="Calls Handled"
              value={intel?.summary?.totalCalls ?? 0}
              gradientColors={["#fb923c", "#8B5CF6"]}
            />
            <StatCard
              iconName="trending-up-outline"
              label="Avg Deal Hit Rate"
              value={`${intel?.summary?.avgDealProbability ?? 0}%`}
              gradientColors={["#8B5CF6", "#D946EF"]}
            />
            <StatCard
              iconName="happy-outline"
              label="Call Atmosphere"
              value={sentimentLabel(intel?.summary?.sentiment?.dominant)}
              gradientColors={["#00D4AA", "#06B6D4"]}
            />
            <StatCard
              iconName="star-outline"
              label="Agent Rating"
              value={`${intel?.summary?.avgRepRating ?? 0}/10`}
              gradientColors={["#10B981", "#84CC16"]}
            />
            <StatCard
              iconName="people-outline"
              label="Customer Engagement"
              value={`${intel?.summary?.avgCustomerEngagement ?? 0}/10`}
              gradientColors={["#06B6D4", "#3B82F6"]}
            />
          </View>

          <View style={styles.twoColWrap}>
            <SectionCard
              title="Call Sentiment History"
              subtitle="What this employee encounters most often"
              badge={`${intel?.summary?.sentiment?.positive ?? 0} positive`}
              badgeColor="#34d399"
            >
              <View style={styles.sentimentStack}>
                <ProgressRow
                  label="Positive"
                  count={intel?.summary?.sentiment?.positive ?? 0}
                  maxCount={Math.max(intel?.summary?.sentiment?.positive ?? 0, intel?.summary?.sentiment?.negative ?? 0, intel?.summary?.sentiment?.neutral ?? 0, 1)}
                  color="#00D4AA"
                  tone="positive"
                />
                <ProgressRow
                  label="Neutral"
                  count={intel?.summary?.sentiment?.neutral ?? 0}
                  maxCount={Math.max(intel?.summary?.sentiment?.positive ?? 0, intel?.summary?.sentiment?.negative ?? 0, intel?.summary?.sentiment?.neutral ?? 0, 1)}
                  color="#F59E0B"
                />
                <ProgressRow
                  label="Negative"
                  count={intel?.summary?.sentiment?.negative ?? 0}
                  maxCount={Math.max(intel?.summary?.sentiment?.positive ?? 0, intel?.summary?.sentiment?.negative ?? 0, intel?.summary?.sentiment?.neutral ?? 0, 1)}
                  color="#FB7185"
                  tone="negative"
                />
              </View>
            </SectionCard>

            <SectionCard
              title="Call Type Handled"
              subtitle="Conversation categories seen in the agent’s history"
              badge={`${intel?.summary?.callTypeDistribution?.length ?? 0} types`}
              badgeColor="#a78bfa"
            >
              {(intel?.summary?.callTypeDistribution || []).length > 0 ? (
                <View style={styles.progressList}>
                  {intel.summary.callTypeDistribution.map((item, index) => (
                    <ProgressRow
                      key={`${item.type}-${index}`}
                      label={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      count={item.count}
                      maxCount={intel.summary.callTypeDistribution[0].count}
                      color="#8B5CF6"
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyInline}>No call type data recorded.</Text>
              )}
            </SectionCard>
          </View>

          <View style={styles.twoColWrap}>
            <SectionCard
              title="Agent Strengths"
              subtitle="What they do extremely well"
              badge={`${intel?.insights?.strengths?.length ?? 0} tracked`}
              badgeColor="#34d399"
            >
              {(intel?.insights?.strengths || []).length > 0 ? (
                <View style={styles.insightList}>
                  {intel.insights.strengths.slice(0, 5).map((item, index) => (
                    <InsightRow
                      key={`strength-${index}`}
                      text={item.text}
                      count={item.count}
                      maxCount={intel.insights.strengths[0].count}
                      color="#00D4AA"
                      tone="positive"
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyInline}>Not enough data to determine strengths.</Text>
              )}
            </SectionCard>

            <SectionCard
              title="Areas For Improvement"
              subtitle="Skills slowing deals down"
              badge={`${intel?.insights?.weaknesses?.length ?? 0} tracked`}
              badgeColor="#fbbf24"
            >
              {(intel?.insights?.weaknesses || []).length > 0 ? (
                <View style={styles.insightList}>
                  {intel.insights.weaknesses.slice(0, 5).map((item, index) => (
                    <InsightRow
                      key={`weakness-${index}`}
                      text={item.text}
                      count={item.count}
                      maxCount={intel.insights.weaknesses[0].count}
                      color="#F59E0B"
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyInline}>No flagged areas for improvement.</Text>
              )}
            </SectionCard>
          </View>

          {(intel?.insights?.missedOpportunities || []).length > 0 ? (
            <SectionCard
              title="Missed Opportunities"
              subtitle="Moments where the agent could have dug deeper or closed"
              badge={`${intel.insights.missedOpportunities.length} found`}
              badgeColor="#fb7185"
            >
              <View style={styles.insightGrid}>
                {intel.insights.missedOpportunities.slice(0, 8).map((item, index) => (
                  <InsightRow
                    key={`missed-${index}`}
                    text={item.text}
                    count={item.count}
                    maxCount={intel.insights.missedOpportunities[0].count}
                    color="#FB7185"
                    tone="negative"
                  />
                ))}
              </View>
            </SectionCard>
          ) : null}

          {(intel?.recentCalls || []).length > 0 ? (
            <SectionCard
              title="Recent Conversational Output"
              subtitle="Latest calls logged under this agent"
              badge={`${intel.recentCalls.length} calls`}
              badgeColor="#ea580c"
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScrollContent}>
                <View style={styles.recentCallsList}>
                  <View style={styles.recentHeaderRow}>
                    <Text style={styles.recentHeaderCellWide}>Call Title</Text>
                    <Text style={styles.recentHeaderCell}>Product</Text>
                    <Text style={styles.recentHeaderCell}>Customer</Text>
                    <Text style={styles.recentHeaderCell}>Sentiment</Text>
                    <Text style={styles.recentHeaderCell}>Deal %</Text>
                    <Text style={styles.recentHeaderCell}>Date</Text>
                  </View>
                  {intel.recentCalls.map((call) => {
                    const tone = (call.sentiment || "neutral").toLowerCase();
                    return (
                      <View key={call.callId || call.createdAt} style={styles.recentRow}>
                        <Text style={styles.recentCallWide} numberOfLines={1}>{call.callTitle || "Untitled Call"}</Text>
                        <Text style={styles.recentCallCell} numberOfLines={1}>{call.productName || "—"}</Text>
                        <Text style={styles.recentCallCell} numberOfLines={1}>{call.customerName || "—"}</Text>
                        <View style={styles.recentCallCell}>
                          <View style={[styles.sentimentPill, tone === "positive" ? styles.sentimentPositive : tone === "negative" ? styles.sentimentNegative : styles.sentimentNeutral]}>
                            <Text style={styles.sentimentText}>{sentimentLabel(tone)}</Text>
                          </View>
                        </View>
                        <Text style={styles.recentCallCellStrong}>{call.dealProbability ?? 0}%</Text>
                        <Text style={styles.recentCallCell}>{call.createdAt ? new Date(call.createdAt).toLocaleDateString() : "—"}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </SectionCard>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
};

export default function EmployeesScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    designation: "",
  });
  const [formError, setFormError] = useState("");

  const loadEmployees = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");

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

      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch {}
      }

      const response = await usersApi.getEmployees(storedToken);
      setEmployees(response.employees || []);
    } catch (err) {
      setError(err.message || "Failed to load employees. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEmployees(true);
  };

  const handleAddEmployee = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError("Name, email, and password are required.");
      return;
    }

    setAdding(true);
    setFormError("");

    try {
      await usersApi.addEmployee(
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          designation: formData.designation.trim(),
        },
        token
      );
      setModalOpen(false);
      setFormData({ name: "", email: "", password: "", designation: "" });
      loadEmployees(true);
    } catch (err) {
      setFormError(err.message || "Failed to add employee.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#fff7ed", "#ffffff"]} style={styles.loadingWrapInner}>
          <ActivityIndicator size="large" color="#fb923c" />
          <Text style={styles.loadingText}>Loading team...</Text>
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
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn} activeOpacity={0.7}>
            <Ionicons name="menu" size={22} color="#6b7280" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Company Employees</Text>
            <Text style={styles.subtitle}>Manage team members and workspace access.</Text>
          </View>
          {user?.role === "admin" && (
            <TouchableOpacity onPress={() => setModalOpen(true)} style={styles.addBtn} activeOpacity={0.8}>
              <Ionicons name="add" size={20} color="#c7d2fe" />
            </TouchableOpacity>
          )}
        </View>

        {selectedEmployee ? (
          <EmployeeIntelligenceView
            employee={selectedEmployee}
            token={token}
            onBack={() => setSelectedEmployee(null)}
          />
        ) : user?.role !== "admin" ? (
          <AccessDenied />
        ) : error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : employees.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={50} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Employees Yet</Text>
            <Text style={styles.emptySub}>Add your first team member to start collaborating.</Text>
          </View>
        ) : (
          <FlatList
            data={employees}
            keyExtractor={(item, idx) => String(item._id || idx)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fb923c" colors={["#fb923c"]} />
            }
            renderItem={({ item }) => {
              const isAdmin = (item.role || "").toLowerCase() === "admin";
              return (
                <TouchableOpacity
                  style={styles.employeeCard}
                  activeOpacity={0.82}
                  onPress={() => setSelectedEmployee(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.empName}>{item.name}</Text>
                    <Text style={styles.empSub}>{item.designation || "Sales Representative"}</Text>
                    <Text style={styles.empEmail}>{item.email}</Text>
                  </View>
                  <View style={styles.rightWrap}>
                    <Text style={[styles.rolePill, isAdmin ? styles.roleAdmin : styles.roleEmployee]}>
                      {item.role || "employee"}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color="#ea580c" style={{ marginTop: 8 }} />
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </LinearGradient>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Add New Employee</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.modalClose}>
                <Ionicons name="close" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {!!formError && (
              <View style={styles.errorBannerMini}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => {
                setFormData((p) => ({ ...p, name: text }));
                setFormError("");
              }}
              placeholder="Jane Doe"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => {
                setFormData((p) => ({ ...p, email: text }));
                setFormError("");
              }}
              placeholder="jane@company.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Designation</Text>
            <TextInput
              style={styles.input}
              value={formData.designation}
              onChangeText={(text) => {
                setFormData((p) => ({ ...p, designation: text }));
                setFormError("");
              }}
              placeholder="e.g. Senior Account Executive"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Temporary Password</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => {
                setFormData((p) => ({ ...p, password: text }));
                setFormError("");
              }}
              placeholder="Enter password"
              placeholderTextColor="#64748b"
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setModalOpen(false)} disabled={adding}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, adding && styles.btnDisabled]} onPress={handleAddEmployee} disabled={adding}>
                {adding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff7ed" },
  flex: { flex: 1 },

  loadingWrapInner: { flex: 1, justifyContent: "center", alignItems: "center" },
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
    backgroundColor: "rgba(249,115,22,0.10)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(249,115,22,0.14)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.4)",
  },
  title: { color: "#111827", fontSize: 22, fontWeight: "900" },
  subtitle: { color: "#6b7280", marginTop: 2, fontSize: 12 },

  listContent: { paddingHorizontal: 16, paddingBottom: 34, paddingTop: 4 },

  employeeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#ffffff",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  empName: { color: "#111827", fontSize: 15, fontWeight: "800" },
  empSub: { color: "#374151", fontSize: 12, marginTop: 3 },
  empEmail: { color: "#6b7280", fontSize: 12, marginTop: 3 },
  rightWrap: { alignItems: "flex-end" },
  rolePill: {
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  roleAdmin: {
    color: "#fcd34d",
    borderColor: "rgba(251,191,36,0.35)",
    backgroundColor: "rgba(251,191,36,0.12)",
  },
  roleEmployee: {
    color: "#047857",
    borderColor: "rgba(52,211,153,0.35)",
    backgroundColor: "rgba(52,211,153,0.12)",
  },

  agentPill: {
    alignSelf: "flex-start",
    marginBottom: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.3)",
    backgroundColor: "rgba(99,102,241,0.14)",
    color: "#ea580c",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },

  profileHeaderCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#ffffff",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.24)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.35)",
  },
  avatarLargeText: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
  },
  nameLarge: { color: "#111827", fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 7, marginBottom: 7 },
  roleChipSoft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.10)",
    backgroundColor: "rgba(249,115,22,0.07)",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  roleChipSoftText: { color: "#374151", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  roleChipGreen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.35)",
    backgroundColor: "rgba(52,211,153,0.12)",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  roleChipGreenText: { color: "#047857", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  emailText: { color: "#6b7280", fontSize: 12 },

  summaryStrip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.08)",
    backgroundColor: "rgba(249,115,22,0.06)",
    padding: 12,
  },
  summaryStripText: { color: "#374151", fontSize: 13, lineHeight: 19 },
  summaryStripStrong: { color: "#111827", fontWeight: "900" },

  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.18)",
    backgroundColor: "#ffffff",
    padding: 14,
  },
  summaryCardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  summaryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.14)",
  },
  summaryCardTitle: { color: "#c4b5fd", fontSize: 11, fontWeight: "900", textTransform: "uppercase", flex: 1 },
  summaryCardText: { marginTop: 8, color: "#111827", fontSize: 13, lineHeight: 19 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#ffffff",
    padding: 14,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statLabel: { color: "#64748b", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  statValue: { color: "#111827", fontSize: 18, fontWeight: "900", marginTop: 4 },
  statSub: { color: "#6b7280", fontSize: 11, marginTop: 4 },

  twoColWrap: { gap: 12 },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#ffffff",
    padding: 14,
  },
  sectionHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  sectionTitle: { color: "#111827", fontSize: 15, fontWeight: "900" },
  sectionSubtitle: { marginTop: 2, color: "#64748b", fontSize: 11, lineHeight: 16 },
  sectionBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  sectionBadgeText: { fontSize: 10, fontWeight: "900" },
  sectionBody: { gap: 10 },

  sentimentStack: { gap: 10 },
  progressList: { gap: 10 },
  progressItem: { gap: 6 },
  progressTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  progressLabel: { color: "#374151", fontSize: 12, fontWeight: "700", flex: 1 },
  progressBg: {
    width: "100%",
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(249,115,22,0.08)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 999 },
  progressBgThin: {
    width: "100%",
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(249,115,22,0.08)",
    overflow: "hidden",
  },
  progressFillThin: { height: "100%", borderRadius: 999 },

  miniPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  miniPositive: { borderColor: "rgba(52,211,153,0.35)", backgroundColor: "rgba(52,211,153,0.12)" },
  miniNegative: { borderColor: "rgba(244,63,94,0.35)", backgroundColor: "rgba(244,63,94,0.12)" },
  miniNeutral: { borderColor: "rgba(251,191,36,0.35)", backgroundColor: "rgba(251,191,36,0.12)" },
  miniPillText: { color: "#374151", fontSize: 10, fontWeight: "800" },

  insightList: { gap: 10 },
  insightGrid: { gap: 10 },
  insightRow: { gap: 7 },
  insightRowTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  insightText: { flex: 1, color: "#111827", fontSize: 12, fontWeight: "700", lineHeight: 17 },

  recentCallsList: { gap: 8 },
  recentScrollContent: { paddingBottom: 2 },
  recentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 720,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(249,115,22,0.08)",
  },
  recentHeaderCellWide: { flex: 1.3, color: "#64748b", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  recentHeaderCell: { flex: 1, color: "#64748b", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 720,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(249,115,22,0.07)",
  },
  recentCallWide: { flex: 1.3, color: "#111827", fontSize: 12, fontWeight: "800" },
  recentCallCell: { flex: 1, color: "#374151", fontSize: 11 },
  recentCallCellStrong: { flex: 1, color: "#111827", fontSize: 11, fontWeight: "800" },
  sentimentPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sentimentPositive: { backgroundColor: "rgba(52,211,153,0.12)", borderColor: "rgba(52,211,153,0.35)" },
  sentimentNegative: { backgroundColor: "rgba(244,63,94,0.12)", borderColor: "rgba(244,63,94,0.35)" },
  sentimentNeutral: { backgroundColor: "rgba(251,191,36,0.12)", borderColor: "rgba(251,191,36,0.35)" },
  sentimentText: { color: "#111827", fontSize: 10, fontWeight: "800" },

  emptyInline: { color: "#64748b", fontSize: 12, lineHeight: 18 },
  errorWrap: {
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.3)",
    backgroundColor: "rgba(244,63,94,0.12)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorWrapText: { color: "#fca5a5", fontSize: 12, flex: 1 },

  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30, gap: 8 },
  emptyTitle: { color: "#111827", fontSize: 18, fontWeight: "800" },
  emptySub: { color: "#9ca3af", fontSize: 13, textAlign: "center" },

  errorBanner: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.35)",
    backgroundColor: "rgba(244,63,94,0.12)",
    padding: 10,
  },
  errorBannerMini: {
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.35)",
    backgroundColor: "rgba(244,63,94,0.12)",
    padding: 8,
  },
  errorText: { color: "#fda4af", fontSize: 12 },

  detailHeader: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(249,115,22,0.08)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backBtnText: { color: "#374151", fontSize: 12, fontWeight: "700" },
  detailTitle: { flex: 1, color: "#111827", fontSize: 15, fontWeight: "800" },
  detailContent: { paddingHorizontal: 16, paddingBottom: 28, gap: 12 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#ffffff",
    padding: 14,
  },
  cardTitle: { color: "#111827", fontSize: 14, fontWeight: "800", marginBottom: 8 },
  detailLine: { color: "#374151", fontSize: 12, marginBottom: 6, lineHeight: 18 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
    backgroundColor: "#121527",
    padding: 14,
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: { color: "#111827", fontSize: 18, fontWeight: "800" },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.07)",
  },
  label: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 5,
    marginTop: 6,
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "rgba(249,115,22,0.07)",
    color: "#111827",
    paddingHorizontal: 12,
    fontSize: 13,
  },
  modalActions: { marginTop: 12, flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(249,115,22,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: { color: "#374151", fontSize: 12, fontWeight: "700" },
  primaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f97316",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: { color: "#111827", fontSize: 12, fontWeight: "700" },
  btnDisabled: { opacity: 0.55 },
});
