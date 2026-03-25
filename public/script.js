let messageInterval = null;
let currentUser = null;
let selectedUser = null;
let users = [];

async function registerUser() {
  const first_name = document.getElementById('regFirstName').value.trim();
  const last_name = document.getElementById('regLastName').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  const status = document.getElementById('registerStatus');
  status.textContent = '';

  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name, last_name, username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      status.textContent = data.error;
      return;
    }

    status.textContent = data.message;
  } catch (err) {
    status.textContent = 'Register failed.';
    console.error(err);
  }
}

async function loginUser() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  const status = document.getElementById('loginStatus');
  status.textContent = '';

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      status.textContent = data.error;
      return;
    }

    currentUser = data.user;

    document.getElementById('currentUser').textContent =
      `Logged in as ${currentUser.first_name} ${currentUser.last_name} (@${currentUser.username})`;

    status.textContent = data.message;

    await loadUsers();
  } catch (err) {
    status.textContent = 'Login failed.';
    console.error(err);
  }
}

async function loadUsers() {
  try {
    const res = await fetch('/users');
    const allUsers = await res.json();

    users = allUsers.filter(user => user.id !== currentUser.id);

    renderUsers();

    // auto-select Jovanny if he exists
    const jovanny = users.find(
      user => user.username.toLowerCase() === 'jovanny'
    );

    if (jovanny) {
      selectedUser = jovanny;
      document.getElementById('chatTitle').textContent =
        `Messages with ${selectedUser.first_name} ${selectedUser.last_name}`;
      await loadMessages();
    }
  } catch (err) {
    console.error('Could not load users', err);
  }
}

function renderUsers() {
  const usersDiv = document.getElementById('usersList');
  usersDiv.innerHTML = '';

  users.forEach(user => {
    const btn = document.createElement('button');
    btn.textContent = `${user.first_name} ${user.last_name} (@${user.username})`;

    // 👇 THIS IS WHERE IT GOES
    btn.onclick = async () => {
      selectedUser = user;

      document.getElementById('chatTitle').textContent =
        `Messages with ${selectedUser.first_name} ${selectedUser.last_name}`;

      await loadMessages();

      //  START AUTO REFRESH
      if (messageInterval) clearInterval(messageInterval);

      messageInterval = setInterval(() => {
        loadMessages();
      }, 2000);
    };

    usersDiv.appendChild(btn);
  });
}

async function loadMessages() {
  if (!currentUser || !selectedUser) return;

  try {
    const res = await fetch(`/messages/${currentUser.id}/${selectedUser.id}`);
    const messages = await res.json();

    const box = document.getElementById('messagesBox');
    box.innerHTML = '';

    messages.forEach(msg => {
      const div = document.createElement('div');

      if (msg.sender_id === currentUser.id) {
        div.textContent = `You: ${msg.message_text}`;
      } else {
        div.textContent = `${selectedUser.first_name}: ${msg.message_text}`;
      }

      box.appendChild(div);
    });
  } catch (err) {
    console.error('Could not load messages', err);
  }
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const message_text = input.value.trim();

  if (!currentUser) {
    alert('Please log in first.');
    return;
  }

  if (!selectedUser) {
    alert('Please select a user first.');
    return;
  }

  if (!message_text) {
    return;
  }

  try {
    const res = await fetch('/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        message_text
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    input.value = '';
    await loadMessages();
  } catch (err) {
    console.error('Could not send message', err);
  }
}