import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BarChart2, Zap, Settings, PenLine } from 'lucide-react-native';
import { TeacherDashboardScreen } from '../screens/TeacherDashboardScreen';
import { TeacherIngestionScreen } from '../screens/TeacherIngestionScreen';
import { TeacherSettingsScreen } from '../screens/TeacherSettingsScreen';
import { TeacherLessonBuilderScreen } from '../screens/TeacherLessonBuilderScreen';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';

export type TeacherTabParamList = {
  Dashboard: undefined;
  Ingestion: undefined;
  Builder: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TeacherTabParamList>();

export function TeacherTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgSidebar,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
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
          tabBarLabel: 'Dashboard',
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
        name="Builder"
        component={TeacherLessonBuilderScreen}
        options={{
          tabBarLabel: 'Builder',
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
