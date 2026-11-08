import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  Sparkles,
  UploadCloud,
  Link2,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  X,
  Check,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { useAppStore, resolveServerUrl } from '../../store/useAppStore';
import { toast } from '../ui/ToastContainer';

export interface EducationalImagePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  defaultPrompt?: string;
  subject?: string;
  grade?: number | string;
  context?: string;
}

export function EducationalImagePicker({
  label,
  value,
  onChange,
  defaultPrompt = '',
  subject = 'General',
  grade = 4,
  context = 'intro',
}: EducationalImagePickerProps) {
  const serverUrlFromStore = useAppStore((state) => state.serverUrl);
  const serverUrl = serverUrlFromStore || process.env.EXPO_PUBLIC_API_URL || 'https://neoguro.app';

  const [isGenerating, setIsGenerating] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [hasError, setHasError] = useState(false);

  // Generate educational visual via AI (Backend endpoint with client-side Pollinations fallback)
  const handleGenerateAI = async (promptOverride?: any) => {
    const promptToUse = (typeof promptOverride === 'string' && promptOverride.trim()) ? promptOverride.trim() : (defaultPrompt.trim() || 'elementary school lesson visual aid');
    setIsGenerating(true);
    setHasError(false);

    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/lesson/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAppStore.getState().token}`,
        },
        body: JSON.stringify({
          prompt: promptToUse,
          subject,
          grade: typeof grade === 'string' ? parseInt(grade, 10) || 4 : grade,
          context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          onChange(data.imageUrl);
          toast.success('Generated educational visual!');
          return;
        }
      }

      // Safe fallback: direct Pollinations AI endpoint
      const cleanTerm = promptToUse.replace(/[^a-zA-Z0-9\s]/g, '');
      const encoded = encodeURIComponent(`educational diagram illustration of ${cleanTerm} for grade ${grade} elementary school ${subject}, colorful textbook style graphic, clean white background`);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=500&nologo=true`;
      onChange(fallbackUrl);
      toast.success('Generated educational visual!');
    } catch {
      const cleanTerm = promptToUse.replace(/[^a-zA-Z0-9\s]/g, '');
      const encoded = encodeURIComponent(`educational diagram illustration of ${cleanTerm} for grade ${grade} elementary school ${subject}, colorful textbook style graphic, clean white background`);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=500&nologo=true`;
      onChange(fallbackUrl);
      toast.success('Generated educational visual!');
    } finally {
      setIsGenerating(false);
    }
  };

  // Pick local photo from device
  const handlePickLocalImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });
        const mimeType = asset.mimeType || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${base64}`;
        setHasError(false);
        onChange(dataUri);
        toast.success('Image attached successfully.');
      }
    } catch (e) {
      toast.error('Failed to select image from device.');
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setShowUrlModal(false);
      return;
    }
    setHasError(false);
    onChange(urlInput.trim());
    setUrlInput('');
    setShowUrlModal(false);
    toast.success('Image URL applied.');
  };

  return (
    <View style={styles.container}>
      {/* Label and Badge Header */}
      <View style={styles.headerRow}>
        <View style={styles.labelWrapper}>
          <ImageIcon size={14} color={Colors.accentPrimary} />
          <Text style={styles.labelText}>{label}</Text>
        </View>

        {value ? (
          <View style={styles.badgeWrapper}>
            <Text style={styles.badgeText}>
              {value.startsWith('data:') ? 'Device File' : value.includes('pollinations') ? 'AI Visual' : 'Web Link'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Image Preview Box or Action Row */}
      {value ? (
        <View style={styles.previewCard}>
          {!hasError ? (
            <Image
              source={{ uri: value }}
              style={styles.imagePreview}
              resizeMode="cover"
              onError={() => setHasError(true)}
            />
          ) : (
            <View style={styles.errorBox}>
              <AlertCircle size={20} color={Colors.danger} />
              <Text style={styles.errorText}>Image failed to load</Text>
            </View>
          )}

          <View style={styles.previewActions}>
            <TouchableOpacity
              onPress={handleGenerateAI}
              disabled={isGenerating}
              style={styles.actionBtnSecondary}
              accessibilityLabel="Regenerate educational picture"
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={Colors.accentPrimary} />
              ) : (
                <>
                  <RefreshCw size={13} color={Colors.accentPrimary} />
                  <Text style={styles.actionBtnTextSecondary}>Regenerate AI</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setHasError(false);
                onChange('');
              }}
              style={styles.actionBtnDanger}
              accessibilityLabel="Remove picture"
            >
              <Trash2 size={13} color={Colors.danger} />
              <Text style={styles.actionBtnTextDanger}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleGenerateAI}
            disabled={isGenerating}
            style={styles.aiButton}
            accessibilityLabel="Generate picture with AI"
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Sparkles size={14} color="#FFFFFF" />
                <Text style={styles.aiButtonText}>AI Picture</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePickLocalImage}
            style={styles.pickButton}
            accessibilityLabel="Pick picture from device"
          >
            <UploadCloud size={14} color={Colors.textMain} />
            <Text style={styles.pickButtonText}>Pick Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setUrlInput(value && !value.startsWith('data:') ? value : '');
              setShowUrlModal(true);
            }}
            style={styles.linkButton}
            accessibilityLabel="Paste image URL link"
          >
            <Link2 size={14} color={Colors.textMuted} />
            <Text style={styles.linkButtonText}>Link</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Curated Diagrams */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 6 }}>
          {[
            { label: '🍰 Fraction 3/4', prompt: 'fraction pie divided into 4 slices, 3 shaded' },
            { label: '📊 10x10 Grid', prompt: 'decimals 10x10 grid model with shaded squares' },
            { label: '📏 Number Line', prompt: 'number line with tick marks from 0 to 10' },
            { label: '📐 Shapes', prompt: 'geometric shapes triangle square circle rectangle' },
            { label: '💡 Figures of Speech', prompt: 'figures of speech simile metaphor illustration' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => handleGenerateAI(item.prompt)}
              activeOpacity={0.7}
              style={{
                backgroundColor: 'rgba(17,66,142,0.06)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(17,66,142,0.15)',
              }}
            >
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentPrimary }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        </>
      )}

      {/* URL Input Modal */}
      <Modal
        visible={showUrlModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUrlModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paste Image Link</Text>
              <TouchableOpacity onPress={() => setShowUrlModal(false)} style={{ padding: 4 }}>
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://..."
              placeholderTextColor={Colors.textDark}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.urlTextInput}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                onPress={() => setShowUrlModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyUrl}
                style={styles.modalApplyBtn}
              >
                <Check size={14} color="#FFFFFF" />
                <Text style={styles.modalApplyText}>Apply Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: Spacing.sm,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeWrapper: {
    backgroundColor: 'rgba(17,66,142,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.accentPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiButton: {
    flex: 1.2,
    backgroundColor: Colors.accentPrimary,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
  },
  aiButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  pickButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 40,
  },
  pickButtonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textMain,
  },
  linkButton: {
    width: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    minHeight: 40,
  },
  linkButtonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
    padding: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imagePreview: {
    width: 72,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  errorBox: {
    width: 72,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 8,
    color: Colors.danger,
    textAlign: 'center',
    marginTop: 2,
  },
  previewActions: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(17,66,142,0.06)',
    minHeight: 38,
  },
  actionBtnTextSecondary: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.accentPrimary,
  },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(239,68,68,0.06)',
    minHeight: 38,
  },
  actionBtnTextDanger: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.danger,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    fontWeight: '700',
  },
  urlTextInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMain,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  modalApplyBtn: {
    flex: 1,
    backgroundColor: Colors.accentPrimary,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalApplyText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
