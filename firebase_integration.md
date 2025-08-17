# 📊 Firebase Database Integration for User Management

## 🔥 **Database Structure**

### **Collection: `users`**
When a user registers, their data is stored in Firebase Firestore with the following structure:

```javascript
{
  id: "auto-generated-firestore-id",
  username: "John Doe",
  mobileNumber: "9876543210",
  countryCode: "+91",
  houseNumber: "A-101",
  buildingId: "Block-A",
  role: "member",           // Default: "member"
  status: "pending",        // Default: "pending" 
  firstLogin: true,         // Flag for first login
  createdAt: Timestamp,     // Auto-generated
  updatedAt: Timestamp,     // Auto-generated
}
```

## 🔄 **User Registration Flow**

### **Step 1: User Registration**
```javascript
// In RegisterScreen.js - when user submits registration
const result = await DatabaseService.createUser({
  username: formData.username,
  mobileNumber: formData.mobileNumber,
  countryCode: formData.countryCode,
  houseNumber: formData.houseNumber,
  buildingId: formData.buildingId,
  // Default values set by DatabaseService:
  role: 'member',
  status: 'pending'
});
```

### **Step 2: Data Storage**
```javascript
// In database.js - createUser function
async createUser(userData) {
  const userRef = collection(db, 'users');
  const docRef = await addDoc(userRef, {
    ...userData,
    role: 'member',           // Always member for new registrations
    status: 'pending',        // Always pending for approval
    firstLogin: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // Save to local storage
  await StorageService.saveUserData({...userData, id: docRef.id});
  
  // Notify admin of new registration
  await NotificationService.sendLocalNotification(
    "👤 New Registration",
    `${userData.username} from House ${userData.houseNumber} needs approval`
  );
}
```

### **Step 3: User Status**
After registration, user sees `AccountPendingScreen` until admin approval.

## 👨‍💼 **Admin Request Management**

### **Step 1: Admin Views Requests**
```javascript
// In AccountRequestsScreen.js - loads all user requests
const loadAccountRequests = async () => {
  const result = await DatabaseService.getUserRequests();
  // Shows all users with all statuses (pending, approved, rejected)
};

// Filter for pending only
const loadPendingRequests = async () => {
  const result = await DatabaseService.getPendingRequests();
  // Shows only pending users for approval
};
```

### **Step 2: Admin Actions**
```javascript
// Approve user
const handleApproveRequest = async (request) => {
  const result = await DatabaseService.updateUserStatus(request.id, 'approved');
  // User gets notification: "✅ Account Approved!"
};

// Reject user  
const handleRejectRequest = async (request) => {
  const result = await DatabaseService.updateUserStatus(request.id, 'rejected');
  // User gets notification: "❌ Account Application needs review"
};
```

### **Step 3: Real-time Updates**
- Admin sees requests immediately after user registration
- Users get notified when status changes
- Pull-to-refresh updates the request list

## 🔄 **Database Query Functions**

### **Get All User Requests**
```javascript
async getUserRequests(buildingId = null) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('createdAt', 'desc'));
  // Returns all users ordered by registration date
}
```

### **Get Pending Requests Only**
```javascript
async getPendingRequests(buildingId = null) {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  // Returns only pending users for admin approval
}
```

### **Update User Status**
```javascript
async updateUserStatus(userId, status) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    status: status,           // 'approved', 'rejected', 'pending'
    updatedAt: serverTimestamp(),
  });
  
  // Send notification to user about status change
  await NotificationService.sendLocalNotification(/* appropriate message */);
}
```

## 📱 **App Flow Integration**

### **For New Users:**
1. **Register** → Data saved to Firebase `users` collection with `status: 'pending'`
2. **Admin Notification** → Admin gets notified of new registration
3. **Pending Screen** → User sees AccountPendingScreen until approval
4. **Admin Review** → Admin sees request in AccountRequestsScreen
5. **Approval/Rejection** → Admin updates status in Firebase
6. **User Notification** → User gets notified of decision
7. **Access Granted** → Approved users can access main app

### **For Admin Users:**
1. **Direct Access** → Admin users bypass approval (role: 'admin')
2. **View Requests** → AccountRequestsScreen shows all pending users
3. **Manage Users** → Approve/reject with single tap
4. **Real-time Updates** → Pull-to-refresh shows latest requests

## 🔒 **Security & Permissions**

### **User Roles:**
- `member`: Regular users, need approval
- `admin`: Secretary/Admin, can approve others

### **Status Values:**
- `pending`: Waiting for admin approval
- `approved`: Can access all app features  
- `rejected`: Access denied, contact admin

### **Access Control:**
- Only admins can see AccountRequestsScreen
- Only admins can change user status
- Users can only see their own status

## ✅ **Current Implementation Status**

### **✅ Completed Features:**
- User registration saves to Firebase
- Admin can view all user requests
- Admin can approve/reject users
- Real-time status updates
- Notification system integrated
- Pull-to-refresh functionality
- Search and filter requests
- Mobile-responsive UI

### **🔄 Data Flow:**
1. **Registration** → Firebase `users` collection
2. **Admin View** → AccountRequestsScreen queries Firebase  
3. **Admin Action** → Updates Firebase user status
4. **User Update** → User sees status change immediately
5. **Notifications** → Both user and admin get notified

**The complete Firebase integration is already implemented and working! 🎉**
