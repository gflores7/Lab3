const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const crypto = require('crypto');

console.log('friends.js loaded'); // <-- just to check Node is reading this file

// connection to database
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '1234',
  database: 'finaldb',
  port: 3306
});

db.connect(err => {
  if (err) {
    console.error(
      `DB connection failed. User: ${db.config.user}, Host: ${db.config.host}, Database: ${db.config.database}`,
      err.message
    );
    process.exit(1); // stop server if DB fails
  }
  console.log(
    `Connected to MySQL as user: ${db.config.user} on ${db.config.host}, DB: ${db.config.database}`
  );
});

// SEND FRIEND REQUEST
router.post('/request', (req, res) => {
  const sender_id = req.body.sender_id;
  const receiver_id = req.body.receiver_id;

  if (!sender_id || !receiver_id) {
    return res.status(400).send('Missing user IDs');
  }

  if (sender_id === receiver_id) {
    return res.send('You cannot add yourself');
  }

  const id = crypto.randomUUID();

  const sql = `
    INSERT INTO friendships (id, sender_id, receiver_id, status)
    VALUES (?, ?, ?, 'pending')
  `;

  db.query(sql, [id, sender_id, receiver_id], (err, result) => {
    if (err) {
      console.error(err);

      if (err.code === 'ER_DUP_ENTRY') {
        return res.send('Friend request already exists');
      }

      return res.status(500).send('Server error');
    }

    res.send('Friend request sent');
  });
});



// ACCEPT FRIEND REQUEST
router.post('/accept', (req, res) => {
  const sender_id = req.body.sender_id;
  const receiver_id = req.body.receiver_id;

  const sql = `
    UPDATE friendships
    SET status = 'accepted'
    WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
  `;

  db.query(sql, [sender_id, receiver_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }

    if (result.affectedRows === 0) {
      return res.send('Request not found');
    }

    res.send('Friend request accepted');
  });
});



// DENY FRIEND REQUEST
router.post('/deny', (req, res) => {
  const sender_id = req.body.sender_id;
  const receiver_id = req.body.receiver_id;

  const sql = `
    UPDATE friendships
    SET status = 'rejected'
    WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
  `;

  db.query(sql, [sender_id, receiver_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }

    if (result.affectedRows === 0) {
      return res.send('Request not found');
    }

    res.send('Friend request denied');
  });
});


// GET FRIEND LIST
router.get('/list/:userid', (req, res) => {
  const userId = req.params.userid;

  const sql = `
    SELECT u.userID, u.userName
    FROM friendships f
    JOIN users u
      ON (
        (u.userID = f.sender_id AND f.receiver_id = ?)
        OR
        (u.userID = f.receiver_id AND f.sender_id = ?)
      )
    WHERE f.status = 'accepted'
  `;

  db.query(sql, [userId, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }

    res.json(results);
  });
});
module.exports = router;