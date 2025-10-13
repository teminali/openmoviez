// src/components/ProfileSettingsTab.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile, changeUserPassword } from "../firebase";
import { Camera, Save, ShieldCheck } from "lucide-react";

export default function ProfileSettingsTab() {
    const { currentUser } = useAuth();
    const [form, setForm] = useState({
        displayName: currentUser?.displayName ?? "",
        email: currentUser?.email ?? "",
    });
    const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(currentUser?.photoURL || null);
    const [message, setMessage] = useState({ type: "", text: ""});
    const [pwdMessage, setPwdMessage] = useState({ type: "", text: ""});
    const [loading, setLoading] = useState(false);
    const avatarInputRef = useRef(null);

    useEffect(() => {
        // Update form if currentUser loads after initial render
        if (currentUser) {
            setForm({ displayName: currentUser.displayName, email: currentUser.email });
            setAvatarPreview(currentUser.photoURL);
        }
    }, [currentUser]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const onSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });
        try {
            // CHANGED: No longer passing 'currentUser'
            await updateUserProfile(form, avatarFile);
            setMessage({ type: "success", text: "Profile updated successfully!" });
            // You might need to refresh the auth state here depending on your context setup
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const onSavePassword = async (e) => {
        e.preventDefault();
        if (pwd.next !== pwd.confirm) {
            setPwdMessage({ type: "error", text: "New passwords do not match." });
            return;
        }
        setLoading(true);
        setPwdMessage({ type: "", text: "" });
        try {
            // CHANGED: No longer passing 'currentUser'
            await changeUserPassword(pwd.next);
            setPwdMessage({ type: "success", text: "Password changed successfully!" });
            setPwd({ current: "", next: "", confirm: "" });
        } catch (error) {
            setPwdMessage({ type: "error", text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <aside className="lg:col-span-1 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-slate-100">
                <div className="flex flex-col items-center text-center">
                    <div className="relative">
                        <img src={avatarPreview || "/avatar_placeholder.png"} alt="Avatar" className="size-24 rounded-2xl object-cover bg-white/10" />
                        <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                        <button onClick={() => avatarInputRef.current.click()} className="absolute -bottom-2 -right-2 rounded-xl bg-white/10 border border-white/20 p-2 hover:bg-white/20">
                            <Camera className="size-4"/>
                        </button>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold">{form.displayName}</h3>
                    <p className="text-xs text-slate-400">{form.email}</p>
                </div>
            </aside>

            <section className="lg:col-span-2 space-y-6">
                <form onSubmit={onSaveProfile} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-base font-semibold">Profile</h2>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400">Display Name</label>
                            <input
                                value={form.displayName}
                                onChange={(e) => setForm(v => ({...v, displayName: e.target.value}))}
                                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                className="mt-1 w-full rounded-xl bg-slate-800 border border-white/10 px-3 py-2 text-sm text-slate-400"
                                readOnly
                            />
                        </div>
                    </div>
                    {message.text && (
                        <div className={`mt-4 text-sm ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {message.text}
                        </div>
                    )}
                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button type="submit" disabled={loading} className="rounded-xl bg-indigo-500/90 hover:bg-indigo-500 transition px-4 py-2 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                            <Save className="size-4"/> {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>

                <form onSubmit={onSavePassword} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-base font-semibold">Change Password</h2>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400">New Password</label>
                            <input
                                type="password"
                                value={pwd.next}
                                onChange={(e) => setPwd(v => ({...v, next: e.target.value}))}
                                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Confirm New Password</label>
                            <input
                                type="password"
                                value={pwd.confirm}
                                onChange={(e) => setPwd(v => ({...v, confirm: e.target.value}))}
                                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
                                required
                            />
                        </div>
                    </div>
                    {pwdMessage.text && (
                        <div className={`mt-4 text-sm ${pwdMessage.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {pwdMessage.text}
                        </div>
                    )}
                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button type="submit" disabled={loading} className="rounded-xl bg-indigo-500/90 hover:bg-indigo-500 transition px-4 py-2 text-sm font-medium disabled:opacity-50">
                            {loading ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}