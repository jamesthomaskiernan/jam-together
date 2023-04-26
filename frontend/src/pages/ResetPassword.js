import {useState} from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {sendPasswordResetEmail} from "firebase/auth";
import {useNavigate} from "react-router-dom";
import {auth} from "../App";

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

const ResetPassword = () => {
    const [email, setEmail] = useState('');

    const navigate = useNavigate();

    return (
        <div className='login-container'>
            <p style={{textAlign: 'center'}}>Trouble logging in?</p>
            <div className='input-block'>
                <Box
                    component="form"
                    sx={{
                        '& > :not(style)': {m: 5, width: '25ch'},
                    }}
                    noValidate
                    autoComplete="off"
                >
                    <TextField id="standard-basic"
                               label="Email"
                               variant="outlined"
                               data-testid="email-input"
                               onChange={(e) => {
                                   setEmail(e.target.value);
                               }}
                    />
                </Box>
                <ThemeProvider theme={theme}>
                    <Button variant="contained"
                            onClick={() => {
                                sendPasswordResetEmail(auth, email)
                                    .then(() => {
                                        console.log("Email sent!");
                                        console.log(email);
                                        navigate('/login');
                                    }).catch((error) => {
                                        // const errorCode = error.code;
                                        // const errorMessage = error.message;
                                        console.error(error);
                                });
                            }}
                    >
                        Send reset email
                    </Button>
                </ThemeProvider>
            </div>
        </div>
    );
}

export default ResetPassword;
