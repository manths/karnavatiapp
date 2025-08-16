import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { APP_CONFIG } from '../constants/config';

const BuildingSelectionScreen = ({ navigation }) => {
  const handleBuildingSelect = (building) => {
    if (building.isActive) {
      navigation.navigate('Auth', { buildingId: building.id });
    }
  };

  const renderBuildingCard = (building) => (
    <Card
      key={building.id}
      style={[
        styles.buildingCard,
        building.isActive ? styles.activeCard : styles.inactiveCard,
      ]}
      elevation={building.isActive ? 3 : 1}
    >
      <TouchableOpacity
        onPress={() => handleBuildingSelect(building)}
        disabled={!building.isActive}
        style={styles.cardContent}
      >
        <View style={styles.buildingHeader}>
          <Title style={[
            styles.buildingTitle,
            { color: building.isActive ? Colors.primary : Colors.gray }
          ]}>
            {building.name}
          </Title>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: building.isActive ? Colors.buildingActive : Colors.buildingInactive }
          ]} />
        </View>
        
        <Paragraph style={[
          styles.buildingDescription,
          { color: building.isActive ? Colors.text : Colors.gray }
        ]}>
          {building.description}
        </Paragraph>
        
        {building.isActive && (
          <Button
            mode="contained"
            style={styles.selectButton}
            labelStyle={styles.selectButtonText}
            onPress={() => handleBuildingSelect(building)}
          >
            Select Building
          </Button>
        )}
        
        {!building.isActive && (
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        )}
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appTitle}>{APP_CONFIG.name}</Text>
          <Text style={styles.subtitle}>Select your apartment block to continue</Text>
        </View>

        <View style={styles.buildingsContainer}>
          {APP_CONFIG.buildings.map(building => renderBuildingCard(building))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            More blocks will be available soon
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    paddingTop: Layout.spacing.lg,
  },
  welcomeText: {
    fontSize: Layout.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  appTitle: {
    fontSize: Layout.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  buildingsContainer: {
    flex: 1,
    gap: Layout.spacing.md,
  },
  buildingCard: {
    marginBottom: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
  },
  activeCard: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  inactiveCard: {
    backgroundColor: Colors.lightGray,
    opacity: 0.7,
  },
  cardContent: {
    padding: Layout.spacing.lg,
  },
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  buildingTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: Layout.borderRadius.round,
  },
  buildingDescription: {
    fontSize: Layout.fontSize.md,
    marginBottom: Layout.spacing.lg,
    lineHeight: 22,
  },
  selectButton: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Layout.spacing.xs,
  },
  selectButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  comingSoonText: {
    fontSize: Layout.fontSize.md,
    color: Colors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Layout.spacing.md,
  },
  footer: {
    marginTop: Layout.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default BuildingSelectionScreen;
