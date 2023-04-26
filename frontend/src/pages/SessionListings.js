import React, {useEffect, useState} from 'react'
import {Card, CardActionArea, CardContent, Typography} from '@mui/material'
import {Link as RouterLink} from 'react-router-dom'
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PublicIcon from '@mui/icons-material/Public';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import {IconButton} from '@mui/material';
import {getAuth, onAuthStateChanged} from "firebase/auth";

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

const instrumentOptions = [
    'Drums',
    'Piano',
    'Acoustic bass',
    'Electric bass',
    'Trumpet',
    'Saxophone',
    'Trombone',
    'Guitar'
]


function SessionListings() {
    const [sessions, setSessions] = useState([])
    const [friendsOnly, setFriendsOnly] = React.useState(false)
    const [freeSpacesCheckbox, setFreeSpacesCheckbox] = React.useState(false)
    const [freeSpaces, setFreeSpaces] = React.useState(2)
    const [instrumentsCheckbox, setInstrumentsCheckbox] = React.useState(false)
    const [instruments, setInstruments] = React.useState([])
    const [search, setSearch] = React.useState("")
    const [distanceCheckbox, setDistanceCheckbox] = React.useState(false)
    const [distance, setDistance] = React.useState(2)

    // Fetch all sessions
    useEffect(() => {
        const getAllSessions = async () => {
            const response = await fetch('/api/sessions/filtered', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userID: getAuth().currentUser.uid,
                    search: search,
                    friendsOnly: friendsOnly,
                    freeSpaces: (freeSpacesCheckbox ? freeSpaces : false),
                    instruments: (instrumentsCheckbox ? instruments : false),
                    distance: (distanceCheckbox ? distance : false)
                })
            })

            let data = await response.json();

            if (typeof data === "object") {
                const session_list = [];

                // Loops through the sessions and pushes them into the array
                for (let key in data) {
                    session_list.push({...data[key], id: key})
                }

                setSessions(session_list)
            }
        }

        getAllSessions();
    }, [friendsOnly, freeSpacesCheckbox, freeSpaces, search, instruments, instrumentsCheckbox]);


    const handleChange = (event) => {
        const {
            target: {value},
        } = event;
        setInstruments(
            // On autofill we get a stringified value.
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    return (
        <ThemeProvider theme={theme}>
            <Stack direction="row" sx={{padding: 5, display: 'flex', alignItems: 'space-between'}}>
                {/* Filter Selection */}
                <Card sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '25vw',
                    height: '65vh',
                    marginTop: '11vh',
                    position: 'sticky',
                    top: '10vh'
                }}>
                    <Stack>
                        {/* 'Filters' Title for Card */}
                        <CardContent sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <h2>Filters</h2>
                        </CardContent>

                        <CardContent sx={{display: 'flex', flexDirection: 'column', alignItems: 'left'}}>

                            {/* Search Bar  */}
                            <Stack direction="row" sx={{display: 'flex', paddingBottom: 2}}>
                                <TextField
                                    label="Title"
                                    variant="outlined"
                                    size='small'
                                    inputProps={{maxLength: 50}}
                                    maxWidth={{}}
                                    onChange={(event) => {
                                        setSearch(event.target.value)
                                    }}
                                />
                                <IconButton>
                                    <SearchIcon/>
                                </IconButton>
                            </Stack>

                            {/* Friends Only Checkbox */}
                            <FormControlLabel
                                control={
                                    <Checkbox checked={friendsOnly}
                                              onChange={(event) => {
                                                  setFriendsOnly(event.target.checked)
                                              }}
                                              id='friends-only-checkbox'
                                    />
                                }
                                label="Friends Only"
                            />

                            {/* Free Spaces Checkbox */}
                            <Stack direction="row">
                                <FormControlLabel
                                    control={
                                        <Checkbox checked={freeSpacesCheckbox}
                                                  onChange={(event) => {
                                                      setFreeSpacesCheckbox(event.target.checked)
                                                  }}/>}
                                    label="Free Spaces"
                                    id='free-spaces-checkbox'
                                />
                                {freeSpacesCheckbox && <Typography
                                    sx={{paddingTop: 1.2}}>{freeSpaces === 10 ? "10+" : freeSpaces}</Typography>}
                            </Stack>

                            {/* Free Spaces Slider */}
                            {freeSpacesCheckbox && <Box sx={{paddingLeft: "2ch", paddingRight: "2ch"}}>
                                <Slider
                                    defaultValue={freeSpaces}
                                    valueLabelDisplay="off"
                                    marks
                                    value={freeSpaces}
                                    min={1}
                                    max={10}
                                    step={1}
                                    onChange={(event, newValue) => setFreeSpaces(newValue)}
                                />
                            </Box>}

                            {/* Instruments Checkbox */}
                            <Stack direction="row">
                                <FormControlLabel
                                    control={
                                        <Checkbox checked={instrumentsCheckbox}
                                                  onChange={(event) => {
                                                      setInstrumentsCheckbox(event.target.checked)
                                                  }}/>}
                                    label="Instruments Available"
                                    id='instruments-checkbox'
                                />
                            </Stack>

                            {/* Instrument Selection */}
                            {instrumentsCheckbox &&
                                <Box sx={{paddingTop: 2}}>
                                    <FormControl size="small" id='select-instruments'>
                                        <InputLabel id='select-instruments'>Instruments Available</InputLabel>
                                        <Select
                                            labelId='select-instruments'
                                            id='select-instruments'
                                            sx={{width: "26ch"}}
                                            multiple
                                            value={instruments}
                                            onChange={handleChange}
                                            input={<OutlinedInput label="Instruments Available"/>}
                                            renderValue={(selected) => selected.join(', ')}
                                            MenuProps={instrumentOptions}
                                        >
                                            {instrumentOptions.map((instrument) => (
                                                <MenuItem key={instrument} value={instrument} id={instrument}>
                                                    <Checkbox checked={instruments.indexOf(instrument) > -1}/>
                                                    <ListItemText primary={instrument}/>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>}

                            {/* Distance Checkbox */}
                            {/*<Stack direction="row">*/}
                            {/*    <FormControlLabel */}
                            {/*    control={*/}
                            {/*    <Checkbox checked={distanceCheckbox} */}
                            {/*        onChange={(event) => {        */}
                            {/*            setDistanceCheckbox(event.target.checked)}} />}*/}
                            {/*    label="Distance"/>*/}
                            {/*    {distanceCheckbox && <Typography sx={{paddingTop: 1.2}}>{*/}
                            {/*    distance === 10 ? "10+" : ("<" + distance)}mi</Typography>}*/}
                            {/*</Stack>*/}

                            {/*/!* Distance Slider *!/*/}
                            {/*{distanceCheckbox && <Box sx={{ paddingLeft: "2ch", paddingRight: "2ch"}}>*/}
                            {/*    <Slider*/}
                            {/*        defaultValue={distance}*/}
                            {/*        valueLabelDisplay="off"*/}
                            {/*        marks*/}
                            {/*        value={distance}*/}
                            {/*        min={1}*/}
                            {/*        max={10}*/}
                            {/*        step={1}*/}
                            {/*        onChange={(event, newValue) => setDistance(newValue)}*/}
                            {/*    />*/}
                            {/*</Box>}*/}
                        </CardContent>
                    </Stack>
                </Card>

                {/* Shows Listings */}
                <div className="session-listings">
                    {sessions.length !== 0 && <h1>Sessions</h1>}
                    {sessions.length === 0 && <h1>No Sessions</h1>}
                    {sessions.map((session, index) => {
                        return (
                            // Using id property of post to output JSX for each individual post
                            // CHANGE SO THAT THE KEY IS EQUAL TO POST.ID INSTEAD AND THE ROUTER IS LINKED TO POST.ID

                            <Card className="session-listing-card" key={session.id}>
                                <CardActionArea component={RouterLink} to={"/" + session.id} id={'session-' + index}>
                                    <CardContent>
                                        <Typography>
                                            <h1>{session.title}</h1>
                                            <p className="session-listing-description">{session.descr}</p>
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
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        )
                    })}
                </div>
            </Stack>
        </ThemeProvider>)
}


export default SessionListings;