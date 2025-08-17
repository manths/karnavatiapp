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
  Modal,
  ScrollView,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  IconButton,
  Searchbar,
  FAB,
  Button,
  Portal,
  Dialog,
  Divider,
  Surface,
  Badge,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { USER_ROLES, hasPermission, PERMISSIONS } from '../constants/userRoles';
import { SafeAccess, SafeAsync, SafeConsole } from '../utils/safeAccess';
import { formatDate, getRelativeTime } from '../utils/dateUtils';
import { formatCurrency } from '../utils/helpers';
import DatabaseService from '../services/database';
import StorageService from '../services/storage';
import { useToast } from '../context/ToastContext';

const PaymentReceiptsScreen = ({ navigation, route }) => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedHouse, setSelectedHouse] = useState('all');
  const [userData, setUserData] = useState(null);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { showSuccess, showError } = useToast();

  // Check if opened from notification
  const highlightPaymentId = route?.params?.paymentId;

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      loadPayments();
    }
  }, [userData]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, selectedStatus, selectedHouse]);

  const loadUserData = async () => {
    try {
      console.log('🔍 Loading user data...');
      const user = await SafeAsync.execute(StorageService.getUserData, null);
      console.log('👤 User data loaded:', user ? `${user.username} (${user.role})` : 'null');
      setUserData(user);
    } catch (error) {
      SafeConsole.error('Error loading user data:', error);
      showError('Failed to load user data');
    }
  };

  const loadPayments = async () => {
    try {
      console.log('💳 Loading payments for user:', userData?.username, 'Role:', userData?.role);
      let result;
      if (userData?.role === USER_ROLES.ADMIN) {
        console.log('👑 Admin user - loading all payments');
        result = await DatabaseService.getAllPayments();
      } else {
        console.log('👤 Member user - loading user payments for ID:', userData.id);
        result = await DatabaseService.getUserPayments(userData.id);
      }
      
      console.log('📊 Payment result:', result);
      
      if (result.success) {
        console.log(`✅ Loaded ${result.data.length} payments`);
        setPayments(result.data);
      } else {
        console.log('❌ Failed to load payments:', result.error);
        showError('Failed to load payment receipts');
      }
    } catch (error) {
      SafeConsole.error('Error loading payments:', error);
      showError('Failed to load payment receipts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(payment =>
        payment.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.houseNumber?.includes(searchQuery) ||
        payment.buildingId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status === selectedStatus);
    }

    // Filter by house (admin only)
    if (selectedHouse !== 'all' && userData?.role === USER_ROLES.ADMIN) {
      filtered = filtered.filter(payment => payment.houseNumber === selectedHouse);
    }

    setFilteredPayments(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const addSampleData = async () => {
    try {
      console.log('🧪 Adding sample payment data...');
      setLoading(true);
      
      const samplePayments = [
        {
          userId: userData.id,
          username: userData.username,
          buildingId: userData.buildingId,
          houseNumber: userData.houseNumber,
          amount: 2500,
          description: 'Monthly Maintenance - July 2025',
          transactionId: 'TXN202507001',
          paymentMethod: 'UPI',
          upiId: 'sagarmanthan0001-1@oksbi',
          status: 'success',
          expectedAmount: 2500,
          expectedUPIId: 'sagarmanthan0001-1@oksbi',
          smsDetails: {
            amount: 2500,
            upiId: 'sagarmanthan0001-1@oksbi',
            transactionId: '559526315119',
            date: '17-08-25',
            bankDetails: 'Kotak Bank AC',
            isPaymentConfirmation: true
          },
          smsVerified: true
        },
        {
          userId: 'member123',
          username: 'John Doe',
          buildingId: 'F',
          houseNumber: '102',
          amount: 2500,
          description: 'Monthly Maintenance - July 2025',
          transactionId: 'TXN202507002',
          paymentMethod: 'UPI',
          upiId: 'sagarmanthan0001-1@oksbi',
          status: 'pending',
          expectedAmount: 2500,
          expectedUPIId: 'sagarmanthan0001-1@oksbi'
        },
        {
          userId: 'member456',
          username: 'Jane Smith',
          buildingId: 'F',
          houseNumber: '201',
          amount: 1800,
          description: 'Water Bill - July 2025',
          transactionId: 'TXN202507003',
          paymentMethod: 'UPI',
          upiId: 'sagarmanthan0001-1@oksbi',
          status: 'failed',
          expectedAmount: 1800,
          expectedUPIId: 'sagarmanthan0001-1@oksbi'
        }
      ];

      for (const payment of samplePayments) {
        const result = await DatabaseService.savePaymentWithSMS(payment, payment.smsDetails || null);
        if (result.success) {
          console.log(`✅ Added payment: ${payment.username} - ₹${payment.amount} - ${payment.status}`);
        } else {
          console.log(`❌ Failed to add payment for ${payment.username}:`, result.error);
        }
      }

      showSuccess('Sample payment data added successfully!');
      await loadPayments(); // Reload the payments
    } catch (error) {
      console.error('❌ Error adding sample payments:', error);
      showError('Failed to add sample data');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const result = await DatabaseService.updatePaymentStatus(paymentId, newStatus);
      if (result.success) {
        showSuccess(`Payment status updated to ${newStatus}`);
        loadPayments();
      } else {
        showError('Failed to update payment status');
      }
    } catch (error) {
      SafeConsole.error('Error updating payment status:', error);
      showError('Failed to update payment status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return Colors.success;
      case 'failed': return Colors.error;
      case 'pending': return Colors.warning;
      default: return Colors.surface;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return 'check-circle';
      case 'failed': return 'close-circle';
      case 'pending': return 'clock';
      default: return 'help-circle';
    }
  };

  const renderPaymentItem = ({ item }) => {
    const isHighlighted = highlightPaymentId === item.id;
    
    return (
      <Card 
        style={[
          styles.paymentCard,
          isHighlighted && styles.highlightedCard
        ]}
        onPress={() => {
          setSelectedPayment(item);
          setShowPaymentDialog(true);
        }}
      >
        <Card.Content>
          <View style={styles.paymentHeader}>
            <View style={styles.paymentInfo}>
              <Title style={styles.paymentAmount}>
                {formatCurrency(item.amount)}
              </Title>
              {userData?.role === USER_ROLES.ADMIN && (
                <Paragraph style={styles.userInfo}>
                  {item.username} • {item.buildingId}-{item.houseNumber}
                </Paragraph>
              )}
              <Paragraph style={styles.description}>
                {item.description}
              </Paragraph>
            </View>
            <View style={styles.statusContainer}>
              <Chip
                icon={getStatusIcon(item.status)}
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
                textStyle={styles.statusText}
              >
                {item.status.toUpperCase()}
              </Chip>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.paymentFooter}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionId}>
                ID: {item.transactionId}
              </Text>
              <Text style={styles.timestamp}>
                {getRelativeTime(item.createdAt?.toDate?.() || item.createdAt)}
              </Text>
            </View>
            
            {userData?.role === USER_ROLES.ADMIN && item.status === 'pending' && (
              <View style={styles.adminActions}>
                <IconButton
                  icon="check"
                  iconColor={Colors.success}
                  size={24}
                  onPress={() => updatePaymentStatus(item.id, 'success')}
                />
                <IconButton
                  icon="close"
                  iconColor={Colors.error}
                  size={24}
                  onPress={() => updatePaymentStatus(item.id, 'failed')}
                />
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderFilterDialog = () => (
    <Portal>
      <Dialog visible={showFilterDialog} onDismiss={() => setShowFilterDialog(false)}>
        <Dialog.Title>Filter Payments</Dialog.Title>
        <Dialog.Content>
          {/* Status Filter */}
          <Text style={styles.filterLabel}>Status:</Text>
          <View style={styles.filterChips}>
            {[
              { key: 'all', label: 'All' },
              { key: 'success', label: 'Success' },
              { key: 'pending', label: 'Pending' },
              { key: 'failed', label: 'Failed' },
            ].map((status) => (
              <Chip
                key={status.key}
                selected={selectedStatus === status.key}
                onPress={() => setSelectedStatus(status.key)}
                style={styles.filterChip}
              >
                {status.label}
              </Chip>
            ))}
          </View>

          {/* House Filter (Admin Only) */}
          {userData?.role === USER_ROLES.ADMIN && (
            <>
              <Text style={styles.filterLabel}>House:</Text>
              <View style={styles.filterChips}>
                <Chip
                  selected={selectedHouse === 'all'}
                  onPress={() => setSelectedHouse('all')}
                  style={styles.filterChip}
                >
                  All Houses
                </Chip>
                {/* Add specific house filters based on available data */}
              </View>
            </>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => {
            setSelectedStatus('all');
            setSelectedHouse('all');
            setSearchQuery('');
          }}>
            Clear
          </Button>
          <Button onPress={() => setShowFilterDialog(false)}>
            Apply
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  const renderPaymentDialog = () => (
    <Portal>
      <Dialog 
        visible={showPaymentDialog} 
        onDismiss={() => setShowPaymentDialog(false)}
        style={styles.paymentDialog}
      >
        <Dialog.ScrollArea style={styles.dialogScrollArea}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedPayment && (
              <View style={styles.dialogContent}>
                {/* Header with Amount and Status */}
                <View style={styles.dialogHeader}>
                  <View style={styles.amountContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Text style={styles.dialogAmount}>
                      {selectedPayment.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Chip
                    icon={getStatusIcon(selectedPayment.status)}
                    style={[styles.dialogStatusChip, { backgroundColor: getStatusColor(selectedPayment.status) }]}
                    textStyle={styles.statusText}
                  >
                    {selectedPayment.status.toUpperCase()}
                  </Chip>
                </View>

                {/* Payment Info Card */}
                <Surface style={styles.infoCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="card-outline" size={24} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Payment Information</Text>
                  </View>
                  
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Description</Text>
                      <Text style={styles.infoValue}>{selectedPayment.description}</Text>
                    </View>
                    
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Transaction ID</Text>
                      <Text style={styles.infoValue}>{selectedPayment.transactionId}</Text>
                    </View>
                    
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Date & Time</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(selectedPayment.createdAt?.toDate?.() || selectedPayment.createdAt)}
                      </Text>
                    </View>
                    
                    {selectedPayment.upiId && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>UPI ID</Text>
                        <Text style={styles.infoValue}>{selectedPayment.upiId}</Text>
                      </View>
                    )}
                  </View>
                </Surface>

                {/* User Info Card (Admin Only) */}
                {userData?.role === USER_ROLES.ADMIN && (
                  <Surface style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                      <Ionicons name="person-outline" size={24} color={Colors.primary} />
                      <Text style={styles.cardTitle}>Member Information</Text>
                    </View>
                    
                    <View style={styles.infoGrid}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Name</Text>
                        <Text style={styles.infoValue}>{selectedPayment.username}</Text>
                      </View>
                      
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>House Number</Text>
                        <Text style={styles.infoValue}>
                          {selectedPayment.buildingId}-{selectedPayment.houseNumber}
                        </Text>
                      </View>
                    </View>
                  </Surface>
                )}

                {/* SMS Verification Card */}
                {selectedPayment.smsDetails ? (
                  <Surface style={[styles.infoCard, styles.smsCard]}>
                    <View style={styles.cardHeader}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                      <Text style={[styles.cardTitle, {color: Colors.success}]}>SMS Verified</Text>
                    </View>
                    
                    <View style={styles.infoGrid}>
                      {selectedPayment.smsDetails.bankDetails && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Bank Details</Text>
                          <Text style={styles.infoValue}>{selectedPayment.smsDetails.bankDetails}</Text>
                        </View>
                      )}
                      
                      {selectedPayment.smsDetails.transactionId && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>SMS Reference</Text>
                          <Text style={styles.infoValue}>{selectedPayment.smsDetails.transactionId}</Text>
                        </View>
                      )}
                      
                      {selectedPayment.smsDetails.date && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>SMS Date</Text>
                          <Text style={styles.infoValue}>{selectedPayment.smsDetails.date}</Text>
                        </View>
                      )}
                    </View>
                  </Surface>
                ) : selectedPayment.status === 'pending' && (
                  <Surface style={[styles.infoCard, styles.pendingCard]}>
                    <View style={styles.cardHeader}>
                      <Ionicons name="time-outline" size={24} color={Colors.warning} />
                      <Text style={[styles.cardTitle, {color: Colors.warning}]}>Pending Verification</Text>
                    </View>
                    
                    <Text style={styles.pendingText}>
                      This payment is awaiting SMS verification or admin approval.
                    </Text>
                  </Surface>
                )}

                {/* Admin Actions */}
                {userData?.role === USER_ROLES.ADMIN && selectedPayment?.status === 'pending' && (
                  <Surface style={[styles.infoCard, styles.actionsCard]}>
                    <View style={styles.cardHeader}>
                      <Ionicons name="settings-outline" size={24} color={Colors.primary} />
                      <Text style={styles.cardTitle}>Admin Actions</Text>
                    </View>
                    
                    <View style={styles.actionButtons}>
                      <Button 
                        mode="contained"
                        onPress={() => {
                          updatePaymentStatus(selectedPayment.id, 'success');
                          setShowPaymentDialog(false);
                        }}
                        style={[styles.actionButton, {backgroundColor: Colors.success}]}
                        labelStyle={styles.actionButtonText}
                      >
                        Approve Payment
                      </Button>
                      
                      <Button 
                        mode="contained"
                        onPress={() => {
                          updatePaymentStatus(selectedPayment.id, 'failed');
                          setShowPaymentDialog(false);
                        }}
                        style={[styles.actionButton, {backgroundColor: Colors.error}]}
                        labelStyle={styles.actionButtonText}
                      >
                        Reject Payment
                      </Button>
                    </View>
                  </Surface>
                )}
              </View>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        
        <Dialog.Actions style={styles.dialogActions}>
          <Button 
            onPress={() => setShowPaymentDialog(false)}
            mode="outlined"
            style={styles.closeButton}
          >
            Close
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Payment Receipts</Text>
      <Text style={styles.emptySubtitle}>
        {userData?.role === USER_ROLES.ADMIN 
          ? 'No payment transactions found in the system'
          : 'You haven\'t made any payments yet'
        }
      </Text>
      
      {/* Debug button to add sample data */}
      {userData?.role === USER_ROLES.ADMIN && (
        <Button
          mode="outlined"
          onPress={addSampleData}
          style={[styles.emptyButton, {marginBottom: Layout.spacing.md}]}
        >
          Add Sample Data (Debug)
        </Button>
      )}
      
      {userData?.role !== USER_ROLES.ADMIN && (
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Payment')}
          style={styles.emptyButton}
        >
          Make Payment
        </Button>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchRow}>
        {/* Search */}
        <Searchbar
          placeholder="Search by name, transaction ID, or house number"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          onFocus={() => {}}
          onBlur={() => {}}
          autoComplete="off"
          autoCorrect={false}
          keyboardType="default"
          returnKeyType="search"
          blurOnSubmit={false}
        />

        {/* Filter Button */}
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterDialog(true)}
        >
          <Ionicons name="filter" size={20} color={Colors.primary} />
          <Text style={styles.filterButtonText}>Filter</Text>
          {(selectedStatus !== 'all' || selectedHouse !== 'all') && (
            <Badge style={styles.filterBadge}>!</Badge>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading payment receipts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredPayments}
        renderItem={renderPaymentItem}
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
      
      {renderFilterDialog()}
      {renderPaymentDialog()}
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
  },
  listContent: {
    flexGrow: 1,
    padding: Layout.spacing.md,
  },
  header: {
    marginBottom: Layout.spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  searchBar: {
    flex: 1,
    elevation: 2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface,
    minWidth: 80,
  },
  filterButtonText: {
    marginLeft: Layout.spacing.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  filterBadge: {
    marginLeft: Layout.spacing.xs,
    backgroundColor: Colors.error,
  },
  paymentCard: {
    marginBottom: Layout.spacing.md,
    elevation: 2,
  },
  highlightedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Layout.spacing.xs,
  },
  userInfo: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  description: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusChip: {
    elevation: 1,
  },
  statusText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: Layout.spacing.md,
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  adminActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  filterChip: {
    marginRight: Layout.spacing.xs,
    marginBottom: Layout.spacing.xs,
  },
  paymentDialog: {
    margin: Layout.spacing.md,
  },
  dialogContent: {
    paddingVertical: Layout.spacing.md,
  },
  amountSurface: {
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.md,
    alignItems: 'center',
    elevation: 1,
  },
  dialogAmount: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Layout.spacing.sm,
  },
  dialogStatusChip: {
    elevation: 1,
  },
  detailsContainer: {
    gap: Layout.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    flex: 2,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  emptyTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  emptySubtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.xl,
  },
  emptyButton: {
    paddingHorizontal: Layout.spacing.xl,
  },
  sectionDivider: {
    marginVertical: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Layout.spacing.sm,
  },
  pendingNote: {
    backgroundColor: Colors.warning + '20',
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  pendingNoteTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: 'bold',
    color: Colors.warning,
    marginBottom: Layout.spacing.xs,
  },
  pendingNoteText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
    lineHeight: 18,
  },
  // New improved modal styles
  dialogScrollArea: {
    maxHeight: '70%',
  },
  dialogHeader: {
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Layout.spacing.sm,
  },
  currencySymbol: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: Layout.spacing.xs,
  },
  infoCard: {
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  cardTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: Layout.spacing.sm,
  },
  infoGrid: {
    gap: Layout.spacing.md,
  },
  infoItem: {
    backgroundColor: Colors.lightGray,
    padding: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.sm,
  },
  infoLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  infoValue: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  smsCard: {
    backgroundColor: Colors.success + '10',
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  pendingCard: {
    backgroundColor: Colors.warning + '10',
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  pendingText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    fontStyle: 'italic',
  },
  actionsCard: {
    backgroundColor: Colors.primary + '05',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: Layout.borderRadius.md,
  },
  actionButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: 'bold',
  },
  dialogActions: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.md,
  },
  closeButton: {
    borderColor: Colors.primary,
  },
});

export default PaymentReceiptsScreen;
