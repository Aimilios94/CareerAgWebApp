'use client'

import Link from 'next/link'
import { useRef, useState, useEffect, useMemo } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Target,
  Sparkles,
  TrendingUp,
  ChevronRight,
  FileSearch,
  Zap,
  Shield,
  BarChart3,
  Check,
  Play,
  Menu,
  X,
} from 'lucide-react'

/* ─── Reusable scroll-reveal wrapper ─── */
function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const directionMap = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Floating particles component (client-only to avoid hydration mismatch) ─── */
function Particles() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Seed-based pseudo-random to be deterministic per particle index
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        size: ((i * 7 + 3) % 30) / 10 + 1,
        left: ((i * 17 + 5) % 100),
        delay: ((i * 13 + 2) % 150) / 10,
        duration: ((i * 11 + 7) % 100) / 10 + 10,
        color: i % 3 === 0 ? 'bg-accent/20' : i % 3 === 1 ? 'bg-purple-500/20' : 'bg-blue-500/15',
      })),
    []
  )

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle ${p.color}`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            bottom: '-5%',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ─── Glassmorphism Feature Card ─── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  iconColor,
  iconBg,
  delay = 0,
}: {
  icon: any
  title: string
  description: string
  iconColor: string
  iconBg: string
  delay?: number
}) {
  return (
    <Reveal delay={delay}>
      <motion.div
        className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 cursor-default overflow-hidden"
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Hover glow */}
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />

        {/* Animated Icon Container */}
        <div className="relative z-10">
          <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:border-white/20 transition-colors group-hover:scale-110 duration-300`}>
            <Icon className={`w-7 h-7 ${iconColor}`} />
          </div>

          <h3 className="text-xl font-heading font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-300 transition-all">
            {title}
          </h3>
          <p className="text-zinc-400 font-body leading-relaxed group-hover:text-zinc-300 transition-colors">
            {description}
          </p>
        </div>
      </motion.div>
    </Reveal>
  )
}

