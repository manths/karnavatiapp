import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Button, Chip, Divider } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { TunnelHandler } from '../utils/tunnelHandler';
import { SafeConsole } from '../utils/safeAccess';

const TroubleshootingScreen = ({ navigation }) => {
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [autoFixResult, setAutoFixResult] = useState(null);

  const runDiagnostics = async () => {
    SafeConsole.log('Running diagnostics...');
    
    // Get connection info
    const info = TunnelHandler.showConnectionInfo();
    setConnectionInfo(info);
    
    // Run auto-fix
    const result = await TunnelHandler.autoFix();
    setAutoFixResult(result);
  };

  const troubleshootingSteps = TunnelHandler.getTroubleshootingSteps();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Connection Troubleshooting</Text>
          <Text style={styles.subtitle}>
            Having issues with "Failed to download remote updates"? Here's how to fix it:
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Quick Fix</Text>
          <Button 
            mode="contained" 
            onPress={runDiagnostics}
            style={styles.button}
            icon="play"
          >
            Run Auto-Fix
          </Button>
          
          {autoFixResult && (
            <View style={styles.resultContainer}>
              <Chip 
                mode="outlined"
                style={[
                  styles.chip,
                  { backgroundColor: autoFixResult.success ? Colors.success : Colors.error }
                ]}
              >
                {autoFixResult.success ? '✅ Success' : '❌ Issue Found'}
              </Chip>
              <Text style={styles.resultText}>{autoFixResult.message}</Text>
              {autoFixResult.suggestion && (
                <Text style={styles.suggestionText}>{autoFixResult.suggestion}</Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {connectionInfo && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Connection Status</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.statusItem}>
                🌐 Network: {connectionInfo.networkOnline ? 'Online' : 'Offline'}
              </Text>
              <Text style={styles.statusItem}>
                🔗 Tunnel: {connectionInfo.tunnelActive ? 'Active' : 'Inactive'}
              </Text>
              <Text style={styles.statusItem}>
                📱 Platform: {connectionInfo.userAgent.includes('Android') ? 'Android' : 'iOS'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Manual Troubleshooting Steps</Text>
          {troubleshootingSteps.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <Text style={styles.stepNumber}>{step.step}</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepAction}>{step.action}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
                {step.command && (
                  <Text style={styles.stepCommand}>{step.command}</Text>
                )}
                {step.solution && (
                  <Text style={styles.stepSolution}>{step.solution}</Text>
                )}
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Common Solutions</Text>
          <View style={styles.solutionContainer}>
            <Text style={styles.solutionItem}>• Use tunnel mode: npx expo start --tunnel</Text>
            <Text style={styles.solutionItem}>• Check Expo Go app version matches SDK 53</Text>
            <Text style={styles.solutionItem}>• Ensure same Wi-Fi network for both devices</Text>
            <Text style={styles.solutionItem}>• Disable VPN on mobile device</Text>
            <Text style={styles.solutionItem}>• Restart router and Metro bundler</Text>
            <Text style={styles.solutionItem}>• Allow Node.js through Windows Firewall</Text>
          </View>
        </Card.Content>
      </Card>

      <Button 
        mode="outlined" 
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        Back to App
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
  },
  button: {
    marginVertical: 8,
  },
  backButton: {
    marginTop: 16,
    marginBottom: 32,
  },
  resultContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  chip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: 'bold',
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusContainer: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  statusItem: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 12,
    minWidth: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepAction: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  stepCommand: {
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: Colors.surface,
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    color: Colors.primary,
  },
  stepSolution: {
    fontSize: 14,
    color: Colors.accent,
    marginTop: 4,
    fontStyle: 'italic',
  },
  solutionContainer: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  solutionItem: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default TroubleshootingScreen;
