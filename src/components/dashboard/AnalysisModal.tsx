'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Github, FileType, Check, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AnalysisModalProps {
    isOpen: boolean
    onClose: () => void
    onAnalyze: (data: { cv: File; coverLetter?: File; githubUrl?: string }) => void
    isAnalyzing?: boolean
}

export function AnalysisModal({ isOpen, onClose, onAnalyze, isAnalyzing }: AnalysisModalProps) {
    const [cvFile, setCvFile] = useState<File | null>(null)
    const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null)
    const [githubUrl, setGithubUrl] = useState('')
    const [step, setStep] = useState(1) // 1: Input, 2: Analyzing (handled by parent logic mostly, but good for local transitions)

    const cvInputRef = useRef<HTMLInputElement>(null)
    const coverLetterInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent, type: 'cv' | 'cover-letter') => {
        e.preventDefault()
        e.stopPropagation()
        const files = e.dataTransfer.files
        if (files?.[0]) {
            if (type === 'cv') setCvFile(files[0])
            if (type === 'cover-letter') setCoverLetterFile(files[0])
        }
    }

    const handleSubmit = () => {
        if (!cvFile) return
        onAnalyze({
            cv: cvFile,
            coverLetter: coverLetterFile || undefined,
            githubUrl: githubUrl || undefined
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-zinc-950 border-white/10 p-0 overflow-hidden flex flex-col gap-0 shadow-2xl shadow-black/50">
                {/* Header with gradient */}
                <div className="relative p-6 border-b border-white/5 bg-zinc-900/30">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-purple-500 to-accent" />
                    <DialogHeader>
                        <DialogTitle className="font-heading text-2xl tracking-tight flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/20">
                                <FileType className="w-5 h-5 text-accent" />
                            </span>
                            Start Profile Analysis
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-base">
                            Upload your documents to let our AI build your comprehensive career profile.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6 bg-zinc-950/50 backdrop-blur-3xl">
                    {/* CV Upload - Required */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-white flex items-center justify-between">
                            Resume / CV <span className="text-accent text-xs font-bold px-2 py-0.5 bg-accent/10 rounded-full">REQUIRED</span>
                        </label>
                        <div
                            onClick={() => cvInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'cv')}
                            className={cn(
                                "border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer group hover:bg-white/5 relative overflow-hidden",
                                cvFile ? "border-emerald-500/50 bg-emerald-500/5" : "border-zinc-800 hover:border-zinc-700"
                            )}
                        >
                            <input
                                type="file"
                                ref={cvInputRef}
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => e.target.files?.[0] && setCvFile(e.target.files[0])}
                            />

                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                {cvFile ? (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center animate-in zoom-in">
                                            <Check className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{cvFile.name}</p>
                                            <p className="text-zinc-500 text-xs mt-1">Ready for analysis</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="text-zinc-300 font-medium">Click to upload or drag & drop</p>
                                            <p className="text-zinc-500 text-xs mt-1">PDF, DOCX up to 10MB</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cover Letter - Optional */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                Cover Letter <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-zinc-500">Optional</span>
                            </label>
                            <div
                                onClick={() => coverLetterInputRef.current?.click()}
                                className={cn(
                                    "border border-dashed border-zinc-800 rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-colors h-24 flex items-center justify-center text-center",
                                    coverLetterFile && "border-white/20 bg-white/5"
                                )}
                            >
                                <input
                                    type="file"
                                    ref={coverLetterInputRef}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => e.target.files?.[0] && setCoverLetterFile(e.target.files[0])}
                                />
                                {coverLetterFile ? (
                                    <div className="flex items-center gap-2 text-sm text-white">
                                        <FileText className="w-4 h-4 text-purple-400" />
                                        <span className="truncate max-w-[120px]">{coverLetterFile.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-zinc-500 flex items-center gap-2">
                                        <Upload className="w-3 h-3" /> Upload File
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Github Profile - Optional */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                GitHub Profile <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-zinc-500">Optional</span>
                            </label>
                            <div className="h-24 flex items-center">
                                <div className="relative w-full">
                                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        placeholder="github.com/username"
                                        value={githubUrl}
                                        onChange={(e) => setGithubUrl(e.target.value)}
                                        className="pl-9 bg-zinc-900/50 border-zinc-800 focus:border-accent text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white hover:bg-white/5">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!cvFile || isAnalyzing}
                        className={cn(
                            "min-w-[140px] font-semibold transition-all",
                            cvFile ? "bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20" : "bg-zinc-800 text-zinc-500"
                        )}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
                            </>
                        ) : (
                            'Start Analysis'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
