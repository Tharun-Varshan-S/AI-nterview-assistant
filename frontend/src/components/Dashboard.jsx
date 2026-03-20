import React from 'react';
import { cn } from '../lib/utils';

export default function Dashboard() {
	return (
		<main className="flex-1 min-h-screen bg-[#FFFFFF] dark:bg-[#0A0A0A] transition-colors duration-300 px-0 py-0">
			{/* Header */}
			<div className="flex items-center justify-between px-12 pt-10 pb-2">
				<div>
					<h1 className="font-heading text-3xl font-bold text-[#111827] dark:text-[#E5E7EB] tracking-tight">Candidate Dashboard</h1>
					<div className="mt-1 text-sm text-[#6B7280] dark:text-[#9CA3AF]">Manage your workspace and track interview readiness.</div>
				</div>
				<button className="h-9 px-4 rounded-lg bg-[#F9FAFB] dark:bg-[#151515] border border-[#E5E7EB] dark:border-white/10 text-[#111827] dark:text-[#E5E7EB] text-sm font-semibold transition-colors" style={{ boxShadow: 'none' }}>ACTIVE SESSION</button>
			</div>

			{/* Readiness Protocol Card */}
			<div className="px-12 mt-2">
				<div className="rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-[#FAFAFA] dark:bg-[#111111] p-7 flex flex-col md:flex-row md:items-center gap-6 md:gap-12" style={{ boxShadow: 'none' }}>
					<div className="flex flex-col gap-1 min-w-[120px]">
						<span className="text-xs font-semibold text-[#F59E0B] tracking-wide">READINESS PROTOCOL</span>
						<span className="text-4xl font-bold text-[#111827] dark:text-[#E5E7EB] mt-1">56.0</span>
						<span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">OVERALL SCORE</span>
					</div>
					<div className="flex flex-col gap-2 min-w-[120px]">
						<span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">TIER STATUS</span>
						<span className="inline-block bg-[#111827] dark:bg-[#E5E7EB] text-[#FAFAFA] dark:text-[#111827] text-xs font-bold rounded px-2 py-0.5 tracking-wide w-fit">IMPROVING</span>
					</div>
					<div className="flex flex-col gap-2 min-w-[180px]">
						<span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">TOP COMPETENCY</span>
						<span className="text-sm font-semibold text-[#111827] dark:text-[#E5E7EB]">HTML/CSS Fundamentals</span>
					</div>
					<div className="flex flex-col gap-2 min-w-[180px]">
						<span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">TARGET FOCUS</span>
						<span className="text-sm font-semibold text-[#111827] dark:text-[#E5E7EB]">Generative AI</span>
					</div>
					<div className="flex-1 flex flex-col justify-end min-w-[200px]">
						<span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-1">SYSTEM ALIGNMENT PROGRESS</span>
						<div className="w-full h-2 bg-[#E5E7EB] dark:bg-white/5 rounded-full">
							<div className="h-2 rounded-full bg-[#111827] dark:bg-[#E5E7EB] transition-all duration-300" style={{ width: '56%' }}></div>
						</div>
						<span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 text-right">56%</span>
					</div>
				</div>
			</div>

			{/* Action Cards Grid */}
			<div className="px-12 mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
				{[
					{ label: 'Practice Rounds', desc: 'Targeted skill drills', icon: (
						<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
					) },
					{ label: 'Mock Setup', desc: 'Configure new sessions', icon: (
						<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 9h18"/></svg>
					) },
					{ label: 'Skill Analytics', desc: 'Growth & trajectory', icon: (
						<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 15v-6"/><path d="M11 17v-2"/><path d="M15 13v-6"/><path d="M19 17v-8"/></svg>
					) },
					{ label: 'Latest Report', desc: 'Deep-dive feedback', icon: (
						<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h6"/></svg>
					) },
				].map(card => (
					<div key={card.label} className="rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-[#FAFAFA] dark:bg-[#111111] p-6 flex flex-col gap-3 items-start transition-colors duration-300 hover:border-[#3BA2FF] dark:hover:border-[#3BA2FF]" style={{ boxShadow: 'none', minHeight: '110px' }}>
						<div className="mb-2">{card.icon}</div>
						<div className="font-semibold text-[#111827] dark:text-[#E5E7EB] text-base">{card.label}</div>
						<div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">{card.desc}</div>
					</div>
				))}
			</div>

			{/* Lower Section */}
			<div className="px-12 mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
				<div className="rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-[#FAFAFA] dark:bg-[#111111] p-6 flex flex-col gap-2" style={{ boxShadow: 'none', minHeight: '110px' }}>
					<div className="text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] mb-1 tracking-wide">Active Resume Scan</div>
					<button className="ml-auto text-xs text-[#3BA2FF] font-semibold px-2 py-1 rounded hover:underline">CLEAR CONTEXT</button>
				</div>
				<div className="rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-[#FAFAFA] dark:bg-[#111111] p-6 flex flex-col gap-2" style={{ boxShadow: 'none', minHeight: '110px' }}>
					<div className="text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] mb-1 tracking-wide">Adaptive Assessment</div>
					<span className="inline-block text-[10px] font-semibold bg-[#111827] dark:bg-[#E5E7EB] text-[#FAFAFA] dark:text-[#111827] rounded px-2 py-0.5 w-fit mt-1">LIVE INTERFACE</span>
				</div>
			</div>
		</main>
	);
}
