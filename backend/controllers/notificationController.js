const firebase = require("firebase/database");
require("./controllerHelpers");

const {
  getUserIDWithUsername,
  doesUserExist,
  getFriendStatus,
  getNotification,
  markNotificationDone,
  getSession,
  isUserAttendingSession,
} = require("./controllerHelpers");

// Pushes a new friend request notification to the receiver
const sendFriendRequest = async (req, res) => {
  const {senderID, receiverUsername} = req.body
  
  // make sure username corresponds to user
  let receiverID = await getUserIDWithUsername(receiverUsername)
  if (!receiverID) {return res.status(400).json("Couldn't find user with that username")}

  // make sure userID and receiverID are actual users
  if (!await doesUserExist(senderID)) {return res.status(400).json("User does not exist")}
  if (!await doesUserExist(receiverID)) {return res.status(400).json("Receiver does not exist")}

  // make sure user and receiver are different
  if (senderID == receiverID) {return res.status(400).json("You cannot send a friend request to yourself")}

  // make sure users are not already friends, or have already sent request
  let friendStatus = await getFriendStatus(senderID, receiverID)
  if (friendStatus == "pending") {return res.status(400).json("You have already sent a request to this user")}
  if (friendStatus == true) {return res.status(400).json("You are already friends with this user")}

  const db = firebase.getDatabase();

  // push notification to receiver
  try {
    let path = firebase.ref(db, 'users/' + receiverID + "/notifications/")
    await firebase.push(path, {
      type: "friend request",
      status: "pending",
      senderID: senderID,
      time: new Date(),
    })

    path = firebase.ref(db, 'users/' + senderID + "/friends/")
    await firebase.update(path, {[receiverID]:"pending"})
    return res.status(200).json("Successfully sent friend request")
  } catch (error) {
    console.log(error.message)
    return res.status(400).json('Couldn\'t send friend request')
  }
}

// Changes friend request notification from "pending" to "done"
// Also adds notification sender to receiver's friends list, if answer is true
const answerFriendRequest = async (req, res) => {
  const {userID, notificationID, answer} = req.body
  const db = firebase.getDatabase();

  // make sure userID is an actual user
  if (!await doesUserExist(userID)) {return res.status(400).json("User does not exist")}

  // get notification, make sure it exists
  let notification = await getNotification(userID, notificationID)
  if (!notification) {return res.status(400).json("Bad notification ID")}

  // make sure notification is of type friend request 
  if (notification.type != "friend request") {return res.status(400).json("Incorrect notification type")}

  // make sure notification is still pending
  if (notification.status == "done") {return res.status(400).json("Notification already answered")}

  // change notification from pending to done
  if (!await markNotificationDone(userID, notificationID)) {return res.status(400).json("Failed to update notification")}
  
  // if request was accepted, add sender to receiver's friends list and vice versa
  if (answer) {
    try {
      path = firebase.ref(db, 'users/' + userID + "/friends/")
      await firebase.update(path, {[notification.senderID]:true});
      path = firebase.ref(db, 'users/' + notification.senderID + "/friends/")
      await firebase.update(path, {[userID]:true});
      return res.status(200).json("Successfully answered friend request")
    } catch (error) {
      return res.status(400).json("Couldn't update friend status")
    }
  }
}

// Pushes a new session invite notification to the receiver
const sendSessionInvite = async (req, res) => {
  const {senderID, receiverUsername, sessionID, selectedInstrument} = req.body
  const db = firebase.getDatabase();
  
  // get receiver's userID with their username
  let receiverID = await getUserIDWithUsername(receiverUsername)
  if (!receiverID) {return res.status(400).json("Couldn't find user with that username")}

  // make sure userID and receiverID are actual users
  if (!await doesUserExist(senderID)) {return res.status(400).json("User does not exist")}
  if (!await doesUserExist(receiverID)) {return res.status(400).json("Receiver does not exist")}
  
  // get session and make sure it exists
  let session = await getSession(sessionID)
  if (!session) {return res.status(400).json('Session doesn\'t exist')}

  // we must make sure receiver is not already inside session's attendees
  if (await isUserAttendingSession(receiverID, sessionID)) {return res.status(400).json('User is already attending session')}
  
  // if session has instruments, make sure user sent a selected instrument
  if (session.instruments && !selectedInstrument) {return res.status(400).json('No instrument selected')}

  // if user sent a selected instrument, but session doesn't specify instruments
  if (selectedInstrument && !session.instruments) {return res.status(400).json('Instrument selected, but session doesn\'t specify instruments')}

  // push notification to receiver
  try {
    const path = firebase.ref(db, 'users/' + receiverID + "/notifications/")
    await firebase.push(path, {
      type: "session invite",
      selectedInstrument: selectedInstrument,
      sessionTitle: session.title,
      status: "pending",
      senderID: senderID,
      sessionID: sessionID
    })
    res.status(200).json("Successfully sent session invite")
  } catch (error) {
    res.status(400).json('Couldn\'t push session invite')
  }
}

