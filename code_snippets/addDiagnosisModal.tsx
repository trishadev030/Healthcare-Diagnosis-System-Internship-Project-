/**
 * AddDiagnosisModal — Portfolio Excerpt
 *
 * Highlights:
 *  1. Animated modal       — fade + slide-up entry/exit via Animated.Value
 *  2. ICD lookup flow      — search → auto-fill category & description, validated before save
 *  3. Dynamic modal height — measures field heights, adjusts for keyboard
 *  4. Form validation      — inline per-field errors, ICD validation gate
 *  5. Add / Edit modes     — single component handles both via editData prop
 *
 * Omitted for brevity: full StyleSheet detail, Colors import.
 * Full component available on request.
 */

import React, {
  useState, useCallback, useMemo,
  useRef, useEffect,
} from 'react';
import {
  Modal, ScrollView, View, StyleSheet,
  TouchableOpacity, Dimensions, KeyboardAvoidingView,
  Platform, Keyboard, Alert, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button } from 'react-native-paper';
import Text from '@/components/Custom/Text';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// ── Replace with your own API implementations ─────────────────────────────────
// import { addDiagnosisCode, updateDiagnosisDetails, icdLookup } from '@/api/DiagnosisAPI';
declare function addDiagnosisCode(payload: any): Promise<void>;
declare function updateDiagnosisDetails(payload: any): Promise<void>;
declare function icdLookup(code: string): Promise<{ category: string; userDescription: string }>;

const { width, height } = Dimensions.get('window');

// ── Constants ─────────────────────────────────────────────────────────────────

const DIAGNOSIS_TYPES = [
  { label: 'Principle', value: '0' },
  { label: 'Primary',   value: '1' },
  { label: 'Secondary', value: '2' },
  { label: 'Tertiary',  value: '3' },
  { label: 'Surgical',  value: '4' },
];

// ── Date helpers ──────────────────────────────────────────────────────────────

const toUSDateString = (isoDate: string): string => {
  if (!isoDate) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDate)) return isoDate;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
};

const todayUSFormat = () => toUSDateString(new Date().toISOString().split('T')[0]);

// ── Types ─────────────────────────────────────────────────────────────────────

interface DiagnosisFormData {
  type: string;
  icdCode: string;
  date: string;
  category: string;
  description: string;
}

interface EditData {
  encryptedID: string;
  date: string;
  icD10Code: string;
  category: string;
  description: string;
  diagnosisType: string;
  aiInsight: string;
  userDiagnosis: string;
}

interface AddDiagnosisModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  memberID: string;
  editData?: EditData | null;
  isFirstDiagnosis?: boolean;
}

// ── FormField ─────────────────────────────────────────────────────────────────
// Memoized wrapper around TextInput — measures its own height so the parent
// modal can resize itself to fit content without a fixed height.

const FormField = React.memo(({
  label, value, onChangeText, multiline = false, numberOfLines = 1,
  onContentHeightChange, rightIcon, editable = true, maxLength, autoGrow = false,
  ...props
}: any) => {
  const fieldRef = useRef<View>(null);

  useEffect(() => {
    setTimeout(() => {
      fieldRef.current?.measure((_x, _y, _w, fieldHeight) => {
        onContentHeightChange?.(fieldHeight);
      });
    }, 50);
  }, [value, multiline]);

  return (
    <View ref={fieldRef} style={{ position: 'relative' }}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        maxFontSizeMultiplier={1}
        style={[
          styles.input,
          multiline ? (autoGrow ? styles.textareaAuto : styles.textarea) : styles.singleLineInput,
          rightIcon ? { paddingRight: 48 } : null,
          !editable ? styles.inputReadOnly : null,
        ]}
        mode="outlined"
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        outlineColor="#e2e8f0"
        activeOutlineColor={editable ? '#667eea' : '#e2e8f0'}
        editable={editable}
        {...(maxLength !== undefined ? { maxLength } : {})}
        theme={{
          colors: {
            primary: '#07143b',
            outline: '#e2e8f0',
            background: editable ? '#FFFFFF' : '#f4f6fb',
            onSurface: editable ? '#000000ff' : '#6b7280',
            onSurfaceVariant: '#666666',
          },
          roundness: 8,
        }}
        dense={!multiline}
        {...props}
      />
      {rightIcon && <View style={styles.inputIconWrapper}>{rightIcon}</View>}
      {!editable && (
        <View style={styles.readOnlyIconWrapper}>
          <MaterialCommunityIcons name="lock-outline" size={16} color="#9ca3af" />
        </View>
      )}
    </View>
  );
});

