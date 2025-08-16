import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { APP_CONFIG } from '../constants/config';
import StorageService from './storage';

class DatabaseService {
  // User operations
  async createUser(userData) {
    try {
      const userRef = collection(db, APP_CONFIG.database.collections.users);
      const docRef = await addDoc(userRef, {
        ...userData,
        role: userData.role || 'member', // Default role is 'member', can be 'admin' or 'member'
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Save to local storage
      await StorageService.saveUserData({ ...userData, id: docRef.id, role: userData.role || 'member' });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserByMobile(countryCode, mobileNumber) {
    try {
      const usersRef = collection(db, APP_CONFIG.database.collections.users);
      const q = query(
        usersRef, 
        where('countryCode', '==', countryCode),
        where('mobileNumber', '==', mobileNumber)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, message: 'User not found' };
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = { id: userDoc.id, ...userDoc.data() };
      
      // Ensure role field exists (for backward compatibility)
      if (!userData.role) {
        userData.role = 'member';
        // Update user document with default role
        await this.updateUser(userDoc.id, { role: 'member' });
      }
      
      // Save to local storage
      await StorageService.saveUserData(userData);
      
      return { success: true, data: userData };
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(userId, updateData) {
    try {
      const userRef = doc(db, APP_CONFIG.database.collections.users, userId);
      await updateDoc(userRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
      
      // Update local storage
      const currentUserData = await StorageService.getUserData();
      if (currentUserData) {
        await StorageService.saveUserData({ ...currentUserData, ...updateData });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  // Ticket operations
  async createTicket(ticketData) {
    try {
      const ticketsRef = collection(db, APP_CONFIG.database.collections.tickets);
      const docRef = await addDoc(ticketsRef, {
        ...ticketData,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating ticket:', error);
      return { success: false, error: error.message };
    }
  }

  async getTickets(userId = null, buildingId = null) {
    try {
      const ticketsRef = collection(db, APP_CONFIG.database.collections.tickets);
      let q;
      
      if (userId) {
        // Get tickets for specific user
        q = query(
          ticketsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      } else if (buildingId) {
        // Get all tickets for specific building (now with composite index)
        q = query(
          ticketsRef,
          where('buildingId', '==', buildingId),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Get all tickets (fallback)
        q = query(ticketsRef, orderBy('createdAt', 'desc'));
      }
      
      const querySnapshot = await getDocs(q);
      const tickets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Cache tickets locally
      await StorageService.saveTicketsCache(tickets);
      
      return { success: true, data: tickets };
    } catch (error) {
      console.error('Error getting tickets:', error);
      // Return cached data if available
      const cachedTickets = await StorageService.getTicketsCache();
      return { success: false, error: error.message, cachedData: cachedTickets };
    }
  }

  async getTicketById(ticketId) {
    try {
      const ticketRef = doc(db, APP_CONFIG.database.collections.tickets, ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (!ticketDoc.exists()) {
        return { success: false, error: 'Ticket not found' };
      }
      
      const ticketData = { id: ticketDoc.id, ...ticketDoc.data() };
      return { success: true, data: ticketData };
    } catch (error) {
      console.error('Error getting ticket by ID:', error);
      return { success: false, error: error.message };
    }
  }

  async updateTicketStatus(ticketId, status) {
    try {
      const ticketRef = doc(db, APP_CONFIG.database.collections.tickets, ticketId);
      await updateDoc(ticketRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating ticket status:', error);
      return { success: false, error: error.message };
    }
  }

  // Payment operations
  async savePayment(paymentData) {
    try {
      const paymentsRef = collection(db, APP_CONFIG.database.collections.payments);
      const docRef = await addDoc(paymentsRef, {
        ...paymentData,
        createdAt: serverTimestamp(),
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error saving payment:', error);
      return { success: false, error: error.message };
    }
  }

  async getPayments(userId) {
    try {
      const paymentsRef = collection(db, APP_CONFIG.database.collections.payments);
      const q = query(
        paymentsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const payments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Cache payments locally
      await StorageService.savePaymentsCache(payments);
      
      return { success: true, data: payments };
    } catch (error) {
      console.error('Error getting payments:', error);
      // Return cached data if available
      const cachedPayments = await StorageService.getPaymentsCache();
      return { success: false, error: error.message, cachedData: cachedPayments };
    }
  }

  // File upload operations
  async uploadFile(file, folder = 'uploads') {
    try {
      const timestamp = Date.now();
      const fileName = `${folder}/${timestamp}_${file.name || 'file'}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return { success: true, url: downloadURL, fileName };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteFile(fileName) {
    try {
      const storageRef = ref(storage, fileName);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  }

  // Admin utility methods
  async setUserRole(userId, role) {
    try {
      if (!['admin', 'member'].includes(role)) {
        return { success: false, error: 'Invalid role. Must be "admin" or "member"' };
      }

      const result = await this.updateUser(userId, { role });
      if (result.success) {
        console.log(`User role updated to ${role} successfully`);
      }
      return result;
    } catch (error) {
      console.error('Error setting user role:', error);
      return { success: false, error: error.message };
    }
  }

  async promoteToAdmin(countryCode, mobileNumber) {
    try {
      const userResult = await this.getUserByMobile(countryCode, mobileNumber);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }

      const result = await this.setUserRole(userResult.data.id, 'admin');
      if (result.success) {
        console.log(`User ${userResult.data.username} promoted to admin`);
      }
      return result;
    } catch (error) {
      console.error('Error promoting user to admin:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new DatabaseService();
