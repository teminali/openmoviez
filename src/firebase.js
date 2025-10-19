import { initializeApp } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    updatePassword
} from "firebase/auth";
import {
    getFirestore,
    collection,
    doc,
    query,
    getDocs,
    getDoc,
    addDoc,
    Timestamp,
    orderBy,
    limit,
    where,
    updateDoc,
    deleteDoc,
    increment,
    setDoc,
    documentId,
    arrayUnion,
    arrayRemove,
    writeBatch,
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// --- Firebase Initialization ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Collection Names ---
const MOVIES_COLLECTION = 'movies';
const USERS_COLLECTION = 'users';
const TRENDING_COLLECTION = 'trending_searches';
const COMMENTS_COLLECTION = 'comments';
const RATINGS_COLLECTION = 'ratings';
const PEOPLE_COLLECTION = 'people';
const WATCHLISTS_COLLECTION = 'watchlists';

// --- Helper Functions ---
const createSearchTerms = (title) => {
    const terms = new Set();
    const cleanedTitle = title.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    const words = cleanedTitle.split(' ');

    for (const word of words) {
        if (word.length < 2) continue;
        for (let i = 2; i <= word.length; i++) {
            terms.add(word.substring(0, i));
        }
    }
    terms.add(cleanedTitle);
    return Array.from(terms);
};

const createUserSearchTerms = (displayName) => {
    const terms = new Set();
    if (!displayName) return [];
    const cleanedName = displayName.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    const words = cleanedName.split(' ');

    for (const word of words) {
        if (word.length < 2) continue;
        for (let i = 2; i <= word.length; i++) {
            terms.add(word.substring(0, i));
        }
    }
    terms.add(cleanedName);
    return Array.from(terms);
};

// --- Authentication and Profile Functions ---
export const getUserProfile = async (userId) => {
    if (!userId) return null;
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return { uid: userId, ...docSnap.data() };
    } else {
        const newUserProfile = {
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
            createdAt: Timestamp.now(),
        };
        await setDoc(userDocRef, newUserProfile);
        return { uid: userId, ...newUserProfile };
    }
};

export const signUp = async (email, password, username) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: username, photoURL: null });

    // Create user profile in Firestore with default values
    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    await setDoc(userDocRef, {
        displayName: username,
        email: email,
        searchTerms: createUserSearchTerms(username),
        createdAt: Timestamp.now(),
        isAdmin: false,
        isBlocked: false, // Default blocked status
        photoURL: null,
        bio: null,
        location: null
    });
    return user;
};

export const logIn = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // After successful login, check their status in Firestore
    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists() && docSnap.data().isBlocked === true) {
        // If user is blocked, sign them out immediately and throw an error
        await signOut(auth);
        throw new Error('Your account has been suspended.');
    }

    return userCredential;
};

export const logOut = () => signOut(auth);
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

export const updateUserProfile = async (newProfileData, newAvatarFile = null) => {
    // Get the live user object directly from auth
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");

    let photoURL = user.photoURL;
    if (newAvatarFile) {
        const avatarRef = ref(storage, `avatars/${user.uid}`);
        const snapshot = await uploadBytesResumable(avatarRef, newAvatarFile);
        photoURL = await getDownloadURL(snapshot.ref);
    }
    // Update Firebase Auth profile
    await updateProfile(user, {
        displayName: newProfileData.displayName,
        photoURL: photoURL,
    });
    // Also update Firestore user document
    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userDocRef, {
        displayName: newProfileData.displayName,
        photoURL: photoURL,
        searchTerms: createUserSearchTerms(newProfileData.displayName),
    });
};

export const changeUserPassword = (newPassword) => {
    // Get the live user object directly from auth
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");

    return updatePassword(user, newPassword);
};


// ===================================
// ===== ADMIN FUNCTIONS =========
// ===================================

