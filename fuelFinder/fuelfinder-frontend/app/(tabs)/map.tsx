import { View, Text, StyleSheet } from "react-native";
import React from "react";
export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}> Map to the Nearest Station </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, color: "white" },
});