// Changes session invite notification from "pending" to "done"
// Also adds notification receiver to session's attendees, if answer is true
// If an instrument was selected, also handles that
const answerSessionInvite = async (req, res) => {
  const {userID, notificationID, answer} = req.body
  const db = firebase.getDatabase();

  // get notification, make sure it exists
  let notification = await getNotification(userID, notificationID)
  if (!notification) {return res.status(400).json("Bad notification ID")}

  // make sure notification is of type session invite
  if (notification.type != "session invite") {return res.status(400).json("Incorrect notification type")}

  // make sure notification is still pending
  if (notification.status == "done") {return res.status(400).json("Notification already answered")}

  // make sure userID and receiverID are actual users
  if (!await doesUserExist(userID)) {return res.status(400).json("User does not exist")}

  // get session and make sure it exists
  const session = await getSession(notification.sessionID)
  if (!session) {
    if (!await markNotificationDone(userID, notificationID)) {return res.status(400).json("Failed to update notification")}
    return res.status(400).json('Session has been deleted')
  }

  // if request was accepted
  if (answer) {
    
    // we must make sure receiver is not already inside session's attendees
    if (await isUserAttendingSession(notificationID.receiverID, notification.sessionID)) {return res.status(400).json('You are already attending this session')}

    // make sure there are enough spaces left in the session
    if (session.memberLimit && session.attendees && Object.keys(session.attendees).length >= session.memberLimit)
    {
      return res.status(400).json('No spaces left in session')
    }

    // make sure there are enough spaces left in the session for this type of instrument
    if (session.instruments && session.instrumentsTaken && session.instrumentsTaken[notification.selectedInstrument] && session.instrumentsTaken[notification.selectedInstrument] >= session.instruments[notification.selectedInstrument])
    {
      return res.status(400).json('No spaces left in session for this instrument')
    }

    // add user's ID to session's attendees
    path = firebase.ref(db, 'sessions/' + notification.sessionID + "/attendees/")
    await firebase.update(path, {[userID]:true})

    // update user's attending sessions
    path = firebase.ref(db, 'users/' + userID + "/attendingSessions/")
    await firebase.update(path, {[notification.sessionID]:true})

    // If instruments specified
    if (notification.selectedInstrument)
    {
      // then adjust takenInstruments on the session
      let instrumentsTakenCur = (session.takenInstruments && session.takenInstruments[notification.selectedInstrument]) ? session.takenInstruments[notification.selectedInstrument] : 0

      // update new taken instrument value
      path = firebase.ref(db, 'sessions/' + notification.sessionID + "/takenInstruments/")
      await firebase.update(path, {[notification.selectedInstrument]:instrumentsTakenCur + 1})
    }
  } 
  
  // change notification from pending to done and return
  if (!await markNotificationDone(userID, notificationID)) {return res.status(400).json("Failed to update notification")}
  res.status(200).json("Successfully answered session invite")
}

