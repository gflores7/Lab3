const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ----------------------
// MIDDLEWARE
// ----------------------
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// ----------------------
// DATABASE CONNECTION
// ----------------------
const db = mysql.createConnection({
  host: 'localhost',
  user: 'appuser',
  password: '1234',
  database: 'userDB'
});

// ----------------------
// REGISTER
// ----------------------
app.post('/register', (req, res) => {
  const { first_name, last_name, username, password } = req.body;

  if (!first_name || !last_name || !username || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const hashedPassword = crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');

  const sql = `
    INSERT INTO users (first_name, last_name, username, password)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [first_name, last_name, username, hashedPassword], (err, result) => {
    if (err) {
      console.error('Register error:', err);

      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Username already exists.' });
      }

      return res.status(500).json({ error: err.message });
    }

    res.json({
      message: 'User registered successfully',
      userId: result.insertId
    });
  });
});

// ----------------------
// LOGIN
// ----------------------
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  const hashedPassword = crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');

  const sql = `
    SELECT id, first_name, last_name, username
    FROM users
    WHERE username = ? AND password = ?
  `;

  db.query(sql, [username, hashedPassword], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Server error.' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid login.' });
    }

    res.json({
      message: 'Login successful',
      user: results[0]
    });
  });
});

// ----------------------
// GET USERS
// ----------------------
app.get('/users', (req, res) => {
  const sql = `
    SELECT id, first_name, last_name, username
    FROM users
    ORDER BY first_name ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Users error:', err);
      return res.status(500).json({ error: 'Could not fetch users.' });
    }

    res.json(results);
  });
});

// ----------------------
// SEND MESSAGE
// ----------------------
app.post('/messages', (req, res) => {
  const { sender_id, receiver_id, message_text } = req.body;

  if (!sender_id || !receiver_id || !message_text) {
    return res.status(400).json({ error: 'Missing fields.' });
  }

  const sql = `
    INSERT INTO messages (sender_id, receiver_id, message_text)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [sender_id, receiver_id, message_text], (err, result) => {
    if (err) {
      console.error('Send error:', err);
      return res.status(500).json({ error: 'Could not send message.' });
    }

    res.json({
      message: 'Message sent',
      id: result.insertId
    });
  });
});

// ----------------------
// GET CONVERSATION
// ----------------------
app.get('/messages/:user1/:user2', (req, res) => {
  const { user1, user2 } = req.params;

  const sql = `
    SELECT *
    FROM messages
    WHERE (sender_id = ? AND receiver_id = ?)
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `;

  db.query(sql, [user1, user2, user2, user1], (err, results) => {
    if (err) {
      console.error('Conversation error:', err);
      return res.status(500).json({ error: 'Could not fetch messages.' });
    }

    res.json(results);
  });
});

// ----------------------
// START SERVER
// ----------------------
db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }

  console.log('✅ Connected to MySQL database');

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});