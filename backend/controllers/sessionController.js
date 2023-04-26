const firebase = require("firebase/database");

const {
  getSession
} = require("./controllerHelpers");


// Create a session
const createSession = async (req, res) => {
  const {creator, title, descr, address, city, state, postal, time, privacy, requestToJoin, memberLimit, instruments} = req.body
  const db = firebase.getDatabase();

  console.log(memberLimit)

  let emptyFields = []
  
  // ensure all fields are filled out in form
  if (!title) {
    emptyFields.push('Title')
  }
  if (!descr) {
    emptyFields.push('Description')
  }
  if (!address) {
    emptyFields.push('Address')
  }
  if (!city) {
    emptyFields.push('City')
  }
  if (!state) {
    emptyFields.push('State')
  }
  if (!postal) {
    emptyFields.push('Postal Code')
  }
  if (!time) {
    emptyFields.push('Time')
  }
  if (!privacy) {
    emptyFields.push('Who Can Join')
  }
  if (emptyFields.length > 0) {
    return res.status(400).json({ error: 'Please fill in all fields', emptyFields })
  }

  // make sure user is logged in
  if (!creator)
  {
    console.log("Couldn't post, user logged out!")
    return res.status(400).json({ error: 'Please log in again'})
  }

  // ensure memberlimit is positive
  if (memberLimit && memberLimit < 1)
  {
    return res.status(400).json({error: "Member limit must be 1 or higher"})
  }

  // make sure instrument limits add up to or are more than member limit
  if (instruments && memberLimit)
  {
    const instrumentCounts = Object.values(instruments)
    let totalCount = 0
    for (let i = 0; i < instrumentCounts.length; i++)
    {
      totalCount +=instrumentCounts[i]
    }

    if (totalCount != memberLimit)
    {
      return res.status(400).json({ error:"Please make sure customized instruments add up to member limit"})
    }
  }

  // validate address

  
  // get creator's username
  let username = null
  let path = firebase.ref(db, 'users/' + creator + '/username')
  try {
    await firebase.get(path).then((snapshot) => {
      username = snapshot.val();
      return username
    })
  }
  catch (err) {
    return res.status(400).json({ error:"Couldn't fetch user's username"})
  }

  // add to the database
  try {    
    // push method generates unique ID for each session
    const newSessionRef = firebase.push(firebase.ref(db, 'sessions/'), {
      creator: creator,
      creatorUsername: username,
      title: title,
      descr: descr,
      address: address,
      city: city,
      memberLimit: memberLimit,
      state: state,
      postal: postal,
      time: time,
      privacy: privacy,
      requestToJoin: requestToJoin,
      instruments: instruments
    });
    
    // unique key made from push
    const newSessionId = newSessionRef.key;

    // put user in session
    path = firebase.ref(db, 'users/' + creator + "/createdSessions/")
    await firebase.update(path, {[newSessionId]:true})

    return res.status(200).json({sessionID:[newSessionId]});
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
}

// Get all sessions
const getAllSessions = async (req, res) => {
  // fetch from the database
  try {
    const dbRef = firebase.ref(firebase.getDatabase());
    firebase.get(firebase.child(dbRef, `sessions`)).then((snapshot) => {
      if (snapshot.exists()) {
        return res.status(200).json(snapshot.val());
      } else {
        res.status(400).json("No sessions available.")
      }
    }).catch((error) => {
      console.error(error);
    });
  } catch (error) {
    res.status(400).json("Internal server error.")
  }
};

// Get a session
const getSingleSession = async (req, res) => {
  const id = req.params.session_id;

  // fetch from the database
  try {
    const dbRef = firebase.ref(firebase.getDatabase());
    firebase.get(firebase.child(dbRef, `sessions/${id}`)).then((snapshot) => {
      if (snapshot.exists()) {
        return res.status(200).json(snapshot.val());
      } else {
        res.status(400).json("Session does not exist.")
      }
    }).catch((error) => {
      console.error(error);
    });
  } catch (error) {
    res.status(400).json("Internal server error.")
  }
};

// Add a user to the attendee list
const joinSession = async (req, res) => {
  const {senderID, sessionID, selectedInstrument} = req.body
  const db = firebase.getDatabase();

  // make sure senderID is an actual user
  try {
    const result = await firebase.get(firebase.ref(db, 'users/' + senderID));
    
    if (JSON.stringify(result) === 'null')
    {
      res.status(400).json("Sender does not exist")
      return
    }
  } catch (error) {
    return res.status(400).json("Sender does not exist")
  }

  // get session
  let session = null
  let path = firebase.ref(db, 'sessions/' + sessionID)
  await firebase.get(path).then((snapshot) => {
    session = snapshot.val();
    return session
  })

  // make sure session exists
  if (JSON.stringify(session) == 'null')
  {
    return res.status(400).json('Session doesn\'t exist')
  }

  // we must make sure sender is not already inside session's attendees
  let alreadyInSession = false
  
  // call GET using path to session's attendees
  path = firebase.ref(db, 'sessions/' + sessionID + "/attendees/" + senderID)
  await firebase.get(path).then((snapshot) => {
    alreadyInSession = snapshot.val();
    return alreadyInSession
  })

  // if already attending session, return with error
  if (alreadyInSession)
  {
    return res.status(400).json('You are already attending the session')
  }

  // make sure sender is not host of session
  if (session.creator == senderID)
  {
    return res.status(400).json('You cannot join your own session')
  }

  // make sure there is space, if a limit is on the session
  const memberLimit = session.memberLimit
  
  // if there is a member limit, and session joins 
  if (memberLimit)
  {
    let attendeeCount = 0
    if (session.attendees)
    {
      Object.keys(session.attendees).length
    }
    if (attendeeCount + 1 > memberLimit)
    {
      return res.status(400).json('The session is full')
    }
  }

  // if session is request to join only, then 
  if (session.requestToJoin)
  {
    return res.status(400).json('You must request to join this session')
  }

  // if instruments customized, and instruments taken, and selected instruments have been taken
  if (session.instruments && session.takenInstruments && session.takenInstruments[selectedInstrument])
  {
    // make sure spaces left for selected instrument
    const takenAlready = session.takenInstruments[selectedInstrument]
    const limit = session.instruments[selectedInstrument]

    if (takenAlready + 1 > limit)
    {
      return res.status(400).json('Not enough of that instrument type to join the session')
    }
  }

  // if selected instrument sent, then update it in session
  if (selectedInstrument)
  {
    let newTakenVal = 1

    // if previously this type of instrument was taken, take this into account
    if (session.takenInstruments && session.takenInstruments[selectedInstrument])
    {
      newTakenVal += session.takenInstruments[selectedInstrument]
    }

    // update new taken instrument value
    path = firebase.ref(db, 'sessions/' + sessionID + "/takenInstruments/")
    await firebase.update(path, {[selectedInstrument]:newTakenVal})
  }


  // put user in session
  path = firebase.ref(db, 'sessions/' + sessionID + "/attendees/")
  await firebase.update(path, {[senderID]:true})

  // put session in user's attendees
  path = firebase.ref(db, 'users/' + senderID + "/attendingSessions/")
  await firebase.update(path, {[sessionID]:true})

  return res.status(200).json('Successfully joined session')
}

// Gets all sessions according to given filters
const getSessionsFiltered = async (req, res) => {
  const {userID, search, friendsOnly, freeSpaces, instruments, distance} = req.body
  const db = firebase.getDatabase();
  
  let sessions = {}
  
  // get all sessions
  let path = firebase.ref(db, 'sessions')
  await firebase.get(path).then((snapshot) => {
    sessions = snapshot.val();
    return sessions
  })

  // make sure there were any sessions at all
  if (sessions == null)
  {
    return res.status(400).json("No sessions available")
  }

  let user
  await firebase.get(firebase.ref(db, 'users/' + userID)).then((snapshot) => {
    user = snapshot.val()
    return user
  })

  // Remove any sessions which aren't made by the user's friends
  if (friendsOnly)
  {
    Object.keys(sessions).forEach((sessionID) =>
    {
      const sessionCreator = sessions[sessionID].creator
      
      if ((!user.friends) || user.friends[sessionCreator] == null)
      {
        delete sessions[sessionID]
      }
    })
  }

  // Remove any sessions which have privacy set to Nobody
  Object.keys(sessions).forEach((sessionID) =>
  {
    const privacySetting = sessions[sessionID].privacy
    
    if (privacySetting == "Nobody" && sessions[sessionID].creator != userID)
    {
      delete sessions[sessionID]
    }
  })

  // Remove any sessions which are set to friends only, if the user is not friends with them
  Object.keys(sessions).forEach((sessionID) =>
  {
    const privacySetting = sessions[sessionID].privacy
    const creator = sessions[sessionID].creator
    
    if (privacySetting == "Friends Only")
    {
      if (!user.friends || user.friends[creator] != true)
      {
        delete sessions[sessionID]
      }
    }
  })

  // Remove any sessions which don't have enough spaces
  if (freeSpaces && sessions.length != 0)
  {
    Object.keys(sessions).forEach((sessionID) =>
    {
      const memberLimit = sessions[sessionID].memberLimit

      if (memberLimit)
      {
        const numAttendees = sessions[sessionID].attendees ? Object.keys(sessions[sessionID].attendees).length : 0
        if (memberLimit - numAttendees < freeSpaces)
        {
          delete sessions[sessionID]
        }
      }
    })
  }

  // Remove any which don't have the search string in their title
  if (search && sessions.length != 0)
  {
    Object.keys(sessions).forEach((sessionID) =>
    {
      if (!sessions[sessionID].title.toUpperCase().includes(search.toUpperCase()))
      {
        delete sessions[sessionID]
      }      
    })
  }
  
  // Remove any sessions which don't have instruments available
  if (instruments && instruments.length != 0 && sessions.length != 0)
  {
    Object.keys(sessions).forEach((sessionID) =>
    {
      const session = sessions[sessionID]

      // if session creator specified instruments
      if (session.instruments)
      {
        // do for each instrument in filter
        instruments.forEach((instrument) =>
        {
          // if instrument isn't present in session
          if (session.instruments[instrument] == null)
          {
            delete sessions[sessionID]
          }
          
          // if there aren't spaces left for this instrument
          else if (session.takenInstruments && session.instruments[instrument] == session.takenInstruments[instrument])
          {
            delete sessions[sessionID]
          }
        })
      }
    })
  }

  // Distance check can go here

  return res.status(200).json(sessions)
}

// Deletes a session
const deleteSession = async (req, res) => {
  const {sessionID, userID} = req.body
  const db = firebase.getDatabase();

  // get session and make sure it exists
  const session = await getSession(sessionID)
  if (!session) {return res.status(400).json('Session doesn\'t exist')}

  // makes sure user owns the session
  if (session.creator != userID) {return res.status(400).json('You did not create this session')}

  // remove session
  let path = firebase.ref(db, 'sessions/' + sessionID)
  await firebase.set(path, {})

  // remove session from creator's created sessions
  path = firebase.ref(db, 'users/' + userID + '/createdSessions/' + sessionID)
  await firebase.set(path, {})

  // for each session attendee, remove the session from their attending sessions
  if (session.attendees)
  {
    Object.keys(session.attendees).forEach(async (attendeeID) => {
      path = firebase.ref(db, 'users/' + attendeeID + '/attendingSessions/' + sessionID)
      await firebase.set(path, {})
    })
  }

  // success 
  return res.status(200).json("Successfully deleted session")
}


module.exports = {
  createSession,
  getAllSessions,
  getSingleSession,
  joinSession,
  getSessionsFiltered,
  deleteSession,
};