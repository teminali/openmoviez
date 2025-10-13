// src/components/CastMember.jsx
import React from 'react';
import { motion } from 'framer-motion';

const CastMember = ({ member }) => {
    const placeholderImage = "/avatar_placeholder.png";

    return (
        <motion.div
            className="cast-member-card"
            whileHover={{ scale: 1.05, backgroundColor: '#1a1830' }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
            <img
                src={member.url_small_image || placeholderImage}
                alt={member.name}
                // Tailwind classes for fixed size: w-24 h-24
                className="w-24 h-24 rounded-full object-cover mx-auto cast-image-size" // Added 'cast-image-size' for explicit sizing
                onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
            />
            <div className="text-center mt-3">
                <p className="font-bold text-white line-clamp-1">{member.name}</p> {/* Added line-clamp-1 */}
                <p className="text-sm text-light-200 line-clamp-2">{member.character_name}</p> {/* Added line-clamp-2 */}
            </div>
        </motion.div>
    );
};

export default CastMember;