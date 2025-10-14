// src/main.jsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import {PreviewModalProvider} from "./context/PreviewModalContext.jsx";

// We wrap the entire App in the AuthProvider to make user session
// data available everywhere.
createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <AuthProvider>
            <PreviewModalProvider>
                <App />
            </PreviewModalProvider>
        </AuthProvider>
    </BrowserRouter>
);
