import React from "react";
import { Marker, Callout } from "react-native-maps";
import { View, Text, Button, StyleSheet } from "react-native";

type Station = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  price: string;
};

type Props = {
  station: Station;
  onConfirm: (station: Station) => void;
  onSave: (station: Station) => void;
};

export default function StationMarker({ station, onConfirm, onSave }: Props) {
  return (
    <Marker
      coordinate={{
        latitude: station.latitude,
        longitude: station.longitude,
      }}
      title={station.name}
    >
      <Callout>
        <View style={styles.callout}>
          <Text style={styles.name}>{station.name}</Text>
          <Text style={styles.price}>{station.price}</Text>

          <Button title="Confirm Price" onPress={() => onConfirm(station)} />
          <Button title="Save" onPress={() => onSave(station)} />
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  callout: {
    width: 200,
    padding: 10,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    marginBottom: 8,
  },
});
