import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPlanTrip: (start: string, destination: string) => void;
};

export default function TripPlannerModal({
  visible,
  onClose,
  onPlanTrip,
}: Props) {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");

  const handleSubmit = () => {
    if (start.trim() && destination.trim()) {
      onPlanTrip(start, destination);
      setStart("");
      setDestination("");
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.header}>Plan Your Trip</Text>

          <TextInput
            style={styles.input}
            placeholder="Start Location"
            placeholderTextColor="#aaa"
            value={start}
            onChangeText={setStart}
          />

          <TextInput
            style={styles.input}
            placeholder="Destination"
            placeholderTextColor="#aaa"
            value={destination}
            onChangeText={setDestination}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Plan Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: "#1f1f2e",
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#00c2ff",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  cancelText: {
    textAlign: "center",
    fontSize: 14,
    color: "#999",
  },
});
