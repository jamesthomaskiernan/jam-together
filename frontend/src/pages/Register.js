import {useEffect, useState} from "react";
import {getAuth, createUserWithEmailAndPassword} from "firebase/auth";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import {useNavigate} from "react-router-dom";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import { GoogleButton } from 'react-google-button';
import { UserAuth } from "../context/AuthContext";
import Alert from '@mui/material/Alert';


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

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const instrumentTypes = [
    'Drums',
    'Piano',
    'Acoustic bass',
    'Electric bass',
    'Trumpet',
    'Saxophone',
    'Trombone',
    'Guitar'
];

const genreTypes = [
    'Jazz',
    'Classical',
    'Rock',
    'Punk',
    'Hip-Hop',
    'Alternative',
    'Pop'
];



function Register(){
    // Used to navigate to different pages
    const navigate = useNavigate();

    // Google Authentication

    // Grabs the userAuth from AuthContext
    const {googleSignIn, user} = UserAuth();

    // Handles the Google Sign in feature
    const handleGoogleSignin = async () =>{

        // Tries to authenticate the user using Google
        try{
            await googleSignIn();
        } catch(error){
            console.log(error)
        }
    };

    //console.log(user.displayName == null)

    // Handles navigating the user to the profile page if the user is already signed in
    useEffect(() => {
        if (user && user.email != null){
            navigate('/profile/' + user.uid);
        }
    
        // Whenever there is a user change, this useEffect will run
    }, [user])
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [instruments, setInstruments] = useState([]);
    const [genres, setGenres] = useState([]);
    const [error, setError] = useState("")
    

    const handleInstruments = (event) => {
        const {
            target: { value },
        } = event;
        setInstruments(
            // On autofill we get a stringified value.
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    const handleGenres = (event) => {
        const {
            target: { value },
        } = event;
        setGenres(
            // On autofill we get a stringified value.
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    const handleRegister = async () => {
        const auth = getAuth();
        let uid = null;

        // first check to make sure no empty states
        if (email == "" || password == "" || firstName == "" || lastName == "" || username == "")
        {
            setError('Please fill in all required fields')
            return
        }
        
        // post function
        const response = await fetch('/api/user/is-username-available', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              potentialUsername: username
              })
        })
          
        // call post function
        const json = await response.json()
    
        // if not okay, log error
        if (!response.ok) {

            setError("Username not available")
            return
        }

        // create user with firebase backend
        await createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                
                // then post user data to db
                uid = userCredential.user.uid;
                fetch('/api/user/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        potentialUsername: username,
                        uid: uid,
                        firstName: firstName,
                        lastName: lastName,
                        instruments: instruments,
                        genres: genres
                    })
                }).catch((error) => {
                    setError(error)
                    console.error(error)
                    return
                });

                navigate("/profile/" + uid);
            }).catch((error) => {
                const errorMessage = error.message;
                
                // if email invalid, set custom error message
                if (errorMessage == "Firebase: Error (auth/invalid-email).")
                {
                    setError("Invalid email")
                    return
                }
                
                // otherwise, just set it 
                setError(errorMessage)
                console.error(error)
            });
    }

    return (
        <div className='login-container'>
            <p style={{textAlign: 'center'}}>Sign up for Jam Together</p>
            <div className='input-block'>
                <Box
                    component="form"
                    sx={{
                        '& > :not(style)': { m: 5, width: '25ch', display: 'flex'},
                    }}
                    noValidate
                    autoComplete="off"
                >
                    <TextField id="register-email-input"
                               label="Email"
                               variant="standard"
                               inputProps={{ "data-testid": "register-email-input" }}
                               onChange={(event) => {setEmail(event.target.value)}}
                    />
                    <TextField id="register-password-input"
                               label="Password"
                               type='password'
                               variant="standard"
                               inputProps={{ "data-testid": "register-password-input" }}
                               onChange={(event) => {setPassword(event.target.value)}}
                    />
                    <TextField id="register-first-input"
                               label="First Name"
                               variant="standard"
                               inputProps={{ "data-testid": "register-first-input" }}
                               onChange={(event) => {setFirstName(event.target.value)}}
                    />
                    <TextField id="register-last-input"
                               label="Last Name"
                               variant="standard"
                               inputProps={{ "data-testid": "register-last-input" }}
                               onChange={(event) => {setLastName(event.target.value)}}
                    />
                    <TextField id="register-username-input"
                               label="Username"
                               variant="standard"
                               inputProps={{ "data-testid": "register-username-input" }}
                               onChange={(event) => {setUsername(event.target.value)}}
                    />
                    <FormControl sx={{ m: 1, width: 300 }}>
                        <InputLabel id="demo-multiple-checkbox-label">Instruments</InputLabel>
                        <Select
                            labelId="demo-multiple-checkbox-label"
                            id="demo-multiple-checkbox"
                            multiple
                            value={instruments}
                            onChange={handleInstruments}
                            input={<OutlinedInput label="Instruments" />}
                            renderValue={(selected) => selected.join(', ')}
                            MenuProps={MenuProps}
                        >
                            {instrumentTypes.map((name) => (
                                <MenuItem key={name} value={name}>
                                    <Checkbox checked={instruments.indexOf(name) > -1} />
                                    <ListItemText primary={name} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl sx={{ m: 1, width: 300 }}>
                        <InputLabel id="demo-multiple-checkbox-label">Genres</InputLabel>
                        <Select
                            labelId="demo-multiple-checkbox-label"
                            id="demo-multiple-checkbox"
                            multiple
                            value={genres}
                            onChange={handleGenres}
                            input={<OutlinedInput label="Genres" />}
                            renderValue={(selected) => selected.join(', ')}
                            MenuProps={MenuProps}
                        >
                            {genreTypes.map((name) => (
                                <MenuItem key={name} value={name}>
                                    <Checkbox checked={genres.indexOf(name) > -1} />
                                    <ListItemText primary={name} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <ThemeProvider theme={theme}>
                <Button variant="contained"
                        id="register-button"
                        onClick={handleRegister}
                >
                    Sign up
                </Button>
                {error && 
                        <Box sx={{paddingY: 5}}>
                            <Alert variant="outlined" severity="warning">
                                <b>
                                    {error}&nbsp;
                                </b>
                            </Alert>
                            
                        </Box>}

                <Box sx={{paddingTop:2}}>

                </Box>

                {/* <GoogleButton className="google-auth-button" type="light" onClick={handleGoogleSignin}/> */}
                </ThemeProvider>
            </div>
            <p style={{textAlign: 'center'}}>Already have an account? <a href='/login'>Login here.</a></p>

            
        </div>
    );
}

export default Register;