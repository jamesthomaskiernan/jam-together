const firebase = require("firebase/app");
const express = require('express');

const userRoutes = require('./routes/userRoutes')
const sessionsRoutes = require('./routes/sessionRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const reportRoutes = require('./routes/reportRoutes')

const PORT = 4000

const firebaseConfig = {YOURDATABASEINFOHERE};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// create express app
const app = express()

// checks if request has body data (e.g. post, patch)
// if it does, passes that data to req object
app.use(express.json())

// will run every time a request comes in, simply logs for debug
app.use((req, res, next) => {
  console.log('connected to path:', req.path, 'with method:', req.method)
  next()
})

// get routes from workout.js file
// first param indicates we only want to use workoutRoutes
// if we get a request from that page
app.use('/api/user', userRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/report', reportRoutes);

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


