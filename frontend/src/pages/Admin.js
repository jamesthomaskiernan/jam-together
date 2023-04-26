import {useNavigate} from 'react-router-dom'
import { UserAuth } from "../context/AuthContext";
import * as React from 'react';
import {useEffect, useState} from "react";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

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

const Admin = () => {
  
    // grabs the user and the logOut function from AuthContext
    const {user} = UserAuth();
    const [admin, setAdmin] = React.useState(false)
    const [loading, setLoading] = React.useState(true)
    const [userReports, setUserReports] = React.useState({})
    const [bugReports, setBugReports] = React.useState({})
    

    // ensure admin status

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
            return console.error('Failed to get admin status');
        } else {
            
            // set admin state
            const isAdmin = await response.json()            
            setAdmin(isAdmin)
            
            if (isAdmin)
            {
                // get user reports
                let reportResponse = await fetch('/api/report/user-reports');
                setUserReports(await reportResponse.json())

                // get bug reports
                reportResponse = await fetch('/api/report/bug-reports');
                setBugReports(await reportResponse.json())

                setLoading(false)
            }
        }
    }



    
    // Returns JSX listing all user reports
    function listUserReports() {
        
        let rows = []
        let keys = Object.keys(userReports)
        let reports = Object.entries(userReports)

        for (let i = 0; i < reports.length; i++)
        {
            const report = userReports[keys[i]]
            
            rows.push(
                <div>
                    <Card sx={{width: '50vw'}} variant="outlined">
                        <CardContent>
                            <Typography>
                                <h2>{report.reportingUsername} reported {report.reportedUsername} </h2>
                            </Typography>
                            
                            <Typography variant="body1" gutterBottom >
                                <b>Given Reason:</b> {report.reportBody}
                            </Typography>
                        </CardContent>
                    </Card>
                </div>)
        }
        return rows
    }

    // Returns JSX listing all bug reports
    function listBugReports() {
        
        let rows = []
        let keys = Object.keys(bugReports)
        let reports = Object.entries(bugReports)

        for (let i = 0; i < reports.length; i++)
        {
            const report = bugReports[keys[i]]
            
            rows.push(
                <div>
                    <Card sx={{width: '50vw'}} variant="outlined">
                        <CardContent>
                            <Typography>
                                <h2>{report.reportingUsername} reported bug on {report.reportPage} page</h2>
                            </Typography>
                            
                            <Typography variant="body1">
                                <b>Bug Description:</b> {report.reportBody}
                            </Typography>
                        </CardContent>
                    </Card>
                </div>)
        }
        return rows
    }

    if (loading)
    {
        getAdminStatus()
        return (<div></div>)
    }

    return (
    <div className='reports-container'>
        
        {/* only display if admin */}
        <div>
            <ThemeProvider theme={theme}>
                
                <h2 style={{textAlign: 'center'}}>Reported Users</h2>
                <Stack spacing={2}>
                    {listUserReports()}
                </Stack>
                
                <h2 style={{textAlign: 'center'}}>Bug Reports</h2>
                
                <Stack spacing={2}>
                    {listBugReports()}
                </Stack>

            </ThemeProvider>
           
        </div>
    </div>
  )
}

export default Admin;