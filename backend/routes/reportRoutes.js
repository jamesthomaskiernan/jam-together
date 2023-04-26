const express = require('express')
const {
  reportUser, userReports, bugReports
} = require('../controllers/reportController')

const router = express.Router()

// POST a new user report
router.post('/user', reportUser)

// GET all user reports
router.get('/user-reports', userReports)

// GET all bug reports
router.get('/bug-reports', bugReports)

module.exports = router;