export const getAllUsers = async () => {
    const usersRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateUserAsAdmin = async (userId, data) => {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const updateData = { ...data };
    if (data.displayName) {
        updateData.searchTerms = createUserSearchTerms(data.displayName);
    }
    await updateDoc(userDocRef, updateData);
};

export const verifyMovie = async (movieId, isVerified) => {
    const movieDocRef = doc(db, MOVIES_COLLECTION, movieId);
    await updateDoc(movieDocRef, { isVerified });
};

// Gets ALL movies, not just active ones, for admin panel
export const getAllMoviesAdmin = async () => {
    const moviesRef = collection(db, MOVIES_COLLECTION);
    const q = query(moviesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// --- People (Cast/Crew) Management ---
export const searchPeople = async (searchText) => {
    if (!searchText || searchText.length < 2) return [];
    const peopleRef = collection(db, PEOPLE_COLLECTION);
    const q = query(
        peopleRef,
        where('searchTerms', 'array-contains', searchText.toLowerCase()),
        limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const findOrCreatePerson = async (personData) => {
    const { name, file, bio = '', birthDate = null, birthPlace = '', social = { twitter: '', instagram: '' } } = personData;
    if (!name || !name.trim()) return null;

    const peopleRef = collection(db, PEOPLE_COLLECTION);
    const q = query(peopleRef, where("name", "==", name.trim()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    } else {
        let profilePicURL = null;
        if (file) {
            const personPicRef = ref(storage, `people/${Date.now()}-${file.name}`);
            const snapshot = await uploadBytesResumable(personPicRef, file);
            profilePicURL = await getDownloadURL(snapshot.ref);
        }

        const newPersonDoc = await addDoc(peopleRef, {
            name: name.trim(),
            profilePicURL,
            searchTerms: createSearchTerms(name),
            createdAt: Timestamp.now(),
            bio,
            birthDate: birthDate ? Timestamp.fromDate(new Date(birthDate)) : null,
            birthPlace,
            social,
            totalMovies: 0,
        });
        return newPersonDoc.id;
    }
};

export const updatePersonMovieCount = async (personIds, amount = 1) => {
    if (!personIds || personIds.length === 0) return;
    const batch = writeBatch(db);
    personIds.forEach(id => {
        const personRef = doc(db, PEOPLE_COLLECTION, id);
        batch.update(personRef, { totalMovies: increment(amount) });
    });
    await batch.commit();
};

export const getPersonById = async (id) => {
    try {
        const docRef = doc(db, PEOPLE_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        console.error("Error fetching person by ID:", error);
        return null;
    }
};

export const getPeopleByIds = async (ids = []) => {
    if (!ids || ids.length === 0) return {};
    try {
        const peopleRef = collection(db, PEOPLE_COLLECTION);
        const q = query(peopleRef, where(documentId(), 'in', ids));
        const snapshot = await getDocs(q);
        const peopleMap = {};
        snapshot.docs.forEach(doc => {
            peopleMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        return peopleMap;
    } catch (error) {
        console.error("Error fetching people by IDs:", error);
        return {};
    }
};

export const getTopPeople = async (limitCount = 10) => {
    try {
        const peopleRef = collection(db, PEOPLE_COLLECTION);
        const q = query(peopleRef, orderBy("totalMovies", "desc"), limit(limitCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching top people:", error);
        return [];
    }
};

export const getRecentPeople = async (limitCount = 12) => {
    try {
        const peopleRef = collection(db, PEOPLE_COLLECTION);
        const q = query(peopleRef, orderBy("createdAt", "desc"), limit(limitCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching recent people:", error);
        return [];
    }
};


// --- Movie Management ---
export const shareNewMovie = async (movieData, posterFile, coverFile, actorsData = [], directorsData = [], user) => {
    const directorIds = await Promise.all(
        directorsData.filter(d => d.name).map(findOrCreatePerson)
    );
    const actorsPayload = await Promise.all(
        actorsData.filter(a => a.name).map(async (actor) => {
            const personId = await findOrCreatePerson(actor);
            return { personId, characterName: actor.character || '' };
        })
    );
    const posterRef = ref(storage, `posters/${user.uid}-${Date.now()}-${posterFile.name}`);
    const snapshot = await uploadBytesResumable(posterRef, posterFile);
    const posterURL = await getDownloadURL(snapshot.ref);

    let coverURL = null;
    if (coverFile) {
        const coverRef = ref(storage, `covers/${user.uid}-${Date.now()}-${coverFile.name}`);
        const coverSnapshot = await uploadBytesResumable(coverRef, coverFile);
        coverURL = await getDownloadURL(coverSnapshot.ref);
    }

    const { actors, ...restOfMovieData } = movieData;
    await addDoc(collection(db, MOVIES_COLLECTION), {
        ...restOfMovieData,
        posterURL,
        coverURL,
        uploaderId: user.uid,
        uploaderName: user.displayName || user.email,
        createdAt: Timestamp.now(),
        isActive: true,
        isVerified: false,
        searchTerms: createSearchTerms(movieData.title),
        directors: directorIds.filter(id => id),
        actors: actorsPayload.filter(a => a.personId),
    });

    const allPersonIds = [...directorIds, ...actorsPayload.map(a => a.personId)].filter(Boolean);
    const uniquePersonIds = [...new Set(allPersonIds)];
    await updatePersonMovieCount(uniquePersonIds, 1);
};

export const updateMovie = async (id, updatedData, newPosterFile = null, newCoverFile = null, actorsData = [], directorsData = []) => {
    const movieDocRef = doc(db, MOVIES_COLLECTION, id);
    const oldDocSnap = await getDoc(movieDocRef);
    if (!oldDocSnap.exists()) throw new Error("Movie not found.");
    const oldData = oldDocSnap.data();

    const oldDirectorIds = oldData.directors || [];
    const oldActorPersonIds = (oldData.actors || []).map(a => a.personId);
    const oldPersonIds = new Set([...oldDirectorIds, ...oldActorPersonIds]);

    const newDirectorIds = await Promise.all(directorsData.filter(d => d.name).map(findOrCreatePerson));
    const newActorsPayload = await Promise.all(
        actorsData.filter(a => a.name).map(async (actor) => {
            const personId = await findOrCreatePerson(actor);
            return { personId, characterName: actor.character || '' };
        })
    );
    const newActorPersonIds = newActorsPayload.map(a => a.personId);
    const newPersonIds = new Set([...newDirectorIds, ...newActorPersonIds].filter(Boolean));

    const addedPeople = [...newPersonIds].filter(personId => !oldPersonIds.has(personId));
    const removedPeople = [...oldPersonIds].filter(personId => !newPersonIds.has(personId));

    let finalData = { ...updatedData };
    delete finalData.actors;
    if (updatedData.title) {
        finalData.searchTerms = createSearchTerms(updatedData.title);
    }
    if (newPosterFile) {
        const posterRef = ref(storage, `posters/${auth.currentUser.uid}-${Date.now()}-${newPosterFile.name}`);
        const snapshot = await uploadBytesResumable(posterRef, newPosterFile);
        finalData.posterURL = await getDownloadURL(snapshot.ref);
    }
    if (newCoverFile) {
        const coverRef = ref(storage, `covers/${auth.currentUser.uid}-${Date.now()}-${newCoverFile.name}`);
        const snapshot = await uploadBytesResumable(coverRef, newCoverFile);
        finalData.coverURL = await getDownloadURL(snapshot.ref);
    }

    finalData.directors = newDirectorIds.filter(id => id);
    finalData.actors = newActorsPayload.filter(a => a.personId);

    await updateDoc(movieDocRef, finalData);

    if (addedPeople.length > 0) await updatePersonMovieCount(addedPeople, 1);
    if (removedPeople.length > 0) await updatePersonMovieCount(removedPeople, -1);
};

export const deleteMovie = async (id) => {
    const movieDoc = doc(db, MOVIES_COLLECTION, id);
    await deleteDoc(movieDoc);
};

// --- Data Fetching ---
export const getMovies = async (searchTerm = '') => {
    try {
        const moviesRef = collection(db, MOVIES_COLLECTION);
        let q;
        if (searchTerm) {
            q = query(moviesRef,
                where("isActive", "==", true),
                where("searchTerms", "array-contains", searchTerm.toLowerCase())
            );
        } else {
            q = query(moviesRef,
                where("isActive", "==", true),
                orderBy("createdAt", "desc"),
                limit(20)
            );
        }
        const querySnapshot = await getDocs(q);
        const movies = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (searchTerm) {
            movies.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        }
        return movies;
    } catch (error) {
        console.error("Error in getMovies:", error);
        return [];
    }
};

export const getMoviesByPersonId = async (personId) => {
    try {
        const allMoviesSnapshot = await getDocs(query(collection(db, MOVIES_COLLECTION), where("isActive", "==", true)));
        const movies = [];
        allMoviesSnapshot.forEach(doc => {
            const movie = { id: doc.id, ...doc.data() };
            const isActor = movie.actors?.some(a => a.personId === personId);
            const isDirector = movie.directors?.includes(personId);
            if(isActor || isDirector) {
                movies.push(movie);
            }
        });

        return movies.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    } catch (error) {
        console.error("Error fetching movies by person ID:", error);
        return [];
    }
};

export const getMoviesByUserId = async (userId, searchTerm = '') => {
    try {
        const moviesRef = collection(db, MOVIES_COLLECTION);
        let q;
        if (searchTerm) {
            q = query(moviesRef,
                where("uploaderId", "==", userId),
                where("searchTerms", "array-contains", searchTerm.toLowerCase())
            );
        } else {
            q = query(moviesRef,
                where("uploaderId", "==", userId),
                orderBy("createdAt", "desc")
            );
        }
        const querySnapshot = await getDocs(q);
        const movies = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (searchTerm) {
            movies.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        }
        return movies;
    } catch (error) {
        console.error("Error fetching user's movies:", error);
        return [];
    }
};

export const getMovieById = async (id) => {
    try {
        const docRef = doc(db, MOVIES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        console.error("Error fetching movie by ID:", error);
        return null;
    }
};

// --- Trending Functions ---
export async function getTrendingMovies(max = 20) {
    try {
        const q = query(
            collection(db, "trending_searches"),
            orderBy("count", "desc"),
            limit(max)
        );

        const snapshot = await getDocs(q);

        const trending = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                movie_id: data.movie_id || null,
                coverURL: data.coverURL || data.posterURL || "",
                posterURL: data.posterURL || data.coverURL || "",
                trailerYoutubeID: data.trailerYoutubeID || null,
                searchTerm: data.searchTerm || "",
                count: data.count || 0,
            };
        });

        return trending;
    } catch (err) {
        console.error("Error in getTrendingMovies:", err);
        return [];
    }
}

export const updateSearchCount = async (searchTerm, firstMovieResult) => {
    if (!searchTerm || !firstMovieResult) return;
    const trendingRef = collection(db, TRENDING_COLLECTION);
    const q = query(trendingRef, where('searchTerm', '==', searchTerm.toLowerCase()));
    const querySnapshot = await getDocs(q);

    const payload = {
        movie_id: firstMovieResult.id,
        posterURL: firstMovieResult.posterURL,
        coverURL: firstMovieResult.coverURL || null,
        trailerYoutubeID: firstMovieResult.trailerYoutubeID || null,
    };

    if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
            ...payload,
            count: increment(1)
        });
    } else {
        await addDoc(trendingRef, {
            ...payload,
            searchTerm: searchTerm.toLowerCase(),
            count: 1,
        });
    }
};

// --- Comment & Reply Functions ---
export const getComments = async (contentId) => {
    try {
        const commentsRef = collection(db, `${COMMENTS_COLLECTION}/${contentId}/list`);
        const q = query(commentsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const commentsWithReplies = await Promise.all(snapshot.docs.map(async (commentDoc) => {
            const replies = await getReplies(contentId, commentDoc.id);
            return { id: commentDoc.id, ...commentDoc.data(), replies };
        }));
        return commentsWithReplies;
    } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
};

export const addComment = async (contentId, commentData) => {
    try {
        const commentsRef = collection(db, `${COMMENTS_COLLECTION}/${contentId}/list`);
        const docRef = await addDoc(commentsRef, {
            ...commentData,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

export const getReplies = async (contentId, commentId) => {
    try {
        const repliesRef = collection(db, `${COMMENTS_COLLECTION}/${contentId}/list/${commentId}/replies`);
        const q = query(repliesRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching replies:", error);
        return [];
    }
};

export const addReply = async (contentId, commentId, replyData) => {
    try {
        const repliesRef = collection(db, `${COMMENTS_COLLECTION}/${contentId}/list/${commentId}/replies`);
        const docRef = await addDoc(repliesRef, {
            ...replyData,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding reply:", error);
        throw error;
    }
};

// --- Rating Functions ---
export const getRatings = async (contentId) => {
    try {
        const ratingsRef = collection(db, `${RATINGS_COLLECTION}/${contentId}/list`);
        const snapshot = await getDocs(ratingsRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching ratings:", error);
        return [];
    }
};

export const addRating = async (contentId, userId, value) => {
    try {
        const ratingDocRef = doc(db, `${RATINGS_COLLECTION}/${contentId}/list`, userId);
        await setDoc(ratingDocRef, {
            userId,
            value
        }, { merge: true });
    } catch (error) {
        console.error("Error adding rating:", error);
        throw error;
    }
};

// --- Watchlist Functions ---
export const getWatchlist = async (userId) => {
    if (!userId) return [];
    try {
        const watchlistDocRef = doc(db, WATCHLISTS_COLLECTION, userId);
        const docSnap = await getDoc(watchlistDocRef);
        if (docSnap.exists()) {
            return docSnap.data().movies || [];
        }
        return [];
    } catch (error) {
        console.error("Error fetching watchlist:", error);
        return [];
    }
};

export const addToWatchlist = async (userId, movieId) => {
    if (!userId || !movieId) return;
    const watchlistDocRef = doc(db, WATCHLISTS_COLLECTION, userId);
    await setDoc(watchlistDocRef, {
        movies: arrayUnion(movieId)
    }, { merge: true });
};

export const removeFromWatchlist = async (userId, movieId) => {
    if (!userId || !movieId) return;
    const watchlistDocRef = doc(db, WATCHLISTS_COLLECTION, userId);
    await updateDoc(watchlistDocRef, {
        movies: arrayRemove(movieId)
    });
};

export const getMoviesByIds = async (ids = []) => {
    if (!ids || ids.length === 0) return [];
    const moviesRef = collection(db, MOVIES_COLLECTION);
    const movies = [];

    // Chunk the IDs into arrays of 30, as Firestore's 'in' query has a limit
    for (let i = 0; i < ids.length; i += 30) {
        const chunk = ids.slice(i, i + 30);
        const q = query(moviesRef, where(documentId(), 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            movies.push({ id: doc.id, ...doc.data() });
        });
    }

    const movieMap = movies.reduce((acc, movie) => {
        acc[movie.id] = movie;
        return acc;
    }, {});

    return ids.map(id => movieMap[id]).filter(Boolean);
};


// --- Like/Unlike Functions ---
export const likeMovie = async (movieId, userId) => {
    if (!userId || !movieId) return;
    const movieDocRef = doc(db, MOVIES_COLLECTION, movieId);
    await updateDoc(movieDocRef, {
        likes: arrayUnion(userId)
    });
};

export const unlikeMovie = async (movieId, userId) => {
    if (!userId || !movieId) return;
    const movieDocRef = doc(db, MOVIES_COLLECTION, movieId);
    await updateDoc(movieDocRef, {
        likes: arrayRemove(userId)
    });
};