const express = require('express')
const {
  getSingleSession,
  getAllSessions,
  createSession,
  joinSession,
  getSessionsFiltered,
  deleteSession
} = require('../controllers/sessionController')

const router = express.Router()

// GET all listings
router.get('/', getAllSessions)
// GET one session
router.get('/:session_id', getSingleSession)
// POST one session
router.post('/create', createSession)
// POST a user to attendees
router.post('/join-session', joinSession)
// POST to get a list of filtered sessions
router.post('/filtered', getSessionsFiltered)
// DELETE a session
router.delete('/delete-session', deleteSession)

module.exports = router;