import React, { useEffect } from 'react';
import { BackHandler, View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart2, Zap, Settings, PenLine, MessageSquare } from 'lucide-react-native';
import { TeacherDashboardScreen } from '../screens/TeacherDashboardScreen';
import { TeacherIngestionScreen } from '../screens/TeacherIngestionScreen';
import { TeacherChatScreen } from '../screens/TeacherChatScreen';
import { TeacherLessonBuilderScreen } from '../screens/TeacherLessonBuilderScreen';
import { TeacherSettingsScreen } from '../screens/TeacherSettingsScreen';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';

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
        }}
      >
        <MessageSquare size={22} color="#FFFFFF" strokeWidth={2.2} />
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

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
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
