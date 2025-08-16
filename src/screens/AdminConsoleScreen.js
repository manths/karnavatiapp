import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  Divider,
  Text,
  SegmentedButtons,
} from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import DatabaseService from '../services/database';

const AdminConsoleScreen = ({ navigation }) => {
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [loading, setLoading] = useState(false);

  const handleSetRole = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter a mobile number');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (selectedRole === 'admin') {
        result = await DatabaseService.promoteToAdmin(countryCode, mobileNumber);
      } else {
        // First get the user, then update role
        const userResult = await DatabaseService.getUserByMobile(countryCode, mobileNumber);
        if (userResult.success) {
          result = await DatabaseService.setUserRole(userResult.data.id, 'member');
        } else {
          result = userResult;
        }
      }

      if (result.success) {
        Alert.alert('Success', `User role updated to ${selectedRole} successfully!`);
        setMobileNumber('');
      } else {
        Alert.alert('Error', result.error || 'Failed to update user role');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Admin Console</Title>
            <Text style={styles.subtitle}>
              Set user roles for apartment management
            </Text>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.sectionTitle}>User Mobile Number</Text>
            <View style={styles.mobileContainer}>
              <TextInput
                label="Country Code"
                value={countryCode}
                onChangeText={setCountryCode}
                mode="outlined"
                style={styles.countryCodeInput}
              />
              <TextInput
                label="Mobile Number"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                mode="outlined"
                keyboardType="numeric"
                style={styles.mobileInput}
              />
            </View>

            <Text style={styles.sectionTitle}>Select Role</Text>
            <SegmentedButtons
              value={selectedRole}
              onValueChange={setSelectedRole}
              buttons={[
                {
                  value: 'member',
                  label: 'Member',
                  icon: 'account',
                },
                {
                  value: 'admin',
                  label: 'Admin',
                  icon: 'shield-account',
                },
              ]}
              style={styles.segmentedButtons}
            />

            <Button
              mode="contained"
              onPress={handleSetRole}
              style={styles.updateButton}
              loading={loading}
              disabled={loading}
              buttonColor={Colors.primary}
            >
              Update User Role
            </Button>

            <Divider style={styles.divider} />

            <Text style={styles.infoText}>
              ℹ️ Use this screen to set user roles:{'\n'}
              • <Text style={styles.boldText}>Admin</Text>: Can update ticket status for all tickets{'\n'}
              • <Text style={styles.boldText}>Member</Text>: Can only update their own tickets
            </Text>
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    elevation: 3,
  },
  title: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },
  divider: {
    marginVertical: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  mobileContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  countryCodeInput: {
    flex: 1,
  },
  mobileInput: {
    flex: 3,
  },
  segmentedButtons: {
    marginBottom: Layout.spacing.xl,
  },
  updateButton: {
    paddingVertical: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  infoText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: Colors.text,
  },
});

export default AdminConsoleScreen;
