// React
import * as React from 'react';
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import Autocomplete from '@mui/material/Autocomplete';
import {useEffect} from "react";
// DB
import {getAuth,onAuthStateChanged} from "firebase/auth";

// Day.js
import dayjs from 'dayjs';

// MUI
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import Stack from '@mui/material/Stack';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Slider from '@mui/material/Slider';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import SearchLocationInput from "../components/SearchLocationInput";
import {Search} from "@mui/icons-material";

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

const states = [
    'Alabama','Alaska','American Samoa',
    'Arizona','Arkansas','California',
    'Colorado','Connecticut','Delaware',
    'District of Columbia',
    'Federated States of Micronesia','Florida',
    'Georgia','Guam','Hawaii','Idaho','Illinois',
    'Indiana','Iowa','Kansas','Kentucky',
    'Louisiana','Maine','Marshall Islands',
    'Maryland','Massachusetts','Michigan',
    'Minnesota','Mississippi','Missouri',
    'Montana','Nebraska','Nevada','New Hampshire',
    'New Jersey','New Mexico','New York',
    'North Carolina','North Dakota',
    'Northern Mariana Islands','Ohio','Oklahoma',
    'Oregon','Palau','Pennsylvania','Puerto Rico',
    'Rhode Island','South Carolina','South Dakota',
    'Tennessee','Texas','Utah','Vermont',
    'Virgin Island','Virginia','Washington',
    'West Virginia','Wisconsin','Wyoming']

const INSTRUMENTS_LIMIT = 15
const DEFAULT_INSTRUMENTS_ALLOWED = 2



