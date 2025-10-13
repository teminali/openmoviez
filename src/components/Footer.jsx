// src/components/Footer.jsx
import React from "react";
import {
    Facebook,
    Instagram,
    PlayCircle,
    Smartphone,
    X,
    Youtube,
} from "lucide-react";
import {APP_NAME, COMPANY_LINK, COMPANY_NAME, GITHUB_REPO_URL} from "../data.js";

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-20 border-t border-white/10 bg-black text-white/80 text-sm">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-8">

                {/* --- Top Section: Social + App Download --- */}
                <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-12 items-center">
                    {/* Social */}
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-white font-medium text-base">
                            Follow {APP_NAME} on social
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-indigo-400">
                                <Instagram className="w-5 h-5"/>
                            </a>
                            <a href="https://x.com/home" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" className="hover:text-indigo-400">
                                <X className="w-5 h-5"/>
                            </a>
                            <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-indigo-400">
                                <Youtube className="w-5 h-5"/>
                            </a>
                            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-indigo-400">
                                <Facebook className="w-5 h-5"/>
                            </a>
                        </div>
                    </div>
                </div>

                {/* --- Mid Section: Links --- */}
                <div
                    className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[13px] text-white/70 pt-8 border-t border-white/10">
                    <a href="#" className="hover:text-indigo-300">
                        Home
                    </a>
                    <a href="/series" className="hover:text-indigo-300">
                        TV Series
                    </a>
                    <a href="/movies" className="hover:text-indigo-300">
                        Movies
                    </a>
                    <a href="/movies?sort=rating" className="hover:text-indigo-300">
                        Top Rated
                    </a>
                    <a href="/terms" className="hover:text-indigo-300">
                        Terms of Use
                    </a>
                    <a href="/privacy" className="hover:text-indigo-300">
                        Privacy Policy
                    </a>
                    {/*<a href={GITHUB_REPO_URL} className="hover:text-indigo-300">*/}
                    {/*    Github*/}
                    {/*</a>*/}
                </div>

                {/* --- Bottom Section: Brand + Copyright --- */}
                <div className="flex flex-col items-center gap-3 border-t border-white/10 pt-8 text-center">
                    <p className="text-xs text-white/60">
                        {APP_NAME} is a product by{" "}
                        <a
                            href={COMPANY_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-300 hover:text-indigo-200 font-medium transition-colors"
                        >
                            {COMPANY_NAME}
                        </a>
                    </p>
                    <p className="text-xs text-white/40">
                        © {year} {APP_NAME}. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;