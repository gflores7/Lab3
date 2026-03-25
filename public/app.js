let currentUser = null;
let selectedUser = null;

const API = "http://localhost:3000";

const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");

registerBtn.addEventListener("click", register);
loginBtn.addEventListener("click", login);
sendBtn.addEventListener("click", sendMessage);

async function register() {
  const first_name = document.getElementById("rName").value.trim();
  const last_name = document.getElementById("rLast").value.trim();
  const username = document.getElementById("rUser").value.trim();
  const password = document.getElementById("rPass").value.trim();

  try {
    const res = await fetch(API + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_name, last_name, username, password })
    });

    const data = await res.json();
    statusEl.textContent = data.message || data.error;
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Register failed.";
  }
}

async function login() {
  const username = document.getElementById("lUser").value.trim();
  const password = document.getElementById("lPass").value.trim();

  try {
    const res = await fetch(API + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.error || "Login failed.";
      return;
    }

    currentUser = data.user;
    statusEl.textContent = `Logged in as ${currentUser.first_name}`;
    document.getElementById("app").style.display = "block";
    loadUsers();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Login failed.";
  }
}

async function loadUsers() {
  try {
    const res = await fetch(API + "/users");
    const users = await res.json();

    const usersDiv = document.getElementById("users");
    usersDiv.innerHTML = "";

    users.forEach((u) => {
      if (u.id === currentUser.id) return;

      const div = document.createElement("div");
      div.textContent = `${u.first_name} (@${u.username})`;
      div.addEventListener("click", () => {
        selectedUser = u;
        document.getElementById("chatWith").textContent = `Messages with ${u.first_name}`;
        loadMessages();
      });

      usersDiv.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Could not load users.";
  }
}

async function loadMessages() {
  if (!currentUser || !selectedUser) return;

  try {
    const res = await fetch(`${API}/messages/${currentUser.id}/${selectedUser.id}`);
    const messages = await res.json();

    const msgDiv = document.getElementById("messages");
    msgDiv.innerHTML = "";

    messages.forEach((m) => {
      const div = document.createElement("div");
      div.textContent = `${m.sender_id === currentUser.id ? "You" : selectedUser.first_name}: ${m.message_text}`;
      msgDiv.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Could not load messages.";
  }
}

async function sendMessage() {
  if (!currentUser || !selectedUser) {
    statusEl.textContent = "Pick a user first.";
    return;
  }

  const text = document.getElementById("msg").value.trim();
  if (!text) return;

  try {
    const res = await fetch(API + "/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        message_text: text
      })
    });

    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.error || "Could not send message.";
      return;
    }

    document.getElementById("msg").value = "";
    loadMessages();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Could not send message.";
  }
}