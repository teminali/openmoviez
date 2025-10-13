// src/components/MovieCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

// This component displays a single movie in the grid on the homepage.
const MovieCard = ({ movie }) => {
    return (
        <motion.div
            className="movie-card bg-dark-100 rounded-2xl overflow-hidden shadow-lg"
            whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.4)" }}
            transition={{ duration: 0.2 }}
        >
            <img src={movie.posterURL} alt={movie.title} className="w-full h-auto aspect-[2/3] object-cover" />
            <div className="p-4">
                <h3 className="text-white font-bold text-lg line-clamp-1">{movie.title}</h3>
                <div className="content mt-2 flex justify-between items-center">
                    <div className="rating flex items-center gap-1">
                        <img src="/star.svg" alt="star" className="w-4 h-4" />
                        <p className="text-white font-bold">{movie.rating}</p>
                    </div>
                    <span className="text-gray-400 font-medium">{movie.year}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default MovieCard;
