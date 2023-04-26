import {useEffect, useState} from "react";
import DefaultProfile from "../images/default-profile.png"
import Button from "@mui/material/Button";
import {auth} from "../App";
import {useAuthState} from "react-firebase-hooks/auth";
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import ConfirmationDialog from "../components/ConfirmationDialog";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TextField from '@mui/material/TextField';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import {useNavigate} from "react-router-dom";
import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import {getDownloadURL, getStorage, ref, uploadBytes} from "firebase/storage"
import {updateProfile} from "firebase/auth"

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

const Profile = () => {
    const [user, loading, error] = useAuthState(auth);
    const [profileID, setProfileID] = useState(window.location.pathname.substring(9))
    const [userData, setUserData] = useState({})
    const [refresh, setRefresh] = useState(false)
    const [friendSearchVal, setFriendSearchVal] = useState("")
    const [friendSearchError, setFriendSearchError] = useState("")
    const [friendSearchSucc, setFriendSearchSucc] = useState("")
    const [friendNames, setFriendNames] = useState([])
    const [friendProfilePicURLs, setFriendProfilePicURLs] = useState([])

    const [attendingSessionNames, setAttendingSessionNames] = useState([])
    const [createdSessionNames, setCreatedSessionNames] = useState([])
    const [currentlyUploadingPhoto, setCurrentlyUploadingPhoto] = useState(false)

    const navigate = useNavigate()
    const storage = getStorage()

    // runs when page is first loaded
    async function getProfileData() {
        // GET USER DATA
        let response = await fetch('/api/user/' + profileID);

        if (!response.ok) {
            console.error(`Failed to get user information with status: ${response.status}`);
            return;
        }
        let data = await response.json();

        // add this user's photo
        try {
            const fileRef = ref(storage, 'profilePictures/' + profileID + ".png")
            const photoURL = await getDownloadURL(fileRef)
            data.photoURL = photoURL ?? null;
        } catch(e) {
            data.photoURL = null
        }


        setUserData(data);

        // GET FRIEND NAMES
        const friends = data.friends
        const fIDs = Object.keys(friends) ?? [];
        let names = []

        for (let i = 0; i < fIDs.length; i++) {
            // only show friends which have accepted requests
            if (friends[fIDs[i]] === "pending") {
                continue
            }

            const response = await fetch('/api/user/' + fIDs[i] + '/name');

            if (!response.ok) {
                console.error(`Failed to get user name with status: ${response.status}`);
                return
            } else {
                const result = await response.json()
                const name = result.name
                names.push([fIDs[i], name])
            }
        }

        setFriendNames(names)

        // GET FRIEND PROFILE PICTURE URLS
        let urls = []
        for (let i = 0; i < fIDs.length; i++) {
            // get host's profile picture
            const fileRef = ref(storage, 'profilePictures/' + fIDs[i] + ".png")

            try {
                const photoURL = await getDownloadURL(fileRef)
                urls.push(photoURL)
            } catch (e) {
                urls.push(null)
            }
        }

        setFriendProfilePicURLs(urls)

        // GET ATTENDING SESSION NAMES

        let seshNames = []

        // for every session, get the session name
        if (data.attendingSessions != null) {
            const sessions = data.attendingSessions
            const sessionIDs = Object.keys(sessions);

            for (let i = 0; i < sessionIDs.length; i++) {
                let sessionID = sessionIDs[i]
                let response = await fetch("/api/sessions/" + sessionID);
                data = await response.json();

                if (!response.ok) {
                    console.error(`Failed to get your sessions: ${data}`);
                    return;
                } else {
                    const name = data.title
                    seshNames.push([sessionID, name])
                }
            }
        }

        setAttendingSessionNames(seshNames)
        seshNames = [];

        // GET USER CREATED SESSION NAMES

        // for every session, get the session name
        if (data.createdSessions != null) {
            const sessions = data.createdSessions
            const sessionIDs = Object.keys(sessions);

            for (let i = 0; i < sessionIDs.length; i++) {
                let sessionID = sessionIDs[i]
                let response = await fetch("/api/sessions/" + sessionID);
                data = await response.json();

                if (!response.ok) {
                    console.error(`Failed to get your sessions: ${data}`);
                    return;
                } else {
                    const name = data.title

                    seshNames.push([sessionID, name])
                }
            }
        }

        setCreatedSessionNames(seshNames)
    }

    // get the current user's information
    useEffect(() => {
        getProfileData()
    }, [refresh, profileID])

    // when add friend button is clicked
    const handleFriendRequest = async () => {

        const response = await fetch('/api/notifications/send-friend-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                senderID: user.uid,
                receiverUsername: friendSearchVal,
            })
        })

        // call post function
        const json = await response.json()

        // if not okay, log error
        if (!response.ok) {
            setFriendSearchError(json)
        } else {
            setFriendSearchError("")
            setFriendSearchSucc("Successfully sent friend request")
        }
    }

    // updates user's customized instruments
    const updateInstruments = async (newInstruments) => {
        const response = await fetch(`/api/user/update-instruments`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uid: user.uid,
                instruments: newInstruments
            })
        });

        if (!response.ok) {
            console.error(`Failed to update instruments with status: ${response.status}`);
        }
    }

    // updates user's customized genres
    const updateGenres = async (newGenres) => {
        const response = await fetch(`/api/user/update-genres`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uid: user.uid,
                genres: newGenres
            })
        });

        if (!response.ok) {
            console.error(`Failed to update genres with status: ${response.status}`);
        }
    }

    // update user's profile picture
    async function updateProfilePicture(file) {

        // Each profile picture will just be the user's unique ID
        const fileRef = ref(storage, 'profilePictures/' + profileID + ".png")

        // Upload photo
        setCurrentlyUploadingPhoto(true)
        await uploadBytes(fileRef, file)
        setCurrentlyUploadingPhoto(false)

        // Update the photograph on the user's profile
        const photoURL = await getDownloadURL(fileRef)
        updateProfile(user, {photoURL: photoURL})

        // Give user popup
        alert("File uploaded successfully!")
    }


    const listElements = (list) => {
        return (
            <List dense={true}>
                {list.map((element) => {
                    return (
                        <ListItem>
                            <ListItemAvatar>
                                <Avatar>
                                    <LibraryMusicIcon/>
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={element}
                                secondary={null}
                            />
                        </ListItem>
                    )
                })}
            </List>
        );
    }

    // Returns JSX which lists friends' names and also their profile picture if they have one
    const listFriends = () => {
        let jsx = []
        let index = 0

        friendNames.map((element) => {
            jsx.push(
                <ListItem>
                    <ListItemButton onClick={() => {
                        navigate(`/profile/${element[0]}`);
                        setProfileID(element[0]);
                    }}
                                    id={'friend-' + index}
                    >

                        {/* If friend has a customized url, display it; otherwise, show icon */}
                        {friendProfilePicURLs[index] ?
                            <img src={friendProfilePicURLs[index]} className="profile-img" alt="Default profile pic."
                                 width="40" height="40"/> :
                            <ListItemAvatar>
                                <Avatar>
                                    <PersonIcon/>
                                </Avatar>
                            </ListItemAvatar>}

                        {/* If friend has profile picture, add some padding to the left */}
                        {friendProfilePicURLs[index] ?
                            <ListItemText primary={element[1]} secondary={null} sx={{paddingLeft: 2}}/> :
                            <ListItemText primary={element[1]} secondary={null}/>}
                    </ListItemButton>
                </ListItem>
            )
            index += 1
        })

        return jsx
    }

    const listSessions = (list) => {
        return (
            <List dense={true}>
                {list.map((element, index) => {
                    return (
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => {
                                navigate(`/${element[0]}`)
                            }}
                                            id={'session-' + index}
                            >
                                <ListItemAvatar>
                                    <Avatar>
                                        <CalendarTodayIcon/>
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={element[1]}
                                    secondary={null}
                                />
                            </ListItemButton>
                        </ListItem>
                    )
                })}
            </List>
        );
    }

    if (loading) {
        return (
            <div>
                <p>Loading your profile...</p>
            </div>
        )
    } else if (error) {
        return (
            <div>
                <p>There was an error getting your information!</p>
            </div>
        )
    } else {
        return (
            <div>
                <ThemeProvider theme={theme}>
                    <Stack direction="row"
                           sx={{
                               padding: 5,
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'space-between'
                           }}>

                        {/* Profile Section */}
                        <Card sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '20vw',
                            height: '90vh'
                        }}>
                            <Stack>

                                {/* Display current profile picture */}
                                <CardContent sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <img src={userData.photoURL ? userData.photoURL : DefaultProfile}
                                         className="profile-img" alt="Default profile pic." width="200"
                                         height="200"/>
                                </CardContent>

                                {/* Lets user change profile picture */}
                                <CardContent sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>

                                    {profileID === user.uid ?
                                        <Button
                                            variant="contained"
                                            component="label"
                                            disabled={currentlyUploadingPhoto}
                                            size="small"
                                            id='change-photo-button'
                                        >
                                            Change Photo
                                            <input style={{display: 'none'}} type="file" accept="image/*"
                                                   onChange={async (e) => {

                                                       // update profile picture and then refresh page
                                                       if (e.target.files[0]) {
                                                           await updateProfilePicture(e.target.files[0]);
                                                           navigate("/profile/" + user.uid)
                                                       }
                                                   }}></input>
                                        </Button>
                                        : ""
                                    }
                                </CardContent>

                                <CardContent sx={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                    <h3>{`${userData?.firstName} ${userData?.lastName}`}</h3>
                                    <p style={{marginBottom: '0'}}>@{userData?.username}</p>
                                    <p>Nashville, TN</p>
                                </CardContent>

                            </Stack>
                        </Card>


                        <div className="profile-sub-block-container">

                            {/* Instruments */}
                            <div className="profile-sub-block">
                                <div className="profile-sub-block-header">
                                    <h2>Instruments</h2>
                                    {profileID === user.uid ?
                                        <ConfirmationDialog elements={userData.instruments ?? []}
                                                            type="instrument"
                                                            update={updateInstruments}
                                                            refresh={setRefresh}
                                        />
                                        : ""
                                    }
                                </div>
                                {userData.instruments ? listElements(userData.instruments) : ''}
                            </div>

                            {/* Genres */}
                            <div className="profile-sub-block">
                                <div className="profile-sub-block-header">
                                    <h2>Genres</h2>
                                    {profileID === user.uid ?
                                        <ConfirmationDialog elements={userData.genres ?? []} type="genre"
                                                            update={updateGenres}
                                                            refresh={setRefresh}/>
                                        : ""
                                    }
                                </div>
                                {userData.genres ? listElements(userData.genres) : ''}
                            </div>

                            {/* Friends */}
                            <div className="profile-sub-block">
                                <h2>Friends</h2>
                                <List dense={true}>
                                    {friendNames.length === 0 && <p style={{textAlign: 'center'}}>None Yet</p>}
                                    {listFriends()}
                                    {profileID === user.uid ?
                                        <Stack direction="row" spacing={1} sx={{paddingTop: 10, paddingLeft: 2}}>
                                            <TextField
                                                sx={{width: "40ch"}}
                                                label="Add a new friend"
                                                id='add-friend-input'
                                                value={friendSearchVal}
                                                onChange={(event) => {
                                                    setFriendSearchError('')
                                                    setFriendSearchSucc('')
                                                    setFriendSearchVal(event.target.value);
                                                }}
                                            />
                                            <IconButton aria-label="delete" onClick={handleFriendRequest} id='add-friend-button'>
                                                <PersonAddIcon/>
                                            </IconButton>
                                        </Stack>
                                        : ""
                                    }
                                </List>
                                <Stack direction="row" spacing={1} sx={{paddingTop: 2, paddingLeft: 2}}>
                                    {friendSearchSucc && !friendSearchError &&
                                        <Alert severity="success">{friendSearchSucc}</Alert>}
                                    {friendSearchError && <Alert severity="error">{friendSearchError}</Alert>}

                                </Stack>
                            </div>

                            {/* Attending Jams */}
                            <div className="profile-sub-block">
                                <h2>Jams</h2>

                                {/* List Attending James */}
                                {attendingSessionNames.length !== 0 &&
                                    <p style={{textAlign: 'center'}}>Attending Jams</p>}
                                {attendingSessionNames ? listSessions(attendingSessionNames) : ''}

                                {/* List Created Jams */}
                                {createdSessionNames.length !== 0 &&
                                    <p style={{textAlign: 'center'}}>Created Jams</p>}
                                {createdSessionNames ? listSessions(createdSessionNames) : ''}

                                {/* If no jams created or attending yet, say so */}
                                {createdSessionNames.length === 0 && attendingSessionNames.length === 0 &&
                                    <p style={{textAlign: 'center'}}>None Yet</p>}
                            </div>
                        </div>
                    </Stack>
                </ThemeProvider>
            </div>
        );
    }
}

export default Profile;