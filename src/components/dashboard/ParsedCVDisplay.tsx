'use client'

import { FileText, Briefcase, GraduationCap, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ParsedCVData {
  skills: string[]
  experience: Array<{ company: string; role: string; dates?: string; duration?: string }>
  education: Array<{ institution: string; degree: string; year: string }>
  summary: string
}

interface ParsedCV {
  id: string
  filename: string
  parsedData: ParsedCVData
  createdAt: string
}

interface ParsedCVDisplayProps {
  parsedCV: ParsedCV | null
}

export function ParsedCVDisplay({ parsedCV }: ParsedCVDisplayProps) {
  if (!parsedCV) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No CV uploaded</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your CV to see parsed skills and experience
          </p>
        </CardContent>
      </Card>
    )
  }

  const { filename, parsedData } = parsedCV
  const { skills, experience, education, summary } = parsedData

  return (
    <div className="space-y-6">
      {/* File Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CV Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{filename}</p>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Professional Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">None found</p>
          )}
        </CardContent>
      </Card>

      {/* Experience */}
      {experience.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {experience.map((exp, index) => (
                <div
                  key={index}
                  className="relative pl-4 pb-4 last:pb-0 border-l-2 border-muted last:border-l-0"
                >
                  <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-primary" />
                  <h4 className="font-medium text-sm">{exp.company}</h4>
                  <p className="text-sm text-muted-foreground">{exp.role}</p>
                  <p className="text-xs text-muted-foreground mt-1">{exp.dates || exp.duration}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {education.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {education.map((edu, index) => (
                <div key={index}>
                  <h4 className="font-medium text-sm">{edu.institution}</h4>
                  <p className="text-sm text-muted-foreground">{edu.degree}</p>
                  <p className="text-xs text-muted-foreground">{edu.year}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
