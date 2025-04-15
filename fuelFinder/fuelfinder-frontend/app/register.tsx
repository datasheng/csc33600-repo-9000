import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Register() {
  return (
    <View>
      <Text>Please Register To Continue</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, color: "white" },
});
