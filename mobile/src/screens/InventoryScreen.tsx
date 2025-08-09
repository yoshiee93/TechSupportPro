import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../services/api';
import { Part } from '../types';

export default function InventoryScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: parts, isLoading, refetch } = useQuery({
    queryKey: ['parts'],
    queryFn: () => apiService.getParts(),
  });

  const filteredParts = parts?.filter((part: Part) => {
    const query = searchQuery.toLowerCase();
    return (
      part.name.toLowerCase().includes(query) ||
      part.sku.toLowerCase().includes(query) ||
      part.description?.toLowerCase().includes(query) ||
      part.category.toLowerCase().includes(query)
    );
  }) || [];

  const lowStockParts = filteredParts.filter((part: Part) => 
    part.quantityOnHand <= part.reorderPoint
  );

  const handleBarcodeSearch = (barcode: string) => {
    // Search for part by barcode
    const foundPart = parts?.find((part: Part) => part.barcode === barcode);
    if (foundPart) {
      Alert.alert(
        'Part Found',
        `${foundPart.name} (${foundPart.sku})\nStock: ${foundPart.quantityOnHand}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Part Not Found',
        `No part found with barcode: ${barcode}`,
        [{ text: 'OK' }]
      );
    }
  };

  const getStockStatus = (part: Part) => {
    if (part.quantityOnHand === 0) return { status: 'Out of Stock', color: '#EF4444' };
    if (part.quantityOnHand <= part.reorderPoint) return { status: 'Low Stock', color: '#F59E0B' };
    return { status: 'In Stock', color: '#10B981' };
  };

  const renderPart = ({ item: part }: { item: Part }) => {
    const stockInfo = getStockStatus(part);
    
    return (
      <TouchableOpacity style={styles.partCard}>
        <View style={styles.partHeader}>
          <View style={styles.partTitleRow}>
            <Text style={styles.partName} numberOfLines={1}>
              {part.name}
            </Text>
            <View style={[styles.stockBadge, { backgroundColor: stockInfo.color }]}>
              <Text style={styles.stockText}>{stockInfo.status}</Text>
            </View>
          </View>
          <Text style={styles.partSku}>SKU: {part.sku}</Text>
        </View>
        
        {part.description && (
          <Text style={styles.partDescription} numberOfLines={2}>
            {part.description}
          </Text>
        )}
        
        <View style={styles.partMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="cube" size={16} color="#6B7280" />
            <Text style={styles.metaText}>Stock: {part.quantityOnHand}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="warning" size={16} color="#6B7280" />
            <Text style={styles.metaText}>Reorder: {part.reorderPoint}</Text>
          </View>
        </View>
        
        <View style={styles.partFooter}>
          <View style={styles.priceInfo}>
            <Text style={styles.costText}>Cost: ${part.cost}</Text>
            <Text style={styles.priceText}>Price: ${part.price}</Text>
          </View>
          {part.location && (
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={14} color="#6B7280" />
              <Text style={styles.locationText}>{part.location}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search parts by name, SKU, or category..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('BarcodeScanner' as never, { 
              onScan: handleBarcodeSearch 
            })}
          >
            <Ionicons name="scan" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <View style={styles.alertContainer}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.alertText}>
              {lowStockParts.length} item{lowStockParts.length > 1 ? 's' : ''} low on stock
            </Text>
          </View>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filteredParts.length}</Text>
          <Text style={styles.statLabel}>Total Parts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
            {lowStockParts.length}
          </Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>
            {filteredParts.filter(p => p.quantityOnHand === 0).length}
          </Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
      </View>

      {/* Parts List */}
      <FlatList
        data={filteredParts}
        keyExtractor={(item) => item.id}
        renderItem={renderPart}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No parts found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Inventory is empty'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  scanButton: {
    padding: 8,
    marginLeft: 8,
  },
  alertContainer: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 16,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  partCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  partHeader: {
    marginBottom: 8,
  },
  partTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  partName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  partSku: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  partDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  partMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  partFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  costText: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});