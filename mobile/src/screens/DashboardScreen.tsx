import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../services/api';
import { Ticket } from '../types';

export default function DashboardScreen() {
  const navigation = useNavigation();

  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => apiService.getTickets(),
  });

  const todayTickets = tickets?.filter((ticket: Ticket) => {
    const today = new Date().toDateString();
    const ticketDate = new Date(ticket.createdAt).toDateString();
    return today === ticketDate;
  }) || [];

  const urgentTickets = tickets?.filter((ticket: Ticket) => 
    ticket.priority === 'urgent' && ticket.status !== 'resolved'
  ) || [];

  const inProgressTickets = tickets?.filter((ticket: Ticket) => 
    ticket.status === 'in_progress'
  ) || [];

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'warning';
      case 'high': return 'arrow-up';
      case 'medium': return 'remove';
      case 'low': return 'arrow-down';
      default: return 'help';
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayTickets.length}</Text>
          <Text style={styles.statLabel}>Today's Tickets</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>
            {urgentTickets.length}
          </Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>
            {inProgressTickets.length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('BarcodeScanner' as never)}
          >
            <Ionicons name="scan" size={32} color="#3B82F6" />
            <Text style={styles.actionText}>Scan Barcode</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Tickets' as never)}
          >
            <Ionicons name="list" size={32} color="#10B981" />
            <Text style={styles.actionText}>View Tickets</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Clients' as never)}
          >
            <Ionicons name="people" size={32} color="#F59E0B" />
            <Text style={styles.actionText}>Find Client</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="camera" size={32} color="#8B5CF6" />
            <Text style={styles.actionText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Urgent Tickets */}
      {urgentTickets.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
            🚨 Urgent Tickets
          </Text>
          {urgentTickets.slice(0, 3).map((ticket: Ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={[styles.ticketCard, { borderLeftColor: '#EF4444' }]}
              onPress={() => navigation.navigate('TicketDetail' as never, { ticketId: ticket.id })}
            >
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketTitle} numberOfLines={1}>
                  {ticket.title}
                </Text>
                <View style={styles.ticketMeta}>
                  <Ionicons 
                    name={getPriorityIcon(ticket.priority)} 
                    size={16} 
                    color="#EF4444" 
                  />
                  <View 
                    style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}
                  >
                    <Text style={styles.statusText}>{ticket.status.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.ticketDescription} numberOfLines={2}>
                {ticket.description}
              </Text>
              {ticket.client && (
                <Text style={styles.clientName}>Client: {ticket.client.name}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Tickets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tickets</Text>
        {todayTickets.slice(0, 5).map((ticket: Ticket) => (
          <TouchableOpacity
            key={ticket.id}
            style={[styles.ticketCard, { borderLeftColor: getStatusColor(ticket.status) }]}
            onPress={() => navigation.navigate('TicketDetail' as never, { ticketId: ticket.id })}
          >
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketTitle} numberOfLines={1}>
                {ticket.title}
              </Text>
              <View style={styles.ticketMeta}>
                <Ionicons 
                  name={getPriorityIcon(ticket.priority)} 
                  size={16} 
                  color={ticket.priority === 'urgent' ? '#EF4444' : '#6B7280'} 
                />
                <View 
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}
                >
                  <Text style={styles.statusText}>{ticket.status.toUpperCase()}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.ticketDescription} numberOfLines={2}>
              {ticket.description}
            </Text>
            {ticket.client && (
              <Text style={styles.clientName}>Client: {ticket.client.name}</Text>
            )}
          </TouchableOpacity>
        ))}
        
        {todayTickets.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.emptyText}>No tickets for today!</Text>
            <Text style={styles.emptySubtext}>Great job staying on top of things</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  ticketCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  clientName: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
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