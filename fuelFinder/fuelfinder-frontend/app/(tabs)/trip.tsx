import React from "react";
import { Text, View, StyleSheet } from "react-native";

export default function TripScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Quickest Route to your destination</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, color: "white" },
});
