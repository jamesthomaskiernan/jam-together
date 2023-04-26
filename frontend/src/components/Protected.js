import React from 'react'
import { Navigate } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'


const Protected = ({children}) => {

    // Grabs the user from userAuth
    const {user} = UserAuth();

    // Returns the user back to the register page of they have not been authenticated yet
    if (user && user.email == null){
        return <Navigate to ='/register'/>;
    }
    
    // Allows the user to stay on the profile page if they are authenticated
    return children;
};

export default Protected