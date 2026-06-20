import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { LoginScreen } from '../screens/LoginScreen';
import { StudentTabNavigator } from './StudentTabNavigator';
import { TeacherDashboard } from '../screens/TeacherDashboard';
import { ParentDashboard } from '../screens/ParentDashboard';
import { AssessmentScreen } from '../screens/AssessmentScreen';
import { StudyScreen } from '../screens/StudyScreen';
import { DetailsScreen } from '../screens/DetailsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Colors } from '../theme/colors';
import { Fonts } from '../theme/typography';

export type RootStackParamList = {
  Login: undefined;
  StudentDashboard: undefined;
  TeacherDashboard: undefined;
  ParentDashboard: undefined;
  Assessment: { subject: string; gradeLevel: number; topic: string };
  Study: { subject: string; gradeLevel: number; topic: string };
  Details: { fileName: string; content: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function ReturnToStudentButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity onPress={() => navigation.replace('StudentDashboard')} style={styles.backButton}>
      <Text style={styles.backButtonText}>← Return</Text>
    </TouchableOpacity>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bgSidebar },
        headerTintColor: Colors.textMain,
        headerTitleStyle: {
          fontFamily: Fonts.display,
          fontSize: 16,
          color: Colors.textMain,
        },
        headerShadowVisible: true,
        contentStyle: { backgroundColor: Colors.bgMain },
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      {/* StudentDashboard route now renders the bottom tab navigator */}
      <Stack.Screen
        name="StudentDashboard"
        component={StudentTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherDashboard"
        component={TeacherDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ParentDashboard"
        component={ParentDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Study"
        component={StudyScreen}
        options={{ title: 'Learning Lab' }}
      />
      <Stack.Screen
        name="Assessment"
        component={AssessmentScreen}
        options={{ title: 'Activity Station' }}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ title: 'Report View' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  backButton: { paddingRight: 16 },
  backButtonText: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
  },
});
