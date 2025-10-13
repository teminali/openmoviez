// src/pages/TermsOfUsePage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import {COMPANY_LINK, COMPANY_NAME, SUPPORT_EMAIL} from "../data.js";

export default function TermsOfUsePage() {
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
                        <FileText className="w-6 h-6 text-indigo-400" />
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            Terms of Use
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm md:text-base">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>

                {/* Terms Content */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 md:p-10 space-y-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            1. Acceptance of Terms
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            By accessing or using{" "}
                            <span className="font-medium text-indigo-300">MovieShare</span>,
                            a product of{" "}
                            <a
                                href={COMPANY_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 underline"
                            >
                                {COMPANY_NAME}
                            </a>,
                            you agree to be bound by these Terms of Use and our Privacy Policy.
                            If you do not agree, please refrain from using the app or website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            2. Eligibility
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            You must be at least 13 years old to create an account or use MovieShare.
                            By registering, you confirm that you meet this age requirement and that all information you provide is accurate and complete.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            3. User Accounts
                        </h2>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>
                                You are responsible for maintaining the confidentiality of your account credentials.
                            </li>
                            <li>
                                You agree not to share your password or allow others to access your account.
                            </li>
                            <li>
                                {COMPANY_NAME} reserves the right to suspend or terminate accounts for any activity that violates these Terms or applicable laws.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            4. Acceptable Use
                        </h2>
                        <p className="text-slate-300 mb-3">
                            You agree to use MovieShare responsibly and to avoid:
                        </p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Uploading or sharing illegal, harmful, or infringing content.</li>
                            <li>Using MovieShare for harassment, spamming, or impersonation.</li>
                            <li>Attempting to disrupt or compromise our systems or services.</li>
                            <li>Violating intellectual property rights of MovieShare or others.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            5. Intellectual Property
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            All trademarks, logos, and content available on MovieShare are the property of{" "}
                            <span className="font-medium text-indigo-300">{COMPANY_NAME}</span> or its licensors.
                            You may not reproduce, distribute, or modify any material without written consent.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            6. User-Generated Content
                        </h2>
                        <p className="text-slate-300 mb-3">
                            You retain ownership of the content you post on MovieShare but grant us a limited license to use, display, and distribute that content within the app.
                        </p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Do not post anything you don’t have rights to share.</li>
                            <li>Do not upload copyrighted materials without permission.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            7. Termination
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            {COMPANY_NAME} may suspend or terminate your access to MovieShare at any time if you violate these Terms, misuse the platform, or engage in prohibited activities.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            8. Limitation of Liability
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            MovieShare and {COMPANY_NAME} shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform,
                            including but not limited to data loss or unauthorized access.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            9. Modifications
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            We reserve the right to modify or update these Terms at any time.
                            Continued use of MovieShare after such updates constitutes your acceptance of the revised Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            10. Contact Information
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            For questions or concerns regarding these Terms of Use, please contact:
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