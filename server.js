const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'test123!',
  database: 'userDB'
});

app.get('/hello-user', (req, res) => {
  const sql = 'SELECT * FROM users LIMIT 1';

  db.query(sql, (err, results) => {
    if (err) {
      res.send('Database error');
      return;
    }

    if (results.length === 0) {
      res.send('No users found');
      return;
    }

    res.send('Hello, ' + results[0].first_name + '!');
  });
});

app.post('/login', (req, res) => {
  const userName = req.body.userName;
  const password = req.body.password;

  const sql = 'SELECT * FROM users WHERE userName = ?';

  db.query(sql, [userName], (err, results) => {
    if (err) {
      res.send('Database error');
      return;
    }

    if (results.length === 0) {
      res.send('Invalid username or password');
      return;
    }

    if (results[0].password === password) {
      res.send('Login successful');
    } else {
      res.send('Invalid username or password');
    }
  });
});

app.post('/create-user', (req, res) => {
  const userName = req.body.userName;
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email = req.body.email;
  const password = req.body.password;

  const sql = 'INSERT INTO users (userName, first_name, last_name, email, password) VALUES (?, ?, ?, ?, ?)';

  db.query(sql, [userName, first_name, last_name, email, password], (err, result) => {
    if (err) {
      console.log(err);
      res.send('Error creating user: ' + err.sqlMessage);
      return;
    }

    res.send('User created! Your userID is: ' + result.insertId);
  });
});

app.post('/create-convoy', (req, res) => {
  const userID = req.body.userID;
  const name = req.body.name;
  const joinCode = req.body.joinCode;

  const sql = 'INSERT INTO convoys (joinCode, host_userID, name) VALUES (?, ?, ?)';

  db.query(sql, [joinCode, userID, name], (err, result) => {
    if (err) {
      res.send('Error creating convoy');
      return;
    }

    const convoyID = result.insertId;
    const sql2 = "INSERT INTO convoy_members (userID, convoyID, role) VALUES (?, ?, 'host')";

    db.query(sql2, [userID, convoyID], (err2) => {
      if (err2) {
        res.send('Convoy created but host was not added');
        return;
      }

      res.send('Convoy created successfully. Convoy ID: ' + convoyID);
    });
  });
});

app.post('/join-convoy', (req, res) => {
  const userID = req.body.userID;
  const joinCode = req.body.joinCode;

  const sql = 'SELECT * FROM convoys WHERE joinCode = ?';

  db.query(sql, [joinCode], (err, results) => {
    if (err) {
      res.send('Database error');
      return;
    }

    if (results.length === 0) {
      res.send('Convoy not found');
      return;
    }

    const convoyID = results[0].convoyID;

    const sql2 = "INSERT INTO convoy_members (userID, convoyID, role) VALUES (?, ?, 'member')";

    db.query(sql2, [userID, convoyID], (err2) => {
      if (err2) {

        if (err2.code === 'ER_DUP_ENTRY') {
          res.send('User already in convoy');
          return;
        }

        res.send('Error joining convoy: ' + err2.sqlMessage);
        return;
      }

      res.send('Joined convoy successfully');
    });
  });
});

app.get('/convoy-members/:convoyID', (req, res) => {
  const convoyID = req.params.convoyID;

  const sql = `
    SELECT users.userName, convoy_members.role
    FROM convoy_members
    JOIN users ON convoy_members.userID = users.userID
    WHERE convoy_members.convoyID = ?
  `;

  db.query(sql, [convoyID], (err, results) => {
    if (err) {
      res.send('Error loading members');
      return;
    }

    res.json(results);
  });
});

app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.listen(port, () => {
  console.log('Server running at http://localhost:' + port);
});