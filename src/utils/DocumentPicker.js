import { Platform } from 'react-native';

let DocumentPicker;

if (Platform.OS === 'web') {
  // Web implementation - use HTML input file element
  DocumentPicker = {
    types: {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      images: 'image/*',
      allFiles: '*/*',
    },
    
    pick: async (options = {}) => {
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = options.allowMultiSelection || false;
        
        // Set accepted file types
        if (options.type) {
          if (Array.isArray(options.type)) {
            input.accept = options.type.join(',');
          } else {
            input.accept = options.type;
          }
        }
        
        input.onchange = (event) => {
          const files = Array.from(event.target.files);
          if (files.length === 0) {
            reject(new Error('No files selected'));
            return;
          }
          
          const results = files.map(file => ({
            uri: URL.createObjectURL(file),
            name: file.name,
            type: file.type,
            size: file.size,
            file: file, // Keep original file for upload
          }));
          
          resolve(options.allowMultiSelection ? results : results[0]);
        };
        
        input.oncancel = () => {
          reject(new Error('User cancelled'));
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
      });
    },
    
    isCancel: (error) => {
      return error.message === 'User cancelled';
    },
  };
} else {
  // Native implementation
  try {
    DocumentPicker = require('react-native-document-picker').default;
  } catch (error) {
    console.warn('react-native-document-picker not available:', error);
    DocumentPicker = {
      types: {},
      pick: () => Promise.reject(new Error('Document picker not available')),
      isCancel: () => false,
    };
  }
}

export default DocumentPicker;
