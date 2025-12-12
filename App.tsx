import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import MapScreen from './src/screens/MapScreen';
import InfoScreen from './src/screens/InfoScreen';
import { DESTINATION } from './src/constants/Coords';
import { getHaversineDistance } from './src/utils/MathUtils';

const Tab = createBottomTabNavigator();

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<Location.LocationGeocodedAddress[] | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permissão de localização negada');
          setLoading(false);
          return;
        }

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 1 },
          (newLocation) => {
            setLocation(newLocation);
            const dist = getHaversineDistance(
              newLocation.coords.latitude,
              newLocation.coords.longitude,
              DESTINATION.latitude,
              DESTINATION.longitude
            );
            setDistance(dist);
            setLoading(false);
          }
        );

        let loc = await Location.getCurrentPositionAsync({});
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
        setAddress(reverseGeocode);

      } catch (error) {
        setErrorMsg('Erro ao obter localização');
        setLoading(false);
      }
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="tomato" />
        <Text>Iniciando App...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', fontSize: 16 }}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false, 
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'map';
            if (route.name === 'Mapa') {
              iconName = focused ? 'map' : 'map-outline';
            } else if (route.name === 'Informações') {
              iconName = focused ? 'information-circle' : 'information-circle-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        
        <Tab.Screen 
          name="Mapa"
          options={{
            headerShown: true,        
            headerTitle: "Tela do Mapa",
            headerTitleAlign: 'center', 
            headerStyle: {
              backgroundColor: '#fff', 
              borderBottomWidth: 1,   
              borderBottomColor: '#eee'
            },
            headerTitleStyle: {
              fontWeight: 'bold',
              color: '#333'
            }
          }}
        >
          {() => <MapScreen location={location} />}
        </Tab.Screen>
        
        <Tab.Screen name="Informações">
          {() => <InfoScreen location={location} address={address} distance={distance} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}