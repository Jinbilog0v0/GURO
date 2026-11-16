import React, { useEffect } from 'react';
import { BackHandler, View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart2, Zap, Settings, PenLine, MessageSquare } from 'lucide-react-native';
import { TeacherDashboardScreen } from '../screens/TeacherDashboardScreen';
import { TeacherIngestionScreen } from '../screens/TeacherIngestionScreen';
import { TeacherChatScreen } from '../screens/TeacherChatScreen';
import { TeacherLessonBuilderScreen } from '../screens/TeacherLessonBuilderScreen';
import { TeacherSettingsScreen } from '../screens/TeacherSettingsScreen';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { useAppStore } from '../store/useAppStore';

export type TeacherTabParamList = {
  Dashboard: undefined;
  Ingestion: undefined;
  Chat: undefined;
  Builder: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TeacherTabParamList>();

interface CustomGCashTabButtonProps {
  children?: React.ReactNode;
  onPress?: (e: any) => void;
  accessibilityState?: { selected?: boolean };
}

function CustomGCashChatButton({ onPress, accessibilityState }: CustomGCashTabButtonProps) {
  const isSelected = Boolean(accessibilityState?.selected);
  const unreadChatCount = useAppStore((state) => state.unreadChatCount);
  const isTeacherChatThreadOpen = useAppStore((state) => state.isTeacherChatThreadOpen);

  if (isTeacherChatThreadOpen) {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Parent Consultation Chat"
      accessibilityState={accessibilityState}
      style={{
        top: -18,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
      }}
    >
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: isSelected ? Colors.accentPrimary : '#0D3470',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 3.5,
          borderColor: Colors.bgSidebar,
          shadowColor: '#11428E',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 6,
          elevation: 7,
          position: 'relative',
        }}
      >
        <MessageSquare size={22} color="#FFFFFF" strokeWidth={2.2} />

        {unreadChatCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              backgroundColor: '#EF4444',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              paddingHorizontal: 4,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#FFFFFF',
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.bodyBold,
                fontSize: 10,
                color: '#FFFFFF',
                textAlign: 'center',
                lineHeight: 12,
              }}
            >
              {unreadChatCount > 99 ? '99+' : unreadChatCount}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={{
          fontFamily: Fonts.bodyBold,
          fontSize: 10,
          color: isSelected ? Colors.accentPrimary : Colors.textDark,
          marginTop: 2,
        }}
      >
        Chat
      </Text>
    </TouchableOpacity>
  );
}

export function TeacherTabNavigator() {
  const insets = useSafeAreaInsets();
  const isTeacherChatThreadOpen = useAppStore((state) => state.isTeacherChatThreadOpen);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    useAppStore.getState().fetchTeacherUnreadChatCount();
    const pollTimer = setInterval(() => {
      useAppStore.getState().fetchTeacherUnreadChatCount();
    }, 12000);
    return () => {
      sub.remove();
      clearInterval(pollTimer);
    };
  }, []);

  return (
    <Tab.Navigator
      tabBar={(props) => (isTeacherChatThreadOpen ? null : <BottomTabBar {...props} />)}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: isTeacherChatThreadOpen
          ? { display: 'none', height: 0, position: 'absolute', bottom: -100 }
          : {
              backgroundColor: Colors.bgSidebar,
              borderTopWidth: 1,
              borderTopColor: Colors.border,
              height: 60 + insets.bottom,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
              paddingTop: 8,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              overflow: 'visible',
            },
        tabBarActiveTintColor: Colors.accentPrimary,
        tabBarInactiveTintColor: Colors.textDark,
        tabBarLabelStyle: {
          fontFamily: Fonts.bodySemiBold,
          fontSize: FontSizes.xs,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={TeacherDashboardScreen}
        options={{
          tabBarLabel: 'Console',
          tabBarIcon: ({ color, size }) => <BarChart2 size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Ingestion"
        component={TeacherIngestionScreen}
        options={{
          tabBarLabel: 'AI Ingest',
          tabBarIcon: ({ color, size }) => <Zap size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={TeacherChatScreen}
        options={{
          tabBarStyle: isTeacherChatThreadOpen ? { display: 'none', height: 0 } : undefined,
          tabBarButton: (props) => <CustomGCashChatButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Builder"
        component={TeacherLessonBuilderScreen}
        options={{
          tabBarLabel: 'Lesson Builder',
          tabBarIcon: ({ color, size }) => <PenLine size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={TeacherSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
