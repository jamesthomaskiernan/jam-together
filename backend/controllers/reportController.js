const firebase = require('firebase/database')

// pushes a new user report to the user reports section
const reportUser = async (req, res) => {
    
  const { reportingUserID, reportType, reportedUsername, userReportBody, reportPage, bugReportBody } = req.body
  const db = firebase.getDatabase()

  // get reporting user's username for easy display later
  let reportingUsername = null
  path = firebase.ref(db, 'users/' + reportingUserID + '/username')
  await firebase.get(path).then(snapshot => {
    reportingUsername = snapshot.val()
    return reportingUsername
  })

  // if report is a user report
  if (reportType === 'User Report')
  {
    // get reported user's userID with their username
    let reportedUserID = null
    let path = firebase.ref(db, 'users')
    await firebase.get(path).then(snapshot => {
      users = snapshot.val()
      userIDs = Object.keys(users)
      for (let i = 0; i < userIDs.length; i++) {
        const currentUsername = users[userIDs[i]].username
        if (currentUsername == reportedUsername) {
          reportedUserID = userIDs[i]
          return reportedUserID
        }
      }
    })

    // ensure username is valid
    if (reportedUserID === null)
    {
      return res.status(400).json("Username doesn't correspond to user")
    }

    // add report to the database
    try {
      // push method generates unique ID for each report
      await firebase.push(firebase.ref(db, 'userReports'), {
        reportingUserID: reportingUserID,
        reportingUsername: reportingUsername,
        reportedUserID: reportedUserID,
        reportedUsername: reportedUsername,
        reportBody: userReportBody
      })
      res.status(200).json('Successfully submitted user report')
    } catch (error) {
      res.status(400).json({ error: error.message })
      console.log("Couldn't add report to database")
    }
  }

  // otherwise, report type is bug report
  else if (reportType === 'Bug Report')
  {
    // add report to the database
    try {
      // push method generates unique ID for each report
      await firebase.push(firebase.ref(db, 'bugReports'), {
        reportingUserID: reportingUserID,
        reportingUsername: reportingUsername,
        reportPage: reportPage,
        reportBody: bugReportBody,
      })
      res.status(200).json('Successfully submitted bug report')
    } catch (error) {
      res.status(400).json({ error: error.message })
      console.log("Couldn't add report to database")
    }
  }

  else {return res.status(400).json('Invalid report type')}
}

// gets all user reports
const userReports = async (req, res) => {
  const db = firebase.getDatabase()

  let reports
  const path = firebase.ref(db, 'userReports/')
  await firebase.get(path).then(snapshot => {
    reports = snapshot.val()
    return reports
  })

  return res.status(200).json(reports)
}

// gets all bug reports
const bugReports = async (req, res) => {
  const db = firebase.getDatabase()

  let reports
  const path = firebase.ref(db, 'bugReports/')
  await firebase.get(path).then(snapshot => {
    reports = snapshot.val()
    return reports
  })

  return res.status(200).json(reports)
}


module.exports = {
  reportUser,
  userReports,
  bugReports
}
