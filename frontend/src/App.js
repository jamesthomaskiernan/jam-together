import {Routes, Route} from 'react-router-dom'
import {initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth";

// pages and components
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from "./pages/Profile"
import Landing from './pages/Landing'
import Navbar from './components/Navbar'
import Report from './pages/Report'
import Admin from './pages/Admin'

import Session from './components/Session'
import CreateSession from "./pages/CreateSession";
import SessionListings from "./pages/SessionListings";
import ResetPassword from "./pages/ResetPassword";
import { AuthContextProvider } from './context/AuthContext';
import Protected from './components/Protected';

// Your web app's Firebase configuration
const firebaseConfig = {YOURDATABASEINFOHERE};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)

function App() {
    return (
        <div className="App">
            <AuthContextProvider>
            <Navbar/>
                <Routes>
                    <Route
                        path="/login"
                        element={<Login/>}
                    />
                    <Route
                        path="/register"
                        element={<Register/>}
                    />
                    <Route
                        path="/"
                        element={<Landing/>}
                    />
                    <Route
                        path="/profile/:user_id"
                        element={<Protected><Profile/></Protected>}
                    />
                    <Route
                        path="/create-session"
                        element={<Protected><CreateSession/></Protected>}
                    />
                    <Route
                        path="/session-listings"
                        element={<Protected><SessionListings/></Protected>}
                    />
                    <Route
                      path="/:session_id"
                      element={<Session/>}
                    />
                    <Route
                      path="/report"
                      element={<Report/>}
                    />
                    <Route
                      path="/admin"
                      element={<Admin/>}
                      />
                    <Route
                        path="/reset-password"
                        element={<ResetPassword/>}
                      />
                </Routes>
            </AuthContextProvider>
        </div>
    );
}

export default App;