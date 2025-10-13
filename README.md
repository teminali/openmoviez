# **MovieShare**

MovieShare is a sleek, modern web platform designed for film enthusiasts and creators to share, discover, and watch movies and TV series. It features a rich, creator-focused dashboard for content management and a dynamic, engaging user interface for viewers. The platform is built with a modern React stack, leveraging Firebase for its backend services.

## **Key Features**

### **For Viewers & Enthusiasts**

* **Dynamic Homepage:** A stunning, auto-playing hero banner showcasing trending content, along with curated rails for popular movies and series.  
* **Discover Content:** Browse dedicated pages for all available movies and TV series.  
* **Detailed Views:** Click on any title to see its full details, including synopsis, cast, director, and more.  
* **Personal Watchlist:** Registered users can save titles to their personal watchlist for later viewing.  
* **Responsive Design:** A seamless experience across devices, from mobile phones to desktops.

### **For Creators & Sharers**

* **Creator Dashboard:** A comprehensive dashboard to manage shared content, view key statistics (total movies, published count, average rating), and access quick actions.  
* **Advanced Content Sharing:** A powerful form to share new movies or TV series with detailed metadata:  
  * Distinction between Movies and TV Series (with an episode manager).  
  * Support for both YouTube (unlisted) and direct `.mp4` video links.  
  * Inputs for title, synopsis, release year, specific release date, and genres.  
  * Add detailed cast and director information, including profile photos.  
* **Image Management:** Easy-to-use drag-and-drop uploaders for both vertical posters (2:3) and horizontal cover images (16:9).  
* **Edit Functionality:** Creators can easily edit the metadata and assets of their existing submissions.

### **Technical Highlights**

* **Performant:** Lazy loading for heavy pages (`Dashboard`, `Admin`, `MovieDetails`) ensures a fast initial load time.  
* **Modern UI/UX:** Built with Tailwind CSS, featuring a dark, glassmorphism-inspired theme, smooth animations (Framer Motion), and a clean, icon-driven interface (Lucide React).  
* **Secure Authentication:** User registration and login handled securely via Firebase Authentication.  
* **Protected Routes:** Client-side routing protects creator- and admin-specific pages from unauthorized access.

## **Tech Stack**

* **Frontend:** [React](https://react.dev/)  
* **Build Tool:** [Vite](https://vitejs.dev/)  
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)  
* **Routing:** [React Router DOM](https://reactrouter.com/)  
* **Animations:** [Framer Motion](https://www.framer.com/motion/)  
* **Icons:** [Lucide React](https://lucide.dev/)  
* **Backend & Database:** [Firebase](https://firebase.google.com/?authuser=1) (Authentication, Firestore, Storage)

## **Project Structure**

The project follows a standard React application structure, organizing files by their function.

/src  
├── /components      \# Reusable UI components (Navbar, MovieCard, etc.)  
├── /context         \# React Context for global state (AuthContext)  
├── /pages           \# Top-level route components (HomePage, DashboardPage, etc.)  
├── App.jsx          \# Main application component with routing logic  
├── data.js          \# Centralized static data (e.g., genre list)  
├── firebase.js      \# Firebase initialization and service functions  
├── index.css        \# Global styles and Tailwind CSS configuration  
└── main.jsx         \# Application entry point

## **Getting Started**

Follow these instructions to set up and run the project locally.

### **Prerequisites**

* [Node.js](https://nodejs.org/) (v18 or newer recommended)  
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)  
* A Firebase project

### **1\. Clone the Repository**

Bash  
git clone https://github.com/your-username/movieshare.git  
cd movieshare

### **2\. Install Dependencies**

Bash  
npm install  
\# or  
yarn install

### **3\. Set Up Firebase**

1. Go to the [Firebase Console](https://console.firebase.google.com/?authuser=1) and create a new project.  
2. Enable the following services:  
   * **Authentication:** Enable the "Email/Password" sign-in provider.  
   * **Firestore Database:** Create a new database in production mode. You will need to adjust security rules for development.  
   * **Storage:** Create a new storage bucket.  
3. In your Firebase project settings, go to "Project settings" \> "General" and find your web app's configuration object.

### **4\. Configure Environment Variables**

Create a `.env.local` file in the root of the project by copying the example file:

Bash  
cp .env.example .env.local

Now, open `.env.local` and add your Firebase project configuration keys:

\# .env.local

\# Your Firebase web app's configuration object  
VITE\_FIREBASE\_API\_KEY="your-api-key"  
VITE\_FIREBASE\_AUTH\_DOMAIN="your-project-id.firebaseapp.com"  
VITE\_FIREBASE\_PROJECT\_ID="your-project-id"  
VITE\_FIREBASE\_STORAGE\_BUCKET="your-project-id.appspot.com"  
VITE\_FIREBASE\_MESSAGING\_SENDER\_ID="your-sender-id"  
VITE\_FIREBASE\_APP\_ID="your-app-id"

### **5\. Run the Development Server**

You can now start the local development server.

Bash  
npm run dev  
\# or  
yarn dev

The application should be running at `http://localhost:5173`.

## **Available Scripts**

* `npm run dev`: Starts the Vite development server.  
* `npm run build`: Compiles the React application for production.  
* `npm run preview`: Serves the production build locally to preview it.

## **Author**

This project was created by **Yohana Misgwa**.

* **Find me:** https://x.com/teminalithegoat  
* **Support:** teminali69@gmail.com

