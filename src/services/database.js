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
import { USER_STATUS } from '../constants/userRoles';
import StorageService from './storage';
import NotificationService from './notificationService';

class DatabaseService {
  // User operations
  async createUser(userData) {
    try {
      const userRef = collection(db, APP_CONFIG.database.collections.users);
      const docRef = await addDoc(userRef, {
        ...userData,
        role: userData.role || 'member', // Default role is 'member'
        status: userData.status || 'pending', // Default status is 'pending'
        firstLogin: true, // Flag to show approval message on first login
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Save to local storage with safe fallbacks
      const userDataToSave = { 
        ...userData, 
        id: docRef.id, 
        role: userData.role || 'member',
        status: userData.status || 'pending',
        firstLogin: true,
      };
      
      await StorageService.saveUserData(userDataToSave);
      
      // Send notification to admin about new registration
      if (userData.username && userData.houseNumber && userData.buildingId) {
        const notification = NotificationService.notifications.newRegistration(
          userData.username, 
          userData.buildingId,
          userData.houseNumber
        );
        await NotificationService.sendLocalNotification(
          notification.title,
          notification.body,
          { userId: docRef.id, type: 'new_registration', userData }
        );
      }
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message || 'Failed to create user' };
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

  // User status management
  async updateUserStatus(userId, status) {
    try {
      const userRef = doc(db, APP_CONFIG.database.collections.users, userId);
      
      // Get current user data for notifications
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      await updateDoc(userRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      
      // Send appropriate notification based on status
      if (userData) {
        if (status === USER_STATUS.APPROVED) {
          await NotificationService.sendLocalNotification(
            NotificationService.notifications.accountApproved.title,
            NotificationService.notifications.accountApproved.body,
            { userId, status, type: 'account_approved' }
          );
        } else if (status === USER_STATUS.REJECTED) {
          await NotificationService.sendLocalNotification(
            NotificationService.notifications.accountRejected.title,
            NotificationService.notifications.accountRejected.body,
            { userId, status, type: 'account_rejected' }
          );
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user status:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserRequests(buildingId = null) {
    try {
      const usersRef = collection(db, APP_CONFIG.database.collections.users);
      let q;
      
      if (buildingId) {
        q = query(
          usersRef,
          where('buildingId', '==', buildingId),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          usersRef,
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        });
      });
      
      return { success: true, data: requests };
    } catch (error) {
      console.error('Error getting user requests:', error);
      return { success: false, error: error.message };
    }
  }

  async getPendingRequests(buildingId = null) {
    try {
      const usersRef = collection(db, APP_CONFIG.database.collections.users);
      let q;
      
      if (buildingId) {
        q = query(
          usersRef,
          where('buildingId', '==', buildingId),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          usersRef,
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        });
      });
      
      return { success: true, data: requests };
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserById(userId) {
    try {
      const userRef = doc(db, APP_CONFIG.database.collections.users, userId);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const userData = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        };
        return { success: true, data: userData };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return { success: false, error: error.message };
    }
  }

  // Notification for admin when new user registers
  async getAdminUsers(buildingId = null) {
    try {
      const usersRef = collection(db, APP_CONFIG.database.collections.users);
      let q;
      
      if (buildingId) {
        q = query(
          usersRef,
          where('buildingId', '==', buildingId),
          where('role', '==', 'admin'),
          where('status', '==', 'approved')
        );
      } else {
        q = query(
          usersRef,
          where('role', '==', 'admin'),
          where('status', '==', 'approved')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const admins = [];
      
      querySnapshot.forEach((doc) => {
        admins.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return { success: true, data: admins };
    } catch (error) {
      console.error('Error getting admin users:', error);
      return { success: false, error: error.message };
    }
  }

  // Payment Receipt operations
  async getAllPayments() {
    try {
      const paymentsRef = collection(db, APP_CONFIG.database.collections.payments);
      const q = query(paymentsRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const payments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      return { success: true, data: payments };
    } catch (error) {
      console.error('Error getting all payments:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserPayments(userId) {
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
      
      return { success: true, data: payments };
    } catch (error) {
      console.error('Error getting user payments:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePaymentStatus(paymentId, status) {
    try {
      const paymentRef = doc(db, APP_CONFIG.database.collections.payments, paymentId);
      await updateDoc(paymentRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating payment status:', error);
      return { success: false, error: error.message };
    }
  }

  async savePaymentWithSMS(paymentData, smsDetails) {
    try {
      const paymentsRef = collection(db, APP_CONFIG.database.collections.payments);
      const docRef = await addDoc(paymentsRef, {
        ...paymentData,
        smsDetails,
        status: paymentData.status || 'pending', // Use provided status or default to pending
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error saving payment with SMS:', error);
      return { success: false, error: error.message };
    }
  }

  async verifySMSPayment(paymentId, isVerified) {
    try {
      const paymentRef = doc(db, APP_CONFIG.database.collections.payments, paymentId);
      await updateDoc(paymentRef, {
        smsVerified: isVerified,
        status: isVerified ? 'success' : 'failed',
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error verifying SMS payment:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new DatabaseService();
