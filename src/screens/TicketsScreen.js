import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  Avatar,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { APP_CONFIG } from '../constants/config';
import { formatDateTime, getRelativeTime } from '../utils/dateUtils';
import DatabaseService from '../services/database';
import StorageService from '../services/storage';

const TicketsScreen = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'

  useEffect(() => {
    loadUserData();
    loadTickets();
  }, []);

  // Reload tickets when view mode changes
  useEffect(() => {
    if (userData) {
      loadTickets();
    }
  }, [viewMode]);

  const loadUserData = async () => {
    const user = await StorageService.getUserData();
    setUserData(user);
  };

  const loadTickets = async () => {
    try {
      const user = await StorageService.getUserData();
      if (user) {
        // Load tickets based on view mode
        let result;
        if (viewMode === 'my') {
          // Load only user's tickets
          result = await DatabaseService.getTickets(user.id);
        } else {
          // Load all tickets from user's building
          result = await DatabaseService.getTickets(null, user.buildingId);
        }
        
        if (result.success) {
          setTickets(result.data);
        } else {
          // Load cached data if available
          if (result.cachedData) {
            setTickets(result.cachedData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  }, [viewMode]); // Added viewMode as dependency

  const getStatusColor = (status) => {
    const statusConfig = APP_CONFIG.ticket.statuses.find(s => s.value === status);
    return statusConfig ? statusConfig.color : Colors.gray;
  };

  const getStatusLabel = (status) => {
    const statusConfig = APP_CONFIG.ticket.statuses.find(s => s.value === status);
    return statusConfig ? statusConfig.label : status;
  };

  const renderTicketCard = (ticket) => (
    <Card key={ticket.id} style={styles.ticketCard} elevation={2}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('TicketDetails', { ticket })}
        style={styles.cardContent}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={40} 
              label={ticket.username ? ticket.username.substring(0, 2).toUpperCase() : 'UN'}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.username}>{ticket.username || 'Unknown User'}</Text>
              {viewMode === 'all' && (
                <Text style={styles.buildingInfo}>{ticket.buildingId || 'Unknown'}-{ticket.houseNumber || 'N/A'}</Text>
              )}
              <Text style={styles.timestamp}>
                {getRelativeTime(ticket.createdAt?.toDate?.() || ticket.createdAt)}
              </Text>
            </View>
          </View>
          
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(ticket.status) }]}
            textStyle={styles.statusChipText}
          >
            {getStatusLabel(ticket.status)}
          </Chip>
        </View>

        <View style={styles.ticketContent}>
          <Title style={styles.ticketTitle} numberOfLines={2}>
            {ticket.category || 'General Issue'}
          </Title>
          
          <Paragraph style={styles.ticketDescription} numberOfLines={3}>
            {ticket.description}
          </Paragraph>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <View style={styles.attachmentsInfo}>
              <Text style={styles.attachmentsText}>
                📎 {ticket.attachments.length} attachment{ticket.attachments.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.ticketFooter}>
          <Text style={styles.ticketId}>
            #{ticket.ticketId || ticket.id.substring(0, 8)}
          </Text>
          
          <Text style={styles.fullTimestamp}>
            {formatDateTime(ticket.createdAt?.toDate?.() || ticket.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Tickets Found</Text>
      <Text style={styles.emptyStateText}>
        {viewMode === 'my' 
          ? "You haven't raised any tickets yet.\nTap the + button to create your first ticket."
          : `No tickets have been raised in Building ${userData?.buildingId || 'your building'} yet.\nBe the first to raise a ticket!`
        }
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('RaiseTicket')}
        style={styles.createTicketButton}
        labelStyle={styles.createTicketButtonText}
      >
        {viewMode === 'my' ? 'Raise Your First Ticket' : 'Raise a Ticket'}
      </Button>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading tickets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            {
              value: 'my',
              label: 'My Tickets',
              icon: 'account',
            },
            {
              value: 'all',
              label: 'Building Tickets',
              icon: 'home-city',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {tickets.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {viewMode === 'my' ? 'Your Tickets' : `Building ${userData?.buildingId || ''} Tickets`}
              </Text>
              <Text style={styles.headerSubtitle}>
                {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found
              </Text>
            </View>

            <View style={styles.ticketsList}>
              {tickets.map(ticket => renderTicketCard(ticket))}
            </View>
          </>
        )}
      </ScrollView>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('RaiseTicket')}
        style={styles.fabButton}
        labelStyle={styles.fabButtonText}
        icon="plus"
      >
        Raise Ticket
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl + 60, // Space for FAB
  },
  header: {
    marginBottom: Layout.spacing.lg,
  },
  headerTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  headerSubtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  ticketsList: {
    gap: Layout.spacing.md,
  },
  ticketCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.md,
  },
  cardContent: {
    padding: Layout.spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: Colors.primary,
    marginRight: Layout.spacing.sm,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  buildingInfo: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 1,
  },
  timestamp: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusChip: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChipText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: Layout.fontSize.xs * 1.2,
  },
  ticketContent: {
    marginBottom: Layout.spacing.md,
  },
  ticketTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  ticketDescription: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Layout.spacing.sm,
  },
  attachmentsInfo: {
    marginTop: Layout.spacing.sm,
  },
  attachmentsText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  ticketId: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  fullTimestamp: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    marginTop: Layout.spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  emptyStateText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.xl,
  },
  createTicketButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  createTicketButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  fabButton: {
    position: 'absolute',
    bottom: Layout.spacing.lg,
    right: Layout.spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.xl,
    elevation: 4,
  },
  fabButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  toggleContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  segmentedButtons: {
    backgroundColor: Colors.background,
  },
});

export default TicketsScreen;
