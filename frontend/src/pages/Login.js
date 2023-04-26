import {useEffect, useState} from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {signInWithEmailAndPassword} from "firebase/auth";
import {useNavigate} from "react-router-dom";
import {auth} from "../App";
import { GoogleButton } from 'react-google-button';
import { UserAuth } from "../context/AuthContext";

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

const Login = () => {

    // Google authentication

    // Used to navigate to different pages
    const navigate = useNavigate()

    // Grabs userAuth from AuthContext
    const {googleSignIn, user} = UserAuth();

    // Handles the Google Sign in feature
    const handleGoogleSignin = async () =>{

        // Tries to authenticate the user using Google
        try{
            await googleSignIn();
        } catch(error){
            //console.log(error)
        }
    }

    // Handles navigating the user to the profile page if the user is already signed in
    useEffect(() => {
        if (user && user.email != null){
            navigate('/profile/' + user.uid);
        }
    
        // Whenever there is a user change, this useEffect will run
    }, [user])

    //const navigate = useNavigate()

    // const { user } = UserAuth();
    // useEffect(() => {
    //     if (user && user.displayName != null){
    //         navigate('/profile');
    //     }
    //
    // }, [user])

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className='login-container'>
            <p style={{textAlign: 'center'}}>Sign in to Jam Together</p>
            <div className='input-block'>
                <Box
                    component="form"
                    sx={{
                        '& > :not(style)': {m: 5, width: '25ch', display: 'flex'},
                    }}
                    noValidate
                    autoComplete="off"
                >
                    <TextField id="email-text-field"
                               label="Email"
                               variant="standard"
                               inputProps={{ "data-testid": "signin-email-input" }}
                               onChange={(e) => {
                                   setEmail(e.target.value);
                               }}
                    />
                    <TextField id="password-text-field"
                               label="Password"
                               type='password'
                               variant="standard"
                               inputProps={{ "data-testid": "signin-password-input" }}
                               onChange={(e) => {
                                   setPassword(e.target.value);
                               }}
                    />
                </Box>
                <ThemeProvider theme={theme}>
                    
                    <Button variant="contained"
                            id='signin-button'
                            onClick={() => {
                                signInWithEmailAndPassword(auth, email, password)
                                    .then((userCredential) => {
                                        // Signed in
                                        navigate("/profile/" + auth.currentUser.uid);
                                    }).catch((error) => {
                                        // const errorCode = error.code;
                                        // const errorMessage = error.message;
                                       // console.error(error);
                                });
                        }}
                >
                    Sign in
                </Button>

                {/* <GoogleButton className="google-auth-button" type="light" onClick={handleGoogleSignin}/> */}
                    </ThemeProvider>
            </div>
            <p style={{textAlign: 'center'}}>New here? <a href='/register'>Create an account.</a></p>
            <p style={{textAlign: 'center', margin: '0'}}><a href='/reset-password'>Forgot password?</a></p>
        </div>
    );
}

export default Login;