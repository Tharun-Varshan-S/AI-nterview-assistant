import React, { useState } from 'react';

/**
 * SkillGapReportComponent
 * 
 * Displays AI-generated skill gap report with:
 * - Personalized recommendations
 * - Learning roadmap
 * - Weak area focus suggestions
 * - Timeline estimates
 */
interface SkillGapReport {
  strongestSkills?: string[];
  weakestSkills?: string[];
  recommendedFocusAreas?: string[];
  learningSuggestions?: string[];
  estimatedRoadmapWeeks?: number;
  summary?: string;
}

interface SkillSummary {
  strongestSkills?: string[];
}

interface PerformanceMetrics {
  interviewCount?: number;
  overallScore?: number;
}

interface SkillGapReportProps {
  report?: SkillGapReport;
  skillSummary?: SkillSummary;
  performanceMetrics?: PerformanceMetrics;
}

const SkillGapReportComponent = ({ report, skillSummary, performanceMetrics }: SkillGapReportProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!report) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Complete 3+ interviews to generate a personalized skill gap report</p>
      </div>
    );
  }

  const renderSection = (title: string, content: string | string[], icon: string) => (
    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() =>
          setExpandedSection(expandedSection === title ? null : title)
        }
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        <span className="text-gray-600">
          {expandedSection === title ? '▼' : '▶'}
        </span>
      </button>

      {expandedSection === title && (
        <div className="px-6 py-4 bg-white">
          {Array.isArray(content) ? (
            <ul className="space-y-2">
              {content.map((item: string, idx: number) => (
                <li key={idx} className="flex gap-3 items-start">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Strongest Skill"
          value={report.strongestSkills?.[0] || 'N/A'}
          color="green"
          icon="⭐"
        />
        <SummaryCard
          label="Primary Focus"
          value={report.recommendedFocusAreas?.[0] || 'N/A'}
          color="orange"
          icon="🎯"
        />
        <SummaryCard
          label="Estimated Timeline"
          value={`${report.estimatedRoadmapWeeks || 4}-6 weeks`}
          color="blue"
          icon="📅"
        />
      </div>

      {/* Main Report Sections */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Your Personalized Growth Roadmap
        </h2>

        {renderSection(
          'Strongest Skills',
          report.strongestSkills || [],
          '✅'
        )}

        {renderSection(
          'Areas for Improvement',
          report.weakestSkills || [],
          '⚠️'
        )}

        {renderSection(
          'Recommended Focus Areas',
          report.recommendedFocusAreas || [],
          '🎯'
        )}

        {renderSection(
          'Learning Suggestions',
          report.learningSuggestions || [],
          '📚'
        )}

        {report.summary && renderSection(
          'Summary',
          report.summary,
          '📊'
        )}
      </div>

      {/* Performance Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailCard title="Interview Statistics" items={[
          { label: 'Total Interviews', value: performanceMetrics?.interviewCount || 0 },
          { label: 'Average Score', value: `${(performanceMetrics?.overallScore || 0).toFixed(1)}/10` },
          { label: 'Learning Velocity', value: `+${((performanceMetrics?.overallScore || 0) / (performanceMetrics?.interviewCount || 1)).toFixed(2)}/interview` }
        ]} />

        <DetailCard title="Skill Profile" items={skillSummary?.strongestSkills?.slice(0, 3).map((skill: string, idx: number) => ({
          label: `Top Skill ${idx + 1}`,
          value: skill
        })) || []} />
      </div>

      {/* Action Items */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
          <span>✨</span> Next Steps
        </h3>
        <ul className="space-y-3">
          <li className="flex gap-3 text-green-800">
            <span className="font-bold">1.</span>
            <span>Focus on <strong>{report.recommendedFocusAreas?.[0] || 'your weak areas'}</strong></span>
          </li>
          <li className="flex gap-3 text-green-800">
            <span className="font-bold">2.</span>
            <span>Use suggested resources from Learning Suggestions section</span>
          </li>
          <li className="flex gap-3 text-green-800">
            <span className="font-bold">3.</span>
            <span>Take targeted interviews focusing on {report.weakestSkills?.slice(0, 2).join(' and ') || 'improvement areas'}</span>
          </li>
          <li className="flex gap-3 text-green-800">
            <span className="font-bold">4.</span>
            <span>Track progress with regular mock interviews</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

/**
 * SummaryCard Component
 */
interface SummaryCardProps {
  label: string;
  value: string;
  color: 'green' | 'orange' | 'blue';
  icon: string;
}

const SummaryCard = ({ label, value, color, icon }: SummaryCardProps) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium opacity-80">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-lg font-bold truncate">{value}</p>
    </div>
  );
};

/**
 * DetailCard Component
 */
interface DetailCardItem {
  label: string;
  value: string | number;
}

interface DetailCardProps {
  title: string;
  items: DetailCardItem[];
}

const DetailCard = ({ title, items }: DetailCardProps) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <h4 className="font-semibold text-gray-800 mb-3">{title}</h4>
    <div className="space-y-2">
      {items.map((item: DetailCardItem, idx: number) => (
        <div key={idx} className="flex justify-between">
          <span className="text-gray-600 text-sm">{item.label}</span>
          <span className="font-medium text-gray-800">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

export default SkillGapReportComponent;
