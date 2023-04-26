const firebase = require("firebase/database");

// Gets a given user's ID with their username; returns false otherwise
async function getUserIDWithUsername(username)
{
  const db = firebase.getDatabase();
  let userID
  
  let path = firebase.ref(db, 'users')
  await firebase.get(path).then((snapshot) => {
    const users = snapshot.val()
    const userIDs = Object.keys(users)
  
    for (let i = 0; i < userIDs.length; i++)
    {
      if (users[userIDs[i]].username == username)
      {
        userID = userIDs[i]
        return userID
      }
    }
  })

  return !userID ? false : userID
}

// Makes sure a given user is present in the database
async function doesUserExist(userID)
{
  const db = firebase.getDatabase();
  const user = await firebase.get(firebase.ref(db, 'users/' + userID));
  
  return JSON.stringify(user) === 'null' ? false : true
}

// Returns status of friends
async function getFriendStatus(userID1, userID2)
{
  const db = firebase.getDatabase();
  const path = firebase.ref(db, 'users/' + userID1 + "/friends/" + userID2)
  
  let friendStatus
  await firebase.get(path).then((snapshot) => {
    friendStatus = snapshot.val();
    return friendStatus
  })

  return friendStatus
}

// Gets a notification from a given user
async function getNotification(userID, notificationID)
{
  const db = firebase.getDatabase();
  
  let notification
  try {
    let path = firebase.ref(db, 'users/' + userID + "/notifications/" + notificationID)
    await firebase.get(path).then((snapshot) => {
      
      if (snapshot.exists()) {
        notification = snapshot.val()
        return notification
      } else {
        console.log("Couldn't find notification")
        notification = false
        return notification
      }
    }) 
  } catch (error) {
    console.log("Couldn't reach database get answer notification")
    return false
  }

  return notification
}

// Marks notification as done; returns true if successful, false otherwise
async function markNotificationDone(userID, notificationID)
{
  const db = firebase.getDatabase();
  
  try {
    let path = firebase.ref(db, 'users/' + userID + "/notifications/" + notificationID + "/status/")
    await firebase.set(path, 'done');
    return true
  } catch (error) {return false}
}

// Returns session; returns false if session doesn't exist
async function getSession(sessionID)
{
  const db = firebase.getDatabase();
  let session = null
  try {
    
    // get session
    const path = firebase.ref(db, 'sessions/' + sessionID)
    await firebase.get(path).then((snapshot) => {
      session = snapshot.val();
      return session
    })
  
    // return session if it exists
    return JSON.stringify(session) == 'null' ? false : session
  } catch (error) {return false}  
}

// Returns true or false if user is attending session
async function isUserAttendingSession(userID, sessionID)
{
  const db = firebase.getDatabase();
  let alreadyInSession

  // call GET using path to session's attendees
  const path = firebase.ref(db, 'sessions/' + sessionID + "/attendees/" + userID)
  await firebase.get(path).then((snapshot) => {
    alreadyInSession = snapshot.val();
    return alreadyInSession
  })

  // if already attending session, return with error
  return alreadyInSession
}

module.exports = {
  getUserIDWithUsername,
  doesUserExist,
  getFriendStatus,
  getNotification,
  markNotificationDone,
  getSession,
  isUserAttendingSession,
};