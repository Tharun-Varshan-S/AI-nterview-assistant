
import React from 'react';
import { cn } from '../lib/utils';

const navItems = [
	{ label: 'Overview', icon: (
		<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2.5"/><rect x="14" y="3" width="7" height="7" rx="2.5"/><rect x="14" y="14" width="7" height="7" rx="2.5"/><rect x="3" y="14" width="7" height="7" rx="2.5"/></svg>
	), active: true },
	{ label: 'Practice Interface', icon: (
		<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M4 17v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7"/><rect x="8" y="21" width="8" height="2" rx="1"/><path d="M12 17v4"/></svg>
	) },
	{ label: 'Sync Simulation', icon: (
		<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M22 4 12 14.01l-3-3"/></svg>
	) },
	{ label: 'Telemetry', icon: (
		<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 15v-6"/><path d="M11 17v-2"/><path d="M15 13v-6"/><path d="M19 17v-8"/></svg>
	) },
];

export default function Sidebar() {
	return (
		<aside
			className={cn(
				'flex flex-col justify-between h-full min-h-screen w-[250px] bg-white dark:bg-[#0D0D0D] border-r border-[#E5E7EB] dark:border-white/10 px-0 py-0',
				'transition-colors duration-300'
			)}
			style={{ boxShadow: 'none' }}
		>
			<div>
				{/* Logo */}
				<div className="flex items-center h-20 px-8 border-b border-[#E5E7EB] dark:border-white/10 select-none">
					<span className="font-heading text-lg tracking-tight font-bold text-[#111827] dark:text-[#E5E7EB]">NOVUS</span>
					<span className="ml-1.5 font-heading text-xs font-semibold tracking-widest text-[#6B7280] dark:text-[#9CA3AF]">PROTOCOL</span>
				</div>
				{/* Navigation */}
				<nav className="mt-6 flex flex-col gap-1 px-2">
					{navItems.map((item, idx) => (
						<button
							key={item.label}
							className={cn(
								'flex items-center gap-3 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors',
								item.active
									? 'bg-[#F9FAFB] dark:bg-[#151515] text-[#111827] dark:text-[#E5E7EB] border border-[#E5E7EB] dark:border-white/10 shadow-none'
									: 'text-[#6B7280] dark:text-[#9CA3AF] hover:border hover:border-[#E5E7EB] dark:hover:border-white/10',
								item.active && 'font-semibold',
								'focus:outline-none focus-visible:ring-0 focus-visible:border-[#3BA2FF] dark:focus-visible:border-[#3BA2FF]'
							)}
							style={{ boxShadow: 'none' }}
						>
							{item.icon}
							{item.label}
						</button>
					))}
				</nav>
			</div>
			{/* System Health Card */}
			<div className="px-4 pb-8">
				<div className="rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-[#FAFAFA] dark:bg-[#111111] p-4 flex flex-col gap-3" style={{ boxShadow: 'none' }}>
					<div className="text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] mb-1 tracking-wide">SYSTEM HEALTH</div>
					<div className="flex items-center justify-between text-xs">
						<span className="text-[#6B7280] dark:text-[#9CA3AF]">SYNC STABILITY</span>
						<span className="font-semibold text-[#10B981]">99.8%</span>
					</div>
					<div className="w-full h-1.5 bg-[#E5E7EB] dark:bg-white/5 rounded-full mb-2">
						<div className="h-1.5 rounded-full bg-[#E5E7EB] dark:bg-white/20" style={{ width: '99.8%' }}></div>
					</div>
					<div className="flex items-center justify-between text-xs">
						<span className="text-[#6B7280] dark:text-[#9CA3AF]">API LATENCY</span>
						<span className="font-semibold text-[#111827] dark:text-[#E5E7EB]">12ms</span>
					</div>
				</div>
			</div>
		</aside>
	);
}
