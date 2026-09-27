import React, { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { PrimaryButton } from "./PrimaryButton";
import { colors, spacing } from "../theme";

/**
 * Full-screen barcode scanner. Calls onScanned once per distinct scan session
 * (guarded so a single barcode held in frame doesn't fire repeatedly).
 */
export function BarcodeScanner({
  onScanned,
  onClose,
}: {
  onScanned: (code: string) => void;
  onClose: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const hasScannedRef = useRef(false);

  const handleScanned = (result: BarcodeScanningResult) => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;
    onScanned(result.data);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.message}>StockPilot needs camera access to scan barcodes.</Text>
        <PrimaryButton title="Grant Camera Access" onPress={requestPermission} />
        <PrimaryButton title="Cancel" onPress={onClose} variant="outline" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code39", "code128", "qr"],
        }}
        onBarcodeScanned={handleScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hint}>Align the barcode within the frame</Text>
      </View>
      <View style={styles.closeButtonWrap}>
        <PrimaryButton title="Cancel" onPress={onClose} variant="outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.lg },
  message: { color: colors.text, backgroundColor: "#fff", padding: spacing.md, borderRadius: 8, textAlign: "center" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  frame: {
    width: "75%",
    aspectRatio: 1.6,
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 16,
  },
  hint: { color: "#fff", fontSize: 14, fontWeight: "600" },
  closeButtonWrap: { position: "absolute", bottom: spacing.xl, left: spacing.lg, right: spacing.lg },
});
