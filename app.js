import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { auth } from './firebaseConfig.js';
import { loginWithGoogle } from './googleauth.js';
import { collection, addDoc, query, orderBy, onSnapshot, where, getDocs, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { db } from './firebaseConfig.js';

let currentUser = null;
let currentChat = null;
let currentSessionToken = null;
let displayedUsers = new Set();

async function loadChats() {
  if (!currentUser) return;

  displayedUsers.clear();

  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("chatScreen").classList.remove("hidden");

  const userList = document.getElementById("userList");
  userList.innerHTML = "";

  const chatsRef = collection(db, "chats");

  // Query chats where currentUser is sender or receiver
  const qSender = query(chatsRef, where("sender", "==", currentUser.username));
  const qReceiver = query(chatsRef, where("receiver", "==", currentUser.username));

  const chatSnapshotSender = await getDocs(qSender);
  const chatSnapshotReceiver = await getDocs(qReceiver);

  const chatUsers = new Set();

  chatSnapshotSender.forEach((doc) => {
    const data = doc.data();
    chatUsers.add(data.receiver);
  });

  chatSnapshotReceiver.forEach((doc) => {
    const data = doc.data();
    chatUsers.add(data.sender);
  });

  for (const username of chatUsers) {
    if (username === currentUser.username) continue;

    if (displayedUsers.has(username)) continue;

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      const user = doc.data();
      const li = document.createElement("li");
      li.textContent = user.username;
      li.onclick = () => openChat(user.username);
      userList.appendChild(li);
      displayedUsers.add(user.username);
    });
  }

  document.getElementById("profileUser").textContent = currentUser.username;
  document.getElementById("profileEmail").textContent = currentUser.email;

  if (!currentChat) {
    document.getElementById("messageBox").classList.add("hidden");
    document.getElementById("chatArea").innerHTML = "<p style='text-align:center;color:#999;'>Select a chat</p>";
  }
}

async function searchUserByUsername() {
  const searchInput = document.getElementById("userSearchInput").value.trim();
  const userList = document.getElementById("userList");
  userList.innerHTML = "";
  displayedUsers.clear();

  if (searchInput === "") {
    await loadChats();  // await here to ensure UI resets before user continues
    return;
  }

  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    where("username", ">=", searchInput),
    where("username", "<=", searchInput + "\uf8ff")
  );

  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((doc) => {
    const user = doc.data();
    if (user.username !== currentUser.username && !displayedUsers.has(user.username)) {
      const li = document.createElement("li");
      li.textContent = user.username;
      li.onclick = () => openChat(user.username);
      userList.appendChild(li);
      displayedUsers.add(user.username);
    }
  });
}

function openChat(username) {
  currentChat = username;

  const chatHeader = document.getElementById("chatHeader");
  chatHeader.textContent = `Chat with ${username}`;
  chatHeader.style.cursor = 'pointer';
  chatHeader.onclick = () => {
    document.getElementById("receiverName").textContent = username;
    document.getElementById("receiverPopup").classList.remove("hidden");
  };

  document.getElementById("chatArea").innerHTML = "";
  loadMessages(username);
  document.getElementById("messageBox").classList.remove("hidden");
}

async function loadMessages(username) {
  const chatRef = collection(db, "chats");
  const chatQuery = query(chatRef, orderBy("timestamp"));

  onSnapshot(chatQuery, (querySnapshot) => {
    const chatArea = document.getElementById("chatArea");
    chatArea.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const isYouToThem = data.sender === currentUser.username && data.receiver === username;
      const isThemToYou = data.sender === username && data.receiver === currentUser.username;

      if (isYouToThem || isThemToYou) {
        addMessage(data.text, data.sender === username, data.timestamp?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    });
  });
}

function sendMessage() {
  const input = document.getElementById("msgInput");
  const msg = input.value.trim();
  if (!msg || !currentChat) return;

  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  addDoc(collection(db, "chats"), {
    text: msg,
    sender: currentUser.username,
    receiver: currentChat,
    timestamp: new Date(),
  });

  addMessage(msg, false, timeString);
  input.value = "";
}

function addMessage(text, isReceiver, timestamp) {
  const chatArea = document.getElementById("chatArea");
  const div = document.createElement("div");
  div.className = "msg" + (isReceiver ? " bot" : " user");

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  const textElement = document.createElement("p");
  textElement.textContent = text;

  const time = document.createElement("span");
  time.className = "timestamp";
  time.textContent = timestamp;

  messageContent.appendChild(textElement);
  messageContent.appendChild(time);
  div.appendChild(messageContent);
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

async function loginWithEmail() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) return alert("Please enter both email and password.");

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    handleLogin(userCredential.user);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      document.getElementById("createAccountBtn").classList.remove("hidden");
      alert("Account not found. Please create a new account.");
    } else {
      alert("Login error: " + err.message);
    }
  }
}

async function createAccount() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) return alert("Please enter both email and password.");

  try {
    const newUser = await createUserWithEmailAndPassword(auth, email, password);
    handleLogin(newUser.user);
  } catch (err) {
    alert("Account creation failed: " + err.message);
  }
}

async function handleLogin(user) {
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    let username = "";
    let isUnique = false;

    while (!isUnique) {
      username = prompt("Please choose a unique username:");

      if (username === null) {
        alert("Account setup cancelled.");
        await signOut(auth);
        return location.reload();
      }

      username = username.trim().toLowerCase();

      if (!username) {
        alert("Username is required!");
        continue;
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert("❌ Username already taken. Try another.");
      } else {
        await setDoc(userDocRef, {
          username,
          email: user.email,
        });
        isUnique = true;
        currentUser = { email: user.email, username };
        localStorage.setItem("yatsaapUser", JSON.stringify(currentUser));
        loadChats();
      }
    }
  } else {
    const data = userDoc.data();
    currentUser = {
      username: data.username,
      email: data.email,
    };
    localStorage.setItem("yatsaapUser", JSON.stringify(currentUser));
    loadChats();
  }
}


window.addEventListener("DOMContentLoaded", () => {
  const savedUser = localStorage.getItem("yatsaapUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    loadChats();
  }

  document.getElementById("loginBtn").addEventListener("click", loginWithEmail);
  document.getElementById("signUpBtn").addEventListener("click", createAccount);
  document.getElementById("google-login-button").addEventListener("click", () => {
    loginWithGoogle(handleLogin);
  });

  document.getElementById("sendBtn").addEventListener("click", sendMessage);
  document.getElementById("msgInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  document.getElementById("profileBtn").addEventListener("click", () => {
    document.getElementById("profilePopup").classList.toggle("hidden");
  });
  document.getElementById("closePopupBtn").addEventListener("click", () => {
    document.getElementById("profilePopup").classList.add("hidden");
  });
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("yatsaapUser");
    signOut(auth);
    location.reload();
  });
  document.getElementById("closeReceiverPopupBtn").addEventListener("click", () => {
    document.getElementById("receiverPopup").classList.add("hidden");
  });

  document.getElementById("userSearchInput").addEventListener("input", searchUserByUsername);

  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
});


