import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, Search, Settings, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const getInitials = (name) => {
	if (!name) return "U";
	return name
		.split(" ")
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
};

const Topbar = ({ sidebarCollapsed, onMobileMenu, user, onLogout }) => {
	const leftClass = sidebarCollapsed ? "md:left-[68px]" : "md:left-[240px]";
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const dropdownRef = useRef(null);
	const navigate = useNavigate();

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
				setDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSearchSubmit = (e) => {
		e.preventDefault();
		const q = searchQuery.trim();
		if (q) {
			navigate(`/dashboard/calls?q=${encodeURIComponent(q)}`);
			setSearchQuery("");
		}
	};

	const initials = getInitials(user?.name);
	const displayName = user?.name || "User";
	const displayEmail = user?.email || "";

	return (
		<header
			className={`fixed right-0 top-0 z-99 flex h-16 items-center justify-between border-b border-white/10 bg-[#10111ed9] px-4 backdrop-blur-xl transition-[left] duration-300 md:px-6 ${leftClass} left-0`}
		>
			<button
				className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#161829] text-slate-300 transition hover:border-indigo-500/40 hover:bg-indigo-500/12 hover:text-indigo-300 md:hidden"
				onClick={onMobileMenu}
				aria-label="Toggle menu"
				type="button"
			>
				<Menu size={20} />
			</button>

			{/* Search */}
			<form onSubmit={handleSearchSubmit} className="hidden max-w-96 flex-1 md:block lg:max-w-110">
				<div className="relative flex items-center">
					<Search size={15} className="pointer-events-none absolute left-3 text-slate-500" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search accounts, opportunities, calls..."
						className="w-full rounded-full border border-white/10 bg-[#161829] py-2 pl-9 pr-4 text-[0.85rem] text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:bg-[#1d2031] focus:ring-2 focus:ring-indigo-500/20"
					/>
				</div>
			</form>

			<div className="ml-auto flex items-center gap-3">
				<div className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[0.78rem] font-semibold text-emerald-300 md:flex">
					<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
					<span>Live Workspace</span>
				</div>

				{/* Profile dropdown */}
				<div className="relative" ref={dropdownRef}>
					<button
						type="button"
						onClick={() => setDropdownOpen((v) => !v)}
						className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#161829] px-2 py-1.5 transition hover:border-indigo-400/30 hover:bg-[#1d2031]"
					>
						<div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] text-[0.7rem] font-bold text-white shadow-[0_4px_14px_rgba(108,99,255,0.35)]">
							{initials}
						</div>
						<span className="hidden max-w-28 truncate text-[0.83rem] font-medium text-slate-200 md:block">
							{displayName}
						</span>
						<ChevronDown
							size={14}
							className={`hidden text-slate-400 transition-transform duration-200 md:block ${dropdownOpen ? "rotate-180" : ""}`}
						/>
					</button>

					{dropdownOpen && (
						<div className="absolute right-0 top-full z-200 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#161829] shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-150">
							{/* User info */}
							<div className="border-b border-white/8 px-4 py-3">
								<p className="truncate text-sm font-semibold text-white">{displayName}</p>
								<p className="truncate text-xs text-slate-400">{displayEmail}</p>
								{user?.company_name && (
									<p className="mt-0.5 truncate text-xs text-indigo-400">{user.company_name}</p>
								)}
							</div>

							{/* Links */}
							<div className="py-1.5">
								<Link
									to="/dashboard/profile"
									onClick={() => setDropdownOpen(false)}
									className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
								>
									<User size={15} />
									My Profile
								</Link>
								<Link
									to="/dashboard/profile"
									onClick={() => setDropdownOpen(false)}
									className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
								>
									<Settings size={15} />
									Account Settings
								</Link>
							</div>

							<div className="border-t border-white/8 py-1.5">
								<button
									type="button"
									onClick={() => {
										setDropdownOpen(false);
										onLogout?.();
									}}
									className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-rose-400 transition hover:bg-rose-500/8 hover:text-rose-300"
								>
									<LogOut size={15} />
									Sign out
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</header>
	);
};

export default Topbar;