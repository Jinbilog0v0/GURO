import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { LoginScreen } from '../screens/LoginScreen';
import { StudentDashboard } from '../screens/StudentDashboard';
import { TeacherDashboard } from '../screens/TeacherDashboard';
import { ParentDashboard } from '../screens/ParentDashboard';
import { AssessmentScreen } from '../screens/AssessmentScreen';
import { StudyScreen } from '../screens/StudyScreen';
import { DetailsScreen } from '../screens/DetailsScreen';
import { Colors } from '../theme/colors';
import { Fonts } from '../theme/typography';
import { useAppStore } from '../store/useAppStore';

export type RootStackParamList = {
  Login: undefined;
  StudentDashboard: undefined;
  TeacherDashboard: undefined;
  ParentDashboard: undefined;
  Assessment: { subject: string; gradeLevel: number; topic: string };
  Study: { subject: string; gradeLevel: number; topic: string };
  Details: { fileName: string; content: string };
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
  const { appMode, currentUser } = useAppStore();
  const isPinMode = appMode === 'offline' || currentUser?.role === 'student';

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.bgSidebar,
        },
        headerTintColor: Colors.textMain,
        headerTitleStyle: {
          fontFamily: Fonts.display,
          fontSize: 16,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.bgMain,
        },
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }} // Full-screen branding — no header
      />
      <Stack.Screen
        name="StudentDashboard"
        component={StudentDashboard}
        options={{ title: 'GURO · Kid Zone', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="TeacherDashboard"
        component={TeacherDashboard}
        options={({ navigation }) => ({
          title: 'Teacher Console',
          headerBackVisible: !isPinMode,
          headerLeft: isPinMode ? () => <ReturnToStudentButton /> : undefined,
          gestureEnabled: !isPinMode,
        })}
      />
      <Stack.Screen
        name="ParentDashboard"
        component={ParentDashboard}
        options={({ navigation }) => ({
          title: 'Parent Portal',
          headerBackVisible: !isPinMode,
          headerLeft: isPinMode ? () => <ReturnToStudentButton /> : undefined,
          gestureEnabled: !isPinMode,
        })}
      />
      <Stack.Screen
        name="Study"
        component={StudyScreen}
        options={{ title: 'Learning Lab 📖' }}
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
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
  },
});
