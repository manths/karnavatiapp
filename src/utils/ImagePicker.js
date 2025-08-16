import { Platform, Alert } from 'react-native';

let ImagePicker;

if (Platform.OS === 'web') {
  // Web implementation
  ImagePicker = {
    launchImageLibrary: (options, callback) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = options.selectionLimit > 1;
      
      input.onchange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) {
          callback({ didCancel: true });
          return;
        }
        
        const assets = files.map(file => ({
          uri: URL.createObjectURL(file),
          fileName: file.name,
          type: file.type,
          fileSize: file.size,
          file: file, // Keep original file for upload
        }));
        
        callback({ assets });
      };
      
      input.oncancel = () => {
        callback({ didCancel: true });
      };
      
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    },
    
    launchCamera: (options, callback) => {
      // For web, we'll fall back to image library since camera access is complex
      Alert.alert(
        'Camera Not Available',
        'Camera is not available on web. Please select from gallery.',
        [
          {
            text: 'OK',
            onPress: () => ImagePicker.launchImageLibrary(options, callback),
          },
        ]
      );
    },
  };
} else {
  // Native implementation
  try {
    const nativeImagePicker = require('react-native-image-picker');
    ImagePicker = {
      launchImageLibrary: nativeImagePicker.launchImageLibrary,
      launchCamera: nativeImagePicker.launchCamera,
    };
  } catch (error) {
    console.warn('react-native-image-picker not available:', error);
    ImagePicker = {
      launchImageLibrary: (options, callback) => {
        callback({ errorMessage: 'Image picker not available' });
      },
      launchCamera: (options, callback) => {
        callback({ errorMessage: 'Camera not available' });
      },
    };
  }
}

export { ImagePicker };
