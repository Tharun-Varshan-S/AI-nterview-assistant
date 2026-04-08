const logger = require('../utils/logger');

/**
 * Resume Validation Service
 * Implements multi-layer validation: MIME, word count, keywords, AI scoring
 */

const VALIDATION_CONFIG = {
  MIME_TYPES: ['application/pdf', 'application/x-pdf'],
  MIN_WORD_COUNT: 150,
  CONFIDENCE_THRESHOLD: 60,
  RESUME_LIKELIHOOD_THRESHOLD: 0.55,
  REQUIRED_KEYWORDS: [
    'experience', 'education', 'skills', 'project', 'work',
    'degree', 'university', 'college', 'certification',
    'technical', 'programming', 'language', 'framework',
  ],
  SECTION_HEADERS: [
    'experience', 'work experience', 'professional experience', 'education',
    'skills', 'projects', 'certifications', 'internship', 'summary', 'profile'
  ]
};

/**
 * Validate MIME type
 */
const validateMimeType = (mimeType) => {
  const isValid = VALIDATION_CONFIG.MIME_TYPES.includes(mimeType);
  if (!isValid) {
    logger.warn('Invalid MIME type uploaded', { mimeType });
  }
  return isValid;
};

/**
 * Validate minimum word count
 */
const validateWordCount = (text) => {
  if (!text) return false;
  const wordCount = text.trim().split(/\s+/).length;
  const isValid = wordCount >= VALIDATION_CONFIG.MIN_WORD_COUNT;
  
  if (!isValid) {
    logger.warn('Insufficient word count', { wordCount, required: VALIDATION_CONFIG.MIN_WORD_COUNT });
  }
  
  return isValid;
};

/**
 * Validate presence of resume keywords
 */
const validateKeywords = (text) => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  // Count how many keywords are present
  const foundKeywords = VALIDATION_CONFIG.REQUIRED_KEYWORDS.filter(
    (keyword) => lowerText.includes(keyword)
  );
  
  // Require at least 50% of keywords
  const requiredKeywordThreshold = Math.ceil(VALIDATION_CONFIG.REQUIRED_KEYWORDS.length * 0.5);
  const isValid = foundKeywords.length >= requiredKeywordThreshold;
  
  if (!isValid) {
    logger.warn('Insufficient resume keywords', { 
      found: foundKeywords.length, 
      required: requiredKeywordThreshold 
    });
  }
  
  return isValid;
};

/**
 * Extract structured data from resume text
 */
const extractStructuredData = (text) => {
  const lowerText = text.toLowerCase();
  
  // Extract skills (common programming languages and tools)
  const skillPatterns = [
    'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'golang', 'rust',
    'react', 'angular', 'vue', 'node', 'express', 'django', 'spring',
    'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git',
    'html', 'css', 'rest', 'graphql', 'api', 'microservices',
    'agile', 'scrum', 'jira', 'linux', 'windows', 'macos',
  ];
  
  const skills = [];
  skillPatterns.forEach((skill) => {
    if (lowerText.includes(skill)) {
      skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  });
  
  // Extract technologies (based on skills found)
  const technologies = [];
  const techCategories = {
    frontend: ['javascript', 'typescript', 'react', 'angular', 'vue', 'html', 'css'],
    backend: ['node', 'express', 'django', 'spring', 'java', 'python', 'golang'],
    database: ['sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch'],
    cloud: ['aws', 'azure', 'gcp'],
    devops: ['docker', 'kubernetes', 'jenkins', 'git'],
  };
  
  Object.entries(techCategories).forEach(([category, techs]) => {
    techs.forEach((tech) => {
      if (lowerText.includes(tech)) {
        technologies.push(tech);
      }
    });
  });
  
  // Extract years of experience (look for patterns like "5 years", "5+ years", etc)
  const expMatch = text.match(/(\d+)\s*\+?\s*years?\s+(?:of\s+)?experience/i);
  const experienceYears = expMatch ? parseInt(expMatch[1]) : 0;
  
  // Extract education (look for degree indicators)
  const education = [];
  const degreePatterns = [
    /bachelor|b\.?s|b\.?e/i,
    /master|m\.?s|m\.?e|mba/i,
    /ph\.?d|doctorate/i,
    /diploma/i,
  ];
  
  degreePatterns.forEach((pattern) => {
    if (pattern.test(text)) {
      const degreeMatch = text.match(pattern);
      if (degreeMatch) {
        education.push(degreeMatch[0]);
      }
    }
  });
  
  // Determine primary domain
  let primaryDomain = 'General';
  if (technologies.some(t => ['react', 'angular', 'vue', 'html', 'css'].includes(t))) {
    primaryDomain = 'Frontend Development';
  } else if (technologies.some(t => ['node', 'express', 'django', 'spring'].includes(t))) {
    primaryDomain = 'Backend Development';
  } else if (technologies.some(t => ['aws', 'azure', 'gcp', 'docker'].includes(t))) {
    primaryDomain = 'DevOps & Cloud';
  } else if (technologies.some(t => ['sql', 'mongodb', 'postgresql'].includes(t))) {
    primaryDomain = 'Database Engineering';
  }
  
  return {
    skills: [...new Set(skills)], // Remove duplicates
    technologies: [...new Set(technologies)],
    experienceYears,
    education,
    primaryDomain,
  };
};

/**
 * Perform basic validation (MIME, word count, keywords)
 */
const performBasicValidation = (mimeType, text) => {
  const validations = {
    mimeType: validateMimeType(mimeType),
    wordCount: validateWordCount(text),
    keywords: validateKeywords(text),
  };
  
  // Fail if any critical validation fails
  const allPassed = validations.mimeType && validations.wordCount && validations.keywords;
  
  return {
    passed: allPassed,
    details: validations,
  };
};

const detectResumeLikelihood = (text) => {
  if (!text || typeof text !== 'string') {
    return { isLikelyResume: false, score: 0, evidence: [] };
  }

  const normalized = text.toLowerCase();
  const evidence = [];
  let score = 0;

  const headerHits = VALIDATION_CONFIG.SECTION_HEADERS.filter((header) => normalized.includes(header));
  if (headerHits.length >= 3) {
    score += 0.35;
    evidence.push(`section_headers:${headerHits.length}`);
  } else if (headerHits.length >= 2) {
    score += 0.2;
    evidence.push(`section_headers:${headerHits.length}`);
  }

  const emailMatch = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const phoneMatch = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{3,5}/.test(text);
  if (emailMatch) {
    score += 0.2;
    evidence.push('email_present');
  }
  if (phoneMatch) {
    score += 0.1;
    evidence.push('phone_present');
  }

  const bulletDensity = (text.match(/[•\-*]\s+/g) || []).length;
  if (bulletDensity >= 5) {
    score += 0.15;
    evidence.push('bullet_points');
  }

  const datePattern = /(20\d{2}|19\d{2})|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi;
  const dateMentions = (text.match(datePattern) || []).length;
  if (dateMentions >= 3) {
    score += 0.1;
    evidence.push('date_timeline');
  }

  const keywordResult = validateKeywords(text);
  if (keywordResult) {
    score += 0.15;
    evidence.push('resume_keywords');
  }

  const boundedScore = Number(Math.min(1, score).toFixed(2));
  return {
    isLikelyResume: boundedScore >= VALIDATION_CONFIG.RESUME_LIKELIHOOD_THRESHOLD,
    score: boundedScore,
    evidence,
  };
};

module.exports = {
  validateMimeType,
  validateWordCount,
  validateKeywords,
  extractStructuredData,
  performBasicValidation,
  detectResumeLikelihood,
  VALIDATION_CONFIG,
};