function CreateSession() {
    
    const [title, setTitle] = React.useState("")
    const [descr, setDescr] = React.useState("")
    
    // location states
    const [address, setAddress] = React.useState("")
    const [state, setState] = React.useState("")
    const [city, setCity] = React.useState("")
    const [postal, setPostal] = React.useState("")
    
    const [date, setDate] = React.useState(dayjs()) // default to current date
    const [time, setTime] = React.useState(dayjs()) // default to current hour
    const [privacy, setPrivacy] = useState("")
    
    // error states
    const [error, setError] = useState(null)
    const [missingFields, setMissingFields] = React.useState([])
    const [requestToJoin, setRequestToJoin] = React.useState(false)


    // states for selecting instruments
    const [checkbox, setcheckbox] = React.useState(false) // if instruments are customized
    const [instrumentCount, setInstrumentCount] = React.useState(1) // int saves how many instruments have been added so far, default 1
    const [instrumentNames, setInstrumentNames] = React.useState([]) // arr holds name for each selected instrument
    const [sliderValues, setSliderValues] = React.useState([2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]) // arr holds slider value for each selected instrument, defaults to 2

    const [limitMembers, setLimitMembers] = React.useState(false)
    const [limit, setLimit] = React.useState(2)


    const navigate = useNavigate();
    
    // when create session button is pressed
    const handleCreation = async (e) => {
        
        // make sure no instrument names are left blank
        if (checkbox)
        {
            for (let i = 0; i < instrumentCount; i++)
            {
                if (instrumentNames[i] == null)
                {
                    setError("Please fill in all instrument names, or deselect customized instruments")
                    return
                }
            }
        }

        // make sure no instruments are duplicates
        if (checkbox)
        {
            for (let i = 0; i < instrumentCount; i++)
            {
                for (let j = 0; j < instrumentCount; j++)
                {
                    if (instrumentNames[j] == instrumentNames[i] && i != j)
                    {
                        setError("Please remove duplicate instrument names")
                        return
                    }
                }
            }
        }

        console.log("INSTRUMENT COUNT: " + instrumentCount)


        // make sure limit is positive
        if (limit < 1)
        {
            setError("Member limit must be above 1")
            return
        }

        // post function
        const response = await fetch('/api/sessions/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            creator: getAuth().currentUser.uid,
            title: title,
            descr: descr,
            address: address,
            city: city,
            state: state,
            postal: postal,
            time: date.format("MMM D") + ", " + time.format("h:mm A"),
            privacy: privacy,
            memberLimit: (checkbox || limitMembers) ? limit : false,
            requestToJoin: requestToJoin,
            instruments: getInstrumentsJSON()
            })
        })
        
        // call post function
        const json = await response.json()
    
        // if not okay, log error
        if (!response.ok) {

            setError(json.error)
            setMissingFields(json.emptyFields)
        } else {
            // redirect user to their session page
            return navigate('/' + json.sessionID)
        }
    }

    // converts info in instrumentNames array and sliderValues array into JSON
    function getInstrumentsJSON() {
        if (!checkbox)
        {
            return null
        }

        // new json object to hold instrument names and slider vals
        var obj = {};
        
        // for each instrument added
        for (let i = 0; i < instrumentCount; i++)
        {
            const name = instrumentNames[i]
            const val = sliderValues[i]

            // add it to obj if its not blank
            if (name != "")
            {
                obj[name] = val
            }
        }

        return obj
    }

    const handleDate = (newValue) => {
        setDate(newValue);
    }

    const handleTime = (newValue) => {
        setTime(newValue);
    }

    const handlePrivacy = (event) => {
        setPrivacy(event.target.value)
    }

    const handleCheckbox = (event) => {        
        setcheckbox(event.target.checked)
    }

    const handleRequestToJoinCheckbox = (event) => {
        setRequestToJoin(event.target.checked)
    }

    const handlelimitMembersCheckbox = (event) => {
        setLimitMembers(event.target.checked)
    }

    const handleAddInstrument = () => {
        
        if (instrumentCount + 1 <= INSTRUMENTS_LIMIT)
        {
            setInstrumentCount(instrumentCount + 1)
            handleSliderChange(DEFAULT_INSTRUMENTS_ALLOWED, instrumentCount - 1)   
        }
    }

    const handleRemoveInstrument = () => {
        
        if (instrumentCount > 1)
        {
            setInstrumentCount(instrumentCount - 1)
        }
    }

    // updates instrument name
    const handleInstrumentNameChange = (newValue, index) => {
        setInstrumentNames((prevValues) => {
            const newValues = [...prevValues]
            newValues[index] = newValue
            return newValues
        })
    }

    // updates slider value
    const handleSliderChange = (newValue, index) => {
        setSliderValues((prevValues) => {
          const newValues = [...prevValues]
          newValues[index] = newValue
          return newValues
        })
    }


    function updateLimitValue() {
        if (instrumentNames && sliderValues)
        {
            if (instrumentNames.length != 0 || limitMembers) {
                // make limit equal to all instrument sliders added up
                let newLimit = 0
                for (let i = 0; i < instrumentCount; i++)
                {
                    newLimit += sliderValues[i]
                }
                setLimit(newLimit)
            }
        }
    }

    function autofillAddress(addressComponents) {
        let streetNumber = "";
        let route = "";

        addressComponents.forEach((obj) => {
            if (obj.types[0] === "street_number") {
                streetNumber = obj.long_name;
            } else if (obj.types[0] === "route") {
                route = obj.short_name;
            } else if (obj.types[0] === "locality") {
                setCity(obj.long_name);
            } else if (obj.types[0] === "administrative_area_level_1") {
                setState(obj.long_name);
            } else if (obj.types[0] === "postal_code") {
                setPostal(obj.long_name);
            }
        });

        setAddress(streetNumber + " " + route);
    }

    // Whenever a slider is moved, or instrument removed, recalculate limit
    useEffect(() => {
        updateLimitValue()
    }, [sliderValues, instrumentCount, checkbox])

    // for each instrument selected, generates a text box and slider
    // for user to specify instruments 
    function getCustomizedInstruments() {
        
        const rows = []; // holds the JSX code below

        // var of i specifies which element in sliderValues array to write to,
        // same for instrumentNames
        for (let i = 0; i < instrumentCount; i++) {
            rows.push(
                <Stack direction="row" 
                    spacing={2}>

                    <Autocomplete
                        sx={{ width: "50ch" }}
                        value={instrumentNames[i]}
                        onChange={(event, newValue) => {
                            handleInstrumentNameChange(newValue, i);
                        }}
                        inputValue={instrumentNames[i]}
                        onInputChange={(event, newValue) => {
                            handleInstrumentNameChange(newValue, i);
                        }}
                        freeSolo
                        options={instrumentOptions}
                        size="small"
                        id='instruments-input'
                        renderInput={(params) => <TextField {...params} label="Instrument" />}
                    />

                    <Slider
                        sx={{ paddingTop: 3 }} // makes slider level with text box
                        defaultValue={DEFAULT_INSTRUMENTS_ALLOWED}
                        valueLabelDisplay="auto"
                        marks
                        value={sliderValues[i]}
                        min={1}
                        max={10}
                        step={1}
                        onChange={(event, newValue) => handleSliderChange(newValue, i)}
                    />
                </Stack>)
        }
        
        return rows
    }

    return (
        <ThemeProvider theme={theme}>            
            <div className='create-session-container'>
                <h2 style={{textAlign: 'center'}}>Host a Jam Session</h2>
                <div className='create-session-input-block'>
                    <Box sx={{minWidth: "50ch"}} >
                        <Stack spacing={5}>
                            {/* Title text box*/}
                            <TextField
                                label="Title"
                                id='title'
                                variant="outlined"
                                data-testid="title"
                                inputProps={{ maxLength: 50 }}
                                onChange={(event) => {setTitle(event.target.value)}}
                            />

                            {/* Description text box*/}
                            <TextField
                                label="Description"
                                id='description'
                                multiline
                                maxRows = {8}
                                rows={4}
                                variant="outlined"
                                inputProps={{ maxLength: 300 }}
                                onChange={(event) => {setDescr(event.target.value)}}
                            />
                            
                            <Stack direction="row" fullwidth>
                                {/*Address text box*/}
                                <SearchLocationInput address={address} setAddress={setAddress} autofillAddress={autofillAddress} />
                                                        
                                {/* City */}
                                <TextField
                                    sx={{'& .MuiInputLabel-root': {paddingLeft: "4.5ch"},  width: "100%", paddingLeft: "3ch"}} // set width to 100%
                                    label="City"
                                    id='city'
                                    variant="outlined"
                                    value = {city}
                                    onChange={(event) => {setCity(event.target.value)}}
                                    inputProps={{ maxLength: 40 }}
                                />
                            </Stack>

                            <Stack direction="row" fullwidth>

                                {/* State */}
                                <Autocomplete
                                    sx={{  width: "130%"}}
                                    id='state'
                                    value={state}
                                    onChange={(event, newValue) => {
                                        setState(newValue)
                                    }}
                                    options={states}
                                    renderInput={(params) => <TextField {...params} label="State" />}
                                />

                                {/* Postal */}
                                <TextField
                                    sx={{'& .MuiInputLabel-root': {paddingLeft: "3ch"},   width: "100%", paddingLeft: "2ch"}}
                                    label="Postal Code"
                                    id='postal-code'
                                    variant="outlined"
                                    value = {postal}
                                    onChange={(event) => {setPostal(event.target.value)}}
                                    inputProps={{ maxLength: 10 }}
                                />

                            </Stack>

                            {/* LocalizationProvider needed for MUI components involving time */}
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <Stack direction="row" fullwidth>
                                    
                                    {/* Date */}
                                    <Box sx={{ width: "100%"}} display="flex">
                                        <DesktopDatePicker
                                            label="Date"
                                            inputFormat="MM/DD/YYYY"
                                            value={date}
                                            onChange={handleDate}
                                            renderInput={(params) => <TextField {...params} />}
                                        />
                                    </Box>

                                    {/* Time */}
                                    <Box sx={{paddingLeft: "3ch", width: "100%"}} display="flex" justifyContent="flex-end">
                                    <TimePicker
                                        label="Time"
                                        value={time}
                                        onChange={handleTime}
                                        renderInput={(params) => <TextField {...params} />}
                                        defaultValue={dayjs()}
                                    />
                                    </Box>

                                </Stack>
                            </LocalizationProvider>

                            {/* Privacy Selector*/}
                            <FormControl fullwidth id='select-privacy'>
                                
                                <InputLabel id="select-privacy">Visible To</InputLabel>
                                
                                <Select
                                    labelId="select-privacy"
                                    id="select-privacy"
                                    value={privacy}
                                    label="Visible To"
                                    onChange={handlePrivacy}
                                    >
                                    <MenuItem value={"Public"}>Public</MenuItem>
                                    <MenuItem value={"Friends Only"} id='friends-only-option'>Friends Only</MenuItem>
                                    <MenuItem value={"Nobody"}>Nobody</MenuItem>
                                </Select>

                            </FormControl>
                            
                            {/* Choose Instruments */}
                            <Box>

                                <Stack>
                                    
                                    {/* Users must request to join */}
                                    <FormControlLabel 
                                        control={
                                            <Checkbox checked={requestToJoin} 
                                            onChange={handleRequestToJoinCheckbox} />}
                                        label="Request required"
                                        id='request-required-checkbox'
                                    />

                                    {/* Limit Members */}
                                    <Stack direction="row">

                                        <FormControlLabel 
                                            control={
                                                <Checkbox checked={limitMembers || checkbox} 
                                                onChange={handlelimitMembersCheckbox} />}
                                            label="Limit attendee count"
                                            disabled={checkbox}
                                            id='limit-members-checkbox'
                                        />

                                        {(limitMembers || checkbox) && 
                                        
                                        
                                        <TextField
                                            inputProps={{ "data-testid": "limit" }}
                                            sx={{'& .MuiInputLabel-root': {paddingLeft: 10}, paddingLeft: 8}}
                                            label="Limit"
                                            type="number"

                                            InputLabelProps={{shrink: true}}
                                            InputProps={{ inputProps: { min: 1, max: 100 } }}
                                            value={limit}
                                            disabled={checkbox}
                                            onChange={(event) => {setLimit(event.target.value)}}
                                            size="small"
                                            /> }
                                            
                                    </Stack>
                                                                        
                                    {/* Customize instruments checkbox */}
                                    <FormControlLabel 
                                        control={
                                            <Checkbox checked={checkbox} 
                                            onChange={handleCheckbox} />}
                                        label="Customize allowed instruments"
                                        id='instruments-checkbox'
                                    />
                                </Stack>

                                {/* Conditional statement reveals when customized instruments*/}                
                                {checkbox && 
                                <Stack spacing = {2} sx={{paddingTop: 2}}>
                                    
                                    {/* Func returns html showing each instrument*/}   
                                    {getCustomizedInstruments()}
                                    
                                    <Stack direction="row">
                                        
                                        {/* Plus Button */}
                                        <Box sx={{paddingLeft: 8.5}}>
                                            <IconButton color="primary" size="small" sx={{width: 50}} onClick = {handleAddInstrument}> 
                                                <AddIcon />
                                            </IconButton>
                                        </Box>

                                        {/* Remove Button */}
                                        <Box sx={{paddingLeft: 1}}>
                                            <IconButton color="primary" size="small" sx={{width: 50}} onClick = {handleRemoveInstrument}> 
                                                <RemoveIcon />
                                            </IconButton>
                                        </Box>

                                    </Stack>
                                </Stack>}
                            </Box>
                        </Stack>
                    </Box>
                    
                    <Box sx={{ paddingTop: 4, display: 'flex', justifyContent: 'center' }}>
                        <Button variant="contained"
                                id="create-session-button"
                                onClick={()=> {handleCreation()}}>
                            Create Session
                        </Button>
                    </Box>
                    
                    {error && 
                        <Box sx={{paddingY: 5}}>
                            <Alert variant="outlined" severity="warning">
                                <b>
                                    {error}&nbsp;
                                </b>
                                
                                {/* {missingFields.join(", ")} */}
                            </Alert>
                            
                        </Box>}
                </div>
            </div>
        </ThemeProvider>

        
    );
}

export default CreateSession;