import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import MapView, { Region } from "react-native-maps";
import * as Location from "expo-location";
import type { LocationObjectCoords } from "expo-location";
import SearchBar from "../../components/map/SearchBar";
import ConfirmPriceModal from "../..//components/map/ConfirmPriceModal";
import StationMarker from "../../components/map/StationMarker";
import TripPlannerModal from "../../components/map/TripPlannerModal";

type Station = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  price: string;
};

export default function MapScreen() {
  const [location, setLocation] = useState<LocationObjectCoords | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);

  // Mock station data
  const stations: Station[] = [
    {
      id: 1,
      name: "Shell Gas Station",
      latitude: 40.81987,
      longitude: -73.94958,
      price: "$3.45",
    },
    {
      id: 2,
      name: "Exxon Mobil",
      latitude: 40.81734,
      longitude: -73.94421,
      price: "$3.39",
    },
  ];

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need location access.");
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation.coords);

      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  const handleConfirmPrice = (station: Station) => {
    setSelectedStation(station);
    setIsConfirming(true);
  };

  const handleSaveStation = (station: Station) => {
    Alert.alert("Saved", `${station.name} has been saved to favorites.`);
  };

  const handleSubmitPrice = (price: string) => {
    console.log("New price for", selectedStation?.name, ":", price);
    setIsConfirming(false);
  };

  const handlePlanTrip = (start: string, destination: string) => {
    console.log("Planning trip from", start, "to", destination);
    // Later: fetch directions and show on map
  };

  const filteredStations = stations.filter((station) =>
    station.name.toLowerCase().includes(searchText.toLowerCase())
  );

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00c2ff" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar value={searchText} onChange={setSearchText} />
      <MapView style={styles.map} region={region} showsUserLocation>
        {filteredStations.map((station) => (
          <StationMarker
            key={station.id}
            station={station}
            onConfirm={handleConfirmPrice}
            onSave={handleSaveStation}
          />
        ))}
      </MapView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowTripModal(true)}
      >
        <Text style={styles.fabText}>Plan Trip</Text>
      </TouchableOpacity>

      <ConfirmPriceModal
        visible={isConfirming}
        onClose={() => setIsConfirming(false)}
        onSubmit={handleSubmitPrice}
      />
      <TripPlannerModal
        visible={showTripModal}
        onClose={() => setShowTripModal(false)}
        onPlanTrip={(start, dest) => {
          console.log("Plan trip from:", start, "to:", dest);
          // Hook into your backend or Google Maps Directions API here
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1f1f2e",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1f1f2e",
  },
  loadingText: {
    color: "#ccc",
    marginTop: 12,
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#00c2ff",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    elevation: 5,
  },
  fabText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
