import React from 'react';
import { ModeToggle } from './mode-toggle';

export default function Navbar() {
	return (
		<header className="w-full h-20 flex items-center justify-between px-8 border-b border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#0D0D0D] transition-colors duration-300 select-none" style={{ boxShadow: 'none' }}>
			{/* Left: Search */}
			<div className="flex-1 flex items-center">
				<div className="relative w-[320px]">
					<input
						type="text"
						placeholder="Quick command..."
						className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#F9FAFB] dark:bg-[#151515] border border-[#E5E7EB] dark:border-white/10 text-[#111827] dark:text-[#E5E7EB] placeholder-[#9CA3AF] dark:placeholder-[#6B7280] focus:outline-none focus:ring-0 focus:border-[#3BA2FF] dark:focus:border-[#3BA2FF] text-sm font-medium transition-colors"
						style={{ boxShadow: 'none' }}
					/>
					<svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#6B7280]" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
				</div>
			</div>
			{/* Right: Icons and Avatar */}
			<div className="flex items-center gap-4">
				{/* Notification Icon */}
				<button className="relative p-2 rounded-full hover:bg-[#F9FAFB] dark:hover:bg-[#151515] border border-transparent hover:border-[#E5E7EB] dark:hover:border-white/10 transition-colors" style={{ boxShadow: 'none' }}>
					<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M18 16v-5a6 6 0 1 0-12 0v5l-1.5 2v1h15v-1l-1.5-2Z"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
				</button>
				{/* Theme Toggle */}
				<ModeToggle />
				{/* User Avatar */}
				<div className="flex items-center gap-2">
					<div className="w-9 h-9 rounded-full bg-[#F9FAFB] dark:bg-[#151515] border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center font-bold text-[#111827] dark:text-[#E5E7EB] text-base">T</div>
					<div className="flex flex-col leading-tight">
						<span className="text-xs font-semibold text-[#111827] dark:text-[#E5E7EB]">tester</span>
						<span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">CANDIDATE</span>
					</div>
				</div>
			</div>
		</header>
	);
}
