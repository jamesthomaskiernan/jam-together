// React
import * as React from 'react';
import {useNavigate} from "react-router-dom";

// DB
import {getAuth} from "firebase/auth";

// MUI
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

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

const ReportUser = () => {

    const [reportType, setReportType] = React.useState("")
    
    // for user reports
    const [reportedUsername, setReportedUsername] = React.useState("")
    const [userReportBody, setUserReportBody] = React.useState("")
    
    // for bug reports
    const [reportPage, setReportPage] = React.useState("")
    const [bugReportBody, setBugReportBody] = React.useState("")

    // error/success handling
    const [error, setError] = React.useState("")
    const [succ, setSucc] = React.useState("")

    const navigate = useNavigate();

    // called when button to submit report is pressed
    const handleSubmission = async () => {
        
        // make sure all fields are filled in correctly
        if ((userReportBody === "" && reportType === "User Report") || 
            (reportedUsername === "" && reportType === "User Report") ||
            (reportPage === "" && reportType === "Bug Report") ||
            (bugReportBody === "" && reportType === "Bug Report")) {
            setError("Please fill in all fields")
            return
        }
        
        const response = await fetch('/api/report/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reportingUserID: getAuth().currentUser.uid,
            reportType: reportType,
            reportedUsername: reportedUsername,
            userReportBody: userReportBody,
            reportPage: reportPage,
            bugReportBody: bugReportBody,
            })
        })

        // call post function
        const json = await response.json()
    
        // if not okay, log error
        if (!response.ok) {
            setError(json)
        } else {
            if (reportType === 'User Report') {setSucc("Thank you for making JamTogether safe!")}
            else {setSucc("Thank you for improving JamTogether!")}
            await timeout(3000)
            navigate("/session-listings");
        }
    }

    function timeout(delay) {
        return new Promise( res => setTimeout(res, delay) );
    }

    return (
        <ThemeProvider theme={theme}>
        <Box sx={{paddingTop: 10, display: 'flex', flexGrow: 1}}> </Box>
        
        <div className='reports-container'>
            {!succ && <h2 style={{textAlign: 'center'}}>Create a Report</h2>}
             
            {/* Thank you appears after report submission */}
            {succ && <h2 style={{textAlign: 'center'}}>
                {succ}
            </h2>}

            {/* Select type of report */}
            {!succ && <FormControl fullWidth sx={{display:'flex', maxWidth: 400}} id='report-selector-label'>
                <InputLabel id="demo-simple-select-label">Report Type</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={reportType}
                    label="Report Type"
                    onChange={(event)=>{setReportType(event.target.value)}}
                >
                    <MenuItem value={"User Report"} id='user-report'>Report a User</MenuItem>
                    <MenuItem value={"Bug Report"} id='bug-report'>Report a Bug</MenuItem>
                </Select>
            </FormControl>}

            {/* Bug report page */}
            {!succ && reportType === 'Bug Report' && <TextField
                sx={{'& .MuiInputLabel-root': {paddingTop: 2}, paddingTop: 2, minWidth: 400}}
                label="Which page did the bug occur on?"
                id='bug-page-textbox'
                variant="outlined"
                inputProps={{ maxLength: 50 }}
                onChange={(event) => {setReportPage(event.target.value); setSucc(""); setError("")}}
            />}

            {/* Bug report body */}
            {!succ && reportType === 'Bug Report' && <TextField
                label="Bug Description"
                id='bug-description'
                multiline
                maxRows = {8}
                rows={12}
                sx={{'& .MuiInputLabel-root': {paddingTop: 2}, paddingTop: 2, minWidth: 400}}
                variant="outlined"
                inputProps={{ maxLength: 500 }}
                onChange={(event) => {setBugReportBody(event.target.value); setSucc(""); setError("")}}
            />}

            {/* User report username */}
            {!succ && reportType === 'User Report' && <TextField
                sx={{'& .MuiInputLabel-root': {paddingTop: 2}, paddingTop: 2, minWidth: 400}}
                label="Username"
                id='username-textbox'
                variant="outlined"
                inputProps={{ maxLength: 50 }}
                onChange={(event) => {setReportedUsername(event.target.value); setSucc(""); setError("")}}
            />}

            {/* User report body */}
            {!succ && reportType === 'User Report' && <TextField
                label="Describe issue"
                id='user-description'
                multiline
                maxRows = {8}
                rows={12}
                sx={{'& .MuiInputLabel-root': {paddingTop: 2}, paddingTop: 2, minWidth: 400}}
                variant="outlined"
                inputProps={{ maxLength: 500 }}
                onChange={(event) => {setUserReportBody(event.target.value); setSucc(""); setError("")}}
            />}

            {/* submit Button */}
            {!succ && reportType && <Box sx = {{ paddingTop: 4}}>
                <Button variant="contained" onClick={handleSubmission} id='submit-report-button'>
                    Submit Report
                </Button>
            </Box>}

            {/* display errors */}
            {!succ && error && 
                        <Box sx={{paddingY: 5}}>
                            <Alert variant="outlined" severity="warning">
                                <b>
                                    {error}&nbsp;
                                </b>
                            </Alert>
                        </Box>}
        </div>
        </ThemeProvider>
    )
}
  
export default ReportUser