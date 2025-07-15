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
  const navMenuBtn = document.getElementById('nav-menu-btn');
  const navMenuDropdown = document.getElementById('nav-menu-dropdown');
  const menuEditProfile = document.getElementById('menu-edit-profile');
  const menuDownloadApp = document.getElementById('menu-download-app');
  const menuLogout = document.getElementById('menu-logout');

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

  // Registration logic
  registerBtn.onclick = async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const avatar = avatarSelect.dataset.selected || AVATARS[0];
    if (!username || !password) {
      authMessage.textContent = 'Please enter a username and password.';
      return;
    }
    const userRef = db.ref('users/' + username);
    userRef.once('value', async snapshot => {
      if (snapshot.exists()) {
        authMessage.textContent = 'Username already taken.';
      } else {
        const hashed = await hashPassword(password);
        userRef.set({ password: hashed, avatar });
        authMessage.style.color = '#388e3c';
        authMessage.textContent = 'Registration successful! You can now log in.';
        setTimeout(() => {
          setAuthMode(true);
          authMessage.style.color = '';
        }, 1200);
      }
    });
  };

  // Login logic
  loginBtn.onclick = async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
      authMessage.textContent = 'Please enter your username and password.';
      return;
    }
    const userRef = db.ref('users/' + username);
    userRef.once('value', async snapshot => {
      if (!snapshot.exists()) {
        authMessage.textContent = 'User not found.';
      } else {
        const hashed = await hashPassword(password);
        if (snapshot.val().password === hashed) {
          showApp(username);
        } else {
          authMessage.textContent = 'Incorrect password.';
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
  navMenuBtn.style.display = 'none';
  navMenuDropdown.style.display = 'none';
  navSearch.style.display = 'none';

  // Show nav menu after login
  function showApp(username) {
    authSection.style.display = 'none';
    document.getElementById('messenger-section').style.display = 'flex';
    navMenuBtn.style.display = 'inline-flex';
    navSearch.style.display = 'inline-block';
    // Show avatar in nav
    db.ref('users/' + username).once('value', snap => {
      const avatar = (snap.val() && snap.val().avatar) || AVATARS[0];
      navProfileAvatar.src = avatar;
      navProfileAvatar.style.display = 'inline-block';
    });
    localStorage.setItem('viber-username', username);
    setOnlineStatus(username, true);
    loadUserList(username);
  }

  // 3-dot menu logic
  navMenuBtn.onclick = (e) => {
    e.stopPropagation();
    navMenuDropdown.style.display = navMenuDropdown.style.display === 'flex' ? 'none' : 'flex';
  };
  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (navMenuDropdown.style.display === 'flex') {
      navMenuDropdown.style.display = 'none';
    }
  });
  navMenuDropdown.onclick = (e) => e.stopPropagation();

  // Menu actions
  menuEditProfile.onclick = () => {
    navMenuDropdown.style.display = 'none';
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
  menuLogout.onclick = () => {
    navMenuDropdown.style.display = 'none';
    const username = localStorage.getItem('viber-username');
    if (username) db.ref('users/' + username + '/online').set(false);
    localStorage.removeItem('viber-username');
    navProfileAvatar.style.display = 'none';
    navMenuBtn.style.display = 'none';
    navMenuDropdown.style.display = 'none';
    navSearch.style.display = 'none';
    location.reload();
  };
  menuDownloadApp.onclick = () => {
    navMenuDropdown.style.display = 'none';
    // For PWA, prompt install if available, else show instructions
    if (window.matchMedia('(display-mode: standalone)').matches) {
      alert('App is already installed!');
    } else {
      alert('To install the app, use your browser\'s "Add to Home Screen" or "Install App" option.');
    }
  };

  // User search filter
  navSearch.addEventListener('input', function() {
    const currentUser = localStorage.getItem('viber-username');
    loadUserList(currentUser, navSearch.value.trim().toLowerCase());
  });

  // Load user list (except self, with search)
  function loadUserList(currentUser, search = '') {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    db.ref('users').on('value', snapshot => {
      const users = snapshot.val() || {};
      Object.keys(users).forEach(user => {
        if (user !== currentUser && user.toLowerCase().includes(search)) {
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
    });
  }

  let currentChatUser = null;
  let chatListener = null;

  function selectChatUser(currentUser, otherUser, liElem) {
    Array.from(document.querySelectorAll('#user-list li')).forEach(li => li.classList.remove('selected'));
    liElem.classList.add('selected');
    currentChatUser = otherUser;
    const chatSection = document.getElementById('chat-section');
    chatSection.style.display = 'flex';
    // Show avatar and name
    db.ref('users/' + otherUser).once('value', snap => {
      const avatar = (snap.val() && snap.val().avatar) || AVATARS[0];
      document.getElementById('chat-with').innerHTML = `<img src="${avatar}" class="avatar"> Chat with ${otherUser}`;
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
      Object.entries(messages)
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .forEach(([msgId, msg]) => {
          const div = document.createElement('div');
          div.className = 'chat-message' + (msg.sender === currentUser ? ' me' : '');
          // Avatar
          const img = document.createElement('img');
          img.src = msg.avatar || AVATARS[0];
          img.className = 'avatar';
          div.appendChild(img);
          // Message text
          const span = document.createElement('span');
          span.textContent = msg.content;
          div.appendChild(span);
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
      chatMessages.scrollTop = chatMessages.scrollHeight;
      // Mark messages as read
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

  // Send message
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
    if (content && sender && receiver) {
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
        db.ref('messages/' + chatId).push(msg);
        chatInput.value = '';
      });
    }
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