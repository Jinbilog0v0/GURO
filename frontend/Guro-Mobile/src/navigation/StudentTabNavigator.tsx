import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, BarChart2, User2 } from 'lucide-react-native';
import { StudentDashboard } from '../screens/StudentDashboard';
import { LessonsScreen } from '../screens/LessonsScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';

export type StudentTabParamList = {
  Home: undefined;
  Lessons: undefined;
  Progress: undefined;
  Me: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();

export function StudentTabNavigator() {
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
        name="Home"
        component={StudentDashboard}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Lessons"
        component={LessonsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <BookOpen size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color, size }) => <BarChart2 size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Me"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Me',
          tabBarIcon: ({ color, size }) => <User2 size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
