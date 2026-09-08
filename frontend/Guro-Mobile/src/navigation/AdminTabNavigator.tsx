import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BarChart2, ShieldCheck, Users, School, Award } from 'lucide-react-native';
import { AdminOverviewScreen } from '../screens/admin/AdminOverviewScreen';
import { AdminTeacherVerificationsScreen } from '../screens/admin/AdminTeacherVerificationsScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminClassroomsScreen } from '../screens/admin/AdminClassroomsScreen';
import { AdminReportsScreen } from '../screens/admin/AdminReportsScreen';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';

export type AdminTabParamList = {
  Overview: undefined;
  Verifications: undefined;
  Users: undefined;
  Classrooms: undefined;
  Reports: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminTabNavigator() {
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
        tabBarActiveTintColor: Colors.accentSecondary,
        tabBarInactiveTintColor: Colors.textDark,
        tabBarLabelStyle: {
          fontFamily: Fonts.bodySemiBold,
          fontSize: FontSizes.xs,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={AdminOverviewScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color, size }) => <BarChart2 size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Verifications"
        component={AdminTeacherVerificationsScreen}
        options={{
          tabBarLabel: 'Verify',
          tabBarIcon: ({ color, size }) => <ShieldCheck size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{
          tabBarLabel: 'Users',
          tabBarIcon: ({ color, size }) => <Users size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Classrooms"
        component={AdminClassroomsScreen}
        options={{
          tabBarLabel: 'Sections',
          tabBarIcon: ({ color, size }) => <School size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={AdminReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => <Award size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
