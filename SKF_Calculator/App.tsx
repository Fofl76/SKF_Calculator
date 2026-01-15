import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
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
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: 'white',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Расчет"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Расчет',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🧮</Text>
          ),
        }}
      />
      <Tab.Screen
        name="История"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'История',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Профиль"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
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
        <ActivityIndicator size="large" color="#007AFF" />
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
    </AuthProvider>
  );
}
