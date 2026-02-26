class ResumeConsistencyEngine {
  static normalizeSkill(skill) {
    return String(skill || '').trim().toLowerCase();
  }

  static toDisplay(skill) {
    if (!skill) return '';
    return skill
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  static calculate(interview, resume) {
    const claimedSkillsRaw = [
      ...(resume?.structuredData?.skills || []),
      ...(resume?.structuredData?.technologies || [])
    ];

    const claimedSkills = Array.from(
      new Set(claimedSkillsRaw.map((s) => this.normalizeSkill(s)).filter(Boolean))
    );

    const skillPerformanceMap = interview?.skillPerformance instanceof Map
      ? Object.fromEntries(interview.skillPerformance.entries())
      : (interview?.skillPerformance || {});

    const performedSkills = Object.keys(skillPerformanceMap).map((topic) => ({
      topic: this.normalizeSkill(topic),
      score: Number(skillPerformanceMap[topic]?.score || 0)
    }));

    const matched = claimedSkills.filter((skill) => performedSkills.some((p) => p.topic.includes(skill) || skill.includes(p.topic)));

    const resumeClaimAccuracy = claimedSkills.length > 0
      ? Math.round((matched.length / claimedSkills.length) * 100)
      : 0;

    const inflatedSkills = claimedSkills
      .filter((skill) => {
        const perf = performedSkills.find((p) => p.topic.includes(skill) || skill.includes(p.topic));
        return perf && perf.score < 5;
      })
      .map(this.toDisplay);

    const verifiedStrengths = performedSkills
      .filter((p) => p.score >= 7)
      .map((p) => this.toDisplay(p.topic));

    const underutilizedSkills = claimedSkills
      .filter((skill) => !performedSkills.some((p) => p.topic.includes(skill) || skill.includes(p.topic)))
      .map(this.toDisplay);

    return {
      resumeClaimAccuracy,
      inflatedSkills: Array.from(new Set(inflatedSkills)),
      verifiedStrengths: Array.from(new Set(verifiedStrengths)),
      underutilizedSkills: Array.from(new Set(underutilizedSkills))
    };
  }
}

module.exports = ResumeConsistencyEngine;
