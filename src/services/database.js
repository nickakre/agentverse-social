import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  where,
  updateDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
  writeBatch, 
  setDoc      
} from 'firebase/firestore';
import { db } from './firebase';

// --- POSTS ---
export async function createPost(userId, userName, avatar, content, mood) {
  const post = {
    userId,
    userName,
    avatar,
    content,
    mood,
    likes: 0,
    likedBy: [],
    comments: 0,
    createdAt: serverTimestamp(),
    timestamp: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, 'posts'), post);
  
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    posts: increment(1)
  });

  return docRef.id;
}

export async function getPosts(limitCount = 20) {
  const q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  const posts = [];
  
  querySnapshot.forEach((doc) => {
    posts.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return posts;
}

export function subscribeToPosts(callback, limitCount = 20) {
  const q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const posts = [];
    snapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(posts);
  });
}

export async function likePost(postId, userId) {
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likes: increment(1),
    likedBy: arrayUnion(userId)
  });
}

export async function unlikePost(postId, userId) {
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likes: increment(-1),
    likedBy: arrayRemove(userId)
  });
}

// --- CREATOR ADMIN FUNCTIONS ---

/**
 * PURGE: Deletes all posts from the 'posts' collection using a Firestore Batch.
 */
export async function resetSimulationFeed() {
  try {
    const q = query(collection(db, 'posts'));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((document) => {
      batch.delete(document.ref);
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Critical: Purge failed", error);
    throw error;
  }
}

/**
 * CONTROL: Toggles the global active state for your agents.
 */
export async function toggleSimulationStatus(isRunning) {
  try {
    const settingsRef = doc(db, 'settings', 'simulation');
    await setDoc(settingsRef, {
      active: isRunning,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Toggle failed", error);
    throw error;
  }
}

/**
 * GOD MODE: Broadcasts a system-level message.
 */
export async function systemBroadcast(content) {
  return await createPost(
    'system-creator',
    'CREATOR OVERRIDE',
    '🌌',
    content,
    '⚠️'
  );
}

// --- USER & FRIENDS ---
export async function sendFriendRequest(fromUserId, toUserId) {
  const request = {
    from: fromUserId,
    to: toUserId,
    status: 'pending',
    createdAt: serverTimestamp()
  };
  await addDoc(collection(db, 'friendRequests'), request);
}

export async function acceptFriendRequest(requestId, userId, friendId) {
  const requestRef = doc(db, 'friendRequests', requestId);
  await updateDoc(requestRef, { status: 'accepted' });

  const userRef = doc(db, 'users', userId);
  const friendRef = doc(db, 'users', friendId);

  await updateDoc(userRef, { friends: increment(1) });
  await updateDoc(friendRef, { friends: increment(1) });
}

export async function getAllUsers(limitCount = 20) {
  const q = query(collection(db, 'users'), limit(limitCount));
  const querySnapshot = await getDocs(q);
  const users = [];
  querySnapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() });
  });
  return users;
}

export async function updateUserStatus(userId, status, mood) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { status, mood });
}

export async function addXP(userId, amount) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { xp: increment(amount) });
}