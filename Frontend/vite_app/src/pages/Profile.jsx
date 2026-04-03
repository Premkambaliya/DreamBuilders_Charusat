import { useState } from "react";
import {
	AlertTriangle,
	Building2,
	Check,
	KeyRound,
	Loader2,
	Mail,
	Save,
	Trash2,
	User,
	X,
} from "lucide-react";
import { updateUserProfile, deleteUserAccount, persistAuth, getStoredAuth } from "../lib/auth";

const inputCls =
	"w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500/60 focus:bg-white/8 focus:ring-2 focus:ring-indigo-500/15";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400";

const SectionCard = ({ children, className = "" }) => (
	<div
		className={`rounded-2xl border border-white/10 bg-[#121527]/90 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.25)] backdrop-blur-md ${className}`}
	>
		{children}
	</div>
);

const Alert = ({ type, children }) => {
	const colors =
		type === "success"
			? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
			: "border-rose-500/30 bg-rose-500/10 text-rose-300";
	const Icon = type === "success" ? Check : AlertTriangle;
	return (
		<div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${colors}`}>
			<Icon size={16} className="mt-0.5 shrink-0" />
			<span>{children}</span>
		</div>
	);
};

export default function Profile({ user, token, onUserUpdate, onLogout }) {
	/* ---- Profile form ---- */
	const [name, setName] = useState(user?.name || "");
	const [email, setEmail] = useState(user?.email || "");
	const [companyName, setCompanyName] = useState(user?.company_name || "");
	const [profileSaving, setProfileSaving] = useState(false);
	const [profileMsg, setProfileMsg] = useState(null);

	/* ---- Password form ---- */
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [pwdSaving, setPwdSaving] = useState(false);
	const [pwdMsg, setPwdMsg] = useState(null);

	/* ---- Delete account ---- */
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteConfirmText, setDeleteConfirmText] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [deleteMsg, setDeleteMsg] = useState(null);

	const handleProfileSave = async (e) => {
		e.preventDefault();
		setProfileSaving(true);
		setProfileMsg(null);
		try {
			const res = await updateUserProfile(token, { name, email, company_name: companyName });
			const updatedUser = res.data;
			// Update stored auth with new user data
			const stored = getStoredAuth();
			if (stored) {
				persistAuth({ ...stored, user: { ...stored.user, ...updatedUser } }, stored.remember);
			}
			onUserUpdate?.({ ...user, ...updatedUser });
			setProfileMsg({ type: "success", text: "Profile updated successfully." });
		} catch (err) {
			setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
		} finally {
			setProfileSaving(false);
		}
	};

	const handlePasswordSave = async (e) => {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			setPwdMsg({ type: "error", text: "New passwords do not match." });
			return;
		}
		if (newPassword.length < 8) {
			setPwdMsg({ type: "error", text: "Password must be at least 8 characters." });
			return;
		}
		setPwdSaving(true);
		setPwdMsg(null);
		try {
			await updateUserProfile(token, { currentPassword, newPassword });
			setPwdMsg({ type: "success", text: "Password changed successfully." });
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (err) {
			setPwdMsg({ type: "error", text: err.message || "Failed to change password." });
		} finally {
			setPwdSaving(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (deleteConfirmText !== "DELETE") {
			setDeleteMsg({ type: "error", text: 'Please type "DELETE" to confirm.' });
			return;
		}
		setDeleting(true);
		setDeleteMsg(null);
		try {
			await deleteUserAccount(token);
			onLogout?.();
		} catch (err) {
			setDeleteMsg({ type: "error", text: err.message || "Failed to delete account." });
			setDeleting(false);
		}
	};

	const getInitials = (n) => {
		if (!n) return "U";
		return n
			.split(" ")
			.map((w) => w[0])
			.slice(0, 2)
			.join("")
			.toUpperCase();
	};

	return (
		<div className="py-8 text-slate-200 animate-in fade-in duration-300">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
					Account & Profile
				</h1>
				<p className="mt-2 text-sm text-slate-400 md:text-base">
					Manage your personal information, security settings, and account preferences.
				</p>
			</div>

			{/* Avatar + Summary */}
			<SectionCard className="mb-6">
				<div className="flex flex-col items-center gap-6 sm:flex-row">
					<div className="relative">
						<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] text-2xl font-extrabold text-white shadow-[0_12px_32px_rgba(108,99,255,0.4)]">
							{getInitials(user?.name)}
						</div>
						<div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#121527] bg-emerald-400" />
					</div>
					<div>
						<h2 className="text-xl font-bold text-white">{user?.name || "Unknown"}</h2>
						<p className="text-sm text-slate-400">{user?.email}</p>
						{user?.company_name && (
							<span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
								<Building2 size={11} />
								{user.company_name}
							</span>
						)}
					</div>
				</div>
			</SectionCard>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Personal Info */}
				<SectionCard>
					<div className="mb-5 flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
							<User size={18} />
						</div>
						<h3 className="text-base font-bold text-white">Personal Information</h3>
					</div>

					<form onSubmit={handleProfileSave} className="flex flex-col gap-4">
						<div>
							<label className={labelCls}>Full Name</label>
							<div className="relative">
								<User
									size={15}
									className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
								/>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Your full name"
									className={`${inputCls} pl-9`}
									required
								/>
							</div>
						</div>
						<div>
							<label className={labelCls}>Email Address</label>
							<div className="relative">
								<Mail
									size={15}
									className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
								/>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="your@email.com"
									className={`${inputCls} pl-9`}
									required
								/>
							</div>
						</div>
						<div>
							<label className={labelCls}>Company Name</label>
							<div className="relative">
								<Building2
									size={15}
									className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
								/>
								<input
									type="text"
									value={companyName}
									onChange={(e) => setCompanyName(e.target.value)}
									placeholder="Your company"
									className={`${inputCls} pl-9`}
								/>
							</div>
						</div>

						{profileMsg && <Alert type={profileMsg.type}>{profileMsg.text}</Alert>}

						<button
							type="submit"
							disabled={profileSaving}
							className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(108,99,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(108,99,255,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{profileSaving ? (
								<Loader2 size={16} className="animate-spin" />
							) : (
								<Save size={16} />
							)}
							Save Changes
						</button>
					</form>
				</SectionCard>

				{/* Change Password */}
				<SectionCard>
					<div className="mb-5 flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
							<KeyRound size={18} />
						</div>
						<h3 className="text-base font-bold text-white">Change Password</h3>
					</div>

					<form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
						<div>
							<label className={labelCls}>Current Password</label>
							<input
								type="password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								placeholder="Your current password"
								className={inputCls}
								required
							/>
						</div>
						<div>
							<label className={labelCls}>New Password</label>
							<input
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="Min. 8 characters"
								minLength={8}
								className={inputCls}
								required
							/>
						</div>
						<div>
							<label className={labelCls}>Confirm New Password</label>
							<input
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Repeat new password"
								className={inputCls}
								required
							/>
						</div>

						{pwdMsg && <Alert type={pwdMsg.type}>{pwdMsg.text}</Alert>}

						<button
							type="submit"
							disabled={pwdSaving}
							className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,212,170,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{pwdSaving ? (
								<Loader2 size={16} className="animate-spin" />
							) : (
								<KeyRound size={16} />
							)}
							Update Password
						</button>
					</form>
				</SectionCard>
			</div>

			{/* Danger Zone */}
			<SectionCard className="mt-6 border-rose-500/20 bg-rose-500/5">
				<div className="mb-4 flex items-center gap-2.5">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
						<Trash2 size={18} />
					</div>
					<div>
						<h3 className="text-base font-bold text-white">Danger Zone</h3>
						<p className="text-xs text-slate-400">Irreversible actions — proceed with caution</p>
					</div>
				</div>

				<div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="font-semibold text-rose-300">Delete My Account</p>
							<p className="mt-0.5 text-xs text-slate-400">
								Permanently deletes your account and all associated call data. This cannot be undone.
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								setDeleteOpen(true);
								setDeleteConfirmText("");
								setDeleteMsg(null);
							}}
							className="shrink-0 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400 transition hover:border-rose-500/50 hover:bg-rose-500/18 hover:text-rose-300"
						>
							Delete Account
						</button>
					</div>
				</div>
			</SectionCard>

			{/* Delete confirmation modal */}
			{deleteOpen && (
				<div className="fixed inset-0 z-500 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
					<div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-150 rounded-2xl border border-white/10 bg-[#161829] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
						<div className="mb-4 flex items-start justify-between gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
								<AlertTriangle size={20} />
							</div>
							<button
								type="button"
								onClick={() => setDeleteOpen(false)}
								className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
							>
								<X size={16} />
							</button>
						</div>

						<h3 className="mb-1 text-lg font-bold text-white">Delete Account Permanently</h3>
						<p className="mb-4 text-sm text-slate-400">
							This will immediately delete your account, profile data, and{" "}
							<span className="font-semibold text-slate-300">all analyzed call recordings</span> from
							our database. You will be signed out.
						</p>

						<div className="mb-4">
							<label className={labelCls}>
								Type <span className="font-bold text-rose-400">DELETE</span> to confirm
							</label>
							<input
								type="text"
								value={deleteConfirmText}
								onChange={(e) => setDeleteConfirmText(e.target.value)}
								placeholder="DELETE"
								className={inputCls}
								autoFocus
							/>
						</div>

						{deleteMsg && <Alert type={deleteMsg.type}>{deleteMsg.text}</Alert>}

						<div className="mt-4 flex gap-3">
							<button
								type="button"
								onClick={() => setDeleteOpen(false)}
								className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/8"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDeleteAccount}
								disabled={deleting || deleteConfirmText !== "DELETE"}
								className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{deleting ? (
									<Loader2 size={15} className="animate-spin" />
								) : (
									<Trash2 size={15} />
								)}
								Yes, Delete Everything
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
