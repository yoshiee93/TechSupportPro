import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../services/api';
import { Ticket } from '../types';

export default function TicketsScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => apiService.getTickets(),
  });

  const filteredTickets = tickets?.filter((ticket: Ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusOptions = [
    { value: null, label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending', label: 'Pending' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const renderTicket = ({ item: ticket }: { item: Ticket }) => (
    <TouchableOpacity
      style={[styles.ticketCard, { borderLeftColor: getStatusColor(ticket.status) }]}
      onPress={() => navigation.navigate('TicketDetail' as never, { ticketId: ticket.id })}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketTitleRow}>
          <Text style={styles.ticketTitle} numberOfLines={1}>
            {ticket.title}
          </Text>
          <Ionicons 
            name={getPriorityIcon(ticket.priority)} 
            size={16} 
            color={ticket.priority === 'urgent' ? '#EF4444' : '#6B7280'} 
          />
        </View>
        <View style={styles.ticketMeta}>
          <View 
            style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}
          >
            <Text style={styles.statusText}>{ticket.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <Text style={styles.ticketDate}>{formatDate(ticket.createdAt)}</Text>
        </View>
      </View>
      
      <Text style={styles.ticketDescription} numberOfLines={2}>
        {ticket.description}
      </Text>
      
      <View style={styles.ticketFooter}>
        {ticket.client && (
          <Text style={styles.clientName}>
            <Ionicons name="person" size={14} color="#6B7280" /> {ticket.client.name}
          </Text>
        )}
        {ticket.assignedTo && (
          <Text style={styles.assignedTo}>
            <Ionicons name="person-circle" size={14} color="#6B7280" /> Assigned
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusOptions}
          keyExtractor={(item) => item.value || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === item.value && styles.filterChipActive
              ]}
              onPress={() => setStatusFilter(item.value)}
            >
              <Text style={[
                styles.filterText,
                statusFilter === item.value && styles.filterTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Tickets List */}
      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        renderItem={renderTicket}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No tickets found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || statusFilter ? 'Try adjusting your filters' : 'All caught up!'}
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
  filterContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ticketHeader: {
    marginBottom: 12,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  ticketDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  assignedTo: {
    fontSize: 12,
    color: '#6B7280',
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