import React from "react";
import { NavLink } from "react-router-dom";
import {
	LayoutDashboard,
	Phone,
	Upload,
	BarChart3,
	TrendingUp,
	AlertTriangle,
	ChevronLeft,
	ChevronRight,
	User,
	Users,
	Zap,
	X,
	Package,
	Radio,
} from "lucide-react";


const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose, user }) => {
	const sidebarWidthClass = collapsed ? "md:w-[68px]" : "md:w-[240px]";
	const mobileStateClass = mobileOpen ? "translate-x-0" : "-translate-x-full";

	const navItems = [
		{ icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
		{ icon: Upload, label: "Analyze Call", path: "/dashboard/analyze" },
		{ icon: Radio, label: "Live Copilot", path: "/dashboard/copilot" },
		{ icon: Phone, label: "All Calls", path: "/dashboard/calls" },
		{ icon: BarChart3, label: "Insights", path: "/dashboard/insights" },
		{ icon: TrendingUp, label: "Top Deals", path: "/dashboard/top-deals" },
		{ icon: AlertTriangle, label: "High Risk", path: "/dashboard/high-risk" },
		...(user?.role === "admin" ? [
			{ icon: Users, label: "Employees", path: "/dashboard/employees" },
			{ icon: Package, label: "Products", path: "/dashboard/products" }
		] : []),
		{ icon: User, label: "Profile", path: "/dashboard/profile" },
	];

	return (
		<aside
			className={`fixed inset-y-0 left-0 z-[300] flex w-[240px] flex-col border-r border-white/10 bg-[#10111e] transition-all duration-300 ${mobileStateClass} md:z-[100] md:translate-x-0 ${sidebarWidthClass}`}
		>
			<div className="flex min-h-[72px] items-center gap-3 border-b border-white/10 px-4 py-5">
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6C63FF,#00D4AA)] text-white shadow-[0_8px_22px_rgba(108,99,255,0.35)]">
					<Zap size={20} />
				</div>

				{!collapsed && (
					<div className="min-w-0 md:block">
						<span className="block whitespace-nowrap text-[1.1rem] font-bold text-white">SalesIQ</span>
						<span className="block whitespace-nowrap text-[0.7rem] text-slate-400">Revenue Intelligence</span>
					</div>
				)}

				<button
					className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/8 hover:text-white md:hidden"
					onClick={onMobileClose}
					aria-label="Close menu"
					type="button"
				>
					<X size={18} />
				</button>
			</div>

			<button
				className="absolute right-[-14px] top-[22px] hidden h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-[#161829] text-slate-300 transition hover:border-indigo-500 hover:bg-indigo-500 hover:text-white md:inline-flex"
				onClick={onToggle}
				type="button"
			>
				{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
			</button>

			<nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
				{navItems.map(({ icon: Icon, label, path }) => (
					<NavLink
						key={path}
						to={path}
						end={path === "/dashboard"}
						onClick={onMobileClose}
						className={({ isActive }) =>
							`group relative flex items-center gap-3 rounded-xl px-3 py-[0.7rem] text-[0.875rem] font-medium transition ${
								isActive
									? "border border-indigo-500/30 bg-indigo-500/15 text-indigo-300"
									: "text-slate-400 hover:bg-indigo-500/10 hover:text-slate-100"
							}`
						}
					>
						{({ isActive }) => (
							<>
								{isActive ? (
									<span className="absolute left-0 top-1/2 h-[70%] w-[3px] -translate-y-1/2 rounded-r bg-indigo-400" />
								) : null}

								{React.createElement(Icon, { size: 20, className: "shrink-0" })}

								{!collapsed && <span className="truncate">{label}</span>}

								{collapsed ? (
									<span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[200] -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#1b1d2c] px-3 py-1.5 text-[0.8rem] text-slate-100 opacity-0 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition group-hover:opacity-100 md:block">
										{label}
									</span>
								) : null}
							</>
						)}
					</NavLink>
				))}
			</nav>

			{!collapsed && (
				<div className="border-t border-white/10 p-4">
					<div className="flex items-center gap-2 text-[0.8rem] font-semibold text-slate-300">
						<span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
						<span>System Status: Connected</span>
					</div>
					<p className="mt-1 text-[0.72rem] text-slate-500">Use global search to find calls and accounts faster.</p>
				</div>
			)}
		</aside>
	);
};

export default Sidebar;