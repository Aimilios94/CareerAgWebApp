// Skill matching utilities - shared between CV Analysis and Job Detail pages

// Known skill variations for better matching
export const SKILL_VARIATIONS: Record<string, string[]> = {
  javascript: ['js', 'ecmascript'],
  typescript: ['ts'],
  react: ['reactjs', 'react.js'],
  node: ['nodejs', 'node.js'],
  postgres: ['postgresql', 'psql'],
  python: ['py'],
  golang: ['go'],
  'c++': ['cpp', 'cplusplus'],
  'c#': ['csharp', 'dotnet', '.net'],
  vue: ['vuejs', 'vue.js'],
  angular: ['angularjs'],
  nextjs: ['next.js', 'next'],
  docker: ['containers'],
  kubernetes: ['k8s'],
  aws: ['amazon web services'],
  gcp: ['google cloud', 'google cloud platform'],
  azure: ['microsoft azure'],
  mongodb: ['mongo'],
  redis: ['redisdb'],
  graphql: ['gql'],
  tailwind: ['tailwindcss', 'tailwind css'],
  sass: ['scss'],
  jest: ['testing'],
  vitest: ['testing'],
  cypress: ['e2e testing'],
  playwright: ['e2e testing'],
}

// Common skills for extraction from job descriptions
export const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Next.js', 'Node.js',
  'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring', 'Kotlin',
  'Go', 'Golang', 'Rust', 'C++', 'C#', '.NET',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
  'GraphQL', 'REST API', 'gRPC', 'Microservices',
  'Git', 'CI/CD', 'Jenkins', 'GitHub Actions',
  'HTML', 'CSS', 'Tailwind', 'Sass', 'SCSS',
  'Testing', 'Jest', 'Cypress', 'Playwright', 'Vitest',
  'Agile', 'Scrum', 'Jira', 'Figma',
  'Machine Learning', 'AI', 'TensorFlow', 'PyTorch',
  'NoSQL', 'Linux', 'Bash', 'Shell',
]

export function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim().replace(/[^a-z0-9+#]/g, '')
}

export function getVariations(skill: string): string[] {
  const normalized = normalizeSkill(skill)
  const variations = [normalized]

  // Check if this skill has known variations
  for (const [canonical, aliases] of Object.entries(SKILL_VARIATIONS)) {
    if (normalized === canonical || aliases.includes(normalized)) {
      variations.push(canonical, ...aliases)
    }
  }

  return Array.from(new Set(variations))
}

export function extractSkillsFromDescription(description: string | null): string[] {
  if (!description) return []

  const lowerDesc = description.toLowerCase()
  return COMMON_SKILLS.filter(skill =>
    lowerDesc.includes(skill.toLowerCase())
  )
}

export interface SkillComparison {
  matched: string[]
  partial: string[]
  missing: string[]
  matchPercentage: number
  total: number
}

export function compareSkills(cvSkills: string[], jobRequiredSkills: string[]): SkillComparison {
  if (!cvSkills || cvSkills.length === 0 || !jobRequiredSkills || jobRequiredSkills.length === 0) {
    return {
      matched: [],
      partial: [],
      missing: jobRequiredSkills || [],
      matchPercentage: 0,
      total: jobRequiredSkills?.length || 0,
    }
  }

  const cvSkillsNormalized = cvSkills.map(s => ({
    original: s,
    variations: getVariations(s),
  }))

  const matched: string[] = []
  const partial: string[] = []
  const missing: string[] = []

  for (const jobSkill of jobRequiredSkills) {
    const jobNormalized = normalizeSkill(jobSkill)
    const jobVariations = getVariations(jobSkill)

    let found = false
    let partialMatch = false

    for (const cvSkill of cvSkillsNormalized) {
      // Exact match or variation match
      if (cvSkill.variations.some(v => jobVariations.includes(v))) {
        matched.push(jobSkill)
        found = true
        break
      }

      // Partial match (e.g., "React" in "React Native")
      if (cvSkill.variations.some(v => jobNormalized.includes(v) || v.includes(jobNormalized))) {
        partialMatch = true
      }
    }

    if (!found) {
      if (partialMatch) {
        partial.push(jobSkill)
      } else {
        missing.push(jobSkill)
      }
    }
  }

  const total = jobRequiredSkills.length
  const matchPercentage = total > 0
    ? Math.round(((matched.length + partial.length * 0.5) / total) * 100)
    : 0

  return { matched, partial, missing, matchPercentage, total }
}

export interface GapAnalysis {
  requiredSkills?: string[]
  niceToHaveSkills?: string[]
  matchedSkills?: string[]
  missingSkills?: string[]
}

export function getJobSkills(gapAnalysis: GapAnalysis | null, description: string | null): string[] {
  if (gapAnalysis?.requiredSkills && gapAnalysis.requiredSkills.length > 0) {
    return gapAnalysis.requiredSkills
  }
  return extractSkillsFromDescription(description)
}
