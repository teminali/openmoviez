/**
 * @file src/data.js
 * @description Centralized data store for the application.
 *
 * This file contains shared, static data used across multiple components,
 * such as lists for dropdowns or consistent configuration options.
 * Centralizing this data ensures consistency and simplifies updates.
 */

/**
 * A standardized list of genre options for movies and TV series.
 * Using this constant ensures that filtering controls, genre tags, and the
 * 'Share a Movie' form all use the exact same vocabulary.
 */

export const APP_NAME = "MovieShare";
export const COMPANY_NAME = "Bashmania";
export const COMPANY_LINK = "https://www.Bashmania.co.tz";
export const SUPPORT_EMAIL = "support@bashmania.co.tz";
export const GITHUB_REPO_URL = "https://github.com/teminali/openmoviez";
export const GENRE_LIST = [
    "Action",
    "Adventure",
    "Animation",
    "Comedy",
    "Crime",
    "Documentary",
    "Drama",
    "Family",
    "Fantasy",
    "History",
    "Horror",
    "Music",
    "Mystery",
    "Romance",
    "Science Fiction",
    "TV Movie",
    "Thriller",
    "War",
    "Western"
];