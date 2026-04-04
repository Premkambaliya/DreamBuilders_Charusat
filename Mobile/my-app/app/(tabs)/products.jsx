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
import { productIntelligenceApi, productsApi } from "../../api/api";
import MobileSidebar from "../../components/MobileSidebar";

const AccessDenied = () => (
  <View style={styles.emptyWrap}>
    <Ionicons name="shield-outline" size={52} color="#f87171" />
    <Text style={styles.emptyTitle}>Access Denied</Text>
    <Text style={styles.emptySub}>Only company administrators can manage products.</Text>
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

const SectionCard = ({ title, subtitle, badge, badgeColor = "#818cf8", children }) => (
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

const ProductIntelligenceView = ({ product, token, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [intel, setIntel] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await productIntelligenceApi.getProductIntelligence(product._id, token);
        setIntel(data);
        if (!data || data.success === false) {
          setError("Could not load product intelligence.");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [product?._id, token]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color="#cbd5e1" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.agentPill}>Product Intelligence</Text>
          <Text style={styles.detailTitle} numberOfLines={1}>{product.productName}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrapInner}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading product intelligence...</Text>
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
              <Ionicons name="cube-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nameLarge}>{product.productName}</Text>
              {product.category ? (
                <View style={styles.roleRow}>
                  <View style={styles.roleChipSoft}>
                    <Ionicons name="pricetag-outline" size={11} color="#cbd5e1" />
                    <Text style={styles.roleChipSoftText}>{product.category}</Text>
                  </View>
                </View>
              ) : null}
              <Text style={styles.emailText} numberOfLines={3}>
                {product.description || "No description provided."}
              </Text>
            </View>
          </View>

          <View style={styles.summaryStrip}>
            <Text style={styles.summaryStripText}>
              Server-aggregated intelligence from <Text style={styles.summaryStripStrong}>{intel?.summary?.totalCalls ?? 0}</Text> related conversations.
            </Text>
          </View>

          {intel?.summary?.overallProductRating != null ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardTop}>
                <View style={styles.summaryIconWrap}>
                  <Ionicons name="star-outline" size={16} color="#a5b4fc" />
                </View>
                <Text style={styles.summaryCardTitle}>Overall Product Intelligence Summary</Text>
              </View>
              <Text style={styles.summaryCardText}>
                This product has an overall rating of <Text style={styles.summaryCardStrong}>{intel.summary.overallProductRating}/10</Text>. It is shaped by sentiment, rep feedback, engagement and deal momentum across all related conversations.
              </Text>
            </View>
          ) : null}

          <View style={styles.statsGrid}>
            <StatCard iconName="call-outline" label="Total Calls" value={intel?.summary?.totalCalls ?? 0} gradientColors={["#6C63FF", "#8B5CF6"]} />
            <StatCard iconName="trending-up-outline" label="Avg Deal Prob." value={`${intel?.summary?.avgDealProbability ?? 0}%`} gradientColors={["#8B5CF6", "#D946EF"]} />
            <StatCard iconName="happy-outline" label="Overall Sentiment" value={sentimentLabel(intel?.summary?.sentiment?.dominant)} gradientColors={["#FB923C", "#EF4444"]} />
            <StatCard iconName="star-outline" label="Product Rating" value={`${intel?.summary?.overallProductRating ?? 0}/10`} gradientColors={["#F59E0B", "#EF4444"]} />
            <StatCard iconName="people-outline" label="Avg Rep Rating" value={`${intel?.summary?.avgRepRating ?? 0}/10`} gradientColors={["#10B981", "#84CC16"]} />
            <StatCard iconName="analytics-outline" label="Engagement" value={`${intel?.summary?.avgCustomerEngagement ?? 0}/10`} gradientColors={["#06B6D4", "#3B82F6"]} />
          </View>

          <View style={styles.twoColWrap}>
            <SectionCard
              title="Sentiment Distribution"
              subtitle="Overall tone across related conversations"
              badge={sentimentLabel(intel?.summary?.sentiment?.dominant)}
              badgeColor={intel?.summary?.sentiment?.dominant === "negative" ? "#fb7185" : intel?.summary?.sentiment?.dominant === "positive" ? "#34d399" : "#fbbf24"}
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
              title="Call Type Breakdown"
              subtitle="Conversation categories tied to this product"
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
                <Text style={styles.emptyInline}>No call type data available.</Text>
              )}
            </SectionCard>
          </View>

          <View style={styles.twoColWrap}>
            <SectionCard title="What Customers Love" subtitle="Top discussed positive points" badge={`${intel?.insights?.topPositivePoints?.length ?? 0} themes`} badgeColor="#34d399">
              {(intel?.insights?.topPositivePoints || []).length > 0 ? (
                <View style={styles.insightList}>
                  {intel.insights.topPositivePoints.slice(0, 5).map((item, index) => (
                    <InsightRow key={`positive-${index}`} text={item.text} count={item.count} maxCount={intel.insights.topPositivePoints[0].count} color="#00D4AA" tone="positive" />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyInline}>No positive themes captured yet.</Text>
              )}
            </SectionCard>

            <SectionCard title="Main Objections" subtitle="Recurring friction and pushbacks" badge={`${intel?.insights?.topObjections?.length ?? 0} risks`} badgeColor="#fb7185">
              {(intel?.insights?.topObjections || []).length > 0 ? (
                <View style={styles.insightList}>
                  {intel.insights.topObjections.slice(0, 5).map((item, index) => (
                    <InsightRow key={`objection-${index}`} text={item.text} count={item.count} maxCount={intel.insights.topObjections[0].count} color="#FB923C" tone="negative" />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyInline}>No objections on record.</Text>
              )}
            </SectionCard>
          </View>

          {(intel?.insights?.topBuyingSignals || []).length > 0 ? (
            <SectionCard title="Buying Signals Detected" subtitle="Purchase intent indicators across conversations" badge={`${intel.insights.topBuyingSignals.length} signals`} badgeColor="#06b6d4">
              <View style={styles.insightGrid}>
                {intel.insights.topBuyingSignals.slice(0, 8).map((item, index) => (
                  <InsightRow key={`signal-${index}`} text={item.text} count={item.count} maxCount={intel.insights.topBuyingSignals[0].count} color="#00D4AA" tone="positive" />
                ))}
              </View>
            </SectionCard>
          ) : null}

          {(intel?.insights?.topImprovements || []).length > 0 ? (
            <SectionCard title="Suggested Product Improvements" subtitle="Most requested changes from customer feedback" badge={`${intel.insights.topImprovements.length} requests`} badgeColor="#fbbf24">
              <View style={styles.insightGrid}>
                {intel.insights.topImprovements.slice(0, 8).map((item, index) => (
                  <InsightRow key={`improvement-${index}`} text={item.text} count={item.count} maxCount={intel.insights.topImprovements[0].count} color="#8B5CF6" />
                ))}
              </View>
            </SectionCard>
          ) : null}

          {(intel?.insights?.topCompetitors || []).length > 0 || (intel?.insights?.competitorAdvantages || []).length > 0 ? (
            <View style={styles.twoColWrap}>
              <SectionCard title="Competitor Mentions" subtitle="How often alternatives were discussed" badge={`${intel?.insights?.topCompetitors?.length ?? 0} competitors`} badgeColor="#f59e0b">
                {(intel?.insights?.topCompetitors || []).length > 0 ? (
                  <View style={styles.insightList}>
                    {intel.insights.topCompetitors.map((item, index) => (
                      <InsightRow key={`competitor-${index}`} text={item.text} count={item.count} maxCount={intel.insights.topCompetitors[0].count} color="#FFB347" />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyInline}>No competitor mentions.</Text>
                )}
              </SectionCard>

              <SectionCard title="Competitor Advantages" subtitle="Why customers considered alternatives" badge={`${intel?.insights?.competitorAdvantages?.length ?? 0} reasons`} badgeColor="#fb7185">
                {(intel?.insights?.competitorAdvantages || []).length > 0 ? (
                  <View style={styles.insightList}>
                    {intel.insights.competitorAdvantages.map((item, index) => (
                      <InsightRow key={`advantage-${index}`} text={item.text} count={item.count} maxCount={intel.insights.competitorAdvantages[0].count} color="#FB7185" tone="negative" />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyInline}>No competitor advantages recorded.</Text>
                )}
              </SectionCard>
            </View>
          ) : null}

          {(intel?.recentCalls || []).length > 0 ? (
            <SectionCard title="Recent Conversations" subtitle="Latest calls related to this product" badge={`${intel.recentCalls.length} calls`} badgeColor="#818cf8">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScrollContent}>
                <View style={styles.recentCallsList}>
                  <View style={styles.recentHeaderRow}>
                    <Text style={styles.recentHeaderCellWide}>Call</Text>
                    <Text style={styles.recentHeaderCell}>Employee</Text>
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
                        <Text style={styles.recentCallCell} numberOfLines={1}>{call.employeeName || "—"}</Text>
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

export default function ProductsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    description: "",
  });
  const [formError, setFormError] = useState("");

  const loadProducts = useCallback(async (isRefresh = false) => {
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

      const response = await productsApi.getProducts(storedToken);
      setProducts(response.products || []);
    } catch (err) {
      setError(err.message || "Failed to load products. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(true);
  };

  const handleAddProduct = async () => {
    if (!formData.productName.trim()) {
      setFormError("Product name is required.");
      return;
    }

    setAdding(true);
    setFormError("");

    try {
      await productsApi.addProduct(
        {
          productName: formData.productName.trim(),
          category: formData.category.trim(),
          description: formData.description.trim(),
        },
        token
      );
      setModalOpen(false);
      setFormData({ productName: "", category: "", description: "" });
      loadProducts(true);
    } catch (err) {
      setFormError(err.message || "Failed to add product.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#090b13", "#0f1222"]} style={styles.loadingWrapInner}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading products...</Text>
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
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn} activeOpacity={0.7}>
            <Ionicons name="menu" size={22} color="#d1d5db" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Product Portfolio</Text>
            <Text style={styles.subtitle}>Manage products for product-level sales intelligence.</Text>
          </View>
          {user?.role === "admin" && (
            <TouchableOpacity onPress={() => setModalOpen(true)} style={styles.addBtn} activeOpacity={0.8}>
              <Ionicons name="add" size={20} color="#c7d2fe" />
            </TouchableOpacity>
          )}
        </View>

        {selectedProduct ? (
          <ProductIntelligenceView product={selectedProduct} token={token} onBack={() => setSelectedProduct(null)} />
        ) : user?.role !== "admin" ? (
          <AccessDenied />
        ) : error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="archive-outline" size={50} color="#fbbf24" />
            <Text style={styles.emptyTitle}>No Products Yet</Text>
            <Text style={styles.emptySub}>Add your first product to track product intelligence.</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item, idx) => String(item._id || idx)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" colors={["#6C63FF"]} />
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productCard} activeOpacity={0.8} onPress={() => setSelectedProduct(item)}>
                <View style={styles.productHead}>
                  <View style={styles.productIconWrap}>
                    <Ionicons name="pricetag-outline" size={16} color="#fbbf24" />
                  </View>
                  <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
                </View>

                {!!item.category && <Text style={styles.categoryPill}>{item.category}</Text>}

                <Text style={styles.productDesc} numberOfLines={3}>
                  {item.description || "No description provided."}
                </Text>

                <View style={styles.productFoot}>
                  <Text style={styles.productFootText}>View Intelligence</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fbbf24" />
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </LinearGradient>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Add New Product</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.modalClose}>
                <Ionicons name="close" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {!!formError && (
              <View style={styles.errorBannerMini}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              value={formData.productName}
              onChangeText={(text) => {
                setFormData((p) => ({ ...p, productName: text }));
                setFormError("");
              }}
              placeholder="e.g. Dream CRM Pro"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={formData.category}
              onChangeText={(text) => {
                setFormData((p) => ({ ...p, category: text }));
                setFormError("");
              }}
              placeholder="e.g. Enterprise Software"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Short Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => {
                setFormData((p) => ({ ...p, description: text }));
                setFormError("");
              }}
              placeholder="Main value proposition..."
              placeholderTextColor="#64748b"
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setModalOpen(false)} disabled={adding}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, adding && styles.btnDisabled]} onPress={handleAddProduct} disabled={adding}>
                {adding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryBtnText}>Add Product</Text>}
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
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(99,102,241,0.2)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.4)",
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "900" },
  subtitle: { color: "#94a3b8", marginTop: 2, fontSize: 12 },

  listContent: { paddingHorizontal: 16, paddingBottom: 34, paddingTop: 4 },

  productCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(18,21,39,0.92)",
    padding: 14,
  },
  productHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  productIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  productName: { color: "#fff", fontSize: 16, fontWeight: "800", flex: 1 },
  categoryPill: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.35)",
    backgroundColor: "rgba(99,102,241,0.14)",
    color: "#a5b4fc",
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  productDesc: { marginTop: 10, color: "#94a3b8", fontSize: 12, lineHeight: 18 },
  productFoot: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productFootText: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },

  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30, gap: 8 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
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
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backBtnText: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },
  detailTitle: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "800" },
  detailContent: { paddingHorizontal: 16, paddingBottom: 28, gap: 12 },
  agentPill: {
    alignSelf: "flex-start",
    marginBottom: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.3)",
    backgroundColor: "rgba(99,102,241,0.14)",
    color: "#c7d2fe",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
  profileHeaderCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(18,21,39,0.92)",
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
  nameLarge: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 7, marginBottom: 7 },
  roleChipSoft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  roleChipSoftText: { color: "#cbd5e1", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  emailText: { color: "#94a3b8", fontSize: 12, lineHeight: 18 },

  summaryStrip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12,
  },
  summaryStripText: { color: "#cbd5e1", fontSize: 13, lineHeight: 19 },
  summaryStripStrong: { color: "#fff", fontWeight: "900" },

  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.18)",
    backgroundColor: "rgba(18,21,39,0.92)",
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
  summaryCardStrong: { color: "#fff", fontWeight: "900" },
  summaryCardText: { marginTop: 8, color: "#e2e8f0", fontSize: 13, lineHeight: 19 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(18,21,39,0.92)",
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
  statValue: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 4 },
  statSub: { color: "#94a3b8", fontSize: 11, marginTop: 4 },

  twoColWrap: { gap: 12 },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(18,21,39,0.92)",
    padding: 14,
  },
  sectionHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "900" },
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
  progressLabel: { color: "#cbd5e1", fontSize: 12, fontWeight: "700", flex: 1 },
  progressBg: {
    width: "100%",
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 999 },
  progressBgThin: {
    width: "100%",
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
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
  miniPillText: { color: "#cbd5e1", fontSize: 10, fontWeight: "800" },

  insightList: { gap: 10 },
  insightGrid: { gap: 10 },
  insightRow: { gap: 7 },
  insightRowTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  insightText: { flex: 1, color: "#e2e8f0", fontSize: 12, fontWeight: "700", lineHeight: 17 },

  recentCallsList: { gap: 8 },
  recentScrollContent: { paddingBottom: 2 },
  recentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 720,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
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
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  recentCallWide: { flex: 1.3, color: "#e2e8f0", fontSize: 12, fontWeight: "800" },
  recentCallCell: { flex: 1, color: "#cbd5e1", fontSize: 11 },
  recentCallCellStrong: { flex: 1, color: "#fff", fontSize: 11, fontWeight: "800" },
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
  sentimentText: { color: "#e2e8f0", fontSize: 10, fontWeight: "800" },

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

  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(18,21,39,0.92)",
    padding: 14,
  },
  cardTitle: { color: "#fff", fontSize: 14, fontWeight: "800", marginBottom: 8 },
  detailLine: { color: "#cbd5e1", fontSize: 12, marginBottom: 6, lineHeight: 18 },

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
    backgroundColor: "#121527",
    padding: 14,
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  label: {
    color: "#94a3b8",
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
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#fff",
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textArea: { height: 90, paddingTop: 10 },
  modalActions: { marginTop: 12, flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },
  primaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  btnDisabled: { opacity: 0.55 },
});
