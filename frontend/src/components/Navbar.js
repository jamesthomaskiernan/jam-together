import {Link, useNavigate, useLocation} from 'react-router-dom'
import {signOut} from "firebase/auth";
import {Button, IconButton} from "@mui/material";
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import {auth} from "../App";
import {UserAuth} from '../context/AuthContext';
import {useEffect, useState} from "react";
import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemText from "@mui/material/ListItemText";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {Add} from "@mui/icons-material";

// TODO: move this theme to its own file
const theme = createTheme({
    palette: {
        primary: {
            main: '#0F4F63',
        },
        secondary: {
            main: '#FFFBF4',
        },
        background: {
            main: '#FFFBF4',
        }
    },
});

const Navbar = () => {
    const [openDrawer, setOpenDrawer] = useState(false)
    const [friendRequests, setFriendRequests] = useState([])
    const [sessionInvites, setSessionInvites] = useState([])
    const [requestsToJoin, setRequestsToJoin] = useState([])
    const [admin, setAdmin] = useState(false)
    const [refresh, setRefresh] = useState(true)

    // Grabs the user and the logOut function from AuthContext
    const {user, logOut} = UserAuth();

    // Function that handles signing out a user who is Google authenticated
    const handleGoogleSignout = async () => {
        // Tries to log out the Google authenticated user
        try {
            await logOut()
        } catch (error) {
            console.log(error)
        }
    }
    const navigate = useNavigate();
    const location = useLocation();

    // get the current user's information
    useEffect(() => {
        async function getNotifications() {
            let response = await fetch('/api/user/' + user.uid);

            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                return
            }

            let friendReqs = [];
            let sessionInvs = [];
            let joinReqs = [];

            let data = await response.json();

            for (const [key, value] of Object.entries(data.notifications)) {
                const senderID = value.senderID;

                // fetch the sender's information for display
                response = await fetch('/api/user/' + senderID);
                const senderData = await response.json();

                const record = {
                    notificationID: key,
                    sender: {
                        uid: senderID,
                        firstName: senderData.firstName,
                        lastName: senderData.lastName
                    },
                    status: value.status,
                    type: value.type,
                    sessionTitle: value.sessionTitle,
                    selectedInstrument: value.selectedInstrument
                };

                if (record.type === "friend request" && record.status === "pending") {
                    friendReqs.push(record);
                } else if (record.type === "session invite" && record.status === "pending") {
                    sessionInvs.push(record);
                } else if (record.type === "request to join session" && record.status === "pending") {
                    joinReqs.push(record);
                }
            }

            setFriendRequests(friendReqs);
            setSessionInvites(sessionInvs);
            setRequestsToJoin(joinReqs);
        }

        getNotifications();
    }, [openDrawer, refresh]);

    // get admin status
    useEffect(() => {
        async function getAdminStatus() {
        
            const response = await fetch('/api/user/is-admin', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                userID: user.uid
                })
            })
 
            if (!response.ok) {
                console.error('Failed to get admin status');
                return
            } else {
                const result = await response.json()
                setAdmin(result)
            }
        }
        getAdminStatus()
    }, [user])

    const handleFriendRequest = async (notificationID, accept) => {
        await fetch('/api/notifications/answer-friend-request', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: user.uid,
                notificationID: notificationID,
                answer: accept
            })
        }).catch((err) => console.error(err));
    };

    const handleSessionInvite = async (notificationID, accept) => {
        await fetch('/api/notifications/answer-session-invite', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: user.uid,
                notificationID: notificationID,
                answer: accept
            })
        }).catch((err) => console.error(err));
    };

    const handleSessionJoinRequest = async (notificationID, accept) => {
        await fetch('/api/notifications/answer-request-join-session', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: user.uid,
                notificationID: notificationID,
                answer: accept
            })
        }).catch((err) => console.error(err));
    };

    const displayNotifications = () => (
        <Box
            sx={{width: 400}}
            role="presentation"
        >
            <h2 style={{"paddingLeft": "15px"}}>Friend requests</h2>
            <List>
                {friendRequests.map((request) => (
                    <ListItem key={request.sender}>
                        <ListItemText><strong>{request.sender.firstName} {request.sender.lastName}</strong> wants to be
                            friends!</ListItemText>
                        <IconButton onClick={async () => {
                            await handleFriendRequest(request.notificationID, false); setRefresh(curr => !curr);
                        }}>
                            <DoNotDisturbIcon/>
                        </IconButton>
                        <IconButton onClick={async () => {
                            await handleFriendRequest(request.notificationID, true); setRefresh(curr => !curr);
                        }}>
                            <CheckCircleOutlineIcon/>
                        </IconButton>
                    </ListItem>
                ))}
            </List>
            <Divider/>
            <h2 style={{"paddingLeft": "15px"}}>Jam session invites</h2>
            <List>
                {sessionInvites.map((invite) => (
                    <ListItem key={invite.sender}>
                                     
                        {/* If invite doesn't have a selected instrument */}
                        {!invite.selectedInstrument && <ListItemText><strong>{invite.sender.firstName} {invite.sender.lastName}</strong> 
                        &nbsp; has invited you to join their session "{invite.sessionTitle}" </ListItemText>}
                        
                        {/* If requester did select an instrument */}
                        {invite.selectedInstrument && <ListItemText><strong>{invite.sender.firstName} {invite.sender.lastName}</strong> 
                        &nbsp; has invited you to join their session "<b>{invite.sessionTitle}</b>" as <strong>{invite.selectedInstrument}</strong></ListItemText>}
                        
                        
                        <IconButton onClick={async () => {
                            await handleSessionInvite(invite.notificationID, false); setRefresh(curr => !curr);
                        }}>
                            <DoNotDisturbIcon/>
                        </IconButton>
                        <IconButton onClick={async () => {
                            await handleSessionInvite(invite.notificationID, true); setRefresh(curr => !curr);
                        }}>
                            <CheckCircleOutlineIcon/>
                        </IconButton>
                    </ListItem>
                ))}
            </List>
            <Divider/>
            <h2 style={{"paddingLeft": "15px"}}>Join requests</h2>
            <List>
                {requestsToJoin.map((requestToJoin) => (
                    <ListItem key={requestToJoin.sender}>
                        
                        {/* If request to join doesn't have a requested instrument */}
                        {!requestToJoin.selectedInstrument && <ListItemText><strong>{requestToJoin.sender.firstName} {requestToJoin.sender.lastName}</strong> 
                        &nbsp; would like to join your jam session "<b>{requestToJoin.sessionTitle}</b>" </ListItemText>}
                        
                        {/* If request to join did select an instrument */}
                        {requestToJoin.selectedInstrument && <ListItemText><strong>{requestToJoin.sender.firstName} {requestToJoin.sender.lastName}</strong> 
                        &nbsp; would like to join your jam session "<b>{requestToJoin.sessionTitle}</b>" as <strong>{requestToJoin.selectedInstrument}</strong></ListItemText>}

                        <IconButton onClick={async () => {
                            await handleSessionJoinRequest(requestToJoin.notificationID, false); setRefresh(curr => !curr);
                        }}>
                            <DoNotDisturbIcon/>
                        </IconButton>
                        <IconButton onClick={async () => {
                            await handleSessionJoinRequest(requestToJoin.notificationID, true); setRefresh(curr => !curr);
                        }}>
                            <CheckCircleOutlineIcon/>
                        </IconButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    const toggleDrawer = () => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }

        setOpenDrawer(curr => !curr);
    };

    let loginButtons = (
        <Stack spacing={2} direction="row">
            <ThemeProvider theme={theme}>
                <Button variant="outlined"
                        color='secondary'
                        data-testid="login-button"
                        onClick={() => {
                            navigate("/login");
                        }}
                >
                    Sign in
                </Button>
                <Button variant="contained"
                        color='secondary'
                        onClick={() => {
                            navigate("/register");
                        }}
                >Sign up</Button>
            </ThemeProvider>
        </Stack>
    );

    let signOutButtons = (
        <Stack spacing={2} direction="row">
            <ThemeProvider theme={theme}>
                {admin &&
                    <Button variant="contained"
                            color='secondary'
                            onClick={() => {
                                navigate("/admin");
                            }}
                    >
                        Admin
                    </Button>
                }
                <Button variant="contained"
                        color='secondary'
                        onClick={() => {
                            navigate("/report");
                        }}
                >
                    Report
                </Button>

                <Button variant="contained"
                        color='secondary'
                        id='listings-button'
                        onClick={() => {
                            navigate("/session-listings");
                        }}
                >
                    Listings
                </Button>
                <Button variant="contained"
                        color='secondary'
                        onClick={() => {
                            navigate("/create-session");
                        }}
                >
                    Host
                </Button>
                <Button variant="contained"
                        color='secondary'
                        onClick={() => {
                            navigate("/profile/" + user.uid);
                        }}
                >
                    Profile
                </Button>                
                <Button variant="contained"
                        color='secondary'
                        id='sign-out-button'
                        onClick={() => {
                            handleGoogleSignout();
                            signOut(auth).then(() => {
                                // Sign-out successful.
                                navigate("/login");
                            }).catch((error) => {
                                // An error happened.
                                console.error(error);
                            });

                        }}
                >
                    Sign out
                </Button>
                <IconButton onClick={toggleDrawer()}
                            style={{marginLeft: '10px'}}
                >
                    <NotificationsIcon color="secondary"/>
                </IconButton>
            </ThemeProvider>
        </Stack>
    );

    const getButtons = () => {
        if (location.pathname === '/login' || location.pathname === '/register') {
            return null;
        } else if (!user) {
            return loginButtons;
        } else {
            return signOutButtons;
        }
    }

    return (
        <header>
            <div className="container">
                <Link to="/">
                    <h1 className='web-title'>Jam Together</h1>
                </Link>
                {getButtons()}
                <Drawer
                    anchor="right"
                    open={openDrawer}
                    onClose={toggleDrawer()}
                >
                    {displayNotifications()}
                </Drawer>
            </div>
        </header>
    )
}

export default Navbar;