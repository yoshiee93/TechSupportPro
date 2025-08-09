import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type BarcodeScannerRouteProp = RouteProp<RootStackParamList, 'BarcodeScanner'>;

export default function BarcodeScannerScreen() {
  const route = useRoute<BarcodeScannerRouteProp>();
  const navigation = useNavigation();
  const { onScan } = route.params;
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Vibration.vibrate(100); // Quick vibration feedback
    
    Alert.alert(
      'Barcode Scanned',
      `Barcode: ${data}`,
      [
        {
          text: 'Scan Again',
          onPress: () => setScanned(false),
          style: 'cancel',
        },
        {
          text: 'Use This Code',
          onPress: () => {
            onScan(data);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera" size={48} color="#6B7280" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={48} color="#EF4444" />
        <Text style={styles.permissionText}>No access to camera</Text>
        <Text style={styles.permissionSubtext}>
          Please grant camera permission in your device settings to scan barcodes
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            // On real device, this would open app settings
            Alert.alert('Permission Required', 'Please enable camera access in Settings > Apps > TechFix Pro > Permissions');
          }}
        >
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.scanner}
        flashMode={flashEnabled ? 'torch' : 'off'}
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top overlay */}
        <View style={styles.overlayTop}>
          <Text style={styles.instructionText}>
            Position the barcode within the frame
          </Text>
        </View>
        
        {/* Scanning frame */}
        <View style={styles.scanFrame}>
          <View style={styles.scanArea}>
            {/* Corner indicators */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
        </View>
        
        {/* Bottom overlay with controls */}
        <View style={styles.overlayBottom}>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlash}
            >
              <Ionicons 
                name={flashEnabled ? 'flash' : 'flash-off'} 
                size={24} 
                color="white" 
              />
              <Text style={styles.controlText}>
                {flashEnabled ? 'Flash On' : 'Flash Off'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color="white" />
              <Text style={styles.controlText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          {scanned && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanText}>Tap to scan again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  scanner: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 32,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  settingsButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  scanFrame: {
    height: 250,
    marginHorizontal: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3B82F6',
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 50,
  },
  controlButton: {
    alignItems: 'center',
    padding: 16,
  },
  controlText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  rescanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 32,
  },
  rescanText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});