import React, { useState } from "react";
import { Modal, View, TextInput, Button, StyleSheet, Text } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (price: string) => void;
};

export default function ConfirmPriceModal({
  visible,
  onClose,
  onSubmit,
}: Props) {
  const [price, setPrice] = useState("");

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.label}>Enter Updated Price</Text>
        <TextInput
          style={styles.input}
          placeholder="$3.45"
          keyboardType="decimal-pad"
          onChangeText={setPrice}
          value={price}
        />
        <Button title="Submit" onPress={() => onSubmit(price)} />
        <Button title="Cancel" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    marginTop: "50%",
    marginHorizontal: 20,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
  },
  input: {
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    fontSize: 16,
    borderRadius: 6,
  },
});
