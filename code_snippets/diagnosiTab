/**
 * DiagnosisTab — Portfolio Excerpt
 *
 * Highlights:
 *  1. DiagnosisCard      — typed card component with collapsible AI insight section
 *  2. useInsightFlow     — custom hook: multi-select, retry logic, abort on unmount,
 *                          save-to-one vs save-to-all
 *  3. InsightPopup       — modal with skeleton loading state + regenerate
 *
 * Omitted for brevity: filter dropdown, delete/edit modals, full StyleSheet.
 * Full component available on request.
 */

import React, { useState, useRef } from "react";
import {
  View, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal, Alert,
} from "react-native";
import { Card } from "react-native-paper";
import Text from "@/components/Custom/Text";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

// ── Replace with your own API base URL ────────────────────────────────────────
const AI_BASE_URL = "https://your-api-base-url.example.com/";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Diagnosis {
  encryptedID: string;
  diagnosisType: "principle" | "primary" | "secondary" | "tertiary" | "surgical";
  description: string;
  date: string;
  category: string;
  icD10Code: string;
  aiInsight: string;
  userDiagnosis: string;
  lastModifiedDate: string;
}

// Maps diagnosisType string → API enum value
const DIAGNOSIS_TYPE_MAP: Record<string, string> = {
  principle: "0", primary: "1", secondary: "2", tertiary: "3", surgical: "4",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getDiagnosisIcon = (type: string): string => ({
  principle: "heart-pulse",
  primary:   "stethoscope",
  secondary: "pill",
  tertiary:  "clipboard-pulse",
  surgical:  "needle",
}[type?.toLowerCase()] ?? "medical-bag");

const getDiagnosisColor = (type: string): { background: string; text: string } => ({
  principle: { background: "#dbeafe", text: "#1e40af" },
  primary:   { background: "#f0fdf4", text: "#166534" },
  secondary: { background: "#fef9c3", text: "#854d0e" },
  tertiary:  { background: "#fae8ff", text: "#7e22ce" },
  surgical:  { background: "#fff7ed", text: "#c2410c" },
}[type?.toLowerCase()] ?? { background: "#f3f4f6", text: "#374151" });

/** Strips markdown bold/italic/heading syntax from AI-generated text */
const cleanText = (text: string) =>
  text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/#{1,6}\s/g, "").trim();

/** Parses insight into typed lines so bullets render differently from prose */
const formatInsight = (text: string): { type: "bullet" | "text"; content: string }[] =>
  text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map(l =>
      /^[-•*]/.test(l)
        ? { type: "bullet" as const, content: l.replace(/^[-•*]\s*/, "") }
        : { type: "text" as const, content: l }
    );

// ── InsightContent ─────────────────────────────────────────────────────────────
// Renders formatted insight with dash-style bullets and spacing

const InsightContent: React.FC<{ text: string; textStyle: any }> = ({ text, textStyle }) => (
  <>
    {formatInsight(text).map((item, i) =>
      item.type === "bullet" ? (
        <View key={i} style={styles.bulletRow}>
          <Text style={[textStyle, styles.bulletDash]}>{" - "}</Text>
          <Text style={[textStyle, styles.bulletText]}>{item.content}</Text>
        </View>
      ) : (
        <Text key={i} style={[textStyle, styles.plainLine]}>{item.content}</Text>
      )
    )}
  </>
);

// ── DiagnosisCard ──────────────────────────────────────────────────────────────

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  editLoading: string | null;
  deleteLoading: string | null;
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

const DiagnosisCard: React.FC<DiagnosisCardProps> = ({
  diagnosis, onEdit, onDelete,
  editLoading, deleteLoading,
  selectMode, isSelected, onToggleSelect,
}) => {
  const colors        = getDiagnosisColor(diagnosis.diagnosisType);
  const isEditLoading = editLoading   === diagnosis.encryptedID;
  const isDelLoading  = deleteLoading === diagnosis.encryptedID;
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={selectMode ? 0.7 : 1}
      onPress={selectMode ? () => onToggleSelect(diagnosis.encryptedID) : undefined}
    >
      <Card style={[styles.card, isSelected && styles.cardSelected]}>
        {isSelected && <View style={styles.selectedStrip} />}

        <Card.Content>
          {/* ── Type badge + optional select circle ── */}
          <View style={styles.cardHeader}>
            <View style={[styles.typeBadge, { backgroundColor: colors.background }]}>
              <MaterialCommunityIcons name={getDiagnosisIcon(diagnosis.diagnosisType)} size={16} color={colors.text} />
              <Text style={[styles.typeText, { color: colors.text }]}>
                {diagnosis.diagnosisType?.charAt(0).toUpperCase() + diagnosis.diagnosisType?.slice(1)}
              </Text>
            </View>
            {selectMode && (
              <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
                {isSelected && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
              </View>
            )}
          </View>

          {/* ── Core diagnosis info ── */}
          <Text style={styles.title}>{diagnosis.category}</Text>
          <Text style={styles.description}>{diagnosis.description}</Text>
          <Text style={styles.meta}>ICD: {diagnosis.icD10Code}  |  {diagnosis.date}</Text>

          {/* ── Collapsible AI insight section ── */}
          {!!diagnosis.aiInsight && (
            <TouchableOpacity onPress={() => setExpanded(p => !p)} style={styles.insightHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialCommunityIcons name="lightbulb-outline" size={13} color="#0891b2" />
                <Text style={styles.insightHeaderText}>Insights for Wellbeing</Text>
              </View>
              <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#0891b2" />
            </TouchableOpacity>
          )}
          {!!diagnosis.aiInsight && expanded && (
            <View style={styles.insightBody}>
              <InsightContent text={diagnosis.aiInsight} textStyle={styles.insightBodyText} />
            </View>
          )}

          {/* ── Edit / Delete actions (hidden in select mode) ── */}
          {!selectMode && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.editBtn, isEditLoading && { opacity: 0.6 }]}
                onPress={() => onEdit(diagnosis.encryptedID)}
                disabled={isEditLoading}
              >
                {isEditLoading
                  ? <ActivityIndicator size="small" color="#667eea" />
                  : <MaterialCommunityIcons name="pencil-outline" size={16} color="#667eea" />}
                <Text style={styles.editBtnText}>{isEditLoading ? "Loading..." : "Edit"}</Text>
              </TouchableOpacity>

              {/* Principle diagnosis cannot be deleted */}
              {diagnosis.diagnosisType?.toLowerCase() !== "principle" && (
                <TouchableOpacity
                  style={[styles.deleteBtn, isDelLoading && { opacity: 0.6 }]}
                  onPress={() => onDelete(diagnosis.encryptedID)}
                  disabled={isDelLoading}
                >
                  {isDelLoading
                    ? <ActivityIndicator size="small" color="#dc2626" />
                    : <MaterialCommunityIcons name="trash-can-outline" size={16} color="#dc2626" />}
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

// ── useInsightFlow ─────────────────────────────────────────────────────────────
// Custom hook encapsulating: fetch-with-retry, abort controller, generate,
// regenerate, and save-to-one vs save-to-all logic.

interface InsightState {
  diagnoses: Diagnosis[];
  text: string;
}

const useInsightFlow = (
  diagnoses: Diagnosis[],
  onSaved: (updatedIDs: string[], text: string) => void,
) => {
  const [selectMode, setSelectMode]     = useState(false);
  const [selectedIDs, setSelectedIDs]   = useState<string[]>([]);
  const [insightPopup, setInsightPopup] = useState<InsightState | null>(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [saveLoading, setSaveLoading]   = useState(false);
  const abortRef                        = useRef<AbortController | null>(null);

  // Retries on 503, aborts on unmount via abortRef
  const fetchWithRetry = async (url: string, body: object, retries = 3, delay = 4000): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current?.signal,
        body: JSON.stringify(body),
      });
      if (res.ok) return res.json();
      if (res.status === 503 && i < retries - 1) {
        await new Promise<void>(r => setTimeout(r, delay));
        continue;
      }
      throw new Error(`AI error: ${res.status}`);
    }
    throw new Error("Max retries reached");
  };

  const buildPayload = (selected: Diagnosis[]) => ({
    requestType:   "Insights for wellness",
    diagnosisCode: selected.map(d => d.icD10Code).join(", "),
    category:      selected.map(d => d.category).join(", "),
    description:   selected.map((d, i) => `${i + 1}. ${d.category}: ${d.description}`).join("\n"),
    userDiagnosis: selected.map(d => d.userDiagnosis).filter(Boolean).join(", "),
  });

  const generate = async () => {
    if (!selectedIDs.length) { Alert.alert("Select Diagnosis", "Please select at least one."); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const selected = diagnoses.filter(d => selectedIDs.includes(d.encryptedID));
    setInsightPopup({ diagnoses: selected, text: "" });
    setAiLoading(true);
    try {
      const data = await fetchWithRetry(`${AI_BASE_URL}ai/insights`, buildPayload(selected));
      const text = cleanText(data.insight ?? data.content ?? data.data ?? data.result ?? "");
      setInsightPopup({ diagnoses: selected, text });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setInsightPopup(null);
      Alert.alert("AI Error", err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const regenerate = async () => {
    if (!insightPopup) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setAiLoading(true);
    try {
      const data = await fetchWithRetry(`${AI_BASE_URL}ai/insights`, buildPayload(insightPopup.diagnoses));
      const text = cleanText(data.insight ?? data.content ?? data.data ?? data.result ?? "");
      setInsightPopup(prev => prev ? { ...prev, text } : null);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      Alert.alert("AI Error", err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const save = async (saveToAll: boolean) => {
    if (!insightPopup) return;
    setSaveLoading(true);
    const targets = saveToAll ? insightPopup.diagnoses : [insightPopup.diagnoses[0]];
    try {
      await Promise.all(targets.map(d =>
        fetch(`${AI_BASE_URL}diagnosis/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            encrypteddiagnosisrecordID: d.encryptedID,
            readingDate: d.date, ICDCode: d.icD10Code,
            Category: d.category, Description: d.description,
            type: DIAGNOSIS_TYPE_MAP[d.diagnosisType?.toLowerCase()] ?? "0",
            AIInsight: insightPopup.text,
            UserDiagnosis: (d.userDiagnosis || "").trim(),
          }),
        })
      ));
      onSaved(targets.map(d => d.encryptedID), insightPopup.text);
      close();
    } catch (err: any) {
      Alert.alert("Save Error", err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const close = () => {
    abortRef.current?.abort();
    setInsightPopup(null);
    setAiLoading(false);
    setSelectMode(false);
    setSelectedIDs([]);
  };

  return {
    selectMode, setSelectMode,
    selectedIDs, setSelectedIDs,
    insightPopup, aiLoading, saveLoading,
    generate, regenerate, save, close,
  };
};

// ── InsightPopup ───────────────────────────────────────────────────────────────

interface InsightPopupProps {
  popup: InsightState;
  aiLoading: boolean;
  saveLoading: boolean;
  onRegenerate: () => void;
  onSave: (saveToAll: boolean) => void;
  onClose: () => void;
}

const InsightPopup: React.FC<InsightPopupProps> = ({
  popup, aiLoading, saveLoading, onRegenerate, onSave, onClose,
}) => {
  const isMulti = popup.diagnoses.length > 1;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.popupCard}>
          {/* Header */}
          <View style={styles.popupHeader}>
            <View style={styles.popupIconCircle}>
              <MaterialCommunityIcons
                name={isMulti ? "lightbulb-multiple-outline" : "lightbulb-outline"}
                size={18} color="#0891b2"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.popupTitle}>{isMulti ? "Combined Insights" : "Insights for Wellbeing"}</Text>
              <Text style={styles.popupSubtitle} numberOfLines={1}>
                {popup.diagnoses.map(d => d.category).join(" · ")}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Insight body */}
          <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
            <View style={styles.insightBox}>
              {aiLoading ? (
                // Skeleton loading state while AI generates
                <View style={{ alignItems: "center", gap: 8, paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color="#0891b2" />
                  <Text style={{ fontSize: 12, color: "#0891b2", fontWeight: "600" }}>Analyzing diagnosis...</Text>
                  {[85, 70, 80, 60].map((w, i) => (
                    <View key={i} style={{ height: 8, backgroundColor: "#a5f3fc", borderRadius: 4, opacity: 0.4, width: `${w}%` }} />
                  ))}
                </View>
              ) : (
                <InsightContent text={popup.text} textStyle={styles.insightText} />
              )}
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={onRegenerate} disabled={aiLoading}
            style={[styles.regenerateRow, aiLoading && { opacity: 0.4 }]}
          >
            <MaterialCommunityIcons name="refresh" size={13} color="#0891b2" />
            <Text style={styles.regenerateText}>Regenerate</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Save to all vs save latest (only shown for multi-select) */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              onPress={() => onSave(isMulti)}
              disabled={saveLoading || aiLoading}
              style={[styles.primaryBtn, { flex: 1 }, (saveLoading || aiLoading) && { opacity: 0.5 }]}
            >
              {saveLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.primaryBtnText}>{isMulti ? "Save All" : "Save"}</Text>}
            </TouchableOpacity>

            {isMulti && (
              <TouchableOpacity
                onPress={() => onSave(false)} disabled={saveLoading || aiLoading}
                style={[styles.outlineBtn, { borderColor: "#7DBE8E" }, (saveLoading || aiLoading) && { opacity: 0.5 }]}
              >
                <Text style={[styles.outlineBtnText, { color: "#7DBE8E" }]}>Save Latest</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── StyleSheet ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card:               { borderRadius: 12, backgroundColor: "#fff", elevation: 2, marginBottom: 10 },
  cardSelected:       { borderWidth: 2, borderColor: "#667eea", backgroundColor: "#f5f3ff" },
  selectedStrip:      { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: "#667eea", borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  cardHeader:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeBadge:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  typeText:           { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  selectCircle:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#667eea", backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  selectCircleActive: { backgroundColor: "#667eea", borderColor: "#667eea" },
  title:              { fontSize: 16, fontWeight: "700", color: "#1f2937", marginBottom: 4 },
  description:        { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  meta:               { fontSize: 12, color: "#9ca3af" },
  actions:            { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 10 },
  editBtn:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#eef2ff", borderRadius: 8, gap: 4 },
  editBtnText:        { fontSize: 13, fontWeight: "600", color: "#667eea" },
  deleteBtn:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#fef2f2", borderRadius: 8, gap: 4 },
  deleteBtnText:      { fontSize: 13, fontWeight: "600", color: "#dc2626" },
  insightHeader:      { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 8, backgroundColor: "#ecfeff", borderLeftWidth: 3, borderLeftColor: "#0891b2" },
  insightHeaderText:  { fontSize: 11, fontWeight: "700", color: "#0891b2", textTransform: "uppercase", letterSpacing: 0.5 },
  insightBody:        { padding: 10, backgroundColor: "#ecfeff", borderLeftWidth: 3, borderLeftColor: "#0891b2", borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  insightBodyText:    { fontSize: 13, color: "#164e63", lineHeight: 20 },
  bulletRow:          { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  bulletDash:         { lineHeight: 20, marginRight: 4 },
  bulletText:         { flex: 1, lineHeight: 20 },
  plainLine:          { marginBottom: 4 },
  overlay:            { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", paddingHorizontal: 28 },
  popupCard:          { backgroundColor: "#fff", borderRadius: 14, padding: 20, width: "100%", elevation: 8 },
  popupHeader:        { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  popupIconCircle:    { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ecfeff", justifyContent: "center", alignItems: "center" },
  popupTitle:         { fontSize: 15, fontWeight: "700", color: "#111827" },
  popupSubtitle:      { fontSize: 11, color: "#0891b2", fontWeight: "600", marginTop: 1 },
  divider:            { height: 1, backgroundColor: "#f1f5f9", marginVertical: 14 },
  insightBox:         { backgroundColor: "#f8fafc", borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: "#0891b2" },
  insightText:        { fontSize: 13, color: "#374151", lineHeight: 21 },
  regenerateRow:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 10 },
  regenerateText:     { fontSize: 12, color: "#0891b2", fontWeight: "600" },
  btnRow:             { flexDirection: "row", gap: 8 },
  primaryBtn:         { paddingVertical: 11, borderRadius: 10, backgroundColor: "#667eea", alignItems: "center", justifyContent: "center" },
  primaryBtnText:     { fontSize: 14, fontWeight: "600", color: "#fff" },
  outlineBtn:         { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", alignItems: "center" },
  outlineBtnText:     { fontSize: 14, fontWeight: "600", color: "#6b7280" },
});

export { DiagnosisCard, InsightPopup, useInsightFlow };
export type { Diagnosis, InsightState };
