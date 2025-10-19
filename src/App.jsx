// src/App.jsx
import React, { Suspense, lazy, useMemo } from "react";
import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { PreviewModalProvider } from './context/PreviewModalContext.jsx';
import Spinner from "./components/Spinner.jsx";

// Eager-light pages (keep fast)
import Home from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import MoviesPage from "./pages/MoviesPage.jsx";
import SeriesPage from "./pages/SeriesPage.jsx";
import ShareMoviePage from "./pages/ShareMoviePage.jsx";
import WatchlistPage from "./pages/WatchlistPage.jsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.jsx";
import TermsOfUsePage from "./pages/TermsOfUsePage.jsx";
import ActorProfilePage from "./pages/ActorProfilePage.jsx";

// Lazy-heavy pages
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));
const FullScreenPlayerPage = lazy(() => import('./pages/FullScreenPlayerPage.jsx'));

// Smooth scroll to top on route change
function ScrollToTop() {
    const { pathname, search } = useLocation();
    React.useEffect(() => {
        window.scrollTo({ top: 0, behavior: ("instant" in window) ? "instant" : "smooth" });
    }, [pathname, search]);
    return null;
}

// Root layout applies global background + shared chrome (Navbar, Footer)
function RootLayout({ currentUser, onLogout }) {
    const navbarProps = useMemo(() => ({ currentUser, onLogout }), [currentUser, onLogout]);
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
            <Navbar {...navbarProps} />
            <ScrollToTop />

            {/* This spacer pushes content down on non-home pages to prevent it from hiding under the fixed navbar */}
            {!isHomePage && <div className="h-16" />}

            <Outlet />
            <Footer />
        </div>
    );
}

// Tiny 404 view matching your style
function NotFound() {
    return (
        <main className="mx-auto max-w-7xl px-4 py-20 text-center">
            <h1 className="text-3xl font-bold">Page not found</h1>
            <p className="text-slate-400 mt-2">The page you’re looking for doesn’t exist.</p>
            <a
                href="/"
                className="inline-block mt-6 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 px-4 py-2 text-sm font-medium"
            >
                Go Home
            </a>
        </main>
    );
}

const App = () => {
    const { currentUser, logOut } = useAuth();

    return (
        <PreviewModalProvider>
            <Suspense
                fallback={
                    <div className="min-h-screen grid place-items-center bg-slate-950">
                        <Spinner />
                    </div>
                }
            >
                <Routes>
                    {/* Routes with Navbar and Footer */}
                    <Route element={<RootLayout currentUser={currentUser} onLogout={logOut} />}>
                        {/* Public */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/movies" element={<MoviesPage />} />
                        <Route path="/series" element={<SeriesPage />} />
                        <Route path="/privacy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms" element={<TermsOfUsePage />} />

                        {/* Protected */}
                        <Route
                            path="/share"
                            element={
                                <ProtectedRoute>
                                    <ShareMoviePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/share/:id"
                            element={
                                <ProtectedRoute>
                                    <ShareMoviePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/watchlist"
                            element={
                                <ProtectedRoute>
                                    <WatchlistPage />
                                </ProtectedRoute>
                            }
                        />
                        {/* Admin */}
                        <Route
                            path="/watchlist"
                            element={
                                <ProtectedRoute>
                                    <WatchlistPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin */}
                        <Route
                            path="/person/:personId"
                            element={
                                <AdminRoute>
                                    <ActorProfilePage />
                                </AdminRoute>
                            }
                        />

                        {/* 404 - Renders inside the layout */}
                        <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* Standalone Fullscreen Player Route (No Navbar/Footer) */}
                    <Route path="/watch/:id" element={<FullScreenPlayerPage />} />
                </Routes>
            </Suspense>
        </PreviewModalProvider>
    );
};

export default App;