// ── AddDiagnosisModal ─────────────────────────────────────────────────────────

export const AddDiagnosisModal: React.FC<AddDiagnosisModalProps> = ({
  visible, onClose, onSave,
  memberID, editData = null, isFirstDiagnosis = false,
}) => {
  const isEditMode = !!editData;

  const [formData, setFormData] = useState<DiagnosisFormData>({
    type: '', icdCode: '', date: todayUSFormat(), category: '', description: '',
  });
  const [loading, setLoading]           = useState(false);
  const [icdLoading, setIcdLoading]     = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight]   = useState(0);
  const [contentHeight, setContentHeight]     = useState(450);
  const [fieldHeights, setFieldHeights]       = useState<number[]>([]);
  const [isIcdValidated, setIsIcdValidated]   = useState(false);
  const [fieldErrors, setFieldErrors]         = useState<Partial<DiagnosisFormData & { icdInline: string }>>({});

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const contentRef = useRef<View>(null);

  // ── Populate form when editData changes ──
  useEffect(() => {
    if (editData) {
      const typeMatch = DIAGNOSIS_TYPES.find(
        t => t.label.toLowerCase() === (editData.diagnosisType ?? '').toLowerCase()
      );
      setFormData({
        type:        typeMatch ? typeMatch.value : '',
        icdCode:     editData.icD10Code ?? '',
        date:        toUSDateString(editData.date ?? ''),
        category:    editData.category ?? '',
        description: editData.description ?? '',
      });
      setIsIcdValidated(!!(editData.icD10Code));
    } else {
      setFormData({
        type: isFirstDiagnosis ? '0' : '',
        icdCode: '', date: todayUSFormat(), category: '', description: '',
      });
      setIsIcdValidated(false);
    }
    setFieldErrors({});
  }, [editData, isFirstDiagnosis]);

  // ── Keyboard listeners ──
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => { setKeyboardVisible(true); setKeyboardHeight(e.endCoordinates.height); }
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => { setKeyboardVisible(false); setKeyboardHeight(0); }
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  // ── Fade in/out on visibility change ──
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 300 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  // ── Recalculate modal height from measured field heights ──
  useEffect(() => {
    if (fieldHeights.length > 0 && fieldHeights.every(h => h > 0)) {
      const total =
        fieldHeights.reduce((s, h) => s + h, 0) +
        (fieldHeights.length - 1) * 12 + // gaps
        32 + 70 + 52 + 90;               // padding + buttons + header + dropdown
      setContentHeight(prev => {
        const next = Math.max(420, Math.min(total, height * 0.85));
        return prev === next ? prev : next;
      });
    }
  }, [fieldHeights, height]);

  const resetForm = useCallback(() => {
    setFormData({ type: '', icdCode: '', date: todayUSFormat(), category: '', description: '' });
    setIsIcdValidated(false);
    setFieldErrors({});
    setFieldHeights([]);
  }, []);

  // ── ICD lookup: fills category + description from API ──
  const handleICDLookup = useCallback(async () => {
    if (!formData.icdCode.trim()) {
      setFieldErrors(prev => ({ ...prev, icdInline: 'Please enter an ICD code to search.' }));
      return;
    }
    Keyboard.dismiss();
    setIcdLoading(true);
    setFieldErrors(prev => ({ ...prev, icdInline: undefined }));
    try {
      const result = await icdLookup(formData.icdCode.trim());
      setFormData(prev => ({ ...prev, category: result.category || '', description: result.userDescription || '' }));
      setIsIcdValidated(true);
      setFieldErrors(prev => ({ ...prev, category: undefined, icdInline: undefined, icdCode: undefined, description: undefined }));
    } catch {
      setIsIcdValidated(false);
      setFieldErrors(prev => ({ ...prev, icdInline: 'Invalid ICD code. Please check and try again.' }));
      setFormData(prev => ({ ...prev, category: '', description: '' }));
    } finally {
      setIcdLoading(false);
    }
  }, [formData.icdCode]);

  // ── Validation: ICD must be looked up before saving ──
  const validateForm = useCallback((): boolean => {
    const errors: any = {};
    if (!formData.type) errors.type = 'Type is required';
    if (!formData.icdCode.trim()) {
      errors.icdCode = 'ICD Code is required';
      errors.category = 'Category is required';
      errors.description = 'Description is required';
    } else if (!isIcdValidated) {
      errors.icdInline = 'Please search the ICD code to fill Category and Description.';
      errors.category = 'Category is required';
      errors.description = 'Description is required';
    }
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, isIcdValidated]);

  const handleSave = useCallback(async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;
    const dateWithTime = `${formData.date} ${new Date().toLocaleTimeString('en-US', { hour12: false })}`;
    setLoading(true);
    try {
      if (isEditMode && editData) {
        await updateDiagnosisDetails({
          encrypteddiagnosisrecordID: editData.encryptedID,
          readingDate: dateWithTime,
          ICDCode: formData.icdCode,
          Category: formData.category || editData.category,
          Description: formData.description,
          type: formData.type,
          AIInsight: editData.aiInsight || '',
          UserDiagnosis: editData.userDiagnosis || '',
        });
      } else {
        await addDiagnosisCode({
          MemberID: memberID,
          Type: parseInt(formData.type) || 0,
          Date: dateWithTime,
          ICDCode: formData.icdCode,
          Category: formData.category,
          UserDescription: formData.description,
        });
      }
      onSave({ ...formData, isEdit: isEditMode, apiSuccess: true });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save diagnosis.');
    } finally {
      setLoading(false);
    }
  }, [formData, isEditMode, editData, memberID, onSave, validateForm]);

  const handleClose = useCallback(() => { resetForm(); onClose(); Keyboard.dismiss(); }, [onClose, resetForm]);

  // ── Resetting ICD-dependent fields when the code changes ──
  const updateFormField = useCallback((field: keyof DiagnosisFormData, value: string) => {
    if (field === 'icdCode') {
      setIsIcdValidated(false);
      setFormData(prev => ({ ...prev, icdCode: value, category: '', description: '' }));
      setFieldErrors(prev => ({ ...prev, icdCode: undefined, icdInline: undefined }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, []);

  const handleFieldHeightChange = useCallback((index: number, h: number) => {
    setFieldHeights(prev => {
      if (prev[index] === h) return prev;
      const next = [...prev];
      next[index] = h;
      return next;
    });
  }, []);

  // ── Field config — autoGrow:true removes maxHeight cap on category ──
  const formFields = useMemo(() => [
    { key: 'icdCode'     as const, label: 'ICD Code',          multiline: false, autoGrow: false, hasLookup: true,  maxLength: 20        },
    { key: 'date'        as const, label: 'Date (MM/DD/YYYY)', multiline: false, autoGrow: false,                   maxLength: 10        },
    { key: 'category'    as const, label: 'Category',          multiline: true,  autoGrow: true,  numberOfLines: 3, maxLength: undefined  },
    { key: 'description' as const, label: 'Description',       multiline: true,  autoGrow: false, numberOfLines: 10, maxLength: 500       },
  ], []);

  const modalHeight = useMemo(() =>
    keyboardVisible
      ? Math.min(contentHeight, height - keyboardHeight - 40)
      : Math.min(contentHeight, height * 0.85),
    [keyboardVisible, contentHeight, height, keyboardHeight]
  );

  const isPrincipleEdit = isEditMode && editData?.diagnosisType?.toLowerCase() === 'principle';
  const typeLocked      = (isFirstDiagnosis && !isEditMode) || isPrincipleEdit;
  const visibleTypes    = isEditMode
    ? DIAGNOSIS_TYPES.filter(t => t.label !== 'Principle')
    : isFirstDiagnosis
    ? DIAGNOSIS_TYPES.filter(t => t.label === 'Principle')
    : DIAGNOSIS_TYPES.filter(t => t.label !== 'Principle');

  const modalTitle = isEditMode ? 'Edit Diagnosis' : isFirstDiagnosis ? 'Add Principle Diagnosis' : 'Add Diagnosis';

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.animatedWrapper,
          {
            height: modalHeight,
            maxHeight: height * 0.85,
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
          },
        ]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
          >
            <SafeAreaView style={{ flex: 1 }}>
              {/* ── Header ── */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{modalTitle}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.headerClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons name="close" size={22} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* ── Scrollable form ── */}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View ref={contentRef} style={styles.formSection}>

                  {/* ── Type selector ── */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.dropdownLabel}>Type</Text>
                    {typeLocked ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                        <TouchableOpacity style={[styles.typeChip, styles.typeChipActive, { paddingHorizontal: 48 }]} activeOpacity={1}>
                          <Text style={styles.typeChipTextActive}>Principle</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.typeChipRow}>
                        {visibleTypes.map(item => (
                          <TouchableOpacity
                            key={item.value}
                            style={[styles.typeChip, formData.type === item.value && styles.typeChipActive]}
                            onPress={() => updateFormField('type', item.value)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.typeChipText, formData.type === item.value && styles.typeChipTextActive]}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    {fieldErrors.type && <InlineError message={fieldErrors.type} />}
                  </View>

                  {/* ── Form fields ── */}
                  {formFields.map((field, index) => (
                    <View key={field.key} style={styles.fieldContainer}>
                      <FormField
                        label={field.label}
                        value={formData[field.key]}
                        onChangeText={(text: string) => updateFormField(field.key, text)}
                        multiline={field.multiline}
                        numberOfLines={(field as any).numberOfLines || 1}
                        autoGrow={field.autoGrow}
                        onContentHeightChange={(h: number) => handleFieldHeightChange(index, h)}
                        editable={
                          field.key === 'category'    ? false :
                          field.key === 'description' ? isIcdValidated : true
                        }
                        maxLength={field.maxLength}
                        rightIcon={field.hasLookup ? (
                          <TouchableOpacity onPress={handleICDLookup} disabled={icdLoading}>
                            {icdLoading
                              ? <ActivityIndicator size="small" color="#667eea" />
                              : <MaterialCommunityIcons name="magnify" size={22} color="#667eea" />}
                          </TouchableOpacity>
                        ) : undefined}
                      />
                      {field.key === 'icdCode'     && (fieldErrors.icdInline || fieldErrors.icdCode) && <InlineError message={(fieldErrors.icdInline || fieldErrors.icdCode)!} />}
                      {field.key === 'category'    && fieldErrors.category    && <InlineError message={fieldErrors.category} />}
                      {field.key === 'description' && fieldErrors.description && <InlineError message={fieldErrors.description} />}
                      {field.key === 'date'        && fieldErrors.date        && <InlineError message={fieldErrors.date} />}
                      {field.key === 'description' && (
                        <Text style={styles.charCount}>{formData.description.length}/500</Text>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* ── Sticky action buttons ── */}
              <View style={styles.actionBar}>
                <View style={styles.actionRow}>
                  <Button
                    mode="contained" onPress={handleSave}
                    maxFontSizeMultiplier={1}
                    style={[styles.btn, styles.saveBtn]}
                    labelStyle={styles.saveBtnLabel}
                    disabled={loading} loading={loading} compact
                  >
                    {loading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
                  </Button>
                  <Button
                    mode="outlined" onPress={handleClose}
                    maxFontSizeMultiplier={1}
                    style={[styles.btn, styles.cancelBtn]}
                    labelStyle={styles.cancelBtnLabel}
                    compact
                  >
                    Cancel
                  </Button>
                </View>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ── Small shared error component ─────────────────────────────────────────────

const InlineError: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.errorRow}>
    <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#dc2626" />
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

// ── StyleSheet ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  animatedWrapper: { width: width * 0.92, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 16, overflow: 'hidden' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#07143b', minHeight: 52 },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  headerClose:    { position: 'absolute', right: 12, top: 14 },
  formSection:    { padding: 16, gap: 12 },
  fieldContainer: {},
  input:          { backgroundColor: '#fff' },
  inputReadOnly:  { backgroundColor: '#f4f6fb' },
  singleLineInput:{ minHeight: 56 },
  textarea:       { minHeight: 80, maxHeight: 120, textAlignVertical: 'top' },
  textareaAuto:   { minHeight: 56, textAlignVertical: 'top' },
  inputIconWrapper:   { position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  readOnlyIconWrapper:{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  dropdownLabel:  { fontSize: 13, fontWeight: '700', color: '#07143b', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10, marginLeft: 12 },
  typeChipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  typeChip:       { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#d1d9e6', backgroundColor: '#f4f6fb' },
  typeChipActive: { borderColor: '#07143b', backgroundColor: '#07143b' },
  typeChipText:   { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  typeChipTextActive: { color: '#fff' },
  errorRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 2 },
  errorText:      { fontSize: 11, color: '#dc2626', fontWeight: '600' },
  charCount:      { fontSize: 10, color: '#6b7280', textAlign: 'right', marginTop: 2, marginRight: 4 },
  actionBar:      { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 12, elevation: 4 },
  actionRow:      { flexDirection: 'row', gap: 10 },
  btn:            { flex: 1, borderRadius: 10, borderWidth: 1.5, height: 46, justifyContent: 'center' },
  saveBtn:        { backgroundColor: '#7DBE8E', borderColor: '#7DBE8E' },
  saveBtnLabel:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn:      { borderColor: '#6b7280', backgroundColor: 'transparent' },
  cancelBtnLabel: { color: '#6b7280', fontSize: 15, fontWeight: '600' },
});

export default React.memo(AddDiagnosisModal);
