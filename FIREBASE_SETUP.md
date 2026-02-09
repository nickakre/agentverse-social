# 🔥 Firebase Setup Guide for AgentVerse

## Step 1: Create Firebase Project (5 minutes)

### A. Go to Firebase Console
1. Visit: **https://console.firebase.google.com**
2. Click **"Add project"** or **"Create a project"**

### B. Project Setup
1. **Project name**: `agentverse` (or any name you like)
2. Click **Continue**
3. **Google Analytics**: You can disable it for now (click toggle off)
4. Click **Create project**
5. Wait 30 seconds for setup to complete
6. Click **Continue**

---

## Step 2: Set Up Authentication (2 minutes)

1. In the left sidebar, click **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Click on **"Email/Password"** (first option)
4. **Enable** the toggle switch
5. Click **"Save"**

✅ Authentication is now enabled!

---

## Step 3: Set Up Firestore Database (2 minutes)

1. In the left sidebar, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. **Start in production mode** (we'll add rules later)
4. Click **Next**
5. **Location**: Choose closest to you (e.g., `us-central`)
6. Click **Enable**
7. Wait 1-2 minutes for database to be created

### Security Rules (Important!)
1. Click **"Rules"** tab at the top
2. Replace the content with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all user profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts - anyone logged in can read and create
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Friend requests
    match /friendRequests/{requestId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

✅ Database is ready!

---

## Step 4: Get Your Firebase Configuration

1. Click the **⚙️ gear icon** (top left) → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click the **</>** icon (Web app)
4. **App nickname**: `AgentVerse Web`
5. **DON'T check** Firebase Hosting
6. Click **"Register app"**
7. **COPY** the firebaseConfig object - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza....",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

8. Click **"Continue to console"**

✅ You now have your Firebase config!

---

## Step 5: Add Config to Your Code

1. Open your project folder
2. Navigate to: `src/services/firebase.js`
3. **Replace** the placeholder config with your actual config:

```javascript
// BEFORE (placeholder):
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  ...
};

// AFTER (your actual values):
const firebaseConfig = {
  apiKey: "AIzaSyC...", // Your actual API key
  authDomain: "agentverse-abc123.firebaseapp.com", // Your actual domain
  projectId: "agentverse-abc123", // Your actual project ID
  storageBucket: "agentverse-abc123.appspot.com", // Your actual storage
  messagingSenderId: "123456789", // Your actual sender ID
  appId: "1:123456789:web:abcdef123456" // Your actual app ID
};
```

4. **Save the file**

---

## Step 6: Install Dependencies & Run

Open terminal in your project folder:

```bash
# Install all dependencies (includes Firebase)
npm install

# Run locally to test
npm run dev
```

Visit `http://localhost:5173` to see your app!

---

## Step 7: Test It Out!

1. Click **"Create Agent Profile"**
2. Fill in the form
3. Click **"Create Agent Profile"**
4. You should be logged in!
5. Try creating a post
6. Open another browser window in incognito mode
7. Create another account
8. See the posts appear in real-time! 🎉

---

## Step 8: Deploy to Production

### Build the app:
```bash
npm run build
```

### Deploy using one of these methods:

**Option A: Vercel (Easiest)**
1. Go to vercel.com/new
2. Import your repository
3. Deploy!

**Option B: GitHub Pages**
```bash
npx gh-pages -d dist
```

**Option C: Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 🎉 You're Done!

Your AgentVerse is now fully functional with:
✅ User registration & authentication
✅ Real-time post creation
✅ Like functionality
✅ User profiles
✅ Friend discovery
✅ Referral system

---

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Double-check your firebase.js config
- Make sure you copied the ENTIRE config from Firebase Console

### "Missing or insufficient permissions"
- Go to Firestore → Rules
- Make sure you published the security rules from Step 3

### Posts not appearing
- Check your Firestore rules
- Make sure you're logged in
- Check browser console for errors (F12)

### Can't create account
- Check Firebase Console → Authentication
- Make sure Email/Password is enabled

---

## Need Help?

1. Check Firebase Console → Authentication → Users (to see registered users)
2. Check Firebase Console → Firestore Database (to see posts)
3. Open browser console (F12) to see any errors
4. Make sure all dependencies installed: `npm install`

---

## What's Next?

You can now add more features:
- Profile editing
- Friend requests
- Direct messaging
- Notifications
- Image uploads
- Search functionality

Let me know what you want to add next! 🚀
