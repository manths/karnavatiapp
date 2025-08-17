import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
  Share,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  Divider,
  Avatar,
  IconButton,
  List,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { formatDateTime, getRelativeTime } from '../utils/dateUtils';
import StorageService from '../services/storage';
import DatabaseService from '../services/database';
import { useToast } from '../context/ToastContext';

const TicketDetailsScreen = ({ route, navigation }) => {
  const { ticket } = route.params;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadUserData();
    // Set navigation header with ticket ID
    navigation.setOptions({
      title: `Ticket ${ticket.ticketId}`,
    });
  }, []);

  const loadUserData = async () => {
    const user = await StorageService.getUserData();
    setUserData(user);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return Colors.warning;
      case 'in-progress':
        return Colors.info;
      case 'resolved':
        return Colors.success;
      case 'closed':
        return Colors.error;
      default:
        return Colors.gray;
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'Open';
      case 'in-progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return Colors.error;
      case 'medium':
        return Colors.warning;
      case 'low':
        return Colors.success;
      default:
        return Colors.gray;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return 'Normal Priority';
    }
  };

  const handleUpdateStatus = () => {
    Alert.alert(
      'Update Status',
      'Choose new status for this ticket:',
      [
        {
          text: 'Open',
          onPress: () => updateTicketStatus('open')
        },
        {
          text: 'In Progress',
          onPress: () => updateTicketStatus('in-progress')
        },
        {
          text: 'Resolved',
          onPress: () => updateTicketStatus('resolved')
        },
        {
          text: 'Closed',
          onPress: () => updateTicketStatus('closed')
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const updateTicketStatus = async (newStatus) => {
    setLoading(true);
    try {
      const result = await DatabaseService.updateTicketStatus(ticket.id, newStatus);
      if (result.success) {
        showSuccess('Ticket status updated successfully!');
        setTimeout(() => navigation.goBack(), 1000);
      } else {
        showError(result.error || 'Failed to update ticket status');
      }
    } catch (error) {
      showError('Failed to update ticket status');
    } finally {
      setLoading(false);
    }
  };

  const handleShareTicket = async () => {
    try {
      // Create a deep link URL for the ticket
      const ticketUrl = `karnavatiapp://ticket/${ticket.id}`;
      
      const result = await Share.share({
        message: `🎫 Ticket #${ticket.ticketId}\n\n📋 Category: ${ticket.category}\n📝 Description: ${ticket.description}\n📊 Status: ${getStatusLabel(ticket.status)}\n🏢 Building: ${ticket.buildingId}\n\n🔗 View in app: ${ticketUrl}`,
        title: `Ticket #${ticket.ticketId}`,
        url: ticketUrl, // This will be used on iOS
      });
    } catch (error) {
      showError('Failed to share ticket');
    }
  };

  // Check if user can update status (admin or ticket creator)
  const canUpdateStatus = userData && (
    userData.role === 'admin' || 
    userData.id === ticket.userId
  );

  const isOwnTicket = userData && userData.id === ticket.userId;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Card style={styles.headerCard} elevation={2}>
          <Card.Content>
            <View style={styles.headerContent}>
              <View style={styles.userInfo}>
                <Avatar.Text 
                  size={50} 
                  label={ticket.username ? ticket.username.substring(0, 2).toUpperCase() : 'UN'}
                  style={styles.avatar}
                />
                <View style={styles.userDetails}>
                  <View style={styles.usernameRow}>
                    <Title style={styles.username}>{ticket.username || 'Unknown User'}</Title>
                    {userData?.role === 'admin' && (
                      <Chip 
                        style={styles.roleChip}
                        textStyle={styles.roleChipText}
                        compact
                        icon="shield-account"
                      >
                        Admin
                      </Chip>
                    )}
                  </View>
                  <Text style={styles.buildingInfo}>{ticket.buildingId}-{ticket.houseNumber || 'N/A'}</Text>
                  <Text style={styles.timestamp}>
                    Created {getRelativeTime(ticket.createdAt?.toDate?.() || ticket.createdAt)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.statusContainer}>
                <Chip 
                  style={[styles.statusChip, { backgroundColor: getStatusColor(ticket.status) }]}
                  textStyle={styles.chipText}
                >
                  {getStatusLabel(ticket.status)}
                </Chip>
                
                <Chip 
                  style={[styles.priorityChip, { backgroundColor: getPriorityColor(ticket.priority) }]}
                  textStyle={styles.chipText}
                >
                  {getPriorityLabel(ticket.priority)}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Ticket Details Card */}
        <Card style={styles.detailsCard} elevation={2}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Ticket Details</Title>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ticket ID:</Text>
              <Text style={styles.detailValue}>{ticket.ticketId}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{ticket.category}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Priority:</Text>
              <Text style={styles.detailValue}>{getPriorityLabel(ticket.priority)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>{getStatusLabel(ticket.status)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created:</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(ticket.createdAt?.toDate?.() || ticket.createdAt)}
              </Text>
            </View>
            
            {ticket.updatedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailValue}>
                  {formatDateTime(ticket.updatedAt?.toDate?.() || ticket.updatedAt)}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Description Card */}
        <Card style={styles.descriptionCard} elevation={2}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Description</Title>
            <Paragraph style={styles.description}>{ticket.description}</Paragraph>
          </Card.Content>
        </Card>

        {/* Attachments Card */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <Card style={styles.attachmentsCard} elevation={2}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Attachments</Title>
              {ticket.attachments.map((attachment, index) => (
                <List.Item
                  key={index}
                  title={attachment.fileName || `Attachment ${index + 1}`}
                  description={attachment.type || 'File'}
                  left={props => <List.Icon {...props} icon="file-document" />}
                  right={props => <List.Icon {...props} icon="download" />}
                  onPress={() => {
                    // Handle attachment download/view
                    Alert.alert('Attachment', 'File viewing will be available soon');
                  }}
                />
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Actions Card */}
        <Card style={styles.actionsCard} elevation={2}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Actions</Title>
            
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={handleShareTicket}
                style={styles.actionButton}
                icon="share"
              >
                Share Ticket
              </Button>
              
              {canUpdateStatus && (
                <Button
                  mode="contained"
                  onPress={handleUpdateStatus}
                  style={styles.actionButton}
                  buttonColor={Colors.primary}
                  loading={loading}
                  disabled={loading}
                  icon="update"
                >
                  Update Status
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: Layout.spacing.md,
  },
  headerCard: {
    marginBottom: Layout.spacing.lg,
  },
  headerContent: {
    flexDirection: 'column',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  avatar: {
    backgroundColor: Colors.primary,
    marginRight: Layout.spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs / 2,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  roleChip: {
    backgroundColor: Colors.primary,
    height: 24,
  },
  roleChipText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  buildingInfo: {
    fontSize: Layout.fontSize.md,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: Layout.spacing.xs / 2,
  },
  timestamp: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  priorityChip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.white,
    fontWeight: '600',
  },
  detailsCard: {
    marginBottom: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  detailLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    flex: 2,
    textAlign: 'right',
  },
  descriptionCard: {
    marginBottom: Layout.spacing.lg,
  },
  description: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  attachmentsCard: {
    marginBottom: Layout.spacing.lg,
  },
  actionsCard: {
    marginBottom: Layout.spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

export default TicketDetailsScreen;