// Pushes a new request to join session notification to the receiver
const sendSessionJoinRequest = async (req, res) => {
  const {senderID, sessionID, selectedInstrument} = req.body
  const db = firebase.getDatabase();
  
  // make sure userID is an actual users
  if (!await doesUserExist(senderID)) {return res.status(400).json("User does not exist")}

  // get session and make sure it exists
  let session = await getSession(sessionID)
  if (!session) {return res.status(400).json('Session doesn\'t exist')}

  // we must make sure receiver is not already inside session's attendees
  if (await isUserAttendingSession(senderID, sessionID)) {return res.status(400).json('You are already attending the session')}

  // make sure sender is not host of session
  if (session.creator == senderID) {return res.status(400).json('You cannot request to join your own session')}

  // ensure an instrument was selected, if instruments are specified
  if (session.instruments && !selectedInstrument) {return res.status(400).json('Please select a valid instrument')}

  // make sure there are enough spaces left in the session if there is a limit
  if (session.memberLimit && session.attendees && Object.keys(session.attendees).length >= session.memberLimit)
  {
    return res.status(400).json('No spaces left in session')
  }

  // make sure there are enough spaces left in the session for this type of instrument
  if (session.instruments && session.instrumentsTaken && session.instrumentsTaken[notification.selectedInstrument] && session.instrumentsTaken[notification.selectedInstrument] >= session.instruments[notification.selectedInstrument])
  {
    return res.status(400).json('No spaces left in session for this instrument')
  }

  // push notification to session creator
  try {
    const path = firebase.ref(db, 'users/' + session.creator + "/notifications/")
    await firebase.push(path, {
      type: "request to join session",
      status: "pending",
      senderID: senderID,
      sessionID: sessionID,
      sessionTitle: session.title,
      selectedInstrument: selectedInstrument,
    })
    return res.status(200).json("Successfully sent request to join session")
  } catch (error) {
    return res.status(400).json('Couldn\'t send request to join session')
  }
}

// Changes notification to join session from "pending" to "done"
// Also adds notification sender to session's attendees, if answer is true
const answerSessionJoinRequest = async (req, res) => {
  const {userID, notificationID, answer} = req.body
  const db = firebase.getDatabase();

  // get notification, make sure it exists
  let notification = await getNotification(userID, notificationID)
  if (!notification) {return res.status(400).json("Bad notification ID")}

  // make sure notification is of type session invite
  if (notification.type != "request to join session") {return res.status(400).json("Incorrect notification type")}

  // make sure notification is still pending
  if (notification.status == "done") {return res.status(400).json("Notification already answered")}

  // make sure userID exists
  if (!await doesUserExist(userID)) {return res.status(400).json("User does not exist")}

  // get session and make sure it exists
  const session = await getSession(notification.sessionID)
  if (!session) {
    if (!await markNotificationDone(userID, notificationID)) {return res.status(400).json("Failed to update notification")}
    return res.status(400).json('Session has been deleted')
  }
  
  // if request to join was granted, add notification sender's ID to session's attendees, and their attending sessions
  if (answer) {
    
    // make sure there are enough spaces left in the session if there is a limit
    if (session.memberLimit && session.attendees && Object.keys(session.attendees).length >= session.memberLimit)
    {
      return res.status(400).json('No spaces left in session')
    }

    // make sure there are enough spaces left in the session for this type of instrument
    if (session.instruments && session.instrumentsTaken && session.instrumentsTaken[notification.selectedInstrument] && session.instrumentsTaken[notification.selectedInstrument] >= session.instruments[notification.selectedInstrument])
    {
      return res.status(400).json('No spaces left in session for this instrument')
    }
    
    path = firebase.ref(db, 'sessions/' + notification.sessionID + "/attendees/")
    await firebase.update(path, {[notification.senderID]:true})

    path = firebase.ref(db, 'users/' + notification.senderID + "/attendingSessions/")
    await firebase.update(path, {[notification.sessionID]:true})
    
    // if instruments specified, then adjust takenInstruments
    if (notification.selectedInstrument)
    {
      // also update taken instruments value
      let instrumentsTakenCur = (session.takenInstruments && session.takenInstruments[notification.selectedInstrument]) ? session.takenInstruments[notification.selectedInstrument] : 0

      // update new taken instrument value
      path = firebase.ref(db, 'sessions/' + notification.sessionID + "/takenInstruments/")
      await firebase.update(path, {[notification.selectedInstrument]:instrumentsTakenCur + 1})
    }
  } 
  
  // change notification from pending to done and return
  if (!await markNotificationDone(userID, notificationID)) {return res.status(400).json("Failed to update notification")}
  res.status(200).json("Successfully answered request to join")
}

module.exports = {
    sendFriendRequest,
    answerFriendRequest,
    sendSessionInvite,
    answerSessionInvite,
    sendSessionJoinRequest,
    answerSessionJoinRequest,
};