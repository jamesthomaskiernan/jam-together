const firebase = require("firebase/database");

const register = async (req, res) => {
  const {email, potentialUsername, uid, firstName, lastName, instruments, genres} = req.body

  if (!(firstName && lastName && instruments && genres)) {
    return res.status(400).json("Missing fields");
  }

  // add to the database
  try {
    const db = firebase.getDatabase();
    await firebase.set(firebase.ref(db, 'users/' + uid), {
      email: email,
      username: potentialUsername,
      firstName: firstName,
      lastName: lastName,
      instruments: instruments,
      genres: genres,
      friends: [],
      recentSessions: []
    });

    return res.status(200).json("User successfully registered.");
  } catch (error) {
    res.status(400).json(error.message)
  }
}

const getUser = async (req, res) => {
  const uid = req.params.uid;

  // fetch from the database
  try {
    const dbRef = firebase.ref(firebase.getDatabase());
    firebase.get(firebase.child(dbRef, `users/${uid}`)).then((snapshot) => {
      if (snapshot.exists()) {
        return res.status(200).json(snapshot.val());
      } else {
        res.status(400).json("No data available")
      }
    }).catch((error) => {
      console.error(error);
    });
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const getUsersName = async (req, res) => {
  const uid = req.params.uid;

  // fetch from the database
  try {
    const dbRef = firebase.ref(firebase.getDatabase());
    firebase.get(firebase.child(dbRef, `users/${uid}`)).then((snapshot) => {
      if (snapshot.exists()) {
        
        const userData = snapshot.val()
        const usersFullName = userData.firstName + " " + userData.lastName
        return res.status(200).json({name:usersFullName});
      } else {
        res.status(400).json("No data available.")
      }
    }).catch((error) => {
      console.error(error);
    });
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const updateInstruments = async (req, res) => {
  const { uid, instruments } = req.body;

  if (!uid || !instruments) {
    return res.status(400).json({ error: "Missing uid or instruments." })
  }

  // update the user's instruments
  try {
    const db = firebase.getDatabase();
    await firebase.set(firebase.ref(db, `users/${uid}/instruments`), instruments)
    return res.status(200);
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

const updateGenres = async (req, res) => {
  const { uid, genres } = req.body;

  // update the user's genres
  try {
    const db = firebase.getDatabase();
    await firebase.set(firebase.ref(db, `users/${uid}/genres`), genres)
    res.status(200);
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const getUIDWithEmail = async (req, res) => {
  const {email} = req.body;
  const db = firebase.getDatabase();

  // get all users
  let path = firebase.ref(db, 'users')
  await firebase.get(path).then((snapshot) => {
    users = snapshot.val()
    userIDs = Object.keys(users)
  
    for (let i = 0; i < userIDs.length; i++)
    {
      const userEmail = users[userIDs[i]].email
      if (userEmail == email)
      {
        return res.status(200).json(userIDs[i])
      }
    }

    return res.status(400).json("couldn't find user with that email")
  })
}

const isUsernameAvailable = async (req, res) => {
  const {potentialUsername} = req.body;

  if (!potentialUsername) {
    return res.status(400).json("Missing username.")
  }

  const db = firebase.getDatabase();

  // get all users
  let path = firebase.ref(db, 'users')
  await firebase.get(path).then((snapshot) => {
    users = snapshot.val()
    userIDs = Object.keys(users)
  
    for (let i = 0; i < userIDs.length; i++)
    {
      const username = users[userIDs[i]].username
      if (username == potentialUsername)
      {
        return res.status(400).json("Username already taken")
      }
    }
    return res.status(200).json("Username available")
  })
}

const isAdmin = async (req, res) => {
  const {userID} = req.body;
  const db = firebase.getDatabase();

  // get all users
  let path = firebase.ref(db, 'users/' + userID + '/admin')
  await firebase.get(path).then((snapshot) => {
    const admin = snapshot.val()
    
    if (admin == true)
    {
      return res.status(200).json(true)    
    } else {
      return res.status(200).json(false)    
    }
  })
}


module.exports = {
  register,
  getUser,
  getUsersName,
  updateInstruments,
  updateGenres,
  getUIDWithEmail,
  isUsernameAvailable,
  isAdmin
};
