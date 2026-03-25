const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const crypto = require('crypto');


const app = express();
const port = 3000;


// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname));


// MySQL connection
const db = mysql.createConnection({
host: 'localhost',
user: 'root',
password: 'Akeno19!', // ⚠️ keep private in real projects
database: 'userDB'
});


db.connect(err => {
if (err) {
console.error('Database connection failed:', err);
return;
}
console.log('Connected to MySQL');
});




// Test route
app.get('/', (req, res) => {
res.send('Backend Server is running!');
});


// Test user route
app.get('/hello-user', (req, res) => {
const sql = 'SELECT * FROM users LIMIT 1';


db.query(sql, (err, results) => {
if (err) {
console.error(err);
return res.status(500).send('Database error');
}


if (results.length === 0) {
return res.send('No users found');
}


const user = results[0];
res.send(`Hello, ${user.first_name}!`);
});
});




// LOGIN (FIXED HASHING)
app.post('/login', (req, res) => {
const username = req.body.username;


const hashedPassword = crypto
.createHash('sha256')
.update(req.body.password)
.digest('hex');


const sql = `
SELECT * FROM users
WHERE username = ? AND password = ?
`;


db.query(sql, [username, hashedPassword], (err, results) => {
if (err) {
console.error(err);
return res.status(500).send('Server error');
}


if (results.length > 0) {
res.send(`Welcome back, ${results[0].first_name}!`);
} else {
res.send('Invalid username or password.');
}
});
});




// SAVE LOCATION
app.post('/location', (req, res) => {
const { latitude, longitude } = req.body;


if (!latitude || !longitude) {
return res.status(400).send('Missing coordinates');
}


const sql = `
INSERT INTO locations (latitude, longitude)
VALUES (?, ?)
`;


db.query(sql, [latitude, longitude], (err, result) => {
if (err) {
console.error(err);
return res.status(500).send('Database error');
}


res.send('Location saved!');
});
});




// GET ALL LOCATIONS
app.get('/locations', (req, res) => {
const sql = 'SELECT * FROM locations ORDER BY created_at DESC';


db.query(sql, (err, results) => {
if (err) {
console.error(err);
return res.status(500).send('Database error');
}


res.json(results);
});
});




// 404 handler
app.use((req, res) => {
res.status(404).send('Not Found');
});




// Start server
app.listen(port, () => {
console.log(`Server running at http://localhost:${port}`);
});





