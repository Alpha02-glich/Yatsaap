// Initialize Firestore
const db = firebase.firestore();

// Save user data to Firestore (called after login)
async function saveUserToFirestore(user) {
    const userRef = db.collection('users').doc(user.uid);
    await userRef.set({
        username: user.displayName || user.email.split('@')[0],  // default to email if no display name
        email: user.email,
        uid: user.uid,
    });
}

// Send a message to Firestore
function sendMessage(sender, receiver, msgText) {
    const chatRef = db.collection('chats').doc(sender.uid).collection(receiver);

    const timestamp = new Date().toISOString();

    chatRef.add({
        sender: sender.username,
        receiver: receiver,
        text: msgText,
        timestamp: timestamp,
        seen: false, // initially false
    }).then(() => {
        console.log("Message sent!");
    });
}

// Listen for new messages in real time
function listenForMessages(senderUid, receiverUid, callback) {
    const chatRef = db.collection('chats').doc(senderUid).collection(receiverUid);
    
    chatRef.orderBy('timestamp').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const message = change.doc.data();
                callback(message);
            }
        });
    });
}

// Fetch the list of all users (for displaying user list)
function loadUserList(callback) {
    const usersRef = db.collection('users');
    usersRef.get().then(querySnapshot => {
        const users = [];
        querySnapshot.forEach(doc => {
            const user = doc.data();
            users.push(user);
        });
        callback(users);
    });
}

export { saveUserToFirestore, sendMessage, listenForMessages, loadUserList };
