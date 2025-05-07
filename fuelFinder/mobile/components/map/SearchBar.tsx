import React from "react";
import { View, TextInput, StyleSheet } from "react-native";

type Props = {
  value: string;
  onChange: (text: string) => void;
};

export default function SearchBar({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search gas stations..."
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#ccc"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  input: {
    backgroundColor: "#1f1f2e",
    padding: 12,
    borderRadius: 12,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#00c2ff",
  },
});
