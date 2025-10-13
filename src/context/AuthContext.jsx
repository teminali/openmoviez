import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, logOut as firebaseLogout, getUserProfile } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user) => {
            if (user) {
                // User is signed in, fetch their full profile from Firestore
                const userProfile = await getUserProfile(user.uid);
                const finalUser = {
                    ...user, // Standard auth properties (uid, email, etc.)
                    ...userProfile // Custom properties from Firestore (isAdmin, etc.)
                };
                setCurrentUser(finalUser);
                // This log will show us exactly what's in the user object
                console.log('Final Current User Object:', finalUser);
            } else {
                // User is signed out
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logOut = async () => {
        await firebaseLogout();
        setCurrentUser(null);
    };

    const value = {
        currentUser,
        logOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};