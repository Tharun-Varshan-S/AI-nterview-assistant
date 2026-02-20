const logger = require('../utils/logger');

/**
 * Resume Validation Service
 * Implements multi-layer validation: MIME, word count, keywords, AI scoring
 */

const VALIDATION_CONFIG = {
  MIME_TYPES: ['application/pdf', 'application/x-pdf'],
  MIN_WORD_COUNT: 150,
  CONFIDENCE_THRESHOLD: 60,
  REQUIRED_KEYWORDS: [
    'experience', 'education', 'skills', 'project', 'work',
    'degree', 'university', 'college', 'certification',
    'technical', 'programming', 'language', 'framework',
  ],
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

module.exports = {
  validateMimeType,
  validateWordCount,
  validateKeywords,
  extractStructuredData,
  performBasicValidation,
  VALIDATION_CONFIG,
};
