import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  BarChart2,
  Users,
  ShieldCheck,
  School,
  Award,
  Layers,
  Shield,
  Zap,
  LogOut,
  X,
  Server,
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

export type AdminRouteName =
  | 'Overview'
  | 'Users'
  | 'Verifications'
  | 'Classrooms'
  | 'Reports'
  | 'Curriculum'
  | 'RateLimits'
  | 'LessonIngestor';

interface AdminSidebarProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  currentRoute: AdminRouteName;
}

interface NavItem {
  route: AdminRouteName;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  tag?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    route: 'Curriculum',
    label: 'Master Curriculum',
    subtitle: 'Item bank hierarchy & modules',
    icon: Layers,
  },
  {
    route: 'RateLimits',
    label: 'AI & Rate Limits',
    subtitle: 'Quotas, tokens & governance',
    icon: Shield,
    tag: 'Dev',
  },
  {
    route: 'LessonIngestor',
    label: 'Lesson Ingestor',
    subtitle: 'Curriculum & quiz builder',
    icon: Zap,
    tag: 'New',
  },
];

export function AdminSidebar({ visible, onClose, navigation, currentRoute }: AdminSidebarProps) {
  const currentUser = useAppStore((s) => s.currentUser);
  const logoutFromCloud = useAppStore((s) => s.logoutFromCloud);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleNavigate = (route: AdminRouteName) => {
    onClose();
    if (currentRoute !== route) {
      navigation.navigate(route);
    }
  };

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const executeSignOut = () => {
    setShowSignOutConfirm(false);
    onClose();
    logoutFromCloud();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <>
      <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.drawer}>
          {/* Drawer Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.adminBanner}>
              <View style={styles.adminIconBox}>
                <Shield size={20} color={Colors.accentSecondary} />
              </View>
              <View style={styles.adminInfo}>
                <View style={styles.adminTitleRow}>
                  <Text style={styles.adminTitle} numberOfLines={1}>
                    {currentUser?.name || 'Administrator'}
                  </Text>
                  <View style={styles.rootBadge}>
                    <Text style={styles.rootBadgeText}>ROOT</Text>
                  </View>
                </View>
                <Text style={styles.adminEmail} numberOfLines={1}>
                  {currentUser?.email || 'admin@guro.ph'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close navigation menu"
              >
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation Section */}
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>EXTENDED GOVERNANCE &amp; TOOLS</Text>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.route;

              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.navIconBox,
                      isActive && styles.navIconBoxActive,
                    ]}
                  >
                    <Icon
                      size={18}
                      color={isActive ? Colors.accentSecondary : Colors.textMuted}
                    />
                  </View>

                  <View style={styles.navTextContainer}>
                    <View style={styles.navLabelRow}>
                      <Text
                        style={[
                          styles.navLabel,
                          isActive && styles.navLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      {item.tag && (
                        <View style={styles.itemTag}>
                          <Text style={styles.itemTagText}>{item.tag}</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.navSubtitle,
                        isActive && styles.navSubtitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Infrastructure Health Status */}
            <View style={styles.systemStatusCard}>
              <View style={styles.systemStatusHeader}>
                <Server size={14} color={Colors.success} />
                <Text style={styles.systemStatusTitle}>System Telemetry</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Cloud API: Online</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: Colors.accentPrimary }]} />
                <Text style={styles.statusText}>SQLite Database: Synchronized</Text>
              </View>
            </View>
          </ScrollView>

          {/* Drawer Footer with Logout */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <View style={styles.logoutIconBox}>
                <LogOut size={16} color={Colors.danger} />
              </View>
              <View style={styles.logoutTextContainer}>
                <Text style={styles.logoutText}>Sign Out</Text>
                <Text style={styles.logoutSubtext}>End active administrator session</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    <ConfirmDialog
      visible={showSignOutConfirm}
      variant="danger"
      title="Sign Out"
      description="Are you sure you want to log out of the administration console?"
      confirmLabel="Sign Out"
      cancelLabel="Cancel"
      onConfirm={executeSignOut}
      onCancel={() => setShowSignOutConfirm(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 19, 0.72)',
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: Colors.bgSidebar,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingTop: 50,
    paddingBottom: Spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  drawerHeader: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  adminIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(160,19,34,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminInfo: {
    flex: 1,
  },
  adminTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    fontWeight: '700',
    maxWidth: 130,
  },
  rootBadge: {
    backgroundColor: 'rgba(160,19,34,0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(160,19,34,0.25)',
  },
  rootBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    color: Colors.accentSecondary,
    fontWeight: '800',
  },
  adminEmail: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgMain,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    padding: Spacing.md,
    gap: 4,
  },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.textDark,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    paddingHorizontal: 4,
    fontWeight: '700',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  navItemActive: {
    backgroundColor: 'rgba(160,19,34,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(160,19,34,0.2)',
  },
  navIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navIconBoxActive: {
    backgroundColor: 'rgba(160,19,34,0.15)',
    borderColor: 'rgba(160,19,34,0.3)',
  },
  navTextContainer: {
    flex: 1,
  },
  navLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    fontWeight: '600',
  },
  navLabelActive: {
    color: Colors.accentSecondary,
    fontWeight: '700',
  },
  navSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  navSubtitleActive: {
    color: Colors.textDark,
  },
  itemTag: {
    backgroundColor: 'rgba(17,66,142,0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  itemTagText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 8,
    color: Colors.accentPrimary,
    fontWeight: '800',
  },
  systemStatusCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: 6,
  },
  systemStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  systemStatusTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMain,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
  },
  drawerFooter: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(160,19,34,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(160,19,34,0.15)',
  },
  logoutIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(160,19,34,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutTextContainer: {
    flex: 1,
  },
  logoutText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.danger,
    fontWeight: '700',
  },
  logoutSubtext: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
  },
});
