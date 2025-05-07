import { View, Text, StyleSheet } from "react-native";
import React from "react";
export default function FavoriteScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Plan Your Trips here!!</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, color: "white" },
});
