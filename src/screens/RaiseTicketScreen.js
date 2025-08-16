import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  HelperText,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { APP_CONFIG } from '../constants/config';
import { validateTicketDescription } from '../utils/validation';
import { generateTicketId, formatFileSize, getFileType, isValidFileType, isValidFileSize } from '../utils/helpers';
import DatabaseService from '../services/database';
import StorageService from '../services/storage';

const RaiseTicketScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Form fields
  const [category, setCategory] = useState(APP_CONFIG.ticket.categories[0]);
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  
  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = await StorageService.getUserData();
    setUserData(user);
  };

  const validateForm = () => {
    const newErrors = {};

    const descriptionValidation = validateTicketDescription(description);
    if (!descriptionValidation.isValid) {
      newErrors.description = descriptionValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!userData) {
      Alert.alert('Error', 'User data not found');
      return;
    }

    setLoading(true);

    try {
      // File uploads temporarily disabled due to Firebase Storage billing requirement
      // TODO: Re-enable when Firebase billing is set up or alternative storage is implemented
      const uploadedAttachments = [];

      // Create ticket data
      const ticketData = {
        ticketId: generateTicketId(),
        userId: userData.id,
        username: userData.username,
        buildingId: userData.buildingId,
        category,
        priority,
        description: description.trim(),
        attachments: uploadedAttachments,
        status: 'open',
      };

      const result = await DatabaseService.createTicket(ticketData);
      
      if (result.success) {
        Alert.alert(
          'Success', 
          'Your ticket has been raised successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            }
          ]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', error.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      addAttachment({
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'camera_image.jpg',
        size: asset.fileSize || 0,
        fileType: 'image',
      });
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
    });

    if (!result.canceled && result.assets) {
      result.assets.forEach(asset => {
        addAttachment({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || 'gallery_image.jpg',
          size: asset.fileSize || 0,
          fileType: 'image',
        });
      });
    }
  };

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        result.assets.forEach(asset => {
          addAttachment({
            uri: asset.uri,
            type: asset.mimeType,
            name: asset.name,
            size: asset.size,
            fileType: 'document',
          });
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const addAttachment = (attachment) => {
    // Validate file type and size
    if (!isValidFileType(attachment.name, attachment.fileType)) {
      Alert.alert('Invalid File', `This file type is not supported for ${attachment.fileType}s`);
      return;
    }

    if (!isValidFileSize(attachment.size, attachment.fileType)) {
      const maxSize = attachment.fileType === 'image' 
        ? APP_CONFIG.fileUpload.maxImageSize 
        : attachment.fileType === 'video'
        ? APP_CONFIG.fileUpload.maxVideoSize
        : APP_CONFIG.fileUpload.maxDocumentSize;
      
      Alert.alert('File Too Large', `File size exceeds the limit of ${formatFileSize(maxSize)}`);
      return;
    }

    setAttachments(prev => [...prev, { ...attachment, id: Date.now().toString() }]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  const renderAttachment = (attachment) => (
    <View key={attachment.id} style={styles.attachmentItem}>
      {attachment.fileType === 'image' && (
        <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
      )}
      
      <View style={styles.attachmentInfo}>
        <Text style={styles.attachmentName} numberOfLines={1}>
          {attachment.name}
        </Text>
        <Text style={styles.attachmentSize}>
          {formatFileSize(attachment.size)}
        </Text>
      </View>
      
      <TouchableOpacity
        onPress={() => removeAttachment(attachment.id)}
        style={styles.removeButton}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Title style={styles.title}>Raise a Ticket</Title>
            <Text style={styles.subtitle}>
              Describe your issue and we'll help resolve it
            </Text>
          </View>

          <Card style={styles.formCard}>
            <View style={styles.formContent}>
              {/* Category Selection */}
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                >
                  {APP_CONFIG.ticket.categories.map(cat => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>

              {/* Priority Selection */}
              <Text style={styles.fieldLabel}>Priority</Text>
              <View style={styles.priorityContainer}>
                {APP_CONFIG.ticket.priorities.map(p => (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => setPriority(p.value)}
                    style={[
                      styles.priorityChip,
                      { borderColor: p.color },
                      priority === p.value && { backgroundColor: p.color }
                    ]}
                  >
                    <Text style={[
                      styles.priorityText,
                      { color: priority === p.value ? Colors.white : p.color }
                    ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Description */}
              <TextInput
                label="Issue Description"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={6}
                style={styles.descriptionInput}
                error={!!errors.description}
                placeholder="Please describe your issue in detail..."
              />
              <HelperText type="error" visible={!!errors.description}>
                {errors.description}
              </HelperText>

              {/* Attachments - Temporarily disabled due to Firebase Storage billing requirement */}
              {/* TODO: Re-enable when Firebase billing is set up or alternative storage is implemented */}
              {/*
              <Text style={styles.fieldLabel}>Attachments (Optional)</Text>
              
              <View style={styles.attachmentButtons}>
                <Button
                  mode="outlined"
                  onPress={handleAddImage}
                  style={styles.attachmentButton}
                  icon="camera"
                >
                  Add Image
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={handleAddDocument}
                  style={styles.attachmentButton}
                  icon="file-document"
                >
                  Add Document
                </Button>
              </View>

              {attachments.length > 0 && (
                <View style={styles.attachmentsList}>
                  <Text style={styles.attachmentsTitle}>
                    Attachments ({attachments.length})
                  </Text>
                  {attachments.map(attachment => renderAttachment(attachment))}
                </View>
              )}
              */}

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                labelStyle={styles.submitButtonText}
                loading={loading}
                disabled={loading}
              >
                Raise Ticket
              </Button>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  title: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    elevation: 3,
  },
  formContent: {
    padding: Layout.spacing.lg,
  },
  fieldLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Layout.spacing.md,
  },
  picker: {
    height: 56,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  priorityChip: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderWidth: 2,
    borderRadius: Layout.borderRadius.xl,
    backgroundColor: Colors.transparent,
  },
  priorityText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  descriptionInput: {
    backgroundColor: Colors.surface,
    marginBottom: Layout.spacing.xs,
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  attachmentButton: {
    flex: 1,
    borderColor: Colors.primary,
  },
  attachmentsList: {
    marginBottom: Layout.spacing.lg,
  },
  attachmentsTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  attachmentImage: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Layout.spacing.sm,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  attachmentSize: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    marginTop: Layout.spacing.lg,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  submitButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default RaiseTicketScreen;
