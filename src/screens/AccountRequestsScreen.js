import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Button,
  Title,
  Paragraph,
  Avatar,
  Chip,
  IconButton,
  Searchbar,
  FAB,
} from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { USER_STATUS, USER_ROLES } from '../constants/userRoles';
import DatabaseService from '../services/database';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/dateUtils';

const AccountRequestsScreen = ({ navigation, route }) => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [processingIds, setProcessingIds] = useState(new Set());
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const { showSuccess, showError } = useToast();

  // Check if opened from notification
  const highlightRequestId = route?.params?.requestId;

  useEffect(() => {
    loadAccountRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, selectedStatus]);

  const loadAccountRequests = async () => {
    try {
      const result = await DatabaseService.getUserRequests();
      if (result.success) {
        // Filter out admin users from the requests list
        const nonAdminRequests = result.data.filter(user => user.role !== 'admin');
        setRequests(nonAdminRequests);
      } else {
        showError('Failed to load account requests');
      }
    } catch (error) {
      console.error('Error loading account requests:', error);
      showError('Failed to load account requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(request =>
        request.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.mobileNumber.includes(searchQuery) ||
        request.houseNumber.includes(searchQuery)
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(request => request.status === selectedStatus);
    }

    setFilteredRequests(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAccountRequests();
  };

  const handleApproveRequest = async (request) => {
    Alert.alert(
      'Approve Account Request',
      `Are you sure you want to approve ${request.username}'s account request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => processRequest(request.id, USER_STATUS.APPROVED),
        },
      ]
    );
  };

  const handleRejectRequest = async (request) => {
    Alert.alert(
      'Reject Account Request',
      `Are you sure you want to reject ${request.username}'s account request? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => processRequest(request.id, USER_STATUS.REJECTED),
        },
      ]
    );
  };

  const processRequest = async (requestId, newStatus) => {
    try {
      setProcessingIds(prev => new Set([...prev, requestId]));

      const result = await DatabaseService.updateUserStatus(requestId, newStatus);
      
      if (result.success) {
        const actionText = newStatus === USER_STATUS.APPROVED ? 'approved' : 'rejected';
        showSuccess(`Account request ${actionText} successfully!`);
        
        // Update local state
        setRequests(prev => 
          prev.map(request => 
            request.id === requestId 
              ? { ...request, status: newStatus, updatedAt: new Date() }
              : request
          )
        );

        // Send notification to user (you can implement push notifications here)
        // await NotificationService.sendUserStatusNotification(requestId, newStatus);
        
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      showError('Failed to process account request');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case USER_STATUS.PENDING:
        return Colors.warning;
      case USER_STATUS.APPROVED:
        return Colors.success;
      case USER_STATUS.REJECTED:
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case USER_STATUS.PENDING:
        return 'Pending';
      case USER_STATUS.APPROVED:
        return 'Approved';
      case USER_STATUS.REJECTED:
        return 'Rejected';
      default:
        return status;
    }
  };

  const renderRequestItem = ({ item }) => {
    const isHighlighted = item.id === highlightRequestId;
    const isProcessing = processingIds.has(item.id);

    return (
      <Card 
        style={[
          styles.requestCard,
          isHighlighted && styles.highlightedCard
        ]}
      >
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.requestHeader}>
            <View style={styles.userInfo}>
              <Avatar.Text
                size={50}
                label={item.username.charAt(0).toUpperCase()}
                style={[styles.avatar, { backgroundColor: getStatusColor(item.status) }]}
                labelStyle={styles.avatarLabel}
              />
              <View style={styles.userDetails}>
                <Title style={styles.userName}>{item.username}</Title>
                <Text style={styles.userMeta}>
                  {item.buildingId}-{item.houseNumber}
                </Text>
                <Text style={styles.userMobile}>
                  {item.countryCode} {item.mobileNumber}
                </Text>
              </View>
            </View>
            
            <Chip
              mode="outlined"
              style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
              textStyle={[styles.statusText, { color: getStatusColor(item.status) }]}
            >
              {getStatusText(item.status)}
            </Chip>
          </View>

          {/* Request Details */}
          <View style={styles.requestDetails}>
            <Text style={styles.requestDate}>
              Requested: {formatDate(item.createdAt)}
            </Text>
            {item.updatedAt && item.status !== USER_STATUS.PENDING && (
              <Text style={styles.processedDate}>
                {getStatusText(item.status)}: {formatDate(item.updatedAt)}
              </Text>
            )}
          </View>

          {/* Actions */}
          {item.status === USER_STATUS.PENDING && (
            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={() => handleApproveRequest(item)}
                style={styles.approveButton}
                labelStyle={styles.approveButtonText}
                disabled={isProcessing}
                loading={isProcessing}
              >
                Approve
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => handleRejectRequest(item)}
                style={styles.rejectButton}
                labelStyle={styles.rejectButtonText}
                disabled={isProcessing}
              >
                Reject
              </Button>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search */}
      <Searchbar
        placeholder="Search by name, mobile, or house number"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        onFocus={() => setSearchBarFocused(true)}
        onBlur={() => setSearchBarFocused(false)}
        autoComplete="off"
        autoCorrect={false}
        keyboardType="default"
        returnKeyType="search"
        blurOnSubmit={false}
      />

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Status:</Text>
        <View style={styles.filterChips}>
          {[
            { key: 'all', label: 'All' },
            { key: USER_STATUS.PENDING, label: 'Pending' },
            { key: USER_STATUS.APPROVED, label: 'Approved' },
            { key: USER_STATUS.REJECTED, label: 'Rejected' },
          ].map((filter) => (
            <Chip
              key={filter.key}
              mode={selectedStatus === filter.key ? 'flat' : 'outlined'}
              selected={selectedStatus === filter.key}
              onPress={() => setSelectedStatus(filter.key)}
              style={styles.filterChip}
              textStyle={styles.filterChipText}
            >
              {filter.label}
            </Chip>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {requests.filter(r => r.status === USER_STATUS.PENDING).length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {requests.filter(r => r.status === USER_STATUS.APPROVED).length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {requests.filter(r => r.status === USER_STATUS.REJECTED).length}
          </Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Avatar.Icon
        size={80}
        icon="account-multiple-outline"
        style={styles.emptyIcon}
      />
      <Title style={styles.emptyTitle}>No Account Requests</Title>
      <Paragraph style={styles.emptyText}>
        {selectedStatus === 'all' 
          ? 'No account requests found.' 
          : `No ${selectedStatus} requests found.`}
      </Paragraph>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredRequests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={handleRefresh}
        color={Colors.white}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    flexGrow: 1,
    padding: Layout.spacing.md,
  },
  header: {
    marginBottom: Layout.spacing.lg,
  },
  searchBar: {
    backgroundColor: Colors.surface,
    marginBottom: Layout.spacing.md,
  },
  filterContainer: {
    marginBottom: Layout.spacing.md,
  },
  filterLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  filterChip: {
    marginRight: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  filterChipText: {
    fontSize: Layout.fontSize.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  requestCard: {
    backgroundColor: Colors.surface,
    marginBottom: Layout.spacing.md,
    elevation: 2,
  },
  highlightedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  cardContent: {
    padding: Layout.spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    marginRight: Layout.spacing.md,
  },
  avatarLabel: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  userMeta: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  userMobile: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  statusChip: {
    marginLeft: Layout.spacing.sm,
  },
  statusText: {
    fontWeight: '600',
  },
  requestDetails: {
    marginBottom: Layout.spacing.md,
  },
  requestDate: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  processedDate: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  approveButton: {
    flex: 1,
    backgroundColor: Colors.success,
  },
  approveButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    borderColor: Colors.error,
  },
  rejectButtonText: {
    color: Colors.error,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xxl,
  },
  emptyIcon: {
    backgroundColor: Colors.lightGray,
    marginBottom: Layout.spacing.lg,
  },
  emptyTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  emptyText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: Layout.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
});

export default AccountRequestsScreen;