/* ─── Pricing Card ─── */
function PricingCard({
  plan,
  price,
  description,
  features,
  cta,
  href,
  popular = false,
  delay = 0,
}: {
  plan: string
  price: string
  description: string
  features: string[]
  cta: string
  href: string
  popular?: boolean
  delay?: number
}) {
  return (
    <Reveal delay={delay}>
      <motion.div
        className={`relative p-8 rounded-3xl border backdrop-blur-xl transition-all duration-500 ${popular
            ? 'bg-gradient-to-b from-accent/10 to-transparent border-accent/20 hover:border-accent/40'
            : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'
          }`}
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-xs font-bold rounded-full uppercase tracking-wider">
            Most Popular
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-xl font-heading font-bold text-white mb-1">{plan}</h3>
          <p className="text-zinc-400 text-sm">{description}</p>
        </div>

        <div className="flex items-baseline gap-1 mb-8">
          <span className="text-4xl font-heading font-bold text-white">{price}</span>
          {price !== 'Free' && <span className="text-zinc-400 text-sm">/month</span>}
        </div>

        <ul className="space-y-3 mb-8">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
              <Check className={`w-4 h-4 mt-0.5 shrink-0 ${popular ? 'text-accent' : 'text-emerald-400'}`} />
              {feature}
            </li>
          ))}
        </ul>

        <Link
          href={href}
          className={`ripple-effect block w-full text-center py-3.5 rounded-xl font-heading font-semibold text-sm transition-all duration-300 ${popular
              ? 'bg-accent text-white hover:bg-accent/90 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)]'
              : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
        >
          {cta}
        </Link>
      </motion.div>
    </Reveal>
  )
}

/* ─── Section heading helper ─── */
function SectionHeading({
  badge,
  title,
  subtitle,
  badgeColor = 'text-accent',
}: {
  badge: string
  title: string
  subtitle: string
  badgeColor?: string
}) {
  return (
    <Reveal className="text-center mb-16">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
        <span className={`text-xs font-bold tracking-wider uppercase ${badgeColor}`}>{badge}</span>
      </div>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">{title}</h2>
      <p className="max-w-2xl mx-auto text-zinc-400 text-lg">{subtitle}</p>
    </Reveal>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  return (
    <div className="min-h-screen animated-gradient-bg text-foreground overflow-x-hidden selection:bg-accent/30">
      {/* ─── Animated Background Orbs ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-noise opacity-[0.03]" />
        <motion.div
          className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[10%] right-[0%] w-[40%] h-[40%] bg-blue-900/10 blur-[100px] rounded-full"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[0%] left-[20%] w-[60%] h-[40%] bg-accent/5 blur-[150px] rounded-full"
          animate={{ x: [0, 40, 0], y: [0, -15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ─── Floating Particles ─── */}
      <Particles />

      {/* ═══ HEADER ═══ */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-accent blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
                <motion.div
                  className="relative w-10 h-10 bg-gradient-to-br from-zinc-900 to-black rounded-xl flex items-center justify-center border border-white/10 shadow-lg"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Target className="w-5 h-5 text-accent" />
                </motion.div>
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all duration-300">
                Career Agent
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {[
                { label: 'Features', href: '#features' },
                { label: 'Demo', href: '#demo' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'About', href: '#about' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="relative text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-300 group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
              <div className="h-6 w-px bg-white/10" />
              <Link
                href="/login"
                className="text-sm font-medium text-white hover:text-accent transition-colors duration-300"
              >
                Sign In
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/dashboard"
                  className="ripple-effect px-5 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.5)]"
                >
                  Get Started
                </Link>
              </motion.div>
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          className="md:hidden overflow-hidden"
          initial={false}
          animate={{ height: mobileMenuOpen ? 'auto' : 0 }}
          transition={{ duration: 0.3 }}
        >
          <nav className="px-4 pb-6 flex flex-col gap-4 border-t border-white/5 pt-4">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Demo', href: '#demo' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'About', href: '#about' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="h-px bg-white/10" />
            <Link href="/login" className="text-sm font-medium text-white">
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-lg text-center"
            >
              Get Started
            </Link>
          </nav>
        </motion.div>
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="text-xs font-medium text-zinc-300 tracking-wide uppercase">
                AI-Powered Career Intelligence
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="max-w-4xl mx-auto font-heading font-bold text-5xl sm:text-7xl lg:text-8xl tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500 mb-8">
              Master Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">
                Career Trajectory
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-400 font-body leading-relaxed mb-12">
              Stop guessing. Let our advanced AI analyze your profile against millions of data points to
              find your perfect role and bridge your skill gaps.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/dashboard"
                  className="ripple-effect group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white rounded-xl font-heading font-semibold text-lg overflow-hidden transition-all hover:shadow-[0_0_40px_-5px_rgba(249,115,22,0.5)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-xl blur-lg opacity-30 group-hover:opacity-75 animate-pulse" />
                  <span className="relative flex items-center gap-2">
                    Analyze My Profile
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="#demo"
                  className="ripple-effect inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.03] border border-white/10 text-zinc-300 rounded-xl hover:bg-white/[0.08] hover:text-white hover:border-white/20 transition-all font-heading font-medium text-lg backdrop-blur-sm"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </Link>
              </motion.div>
            </div>
          </Reveal>

          {/* Scroll indicator */}
          <Reveal delay={0.5}>
            <motion.div
              className="mt-20 flex flex-col items-center gap-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Scroll to explore</span>
              <div className="w-5 h-8 rounded-full border border-zinc-600 flex items-start justify-center p-1">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-accent"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          </Reveal>
        </div>
      </motion.section>

      {/* ═══ FEATURES SECTION ═══ */}
      <section id="features" className="relative z-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Features"
            title="Everything you need to land your dream job"
            subtitle="Powered by cutting-edge AI that understands your career trajectory, not just keywords."
          />

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main Feature - Large */}
            <div className="md:col-span-8">
              <Reveal>
                <motion.div
                  className="h-full p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 group overflow-hidden relative"
                  whileHover={{ y: -4 }}
                >
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
                  <div className="relative z-10">
                    <motion.div
                      className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:border-blue-500/40 transition-colors"
                      whileHover={{ rotate: [0, -5, 5, 0] }}
                    >
                      <Target className="w-7 h-7 text-blue-400" />
                    </motion.div>
                    <h3 className="text-2xl font-heading font-bold text-white mb-3">
                      Precision Job Matching
                    </h3>
                    <p className="text-zinc-400 font-body text-lg leading-relaxed max-w-2xl group-hover:text-zinc-300 transition-colors">
                      Our proprietary algorithm doesn&apos;t just match keywords. It understands semantic
                      relevance, experience context, and industry trends to score jobs with 98% accuracy.
                    </p>
                    <div className="mt-8 flex gap-4">
                      {[98, 95, 92].map((score, i) => (
                        <motion.div
                          key={i}
                          className="flex flex-col items-center gap-1"
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.15 }}
                          viewport={{ once: true }}
                        >
                          <div className="w-14 h-14 rounded-full border-2 border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400 group-hover:border-blue-500/60 group-hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)] transition-all duration-500">
                            {score}%
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            </div>

            {/* Smaller Feature */}
            <div className="md:col-span-4">
              <FeatureCard
                icon={Sparkles}
                title="Skill Gap Analysis"
                description="Identify exactly what's missing from your resume to land the role you want."
                iconColor="text-accent"
                iconBg="bg-accent/10"
                delay={0.1}
              />
            </div>

            {/* Bottom row: 3 equal cards */}
            <div className="md:col-span-4">
              <FeatureCard
                icon={FileSearch}
                title="CV Intelligence"
                description="Upload your CV and get instant AI-powered feedback, skill extraction, and improvement tips."
                iconColor="text-emerald-400"
                iconBg="bg-emerald-500/10"
                delay={0.1}
              />
            </div>
            <div className="md:col-span-4">
              <FeatureCard
                icon={Zap}
                title="Real-Time Alerts"
                description="Get notified instantly when a high-match job appears. Never miss a perfect opportunity."
                iconColor="text-amber-400"
                iconBg="bg-amber-500/10"
                delay={0.2}
              />
            </div>
            <div className="md:col-span-4">
              <FeatureCard
                icon={BarChart3}
                title="Market Analytics"
                description="Track which skills are trending in your industry and plan your career path accordingly."
                iconColor="text-purple-400"
                iconBg="bg-purple-500/10"
                delay={0.3}
              />
            </div>

            {/* Wide Feature - Explore Trends CTA */}
            <div className="md:col-span-12">
              <Reveal delay={0.1}>
                <motion.div
                  className="p-8 rounded-3xl bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl relative overflow-hidden group"
                  whileHover={{ y: -2 }}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <motion.div
                          className="p-2 bg-emerald-500/10 rounded-lg"
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <TrendingUp className="w-6 h-6 text-emerald-400" />
                        </motion.div>
                        <span className="text-emerald-400 font-bold tracking-wider text-sm uppercase">
                          Live Market Data
                        </span>
                      </div>
                      <h3 className="text-2xl font-heading font-bold text-white mb-3">
                        Real-Time Skill Trending
                      </h3>
                      <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors">
                        Stay ahead of the curve. See which technologies are gaining traction in your
                        specific industry and location before they become requirements.
                      </p>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                      <Link
                        href="/dashboard/trending"
                        className="ripple-effect whitespace-nowrap px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300 transition-all duration-300 flex items-center gap-2"
                      >
                        Explore Trends{' '}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DEMO SECTION ═══ */}
      <section id="demo" className="relative z-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="How It Works"
            title="See Career Agent in action"
            subtitle="Three simple steps from upload to your dream job."
            badgeColor="text-purple-400"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: '01',
                title: 'Upload Your CV',
                description:
                  'Drop your resume and our AI instantly extracts skills, experience, and qualifications.',
                icon: FileSearch,
                color: 'accent',
              },
              {
                step: '02',
                title: 'Get Matched',
                description:
                  'Our algorithm scans thousands of jobs and ranks them by how well they fit your profile.',
                icon: Target,
                color: 'blue-400',
              },
              {
                step: '03',
                title: 'Bridge the Gap',
                description:
                  'See exactly which skills to learn next to unlock higher-paying roles in your field.',
                icon: TrendingUp,
                color: 'emerald-400',
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 0.15}>
                <motion.div
                  className="relative p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl group hover:bg-white/[0.06] transition-all duration-500"
                  whileHover={{ y: -6 }}
                >
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-white/[0.02] to-transparent" />
                  <div className="relative z-10">
                    <span className="text-5xl font-heading font-bold text-white/[0.06] group-hover:text-white/[0.1] transition-colors">
                      {item.step}
                    </span>
                    <motion.div
                      className="mt-4 mb-6"
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                    >
                      <item.icon className={`w-10 h-10 text-${item.color}`} />
                    </motion.div>
                    <h3 className="text-xl font-heading font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>

          {/* Demo Visual: Mock dashboard preview */}
          <Reveal>
            <motion.div
              className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-2xl"
              whileHover={{ y: -4 }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-zinc-800 text-zinc-500 text-xs">
                    careeragent.ai/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard preview mockup */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="h-4 w-32 bg-zinc-700 rounded" />
                    <div className="h-3 w-20 bg-zinc-800 rounded mt-2" />
                  </div>
                </div>

                {/* Mock job cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { score: 96, title: 'Senior React Dev', company: 'TechCorp', color: 'emerald' },
                    { score: 89, title: 'Full Stack Lead', company: 'StartupXYZ', color: 'emerald' },
                    { score: 74, title: 'Frontend Architect', company: 'BigCo', color: 'accent' },
                  ].map((job, i) => (
                    <motion.div
                      key={i}
                      className="p-4 rounded-xl bg-zinc-800/60 border border-white/5 group/card hover:border-white/10 transition-all"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.15 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${job.color === 'emerald'
                              ? 'border-emerald-500/40 text-emerald-400'
                              : 'border-accent/40 text-accent'
                            }`}
                        >
                          {job.score}%
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{job.title}</div>
                          <div className="text-xs text-zinc-500">{job.company}</div>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
                          React
                        </div>
                        <div className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
                          TypeScript
                        </div>
                        <div className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400">
                          AWS
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Gradient overlay at bottom */}
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-zinc-900/80 to-transparent" />
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ═══ PRICING SECTION ═══ */}
      <section id="pricing" className="relative z-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Pricing"
            title="Simple, transparent pricing"
            subtitle="Start free. Upgrade when you're ready to supercharge your career search."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <PricingCard
              plan="Free"
              price="Free"
              description="Get started with core features"
              features={[
                'Upload & parse your CV',
                'Up to 5 job searches/month',
                'Basic skill gap analysis',
                'Match score for each job',
                'Search history tracking',
              ]}
              cta="Get Started Free"
              href="/signup"
            />
            <PricingCard
              plan="Pro"
              price="$19"
              description="Unlock your full career potential"
              features={[
                'Everything in Free',
                'Unlimited job searches',
                'Advanced AI skill analysis',
                'Real-time job alerts',
                'Market trend analytics',
                'Priority support',
              ]}
              cta="Start Pro Trial"
              href="/signup"
              popular
              delay={0.1}
            />
          </div>
        </div>
      </section>

      {/* ═══ ABOUT SECTION ═══ */}
      <section id="about" className="relative z-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                  <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
                    About Us
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
                  Built by people who&apos;ve been there
                </h2>
                <p className="text-zinc-400 text-lg leading-relaxed mb-6">
                  We&apos;ve experienced the frustration of applying to hundreds of jobs, not knowing which skills
                  to learn next, and feeling lost in a competitive market.
                </p>
                <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                  Career Agent was built to give every job seeker an AI-powered advantage. Our platform
                  analyzes real market data, understands your unique profile, and gives you a clear path
                  forward.
                </p>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: '50K+', label: 'Users' },
                    { value: '2M+', label: 'Jobs Analyzed' },
                    { value: '98%', label: 'Match Accuracy' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.06] transition-all duration-300"
                      whileHover={{ y: -2 }}
                    >
                      <div className="text-2xl font-heading font-bold text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-xs text-zinc-400">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* About visual */}
            <Reveal direction="right" delay={0.2}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-purple-500/10 blur-[80px] rounded-full" />
                <div className="relative p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-white">Privacy First</h4>
                        <p className="text-sm text-zinc-400">Your data is encrypted and never sold</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-white">Lightning Fast</h4>
                        <p className="text-sm text-zinc-400">
                          Results in seconds, not hours
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-white">Data Driven</h4>
                        <p className="text-sm text-zinc-400">
                          Decisions backed by real market intelligence
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section className="relative z-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-purple-500/10 to-accent/20" />
              <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-xl" />

              <div className="relative z-10 py-16 px-8 text-center">
                <motion.div
                  className="mb-6"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-10 h-10 text-accent mx-auto" />
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
                  Ready to take control of your career?
                </h2>
                <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
                  Join thousands of professionals who found their perfect role with Career Agent.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href="/signup"
                      className="ripple-effect inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white rounded-xl font-heading font-semibold text-lg hover:shadow-[0_0_40px_-5px_rgba(249,115,22,0.5)] transition-all"
                    >
                      Get Started Free
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-white/5 bg-black/50 backdrop-blur-sm py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 group mb-4">
                <Target className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                <span className="font-heading font-bold text-white">Career Agent</span>
              </Link>
              <p className="text-sm text-zinc-500">
                AI-powered career intelligence platform.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-heading font-bold text-zinc-300 mb-3">Product</h4>
              <div className="space-y-2">
                {['Features', 'Pricing', 'Demo'].map((item) => (
                  <Link
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="block text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-heading font-bold text-zinc-300 mb-3">Platform</h4>
              <div className="space-y-2">
                <Link href="/dashboard" className="block text-sm text-zinc-500 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link href="/dashboard/trending" className="block text-sm text-zinc-500 hover:text-white transition-colors">
                  Skill Trends
                </Link>
                <Link href="/dashboard/jobs" className="block text-sm text-zinc-500 hover:text-white transition-colors">
                  Job Search
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-heading font-bold text-zinc-300 mb-3">Account</h4>
              <div className="space-y-2">
                <Link href="/login" className="block text-sm text-zinc-500 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="block text-sm text-zinc-500 hover:text-white transition-colors">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-600 text-sm">&copy; 2026 Future Systems Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer">
                Privacy Policy
              </span>
              <span className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer">
                Terms of Service
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
