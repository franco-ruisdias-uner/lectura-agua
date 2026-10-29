import { useEffect, useState } from 'react'
import { Modal, StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'

import { Button } from '@/components/Button'
import { colors } from '@/theme/colors'

type QrScannerProps = {
  visible: boolean
  onClose: () => void
  onScan: (data: string) => void
}

export function QrScanner({ visible, onClose, onScan }: QrScannerProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)

  useEffect(() => {
    if (visible) setScanned(false)
  }, [visible])

  const handleBarcode = (data: string) => {
    if (scanned || data.length === 0) return
    setScanned(true)
    onScan(data)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {!permission ? (
          <View style={styles.messageBox}>
            <Text style={styles.message}>Cargando permisos de cámara…</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.messageBox}>
            <Text style={styles.message}>
              Necesitamos la cámara para escanear el código QR del medidor.
            </Text>
            <Button label="Permitir cámara" onPress={() => void requestPermission()} />
            <Button label="Cerrar" variant="secondary" onPress={onClose} />
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : ({ data }) => handleBarcode(data)}
          >
            <View style={styles.overlay}>
              <Text style={styles.hint}>Apuntá al QR del medidor</Text>
              <Button label="Cerrar" variant="secondary" onPress={onClose} />
            </View>
          </CameraView>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  camera: {
    flex: 1,
  },
  messageBox: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  message: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    gap: 12,
  },
  hint: {
    color: colors.onAccent,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(22, 24, 38, 0.72)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
})
