import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import Loader from './components/Loader';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomeScreen from './pages/HomeScreen';
import ProfileScreen from './pages/ProfileScreen';
import HistoryScreen from './pages/HistoryScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import { useEffect, useState } from 'react';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainApp() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // remove top header
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          position: 'absolute',
          bottom: 18,
          left: 16,
          right: 16,
          height: 86,
          borderRadius: 20,
          backgroundColor: '#FFFFFF',
          paddingTop: 10,
          borderWidth: 1,
          borderColor: '#E6EEF8',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Расчет"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Расчет',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Text style={{ color, fontSize: size }}>🧮</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Профиль"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Профиль',
        tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabIconCenter, focused ? styles.tabIconActiveCenter : styles.tabIconCenter]}>
              <Text style={{ color: focused ? '#fff' : '#333', fontSize: size + 4 }}>👤</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="История"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'История',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Text style={{ color, fontSize: size }}>📋</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  const [navigationKey, setNavigationKey] = useState(user ? 'auth' : 'no-auth');

  console.log('AppNavigator render - user:', user ? user.email : 'null', 'loading:', loading, 'key:', navigationKey);

  useEffect(() => {
    // Принудительно обновляем ключ навигации при изменении состояния пользователя
    const newKey = user ? 'auth' : 'no-auth';
    if (newKey !== navigationKey) {
      console.log('Changing navigation key from', navigationKey, 'to', newKey);
      setNavigationKey(newKey);
    }
  }, [user, navigationKey]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <Loader />
        <Text style={{ marginTop: 10, color: '#666' }}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer key={navigationKey}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={user ? 'MainApp' : 'Login'}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainApp" component={MainApp} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <Toast />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconActive: {
    backgroundColor: '#E7F2FF',
  },
  tabIconCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 6,
  },
  tabIconActiveCenter: {
    backgroundColor: '#E7F2FF',
  },
});
