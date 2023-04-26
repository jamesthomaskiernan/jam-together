import {Link as RouterLink, useParams} from "react-router-dom"
import {useEffect, useState} from "react";
import DefaultProfile from "../images/default-profile.png"
import Button from "@mui/material/Button";
import {getAuth} from "firebase/auth";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import Box from '@mui/material/Box';
import {CardActionArea, Typography} from '@mui/material';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PublicIcon from '@mui/icons-material/Public';
import TextField from '@mui/material/TextField';
import {useAuthState} from "react-firebase-hooks/auth";
import {auth} from "../App";
import axios from 'axios'
import {useNavigate} from "react-router-dom";
import {getDownloadURL, getStorage, ref} from "firebase/storage"
// TODO: move this theme to its own file
const theme = createTheme({
    palette: {
        primary: {
            main: '#0F4F63',
        },
        secondary: {
            main: '#FFFBF4',
        },
    },
});

const Session = () => {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [error, setError] = useState("")
    const [deleteSessionError, setDeleteSessionError] = useState("")
    const [succ, setSucc] = useState("")
    const [selectedInstrument, setSelectedInstrument] = useState("")
    const [hostName, setHostName] = useState("")
    const [hostProfilePictureURL, setHostProfilePictureURL] = useState(null)
    const [userToInvite, setUserToInvite] = useState("")
    const [isHost, setIsHost] = useState(false)
    const [offerDelete, setOfferDelete] = useState(false)

    const navigate = useNavigate();
    const storage = getStorage()

    // Holds the review emssage entered by the user
    const [reviewMessage, setReviewMessage] = useState("")

    //Holds the list of reviews for the session
    const [reviews, setReviews] = useState([])

    // Holds the data of the user
    const [userData, setUserData] = useState(null)
    // Gets the state of the current user
    const [user] = useAuthState(auth);

    // Grabs the id for the session
    const id = useParams()

    // Gets session information, also finds out if user is session creator
    async function getSessionInfo() {
        let response = await fetch("/api/sessions/" + id.session_id);
        let data = await response.json();

        setSession(data);

        if (session.creator == getAuth().currentUser.uid) {
            setIsHost(true)
        }

        setLoading(false)
    }

    // Gets name of session hoster
    async function getHostInfo() {
        // Get host's fullname
        let response = await fetch('/api/user/' + session.creator + "/name")
        let result = await response.json()
        const name = result.name
        setHostName(name)

        // Get host's profile picture
        const fileRef = ref(storage, 'profilePictures/' + session.creator + ".png")
        const photoURL = await getDownloadURL(fileRef)
        setHostProfilePictureURL(photoURL)
    }

    // Delays for given amount of time
    function timeout(delay) {
        return new Promise(res => setTimeout(res, delay));
    }

    // Returns instruments still available for selection box
    function getAvailableInstruments() {
        let rows = [] // JSX code to return

        if (session.instruments) {
            Object.keys(session.instruments).map((instrument) => {

                let instrumentsTaken = session.takenInstruments ? session.takenInstruments[instrument] : 0
                let instrumentsLeft = session.instruments[instrument] - instrumentsTaken

                if (instrumentsLeft != 0) {
                    rows.push(<MenuItem value={instrument}>{instrument}</MenuItem>)
                }
            })
        }

        return rows
    }

    // Request to join a session which has the requestToJoin attribute
    async function requestToJoin() {
        // post function
        const response = await fetch('/api/notifications/send-request-join-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                senderID: getAuth().currentUser.uid,
                sessionID: id.session_id,
                selectedInstrument: selectedInstrument,
            })
        })

        // call post function
        const json = await response.json()

        // if not okay, log error
        if (!response.ok) {
            setError(json)
            await timeout(3000)
            setError("")
        } else {
            setSucc("Successfully sent request")
            await timeout(3000)
            setSucc("")
        }
    }

    // Join sessions which does not have requestToJoin attribute
    async function joinSession() {
        // post function
        const response = await fetch('/api/sessions/join-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                senderID: getAuth().currentUser.uid,
                sessionID: id.session_id,
                selectedInstrument: selectedInstrument,
            })
        })

        // call post function
        const json = await response.json()

        // if not okay, log error
        if (!response.ok) {

            console.log(json)
            setError(json)
            await timeout(3000)
            setError("")
        } else {
            setSucc("Successfully joined session")
            await timeout(3000)
            setSucc("")
        }
    }

    // Sends session invite (if you're the session creator)
    async function inviteUserToSession() {
        // Make sure instrument selected, if session needs it
        if (!selectedInstrument && session.instruments) {
            return setError("Please select an instrument for the user")
        }

        // Make sure username entered
        if (!userToInvite) {
            return setError("Please enter user to invite")
        }

        const response = await fetch('/api/notifications/send-session-invite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                senderID: getAuth().currentUser.uid,
                receiverUsername: userToInvite,
                sessionID: id.session_id,
                selectedInstrument: selectedInstrument,
            })
        })

        const json = await response.json()

        // if not okay, log error
        if (!response.ok) {

            console.log(json)
            setError(json)
            await timeout(3000)
            setError("")
        } else {
            setSucc("Successfully sent session invite")
            await timeout(3000)
            setSucc("")
        }
    }

    // Deletes session
    async function deleteSession() {
        // delete function
        const response = await fetch('/api/sessions/delete-session', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: getAuth().currentUser.uid,
                sessionID: id.session_id,
            })
        })

        // call post function
        const json = await response.json()

        // if not okay, log error
        if (!response.ok) {
            setDeleteSessionError(JSON.stringify(json))
        } else {
            // redirect user to their session page
            return navigate('/session-listings')
        }
    }

    // Gets the current user's information
    useEffect(() => {
        async function getUserData() {
            const response = await fetch('/api/user/' + user.uid);

            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setUserData(data);
        }

        getUserData();
    }, [user]);

    const addReview = () => {

        // Holds the array of current reviews
        var reviews = null

        // Gets the current reviews for this session
        axios.get("YOURDATABASEHERE/sessions/" + id.session_id + "/reviews.json")
            .then(res => {

                // Stores the current reviews
                reviews = res.data

                // If there aren't any reviews for this session, create an empty array
                if (reviews == null) {
                    reviews = []
                }

                // If there are reviews for this session
                else {
                    reviews = res.data
                }

                // Will hold the name of the user submitting a review
                var reviewer = ""

                // If a user is logged in with google, get their display name
                if (getAuth().currentUser.displayName != null) {
                    reviewer = getAuth().currentUser.displayName;
                }

                // If a user is logged in with regular email, get their first and last name
                else {
                    reviewer = userData.firstName + " " + userData.lastName;
                }

                // Adds the user's name and review message to the reviews list
                reviews.push({name: reviewer, message: reviewMessage});

                // Places the reviews inside of a JSON object for the patch request
                var new_reviews = {reviews}

                // Adds the user's name to the attendees list in the database
                axios.patch("YOURDATABASEHERE/sessions/" + id.session_id + ".json", new_reviews)
                    .catch((error) => {
                        if (error.response) {
                            console.log(error.response.data); // => the response payload
                        }
                    })


            })
    }

    // useEffect(() => {
    //     getHostName()
    // }, []);

    // Contains the "Attendees" "Spaces Left" "Select instrument" and "Request to Join" info
    function getJoinSessionSection() {
        // First we need attendee information
        let isLimit = session.memberLimit
        let spacesLeft = session.memberLimit
        let attendeeCount = session.attendees ? Object.keys(session.attendees).length : 0

        // If there is a limit, and there are any attendees, subtrant spacesLeft from attendee count
        if (isLimit && session.attendees) {
            spacesLeft -= Object.keys(session.attendees).length
        }

        return (
            <div>
                <ThemeProvider theme={theme}>
                    <Card sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                        height: '65vh',
                        width: '20vw'
                    }}>

                        <Stack>

                            {/* Display Invite A User if session host, otherwise show Join Session */}
                            <CardContent sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                {session && isHost ? <h2>Invite A User</h2> : <h2>Join Session</h2>}
                            </CardContent>

                            {/* Box contains info to join session or invite users */}
                            <Box sx={{display: 'flex', alignItems: 'center', flexDirection: 'column'}}>

                                {/* Display Attendee count */}
                                <p>Attendees: {attendeeCount}</p>

                                {/* Display spaces left if there is a limit */}
                                {isLimit && <div><p>Spaces Left: {spacesLeft}</p></div>}

                                {/* Divider Line if there are instruments to show */}
                                {session.instruments && <Typography sx={{paddingBottom: 3}}>
                                    _____________________
                                </Typography>}

                                {/* Displays Instruments Taken So Far */}
                                {session.instruments && <Box sx={{minWidth: 30}}>
                                    {Object.keys(session.instruments).map((instrument) => {
                                        const instrumentsLeft = session.instruments[instrument] - ((session.takenInstruments && session.takenInstruments[instrument]) ? session.takenInstruments[instrument] : 0)
                                        const instrumentsTotal = session.instruments[instrument]

                                        return (
                                            <div>
                                                <Stack direction="row" justifyContent="flex-start">
                                                    <Typography>
                                                        {instrument}:&nbsp;&nbsp;&nbsp;
                                                    </Typography>
                                                    <Typography style={{marginLeft: "0.5rem"}}>
                                                        {instrumentsLeft} of {instrumentsTotal} available
                                                    </Typography>
                                                </Stack>
                                            </div>)
                                    })}
                                </Box>}

                                {/* Display instrument selector if session has instrument limits, and spaces left */}
                                {(spacesLeft != 0 || session.memberLimit == false) && session.instruments &&
                                    <CardContent sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingTop: "3ch"
                                    }}>
                                        <div>
                                            <FormControl sx={{m: 1}}>
                                                <InputLabel id="demo-simple-select-autowidth-label">Select
                                                    Instrument</InputLabel>
                                                <Select
                                                    labelId="demo-simple-select-autowidth-label"
                                                    id="demo-simple-select-autowidth"
                                                    value={selectedInstrument}
                                                    onChange={(event) => {
                                                        setSelectedInstrument(event.target.value);
                                                    }}
                                                    autoWidth
                                                    sx={{minWidth: 200}}
                                                    label="Select Instrument"
                                                >
                                                    {getAvailableInstruments()}
                                                </Select>
                                            </FormControl>
                                        </div>
                                    </CardContent>}

                                {/* Display button */}
                                {(spacesLeft != 0 || session.memberLimit == false) && <Stack>

                                    {/* If user is host creator, then set button to invite user version */}
                                    {isHost && <div>
                                        <CardContent sx={{alignItems: "center", justifyContent: "center"}}>
                                            {/* User report username */}
                                            <Box sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                                paddingBottom: 2,
                                                minWidth: 200
                                            }}>
                                                <TextField
                                                    sx={{maxWidth: 200}}
                                                    label="Username"
                                                    id='invite-username-input'
                                                    variant="outlined"
                                                    inputProps={{maxLength: 50}}
                                                    onChange={(event) => {
                                                        setUserToInvite(event.target.value);
                                                        setSucc("");
                                                        setError("");
                                                    }}
                                                />
                                            </Box>
                                            <Box sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                                paddingTop: 2,
                                                maxWidth: 200
                                            }}>
                                                <Button variant="contained" onClick={inviteUserToSession} id='invite-user-button'>
                                                    Invite {userToInvite ? userToInvite : "user"} to
                                                    Session {session.instruments && selectedInstrument && "as " + selectedInstrument}
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </div>}

                                    {/* If session is request to join */}
                                    {session.requestToJoin && !isHost &&
                                        <Button variant="contained"
                                                justify="center"
                                                id='request-join-button'
                                                onClick={requestToJoin}>
                                            Request To Join
                                        </Button>}

                                    {/* If session is not request to join */}
                                    {!session.requestToJoin && !isHost &&
                                        <Button variant="contained"
                                                justify="center"
                                                id='join-button'
                                                onClick={joinSession}>
                                            Join Session
                                        </Button>}
                                </Stack>}

                                {/* Display error if possible */}
                                <CardContent sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    {error && <Alert variant="outlined" severity="error">
                                        <b>
                                            {error}&nbsp;
                                        </b></Alert>}
                                </CardContent>

                                {/* Display success if there is no error */}
                                <CardContent sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    {succ && !error && <Alert variant="outlined" severity="success">
                                        <b>
                                            {succ}&nbsp;
                                        </b></Alert>}
                                </CardContent>
                            </Box>
                        </Stack>
                    </Card>
                </ThemeProvider>
            </div>)
    }

    // If loading, then fetch session and host info
    if (loading) {
        getSessionInfo()
        getHostInfo()
        return (<Typography align="center" sx={{paddingTop: 10}}>Loading session...</Typography>)
    }
    // If session has been deleted
    else if (session === "Session does not exist.") {
        return (
            <ThemeProvider theme={theme}>
                <Typography align="center" sx={{paddingTop: 10}}><h2>Session does not exist</h2></Typography>
            </ThemeProvider>
        )
    }


    // Displays the reviews
    function displayReviews() {

        // Gets the current reviews for this session
        axios.get("YOURDATABASEHERE/sessions/" + id.session_id + "/reviews.json")
            .then(res => {
                //console.log(res.data[0].message)
                setReviews(res.data)
            })


        if (reviews == null) {

            return (
                <div>
                    <p id='no-reviews-message'>There are no reviews for this session.</p>
                </div>
            )
        } else {
            return (
                <div className="session-listings">

                    {reviews.map(review => (
                        // Using id property of post to output JSX for each individual post
                        // CHANGE SO THAT THE KEY IS EQUAL TO POST.ID INSTEAD AND THE ROUTER IS LINKED TO POST.ID
                        <Box id='review-cards'>
                            <Card className="session-listing-card" key={review.id}>
                                <CardContent>
                                    <Typography>
                                        <h1 id='reviewer-name'>{review.name}</h1>
                                        <h2 id='reviewer-message'>"{review.message}"</h2>
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>


                    ))}
                </div>
            )

        }

    }

    // If there is a session, render the session information
    if (session !== null) {
        return (
            <div>
                <Stack direction="row"
                       sx={{padding: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>

                    {/* Host Information */}
                    <Card sx={{justifyContent: 'center', width: '20vw', height: '80vh'}}>
                        <CardActionArea component={RouterLink} to={"/profile/" + session.creator} id='host-card'>
                            <Stack>
                                <CardContent sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <h2>Host</h2>
                                </CardContent>

                                <CardContent sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <img src={hostProfilePictureURL ? hostProfilePictureURL : DefaultProfile}
                                         className="profile-img"
                                         alt="Default profile pic."
                                         width="200"
                                         height="200"
                                    />
                                </CardContent>

                                <CardContent sx={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                    <h3>{hostName}</h3>
                                    <p style={{marginBottom: '0'}}>@{session.creatorUsername}</p>
                                    <p>Nashville, TN</p>
                                </CardContent>
                                </Stack>
                            </CardActionArea>
                            <Stack>
                                {/* Delete Session Button */}
                                <ThemeProvider theme={theme}>
                                    <CardContent sx={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>

                                        {/* If user is host, offer ability to delete session */}
                                        {isHost && !offerDelete &&
                                            <Button variant="contained"
                                                    justify="center"
                                                    // sx={{marginTop: 10}}
                                                    onClick={() => {
                                                        setOfferDelete(true)
                                                    }}>
                                                Delete Session
                                            </Button>}

                                        {/* If delete button presed, show text */}
                                        {offerDelete && <p>Are you sure?</p>}

                                        {/* Make sure user is sure they want to delete */}
                                        <Stack direction="row">

                                            {/* Display No Button */}
                                            {offerDelete &&
                                                <Button
                                                    color='success'
                                                    variant="contained"
                                                    justify="center"
                                                    onClick={() => {
                                                        setOfferDelete(false);
                                                        setDeleteSessionError("")
                                                    }}>
                                                    No
                                                </Button>}

                                            {/* Display Yes Button */}
                                            {offerDelete &&
                                                <Button
                                                    color='error'
                                                    sx={{marginLeft: "2ch"}}
                                                    variant="contained"
                                                    justify="center"
                                                    onClick={async () => {
                                                        await deleteSession()
                                                    }}>
                                                    Yes
                                                </Button>}
                                        </Stack>

                                        {/* Display error if there was problem deleting session */}
                                        {deleteSessionError != "" &&
                                            <CardContent
                                                sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                <Alert variant="outlined" severity="error">
                                                    <b>
                                                        {deleteSessionError}&nbsp;
                                                    </b>
                                                </Alert>
                                            </CardContent>}
                                    </CardContent>
                                </ThemeProvider>
                            </Stack>
                    </Card>

                    {/* Session Details */}
                    <Card sx={{width: '50vw', height: '80vh'}}>
                        <CardContent sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <h2>Session Details</h2>
                        </CardContent>

                        <CardContent sx={{padding: 10}}>
                            <Typography>
                                <h1>{session.title}</h1>
                                <div className="session-listing-item">
                                    <PlaceIcon className="session-listing-icon"/>
                                    <p className="session-listing-text">{session.address}, {session.city}, {session.state} {session.postal}</p>
                                </div>
                                <div className="session-listing-item">
                                    <AccessTimeIcon className="session-listing-icon"/>
                                    <p className="session-listing-text">{session.time}</p>
                                </div>
                                <div className="session-listing-item">
                                    <PublicIcon className="session-listing-icon"/>
                                    <p className="session-listing-text">{session.privacy}</p>
                                </div>
                                <p className="session-listing-description">{session.descr}</p>
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Join Session Card */}
                    <Card sx={{width: '20vw'}}>
                        <Stack>
                            {getJoinSessionSection()}
                        </Stack>
                    </Card>
                </Stack>
                <h1 id='reviews-title'>Reviews</h1>
                {displayReviews()}
                <h2 id='leave-review'>Leave a Review</h2>
                <ThemeProvider theme={theme}>
                    {/* Description text box*/}
                    <div style={{display: "flex", justifyContent: "center"}}>
                        <TextField
                            id='review-text-box'
                            label="Review"
                            multiline
                            rows={3}
                            variant="outlined"
                            inputProps={{maxLength: 300}}
                            onChange={(event) => {
                                setReviewMessage(event.target.value)
                            }}
                        />
                    </div>
                </ThemeProvider>
                <Box sx={{paddingTop: 4, display: 'flex', justifyContent: 'center'}} id="review-submit-button">
                    <ThemeProvider theme={theme}>
                        <Button variant="contained"
                                onClick={() => {
                                    addReview()
                                }}>
                            Submit
                        </Button>
                    </ThemeProvider>

                </Box>
            </div>)
    }
}

export default Session;
