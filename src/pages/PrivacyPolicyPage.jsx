// src/pages/PrivacyPolicyPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import {COMPANY_LINK, COMPANY_NAME, SUPPORT_EMAIL} from "../data.js";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
            <main className="mx-auto max-w-5xl px-4 md:px-6 py-10 md:py-16 space-y-10">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center space-y-3">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <Shield className="w-6 h-6 text-indigo-400" />
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            Privacy Policy
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm md:text-base">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>

                {/* Policy Content */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 md:p-10 space-y-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            1. Introduction
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            Welcome to <span className="font-medium text-indigo-300">MovieShare</span>,
                            a platform operated by{" "}
                            <a
                                href={COMPANY_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 underline"
                            >
                                {COMPANY_NAME}
                            </a>.
                            We value your privacy and are committed to protecting your personal data.
                            This Privacy Policy explains how we collect, use, and safeguard your information when you use our app or website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            2. Information We Collect
                        </h2>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>
                                <strong>Account Information:</strong> Your name, email, and profile details when you sign up.
                            </li>
                            <li>
                                <strong>Usage Data:</strong> How you interact with MovieShare — such as movies you view, rate, or share.
                            </li>
                            <li>
                                <strong>Device & Log Data:</strong> IP address, browser type, and device identifiers for analytics and security.
                            </li>
                            <li>
                                <strong>Optional Data:</strong> Any data you choose to share in your profile or comments.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            3. How We Use Your Information
                        </h2>
                        <p className="text-slate-300 mb-3">
                            We use your data responsibly to improve your experience and maintain a safe platform. Specifically, we:
                        </p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Provide, personalize, and improve MovieShare’s content and recommendations.</li>
                            <li>Authenticate logins and secure your account.</li>
                            <li>Analyze app performance and usage trends.</li>
                            <li>Communicate updates, new features, or important notices.</li>
                            <li>Comply with legal obligations and prevent fraud.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            4. Data Sharing & Disclosure
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            We do not sell or rent your personal data.
                            However, we may share information with trusted partners to provide core functionalities — such as authentication, hosting, or analytics — under strict confidentiality agreements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            5. Data Security
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            We employ modern security measures including encryption, access control, and routine audits to protect your data.
                            Despite our efforts, no system is 100% secure; please use strong passwords and keep your login details private.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            6. Your Rights
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            Depending on your location, you may have rights to:
                        </p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Access and review your personal data.</li>
                            <li>Request corrections or deletions.</li>
                            <li>Withdraw consent for specific data uses.</li>
                            <li>Request a copy of your stored information.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            7. Third-Party Services
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            MovieShare may link to external services (e.g., Firebase, YouTube, IMDb).
                            We are not responsible for their privacy practices. Please review their respective privacy policies when using those services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            8. Updates to This Policy
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            We may update this Privacy Policy from time to time to reflect changes in our services or legal requirements.
                            We encourage you to review this page periodically for the latest information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            9. Contact Us
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            If you have any questions about this Privacy Policy or how we handle your data, please contact us at:
                        </p>
                        <p className="text-indigo-300 mt-2 font-medium">
                            {SUPPORT_EMAIL}
                        </p>
                    </section>
                </div>

                {/* Footer Note */}
                <div className="text-center text-xs text-white/40 mt-6">
                    © {new Date().getFullYear()} MovieShare — A{" "}
                    <a
                        href={COMPANY_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-300 hover:text-indigo-200 font-medium"
                    >
                        {COMPANY_NAME}
                    </a>{" "}
                    product. All rights reserved.
                </div>
            </main>
        </div>
    );
}