// Import Firebase scripts dynamically
const firebaseConfig = {
  apiKey: "AIzaSyBCZcjanqK11zoYK63s__yEvLH2YCTiRMU",
  authDomain: "viber-88dd9.firebaseapp.com",
  databaseURL: "https://viber-88dd9-default-rtdb.firebaseio.com",
  projectId: "viber-88dd9",
  storageBucket: "viber-88dd9.firebasestorage.app",
  messagingSenderId: "943471655137",
  appId: "1:943471655137:web:f85f8f2f479f1042c25fa0",
  measurementId: "G-VMMV5B04SX"
};

// Load Firebase scripts
function loadFirebase(cb) {
  const script1 = document.createElement('script');
  script1.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
  script1.onload = () => {
    const script2 = document.createElement('script');
    script2.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js';
    script2.onload = cb;
    document.head.appendChild(script2);
  };
  document.head.appendChild(script1);
}

// Utility: hash password using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const AVATARS = [
  'https://api.dicebear.com/7.x/thumbs/svg?seed=cat',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=dog',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=fox',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=lion',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=owl',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=parrot',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=koala',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=unicorn'
];

loadFirebase(() => {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // UI Elements
  const authSection = document.getElementById('auth-section');
  const postSection = document.getElementById('post-section');
  const feedSection = document.getElementById('feed-section');
  const loginBtn = document.getElementById('login-btn');
  const usernameInput = document.getElementById('username');
  const postBtn = document.getElementById('post-btn');
  const postContent = document.getElementById('post-content');
  const feed = document.getElementById('feed');
  const passwordInput = document.getElementById('password');
  const registerBtn = document.getElementById('register-btn');
  const toggleToRegister = document.getElementById('toggle-to-register');
  const toggleToLogin = document.getElementById('toggle-to-login');
  const authMessage = document.getElementById('auth-message');
  const avatarSelectRow = document.getElementById('avatar-select-row');
  const avatarSelect = document.getElementById('avatar-select');
  const logoutBtn = document.getElementById('logout-btn');
  const profileBtn = document.getElementById('profile-btn');
  const profileModal = document.getElementById('profile-modal');
  const closeProfileModal = document.getElementById('close-profile-modal');
  const editUsernameInput = document.getElementById('edit-username');
  const editAvatarSelect = document.getElementById('edit-avatar-select');
  const saveProfileBtn = document.getElementById('save-profile-btn');
  const profileError = document.getElementById('profile-error');
  const navProfileAvatar = document.getElementById('nav-profile-avatar');
  const navSearch = document.getElementById('nav-search');

  let isLoginMode = true;

  // Show avatar selection only in register mode
  function setAuthMode(loginMode) {
    isLoginMode = loginMode;
    loginBtn.style.display = loginMode ? 'inline-block' : 'none';
    registerBtn.style.display = loginMode ? 'none' : 'inline-block';
    toggleToRegister.style.display = loginMode ? 'inline' : 'none';
    toggleToLogin.style.display = loginMode ? 'none' : 'inline';
    avatarSelectRow.style.display = loginMode ? 'none' : 'flex';
    authMessage.textContent = '';
    if (!loginMode) renderAvatarOptions();
  }

  // Render avatar options
  function renderAvatarOptions() {
    avatarSelect.innerHTML = '';
    AVATARS.forEach((url, i) => {
      const img = document.createElement('img');
      img.src = url;
      img.className = 'avatar-option';
      img.onclick = () => {
        Array.from(document.getElementsByClassName('avatar-option')).forEach(el => el.classList.remove('selected'));
        img.classList.add('selected');
        avatarSelect.dataset.selected = url;
      };
      if (i === 0) {
        img.classList.add('selected');
        avatarSelect.dataset.selected = url;
      }
      avatarSelect.appendChild(img);
    });
  }

  toggleToRegister.onclick = () => setAuthMode(false);
  toggleToLogin.onclick = () => setAuthMode(true);
  setAuthMode(true);

  // --- Utility: Sanitize text to prevent XSS ---
  function sanitize(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Auth Loading State ---
  let authLoading = false;
  function setAuthLoading(loading) {
    authLoading = loading;
    loginBtn.disabled = loading;
    registerBtn.disabled = loading;
    loginBtn.textContent = loading ? 'Loading...' : 'Login';
    registerBtn.textContent = loading ? 'Loading...' : 'Register';
  }

  // --- Focus fields on show ---
  function focusAuthField() {
    if (isLoginMode) {
      usernameInput.focus();
    } else {
      usernameInput.focus();
    }
  }

  // --- Auth logic with improved feedback ---
  registerBtn.onclick = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const avatar = avatarSelect.dataset.selected || AVATARS[0];
    if (!username || !password) {
      authMessage.textContent = 'Please enter a username and password.';
      setAuthLoading(false);
      return;
    }
    db.ref('users/' + username).once('value', async snapshot => {
      if (snapshot.exists()) {
        authMessage.textContent = 'Username already taken.';
        setAuthLoading(false);
      } else {
        const hashed = await hashPassword(password);
        db.ref('users/' + username).set({ password: hashed, avatar });
        authMessage.style.color = '#388e3c';
        authMessage.textContent = 'Registration successful! You can now log in.';
        setTimeout(() => {
          setAuthMode(true);
          authMessage.style.color = '';
          setAuthLoading(false);
          focusAuthField();
        }, 1200);
      }
    });
  };

  loginBtn.onclick = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
      authMessage.textContent = 'Please enter your username and password.';
      setAuthLoading(false);
      return;
    }
    db.ref('users/' + username).once('value', async snapshot => {
      if (!snapshot.exists()) {
        authMessage.textContent = 'User not found.';
        setAuthLoading(false);
      } else {
        const hashed = await hashPassword(password);
        if (snapshot.val().password === hashed) {
          showApp(username);
          setAuthLoading(false);
        } else {
          authMessage.textContent = 'Incorrect password.';
          setAuthLoading(false);
        }
      }
    });
  };

  // Online status logic
  function setOnlineStatus(username, online) {
    db.ref('users/' + username + '/online').set(online);
    if (online) {
      window.addEventListener('beforeunload', () => {
        db.ref('users/' + username + '/online').set(false);
      });
    }
  }

  // Hide nav elements initially
  navProfileAvatar.style.display = 'none';
  profileBtn.style.display = 'none';
  logoutBtn.style.display = 'none';
  navSearch.style.display = 'none';

  // --- Clean up listeners ---
  let userListListener = null;
  let chatListener = null;
  function cleanupListeners() {
    if (userListListener) db.ref('users').off('value', userListListener);
    if (chatListener) chatListener.off();
    userListListener = null;
    chatListener = null;
  }

  // Dropdown menu logic
  const navMenuBtn = document.getElementById('nav-menu-btn');
  const navDropdown = document.getElementById('nav-dropdown');
  const dropdownEditProfile = document.getElementById('dropdown-edit-profile');
  const dropdownLogout = document.getElementById('dropdown-logout');
  const dropdownDownloadApp = document.getElementById('dropdown-download-app');

  // Hide dropdown initially
  navDropdown.style.display = 'none';

  // Open/close dropdown
  navMenuBtn.onclick = (e) => {
    e.stopPropagation();
    if (navDropdown.style.display === 'none') {
      navDropdown.style.display = 'flex';
    } else {
      navDropdown.style.display = 'none';
    }
  };
  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!navDropdown.contains(e.target) && e.target !== navMenuBtn) {
      navDropdown.style.display = 'none';
    }
  });

  // Hide menu when not logged in
  function hideMenu() {
    navMenuBtn.style.display = 'none';
    navDropdown.style.display = 'none';
  }
  function showMenu() {
    navMenuBtn.style.display = 'inline-block';
  }
  hideMenu();

  // Show menu after login
  function showApp(username) {
    cleanupListeners();
    authSection.style.display = 'none';
    document.getElementById('messenger-section').style.display = 'flex';
    navSearch.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    profileBtn.style.display = 'none';
    showMenu();
    db.ref('users/' + username).once('value', snap => {
      const avatar = (snap.val() && snap.val().avatar) || AVATARS[0];
      navProfileAvatar.src = avatar;
      navProfileAvatar.style.display = 'inline-block';
    });
    localStorage.setItem('viber-username', username);
    setOnlineStatus(username, true);
    loadUserList(username);
  }
  // Hide menu on logout
  logoutBtn.onclick = () => {
    const username = localStorage.getItem('viber-username');
    if (username) db.ref('users/' + username + '/online').set(false);
    localStorage.removeItem('viber-username');
    navProfileAvatar.style.display = 'none';
    navSearch.style.display = 'none';
    cleanupListeners();
    hideMenu();
    location.reload();
  };
  // Dropdown actions
  dropdownEditProfile.onclick = () => {
    navDropdown.style.display = 'none';
    profileBtn.onclick();
  };
  dropdownLogout.onclick = () => {
    navDropdown.style.display = 'none';
    logoutBtn.onclick();
  };

  // --- PWA Install Prompt ---
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  dropdownDownloadApp.onclick = async () => {
    navDropdown.style.display = 'none';
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt = null;
      }
    } else {
      alert('To install the app, use your browser\'s menu: Add to Home Screen or Install App.');
    }
  };

  // --- User search filter ---
  navSearch.addEventListener('input', function() {
    const currentUser = localStorage.getItem('viber-username');
    loadUserList(currentUser, navSearch.value.trim().toLowerCase());
  });

  // --- Load user list (except self, with search, and placeholder) ---
  function loadUserList(currentUser, search = '') {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    if (userListListener) db.ref('users').off('value', userListListener);
    userListListener = db.ref('users').on('value', snapshot => {
      const users = snapshot.val() || {};
      let found = false;
      Object.keys(users).forEach(user => {
        if (user !== currentUser && user.toLowerCase().includes(search)) {
          found = true;
          const li = document.createElement('li');
          // Avatar
          const wrapper = document.createElement('span');
          wrapper.className = 'user-list-avatar-wrapper';
          const img = document.createElement('img');
          img.src = users[user].avatar || AVATARS[0];
          img.className = 'avatar';
          wrapper.appendChild(img);
          // Online dot
          if (users[user].online) {
            const dot = document.createElement('span');
            dot.className = 'user-online-dot';
            wrapper.appendChild(dot);
          }
          li.appendChild(wrapper);
          li.appendChild(document.createTextNode(user));
          li.onclick = () => selectChatUser(currentUser, user, li);
          userList.appendChild(li);
        }
      });
      if (!found) {
        const li = document.createElement('li');
        li.textContent = search ? 'No users found.' : 'No other users yet.';
        li.style.color = '#aaa';
        li.style.textAlign = 'center';
        userList.appendChild(li);
      }
    });
  }

  // --- Chat logic with improved UX ---
  let currentChatUser = null;
  function selectChatUser(currentUser, otherUser, liElem) {
    Array.from(document.querySelectorAll('#user-list li')).forEach(li => li.classList.remove('selected'));
    liElem.classList.add('selected');
    currentChatUser = otherUser;
    const chatSection = document.getElementById('chat-section');
    chatSection.style.display = 'flex';
    db.ref('users/' + otherUser).once('value', snap => {
      const avatar = (snap.val() && snap.val().avatar) || AVATARS[0];
      document.getElementById('chat-with').innerHTML = `<img src="${avatar}" class="avatar"> ${sanitize(otherUser)}`;
    });
    loadChat(currentUser, otherUser);
  }

  function getChatId(user1, user2) {
    return [user1, user2].sort().join('_');
  }

  function loadChat(currentUser, otherUser) {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    if (chatListener) chatListener.off();
    const chatId = getChatId(currentUser, otherUser);
    chatListener = db.ref('messages/' + chatId);
    chatListener.on('value', snapshot => {
      const messages = snapshot.val() || {};
      chatMessages.innerHTML = '';
      let hasMessages = false;
      Object.entries(messages)
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .forEach(([msgId, msg]) => {
          hasMessages = true;
          const div = document.createElement('div');
          div.className = 'chat-message' + (msg.sender === currentUser ? ' me' : '');
          // Avatar
          const img = document.createElement('img');
          img.src = msg.avatar || AVATARS[0];
          img.className = 'avatar';
          div.appendChild(img);
          // Message text
          const span = document.createElement('span');
          span.innerHTML = sanitize(msg.content);
          div.appendChild(span);
          // Timestamp
          const time = document.createElement('span');
          time.style.fontSize = '0.85em';
          time.style.marginLeft = '0.7em';
          time.style.color = msg.sender === currentUser ? '#fff' : '#888';
          time.textContent = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          div.appendChild(time);
          // Read receipt
          if (msg.sender === currentUser) {
            const readMark = document.createElement('span');
            readMark.style.fontSize = '0.9em';
            readMark.style.marginLeft = '0.5em';
            readMark.textContent = msg.read ? '✓' : '';
            div.appendChild(readMark);
          }
          chatMessages.appendChild(div);
        });
      if (!hasMessages) {
        const empty = document.createElement('div');
        empty.textContent = 'No messages yet. Say hi!';
        empty.style.color = '#aaa';
        empty.style.textAlign = 'center';
        chatMessages.appendChild(empty);
      }
      chatMessages.scrollTop = chatMessages.scrollHeight;
      markMessagesRead(chatId, currentUser);
    });
  }

  function markMessagesRead(chatId, currentUser) {
    db.ref('messages/' + chatId).once('value', snapshot => {
      const updates = {};
      snapshot.forEach(child => {
        const msg = child.val();
        if (msg.receiver === currentUser && !msg.read) {
          updates[child.key + '/read'] = true;
        }
      });
      if (Object.keys(updates).length > 0) {
        db.ref('messages/' + chatId).update(updates);
      }
    });
  }

  // --- Send message logic with UX improvements ---
  const sendBtn = document.getElementById('send-btn');
  const chatInput = document.getElementById('chat-input');
  sendBtn.onclick = sendMessage;
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMessage();
  });

  function sendMessage() {
    const content = chatInput.value.trim();
    const sender = localStorage.getItem('viber-username');
    const receiver = currentChatUser;
    if (!content || !sender || !receiver) return;
    sendBtn.disabled = true;
    db.ref('users/' + sender).once('value', snap => {
      const avatar = (snap.val() && snap.val().avatar) || AVATARS[0];
      const chatId = getChatId(sender, receiver);
      const msg = {
        sender,
        receiver,
        content,
        timestamp: Date.now(),
        avatar,
        read: false
      };
      db.ref('messages/' + chatId).push(msg).then(() => {
        chatInput.value = '';
        sendBtn.disabled = false;
        chatInput.focus();
      });
    });
  }

  // --- Disable send button if no chat or no message ---
  chatInput.addEventListener('input', function() {
    sendBtn.disabled = !chatInput.value.trim() || !currentChatUser;
  });
  sendBtn.disabled = true;

  // --- Placeholder for chat section if no chat selected ---
  const chatSection = document.getElementById('chat-section');
  if (chatSection) {
    chatSection.style.display = 'none';
    const chatWith = document.getElementById('chat-with');
    if (chatWith) chatWith.innerHTML = '<span style="color:#aaa;">Select a user to start chatting.</span>';
  }

  // Show/hide profile modal
  profileBtn.onclick = () => {
    const currentUser = localStorage.getItem('viber-username');
    if (!currentUser) return;
    db.ref('users/' + currentUser).once('value', snap => {
      const user = snap.val();
      editUsernameInput.value = currentUser;
      renderEditAvatarOptions(user.avatar || AVATARS[0]);
      profileError.textContent = '';
      profileModal.style.display = 'flex';
    });
  };
  closeProfileModal.onclick = () => {
    profileModal.style.display = 'none';
  };
  window.onclick = function(event) {
    if (event.target === profileModal) profileModal.style.display = 'none';
  };

  function renderEditAvatarOptions(selectedUrl) {
    editAvatarSelect.innerHTML = '';
    AVATARS.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.className = 'avatar-option';
      if (url === selectedUrl) img.classList.add('selected');
      img.onclick = () => {
        Array.from(editAvatarSelect.getElementsByTagName('img')).forEach(el => el.classList.remove('selected'));
        img.classList.add('selected');
        editAvatarSelect.dataset.selected = url;
      };
      editAvatarSelect.appendChild(img);
    });
    editAvatarSelect.dataset.selected = selectedUrl;
  }

  // Save profile changes
  saveProfileBtn.onclick = async () => {
    const oldUsername = localStorage.getItem('viber-username');
    const newUsername = editUsernameInput.value.trim();
    const newAvatar = editAvatarSelect.dataset.selected || AVATARS[0];
    if (!newUsername) {
      profileError.textContent = 'Username cannot be empty.';
      return;
    }
    if (newUsername !== oldUsername) {
      // Check for duplicate username
      db.ref('users/' + newUsername).once('value', snap => {
        if (snap.exists()) {
          profileError.textContent = 'Username already taken.';
        } else {
          // Move user data to new username
          db.ref('users/' + oldUsername).once('value', userSnap => {
            const userData = userSnap.val();
            db.ref('users/' + newUsername).set({ ...userData, avatar: newAvatar });
            db.ref('users/' + oldUsername).remove();
            // Update all messages where sender or receiver is oldUsername
            db.ref('messages').once('value', msgSnap => {
              const updates = {};
              msgSnap.forEach(chat => {
                chat.forEach(msg => {
                  const val = msg.val();
                  let changed = false;
                  if (val.sender === oldUsername) {
                    updates[`/${chat.key}/${msg.key}/sender`] = newUsername;
                    changed = true;
                  }
                  if (val.receiver === oldUsername) {
                    updates[`/${chat.key}/${msg.key}/receiver`] = newUsername;
                    changed = true;
                  }
                  if (changed && val.avatar) {
                    updates[`/${chat.key}/${msg.key}/avatar`] = newAvatar;
                  }
                });
              });
              db.ref('messages').update(updates);
              // Update chat keys if needed
              msgSnap.forEach(chat => {
                const users = chat.key.split('_');
                if (users.includes(oldUsername)) {
                  const other = users[0] === oldUsername ? users[1] : users[0];
                  const oldKey = chat.key;
                  const newKey = [newUsername, other].sort().join('_');
                  if (oldKey !== newKey) {
                    db.ref('messages/' + oldKey).once('value', cSnap => {
                      db.ref('messages/' + newKey).set(cSnap.val());
                      db.ref('messages/' + oldKey).remove();
                    });
                  }
                }
              });
              // Update localStorage and UI
              localStorage.setItem('viber-username', newUsername);
              profileModal.style.display = 'none';
              location.reload();
            });
          });
        }
      });
    } else {
      // Only avatar change
      db.ref('users/' + oldUsername + '/avatar').set(newAvatar);
      // Update avatar in all messages sent by this user
      db.ref('messages').once('value', msgSnap => {
        const updates = {};
        msgSnap.forEach(chat => {
          chat.forEach(msg => {
            const val = msg.val();
            if (val.sender === oldUsername) {
              updates[`/${chat.key}/${msg.key}/avatar`] = newAvatar;
            }
          });
        });
        db.ref('messages').update(updates);
        profileModal.style.display = 'none';
        location.reload();
      });
    }
  };

  // Remove old post/feed logic
  // ... existing code ...
}); 