import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import apiService from '../services/api';
import { Ticket, RootStackParamList } from '../types';

type TicketDetailRouteProp = RouteProp<RootStackParamList, 'TicketDetail'>;

export default function TicketDetailScreen() {
  const route = useRoute<TicketDetailRouteProp>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { ticketId } = route.params;
  
  const [refreshing, setRefreshing] = useState(false);

  const { data: ticket, isLoading, refetch } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => apiService.getTicket(ticketId),
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: any }) =>
      apiService.updateTicket(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const handleStatusChange = (newStatus: Ticket['status']) => {
    Alert.alert(
      'Update Status',
      `Change ticket status to "${newStatus.replace('_', ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            updateTicketMutation.mutate({
              ticketId,
              data: { status: newStatus }
            });
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#EF4444';
      case 'assigned': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'pending': return '#8B5CF6';
      case 'resolved': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !ticket) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading ticket...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Ticket not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => refetch()}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusOptions: Ticket['status'][] = [
    'new', 'assigned', 'in_progress', 'pending', 'resolved'
  ];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{ticket.title}</Text>
        <View style={styles.headerMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
            <Text style={styles.badgeText}>{ticket.priority.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
            <Text style={styles.badgeText}>{ticket.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{ticket.description}</Text>
      </View>

      {/* Client Information */}
      {ticket.client && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.clientInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{ticket.client.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{ticket.client.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{ticket.client.phone}</Text>
            </View>
            {ticket.client.company && (
              <View style={styles.infoRow}>
                <Ionicons name="business" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{ticket.client.company}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Device Information */}
      {ticket.device && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          <View style={styles.deviceInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="laptop" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{ticket.device.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="build" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{ticket.device.type}</Text>
            </View>
            {ticket.device.model && (
              <View style={styles.infoRow}>
                <Ionicons name="hardware-chip" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{ticket.device.model}</Text>
              </View>
            )}
            {ticket.device.serialNumber && (
              <View style={styles.infoRow}>
                <Ionicons name="barcode" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{ticket.device.serialNumber}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Ticket Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ticket Details</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>{formatDate(ticket.createdAt)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>{formatDate(ticket.updatedAt)}</Text>
          </View>
          {ticket.estimatedCost && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Estimated Cost</Text>
              <Text style={styles.detailValue}>${ticket.estimatedCost}</Text>
            </View>
          )}
          {ticket.actualCost && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Actual Cost</Text>
              <Text style={styles.detailValue}>${ticket.actualCost}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="camera" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call" size={24} color="#10B981" />
            <Text style={styles.actionText}>Call Client</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="time" size={24} color="#F59E0B" />
            <Text style={styles.actionText}>Log Time</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={24} color="#8B5CF6" />
            <Text style={styles.actionText}>Add Parts</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Update */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Update Status</Text>
        <View style={styles.statusGrid}>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusOption,
                { backgroundColor: getStatusColor(status) },
                ticket.status === status && styles.statusOptionActive
              ]}
              onPress={() => handleStatusChange(status)}
              disabled={ticket.status === status || updateTicketMutation.isPending}
            >
              <Text style={styles.statusOptionText}>
                {status.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  clientInfo: {
    gap: 12,
  },
  deviceInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statusGrid: {
    gap: 8,
  },
  statusOption: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusOptionActive: {
    opacity: 0.5,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});