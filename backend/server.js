const express = require('express');
const app = express();
const PORT = 3000;
const axios = require('axios');

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

const cors = require('cors');
app.use(cors());

app.get('/', (req, res) => {
  res.send('Backend is working');
});

const friendRoutes = require('./friends');
app.use('/friends', friendRoutes);

//this is a test for sending requests.
app.get('/send-test', (req, res) => {
  axios.post('http://localhost:3000/friends/request', {
    sender_id: 1,
    receiver_id: 2
  })
  .then(response => res.send(response.data))
  .catch(err => res.send(err.message));
});


//this is a test for the accept feature 
app.get('/accept-test', (req, res) => {
  axios.post('http://localhost:3000/friends/accept', {
    sender_id: 1,
    receiver_id: 2
  })
  .then(response => res.send(response.data))
  .catch(err => res.send(err.message));
});

//This is a test to get the friends list. 
app.get('/list-test', (req, res) => {
  axios.get('http://localhost:3000/friends/list/1')
    .then(response => res.json(response.data))
    .catch(err => res.send(err.message));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});