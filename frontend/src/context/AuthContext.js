import {useContext, createContext, useEffect, useState} from "react";
import {signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider} from "firebase/auth";
import {auth} from "../App"

const AuthContext = createContext()

// All logic for Google authentication is inside of this function
export const AuthContextProvider = ({children}) => {
    const [user, setUser] = useState({});

    const googleSignIn = () =>{

        // Creates a new provider
        const provider = new GoogleAuthProvider();

        // Launches pop-up when user clicks sign in with Google button
        signInWithPopup(auth, provider);
    }


    // This function handles logging out a google authenticated user
    const logOut = () => {
        signOut(auth)

    }

    useEffect(()=>{
        const unsubscribe = onAuthStateChanged(auth, (currentUser) =>{

            // Sets the state of the user to currentUser
            setUser(currentUser)
        });

        return () => {
            unsubscribe();
        };
    }, [])
    
    return(
        <AuthContext.Provider value={{googleSignIn, logOut, user}}>
            {children}
        </AuthContext.Provider>
    )
}

export const UserAuth =() => {
    return useContext(AuthContext)
}
