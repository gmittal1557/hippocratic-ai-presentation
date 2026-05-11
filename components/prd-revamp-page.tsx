"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Github,
  GraduationCap,
  Info,
  Mail,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react"
import { AppendixDialog } from "@/components/appendix-dialog"
import { cn } from "@/lib/utils"
import {
  trackSectionView,
  trackNavClick,
  trackTocClick,
  trackButtonClick,
  trackTabSwitch,
  trackToggle,
  trackExternalLink,
  trackPainPointSelect,
  trackMvpStepView,
  trackScrollDepth,
} from "@/lib/tracking"


const sectionItems = [
  { id: "cover",         label: "Cover",                nav: "" },
  { id: "author",        label: "About the Author",     nav: "" },
  { id: "toc",           label: "Table of Contents",    nav: "" },
  { id: "pain",          label: "The Core Problem",     nav: "The Problem" },
  { id: "personas",      label: "How an Agent Solves It", nav: "How It Solves It" },
  { id: "vision",        label: "What the Agent Does",  nav: "The Agent" },
  { id: "whyglean",      label: "Configuration",        nav: "Configuration" },
  { id: "mvp",           label: "Integration",          nav: "Integration" },
  { id: "openquestions", label: "Risks & Tradeoffs",    nav: "Risks" },
  { id: "close",         label: "Roadmap",              nav: "Roadmap" },
]

const SAFETYPORTAL_PLACEHOLDER = "[DEMO PLACEHOLDER — to be recorded from SafetyPortal]"

const painPoints = [
  {
    title: "The call that works can't be staffed on human labor",
    stat: "~9 EVENING NURSES NEEDED PER HIGH-VOLUME CENTER",
    detail:
      "Most centers' pre-procedure call happens 3–7 days before the procedure. The published RCT shows the call that actually moves prep adequacy is the one made the night before — but staffing it across a high-volume center doing 30,000 colonoscopies a year would require approximately 9 dedicated evening nurses.",
    tags: [
      { label: "Day -5 call: no effect", explanation: "Published cohort studies (Kohli et al., 2018; n=4,016) show scheduled Day -5 nurse calls have no measurable effect on prep adequacy" },
      { label: "Day -1 call: +11pp", explanation: "RCT (Liu et al., 2021; n=470) showed Day -1 telephone education improved adequate prep from 70.3% to 81.6%" },
      { label: "Unstaffable at scale", explanation: "A center doing 30,000 colonoscopies per year would need ~9 dedicated evening nurses just for pre-procedure calls" },
    ],
    example:
      "The RCT is published. The effect size is large. The reason hospitals haven't deployed this intervention is not lack of evidence — it's that they can't staff 9 evening nurses.",
  },
  {
    title: "Same-day cancellations cost $3M+ per year in preventable revenue",
    stat: "5.6–8.45% CANCELLATION RATE ACROSS U.S. ENDOSCOPY UNITS",
    detail:
      "At a high-volume GI service line doing 30,000 procedures a year, that's three million dollars or more in preventable annual revenue loss — plus the downstream cost of repeat procedures within 12 months (approximately $1,500 per case). The central scenario: 8 percentage point reduction in inadequate prep × 30,000 procedures = $3.1M recovered annually.",
    tags: [
      { label: "$3.1M central case", explanation: "2,400 fewer inadequate prep cases × 40% cancellation recovery ($1K/slot) + 60% repeat procedure avoidance ($1.5K/case) = $3.1M annual" },
      { label: "5.6–8.45% cancellation", explanation: "ASGE GI Operations Benchmarking Survey 2019 across U.S. endoscopy units" },
      { label: "$1,500 repeat procedure", explanation: "Downstream cost of a repeat colonoscopy within 12 months when prep was inadequate" },
    ],
    example:
      "Conservative scenario: 14% inadequate prep rate vs. 20% baseline = ~$720K recovered. Central: 12% = ~$3.1M. Optimistic (full RCT effect): 9% = ~$4.8M.",
  },
  {
    title: "Prep failure is a patient burden, not just a revenue problem",
    stat: "30% OF COLONOSCOPY MISSES ARE PREP-RELATED — THE SINGLE LARGEST CAUSE",
    detail:
      "A colonoscopy that fails because of prep is a patient who took the day off work, drank a gallon of laxative, found a ride to the hospital — and now has to do it all again. Twenty to twenty-five percent of colonoscopies have inadequate bowel prep. About eight percent are cancelled or aborted same-day. Most of these failures are preventable.",
    tags: [
      { label: "20–25% inadequate prep", explanation: "Published cohort studies of GI endoscopy units show 20-25% of colonoscopies have inadequate bowel prep" },
      { label: "8% same-day cancellation", explanation: "Patients who cancel same-day took time off work, arranged rides, completed prep — and must do it all again" },
      { label: "Day off work, twice", explanation: "The patient burden extends well beyond the clinical and financial: it's a broken contract with the patient" },
    ],
    example:
      "A 58-year-old patient on blood thinners didn't understand when to hold her medication. The written instructions were unclear. She cancelled same-day. An agent call the night before would have caught this in 3 minutes.",
  },
]

const dataFlowSteps = [
  {
    label: "3 PM PULL",
    who: "EPIC EHR — Three hours before calls begin",
    what: "The agent reads the patient chart via FHIR R4: Appointment, Patient, ServiceRequest, Practitioner, MedicationStatement (filtered), Condition (filtered), Observation (recent labs), AllergyIntolerance, and DocumentReference (prep templates from the physician). All reads happen at 3 PM.",
    why: "Pre-loading at 3 PM means zero EHR-dependent latency during the actual patient call. Voice doesn't tolerate the silence of a mid-conversation tool call.",
  },
  {
    label: "6 PM CALL",
    who: "POLARIS LLM — Real-time conversation",
    what: "The agent calls every patient scheduled for colonoscopy at approximately 6 PM. It coaches them through their specific prep regimen, confirms medication holds, checks that an escort is arranged, triages symptoms in real time, and warm-transfers to the GI nurse on-call when escalation criteria are met.",
    why: "The Day -1 evening call is the highest-leverage intervention published in the literature. The agent makes the unstaffable workflow possible.",
  },
  {
    label: "6:05 PM WRITE-BACK",
    who: "EPIC EHR — Immediately after the call ends",
    what: "Structured DocumentReference note files in the patient chart. Communication resource records call disposition. Flag resource created if risk was identified. Observation resource captures patient-reported data. In-Basket message sent to GI nurse pool if escalation was triggered during the call.",
    why: "The GI nurse team sees the call summary in their existing In-Basket workflow — no new dashboard required.",
  },
]

const configCards = [
  {
    icon: "📋",
    title: "Per-customer configuration",
    body: "Service-type codes (SNOMED, Epic-internal, or local), In-Basket pool routing, note type for write-back, and escalation triggers. These are site-specific — the 30-minute deployment-week-one session per customer.",
    items: ["Service-type codes", "In-Basket pool routing", "Note type for write-back", "Escalation triggers (vomiting count, prep timing slippage, missing escort)"],
  },
  {
    icon: "👨‍⚕️",
    title: "Per-physician configuration",
    body: "Each GI physician has standing prep preferences. Dr. Smith uses split-dose SUPREP. Dr. Patel uses MoviPrep. Anticoagulant hold rules and insulin adjustment protocols may differ within a single site.",
    items: ["Prep regimen by physician", "Perioperative protocol per physician", "Anticoagulant hold rules", "Insulin adjustment protocols"],
  },
]

const hippocraticRisks = [
  {
    num: "01",
    title: "Will GI nurses adopt the agent — or route around it?",
    why: "Nurses worry the agent will replace them or generate too many false escalations and waste their time. A failed adoption looks like nurses ignoring agent flags.",
    answer: "Position the agent as a triage layer that increases nurse leverage — they get higher-quality escalations, not more volume. Track escalation precision (percent of escalated calls where the nurse actually intervened) as a primary metric. Co-design escalation rules with the GI service line in deployment week one.",
  },
  {
    num: "02",
    title: "Will patients hang up before the agent establishes what it is?",
    why: "Patients hate cold-call IVRs and may hang up before the agent can establish what it is. Older patients in particular may distrust the medium.",
    answer: "Caller ID branding (the call shows 'Cleveland Clinic GI' not a random number). Opt-in at scheduling so patients are pre-warned. Evening time window respected (no calls before 5 PM or after 9 PM). Immediate handoff to a human within 30 seconds when patient asks. Hippocratic's published 9.0/10 patient ratings on existing post-discharge agents are evidence the approach works.",
  },
  {
    num: "03",
    title: "Can we support non-English patients on day one?",
    why: "A high-volume AMC serves Spanish, Mandarin, Vietnamese, and other-language patients. Day-one deployment in English only would exclude the populations who most need attention.",
    answer: "Day-one deployment includes English and Spanish. Phase two expands per customer demand. Better to escalate to a human nurse for non-supported languages than to attempt a poor agent experience.",
  },
  {
    num: "04",
    title: "Bowel prep regimen choice doesn't live in a FHIR field",
    why: "The hardest deployment problem isn't the technology — it's that physician prep preferences aren't structured data. They're in physician heads, PDFs, and decades-old standing orders.",
    answer: "Capture in deployment week one: a 30-minute structured session per customer to map prep regimens by physician. Track time-to-configure per new deployment. Build a configuration wizard that pre-populates common regimens by physician name as we accumulate more sites.",
  },
]

const roadmapPhases = [
  {
    version: "NOW",
    window: "THIS USE CASE",
    headline: "Day -1 evening prep coaching agent.",
    items: [
      "Outbound voice call at 6 PM the evening before",
      "FHIR R4 reads via Epic at 3 PM",
      "Warm-transfer escalation to GI nurse on-call",
      "Structured note write-back to Epic after the call",
    ],
  },
  {
    version: "PHASE 2",
    window: "EXPAND THE FOOTPRINT",
    headline: "Transportation agent. Fear-of-findings agent for FIT-positive patients.",
    items: [
      "Transportation barrier agent (Uber Health / Lyft integration)",
      "Fear-of-findings agent for FIT-positive patients awaiting follow-up colonoscopy",
      "Multi-language expansion per customer demand",
      "Additional GI procedure types (EGD, EUS)",
    ],
  },
  {
    version: "PHASE 3",
    window: "PAYOR EXPANSION",
    headline: "HEDIS COL-FU attribution. Medicare Advantage contracts.",
    items: [
      "Payor deployment using provider outcome data as proof",
      "HEDIS COL-FU measure attribution (currently 35–65% completion nationwide)",
      "Medicare Advantage cost avoidance ($2.4M per 200K-member plan)",
      "Per-call outcome data enables fast payor sale",
    ],
  },
]

const whoItChanges = [
  {
    icon: "gi-clinic",
    label: "GI Clinic",
    tagline: "Recover $3M+ in preventable revenue",
    outcomes: [
      "Reduce same-day cancellation rate by 5–8 percentage points",
      "Free nursing staff from low-complexity evening calls",
      "Structured documentation in existing Epic workflow",
    ],
  },
  {
    icon: "patient",
    label: "Patients",
    tagline: "One less thing to get wrong",
    outcomes: [
      "Real-time coaching the evening it matters most",
      "Medication hold confirmation they can trust",
      "Warm handoff to a human nurse if anything is wrong",
    ],
  },
  {
    icon: "nurses",
    label: "GI Nurses",
    tagline: "Handle escalations, not routine calls",
    outcomes: [
      "Receive only calls where a nurse can actually change the outcome",
      "In-Basket summary before they call back — no cold starts",
      "Escalation precision tracked as a deployment metric",
    ],
  },
  {
    icon: "payors",
    label: "Payors",
    tagline: "HEDIS COL-FU attribution at scale",
    outcomes: [
      "Reduce repeat procedures within 12 months ($1,500/case avoided)",
      "HEDIS COL-FU completion improvement with audit trail",
      "Provider outcome data enables fast contract negotiation",
    ],
  },
]

function Slide({
  id,
  badge,
  title,
  subtitle,
  headerExtra,
  children,
  narrow = false,
}: {
  id: string
  badge?: string
  title: string
  subtitle?: string
  headerExtra?: React.ReactNode
  children: React.ReactNode
  narrow?: boolean
}) {
  return (
    <section id={id} className="min-h-screen border-b border-border/60 px-6 py-28 md:px-10 lg:px-14 scroll-mt-16">
      <div className={cn("mx-auto w-full", narrow ? "max-w-4xl" : "max-w-6xl")}>
        <header className="mb-10">
          {badge && (
            <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.18em] text-primary">{badge}</p>
          )}
          <h2 className="max-w-4xl text-3xl font-semibold leading-[1.08] tracking-[-0.02em] md:text-5xl">{title}</h2>
          {subtitle && <p className="mt-4 max-w-3xl text-base leading-[1.72] text-muted-foreground md:text-lg">{subtitle}</p>}
          {headerExtra}
        </header>
        {children}
      </div>
    </section>
  )
}

function SectionDivider({ title }: { title: string }) {
  return (
    <section className="flex min-h-[30vh] items-center border-b border-border/60 bg-[#e2ded8] px-6 py-12 md:px-10 lg:px-14">
      <div className="mx-auto w-full max-w-6xl">
        <h3 className="text-2xl font-semibold tracking-[-0.02em] text-[#1c1c1c] md:text-4xl">{title}</h3>
      </div>
    </section>
  )
}

function CollapsibleDrawer({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
      >
        <span className="text-base font-semibold tracking-[-0.01em]">{title}</span>
        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-6 py-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function PrdRevampPage() {
  const [progress, setProgress] = useState(0)
  const [activeSection, setActiveSection] = useState("cover")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedPain, setSelectedPain] = useState(0)
  const [hasHovered, setHasHovered] = useState(false)
  const [activeDataFlowStep, setActiveDataFlowStep] = useState(0)
  const [activeConfigTab, setActiveConfigTab] = useState<"per-customer" | "per-physician" | "demo">("per-customer")
  const [activeIntegrationTab, setActiveIntegrationTab] = useState<"architecture" | "dataflow" | "auth">("architecture")
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const [openRisk, setOpenRisk] = useState(false)
  const [openProviderFirst, setOpenProviderFirst] = useState(false)
  const [impactModalOpen, setImpactModalOpen] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const prevSectionRef = useRef("cover")

  useEffect(() => {
    const onScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0
      setProgress(pct)
      trackScrollDepth(pct)

      for (let i = sectionItems.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionItems[i].id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= window.innerHeight * 0.25) {
          const newSection = sectionItems[i].id
          if (newSection !== prevSectionRef.current) {
            prevSectionRef.current = newSection
            trackSectionView(newSection)
          }
          setActiveSection(newSection)
          break
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrer: document.referrer || "direct" }),
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) setIsMenuOpen(false)
    }
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setIsMenuOpen(false); setImpactModalOpen(false) }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [])

  const activeNav = sectionItems.find((s) => s.id === activeSection)

  const scrollTo = (id: string, source?: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setIsMenuOpen(false)
    if (source) trackNavClick(`${source}:${id}`)
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground" style={{ fontFamily: "Arial, system-ui, sans-serif" }}>
      {/* Progress bar */}
      <div className="fixed left-0 top-0 z-[70] h-[3px] bg-primary transition-all" style={{ width: `${progress}%` }} />

      {/* Nav */}
      <header className="fixed left-0 right-0 top-[3px] z-[60] border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5 md:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium tracking-[-0.01em] text-muted-foreground">Gaurav Mittal</span>
            <a
              href="https://github.com/gmittal1557"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackExternalLink("github", "https://github.com/gmittal1557")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="Open GitHub"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://www.linkedin.com/in/iamgauravmittal/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackExternalLink("linkedin", "https://www.linkedin.com/in/iamgauravmittal/")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5zM.5 8h4V23h-4V8zm7 0h3.8v2.05h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-7.63c0-1.82-.03-4.16-2.54-4.16-2.54 0-2.93 1.98-2.93 4.03V23h-4V8z" />
              </svg>
            </a>
            <a
              href="mailto:gmittal1557@gmail.com"
              onClick={() => trackExternalLink("email", "mailto:gmittal1557@gmail.com")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="Email"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-expanded={isMenuOpen}
              className="flex items-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-xs font-medium text-primary transition hover:border-border hover:bg-secondary"
            >
              <span className="uppercase tracking-wide">{activeNav?.nav || "Sections"}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition", isMenuOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-[calc(100%+8px)] z-[80] w-60 rounded-lg border border-border bg-background p-1 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
                >
                  {sectionItems.filter((item) => item.nav).map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id, "menu")}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition",
                        activeSection === item.id ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <span className="w-5 font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                      <span className="tracking-[0.01em]">{item.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ─── COVER ─── */}
      <section id="cover" className="relative flex min-h-screen items-center justify-center px-6 pt-24 text-center md:px-10">
        <div className="mx-auto max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-4xl font-semibold leading-[0.94] tracking-[-0.03em] sm:text-5xl md:text-7xl lg:text-8xl"
          >
            The check-in call<br className="hidden sm:block" /> the night before<br className="hidden sm:block" /> colonoscopy.
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mx-auto my-6 h-[2px] w-28 bg-primary"
          />
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.55 }}
            className="text-lg leading-[1.45] text-muted-foreground md:text-2xl"
          >
            Prevents costly same-day colonoscopy cancellations across the schedule.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mx-auto mt-4 text-[11px] font-mono text-muted-foreground/60"
          >
            For Hippocratic AI · Agent Deployment Architect
          </motion.p>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            onClick={() => { scrollTo("toc"); trackButtonClick("scroll_to_explore", "cover") }}
            className="mx-auto mt-16 inline-flex items-center gap-2 text-xs text-muted-foreground"
          >
            Scroll to explore
            <ArrowDown className="h-4 w-4" />
          </motion.button>
        </div>
      </section>

      <SectionDivider title="About the Author" />

      {/* ─── ABOUT THE AUTHOR ─── */}
      <section id="author" className="relative border-b border-border/60 px-6 py-28 md:px-10 lg:px-14 scroll-mt-16 bg-[#f5f3f0]/60">
        <div className="mx-auto w-full max-w-6xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-[11px] font-mono uppercase tracking-[0.18em] text-primary"
          >
            ABOUT THE AUTHOR
          </motion.p>

          <div className="flex flex-col gap-10 md:flex-row md:gap-12">
            {/* Left column */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full md:w-[320px] md:flex-shrink-0"
            >
              <div className="rounded-xl overflow-hidden w-full md:w-[320px] border border-border shadow-lg hover:scale-[1.02] transition-transform duration-300 aspect-[4/5] md:h-[400px] md:aspect-auto">
                <Image src="/images/author-baa.jpg" alt="Gaurav Mittal at the Boston Marathon B.A.A." width={320} height={400} className="h-full w-full object-cover" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-4 rounded-lg px-4 py-4 bg-muted/60 border border-border hover:border-primary/30 transition-colors duration-200"
              >
                <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Outside Work</p>
                <div className="space-y-2 text-[15px] text-muted-foreground">
                  <p>🏃 Boston Marathon finisher</p>
                  <p>🃏 Bridge enthusiast</p>
                  <p>🌶️ Ghost pepper survivor</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right column */}
            <div className="flex-1 min-w-[280px]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h3 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">Gaurav Mittal</h3>
                <div className="mt-2 h-[2px] w-14 bg-primary" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    IIT Kanpur CS
                  </span>
                  <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Tuck MBA (Dartmouth)
                  </span>
                </div>
                <p className="mt-3 text-[14px] italic text-muted-foreground">
                  &ldquo;I build AI agents that work in messy, real-world environments, at scale.&rdquo;
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-8 mb-5 text-[11px] font-mono uppercase tracking-[0.18em] text-primary"
              >
                EXPERIENCE
              </motion.p>

              <div className="space-y-3">
                {[
                  { company: "EY-Parthenon", title: "Director of PM", desc: "Building AI agents for Fortune 500 clients", delay: 0.2 },
                  { company: "CarGurus", title: "Group PM", desc: "Scaled auto financing platform and LLM dealer copilot", delay: 0.25 },
                  { company: "Swiggy", title: "PM", desc: "Search and discovery for India’s largest food marketplace", delay: 0.3 },
                  { company: "Travel.AI", title: "Co-Founder", desc: "Built a travel app for backpackers", delay: 0.35 },
                ].map((entry) => (
                  <motion.div
                    key={entry.company}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: entry.delay }}
                    className="rounded-lg border border-border/50 bg-card/80 px-4 py-3 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                      <span className="text-primary">→</span>
                      <span className="font-semibold">{entry.company}</span>
                      <span className="text-[12px] font-mono ml-1 text-primary">{entry.title}</span>
                    </div>
                    <p className="ml-5 mt-1 text-[13px] text-muted-foreground">{entry.desc}</p>
                  </motion.div>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="mt-6 border-t border-border/40 pt-4 text-[15px] italic text-muted-foreground"
              >
                The common thread: complex domains where AI has to earn trust before it can scale.
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TABLE OF CONTENTS ─── */}
      <Slide id="toc" badge="Hippocratic AI · Agent Deployment Architect" title="Table of Contents" narrow>
        <ol className="space-y-2">
          {sectionItems.filter((s) => s.nav).map((item, i) => (
            <li key={item.id}>
              <button
                onClick={() => { scrollTo(item.id); trackTocClick(item.id) }}
                className="group flex w-full items-center justify-between rounded-lg border border-border/70 px-4 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-sm md:text-base">{item.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </button>
            </li>
          ))}
        </ol>
      </Slide>

      <SectionDivider title="The Core Problem" />

      {/* ─── 01: THE CORE PROBLEM ─── */}
      <Slide
        id="pain"
        badge="01 THE CORE PROBLEM"
        title="The call that works can't be staffed."
        subtitle="The published RCT shows what fixes prep adequacy. The reason hospitals haven't deployed it is simple: you can't staff 9 evening nurses."
        headerExtra={<p className="mt-2 text-[10px] text-muted-foreground/40 italic">Sources: Liu et al. 2021; Kohli et al. 2018; ASGE GI Operations Benchmarking Survey 2019</p>}
      >
        <div className="grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex h-full flex-col gap-3">
            <p className="mb-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Select a problem</p>
            {painPoints.map((point, idx) => (
              <button
                key={point.title}
                onClick={() => { setSelectedPain(idx); trackPainPointSelect(idx, point.title) }}
                className={cn(
                  "w-full flex-1 cursor-pointer rounded-xl border p-4 text-left transition hover:border-l-[3px] hover:border-l-primary/50",
                  selectedPain === idx
                    ? "border-primary/35 border-l-[3px] border-l-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/30"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-primary">{point.stat}</p>
                    <p className="mt-1 text-sm font-semibold">{point.title}</p>
                  </div>
                  <ChevronRight className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", selectedPain === idx ? "text-primary" : "text-muted-foreground")} />
                </div>
              </button>
            ))}
          </div>

          <div className="h-full min-h-[400px] rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-mono uppercase tracking-wider text-primary">WHAT THIS MEANS</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPain}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.01em]">{painPoints[selectedPain].title}</h3>
                <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="mb-2 text-xs font-mono uppercase tracking-wider text-primary">Example:</p>
                  <p className="text-sm leading-[1.65] text-muted-foreground">{painPoints[selectedPain].example}</p>
                </div>
                <p className="mt-3 text-sm leading-[1.72] text-muted-foreground">{painPoints[selectedPain].detail}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {painPoints[selectedPain].tags.map((tag) => (
                    <div key={tag.label} className="group relative" onMouseEnter={() => setHasHovered(true)} onClick={() => setHasHovered(true)}>
                      <div className="cursor-default rounded-lg border border-dashed border-border bg-background px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 active:border-primary/40 active:bg-primary/5">
                        <span className="inline-flex items-center gap-1.5">
                          {tag.label}
                          <Info className="h-3 w-3 text-muted-foreground/50" />
                        </span>
                      </div>
                      <div className="absolute bottom-full left-0 z-10 mb-2 hidden w-52 rounded-lg border border-border bg-background p-2 text-xs text-muted-foreground shadow-lg group-hover:block group-focus-within:block">
                        {tag.explanation}
                      </div>
                    </div>
                  ))}
                </div>
                {!hasHovered && (
                  <p className="mt-2 text-[10px] italic text-muted-foreground/40">Tap any tag for details</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-primary/20 bg-primary/5 px-6 py-5 text-center">
          <p className="text-base font-semibold text-foreground md:text-lg">
            The problem isn't a lack of clinical knowledge. It's a staffing problem.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The call that fixes prep adequacy has already been proven in a published RCT. The reason hospitals haven't deployed it is not lack of evidence — it's that no GI service line can sustain 9 dedicated evening nurses.
          </p>
        </div>
      </Slide>

      <SectionDivider title="How a Voice Agent Solves It" />

      {/* ─── 02: HOW AN AGENT SOLVES IT ─── */}
      <Slide id="personas" badge="02 HOW AN AGENT SOLVES IT" title="The unstaffable workflow becomes possible.">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_auto_1fr]">
          {/* Left: current state */}
          <div className="h-full rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-mono uppercase text-red-600">
              Without the agent
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Current practice at most high-volume GI centers.
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              {[
                "Mailed instructions only — patients receive written prep materials at scheduling",
                "Day -5 nurse call — scheduled, but published data shows no measurable effect on prep adequacy",
                "No real-time coaching the night before when patients are actually following instructions",
                "Same-day cancellation when prep fails — the patient took time off, arranged a ride, completed prep",
                "~9 evening nurses required to staff a Day -1 call program at a high-volume center",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center: stat */}
          <div className="order-first w-full lg:order-none lg:w-[280px]">
            <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-[#1c1c1c] p-8 text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500 mb-4">Annual value per high-volume site</p>
              <p className="text-6xl font-semibold text-white tracking-tight">$3M+</p>
              <div className="my-4 h-px w-12 bg-primary" />
              <p className="text-xs text-gray-400 leading-relaxed">in preventable revenue recovered by deploying a Day -1 voice agent across a 30,000-procedure GI service line</p>
            </div>
            <p className="mt-3 text-center text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Central scenario math
            </p>
          </div>

          {/* Right: with agent */}
          <div className="h-full rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-mono uppercase text-primary">
              With Day -1 voice agent
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              What changes with a Hippocratic AI voice agent calling at 6 PM.
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              {[
                "Calls every patient at 6 PM the evening before — at the moment they are following instructions",
                "Coaches through the specific prep regimen ordered by their physician",
                "Confirms medication holds for patients on anticoagulants, insulin, or Ozempic",
                "Triages symptoms in real time and warm-transfers to GI nurse when escalation criteria are met",
                "Scales to 30,000 calls per year without adding evening nursing staff",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">Metric</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Mailed instructions</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Day -5 nurse call</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-primary border-l-2 border-l-primary">Day -1 evening agent</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: "Reaches patients", mailed: "At distribution", d5: "Scheduled time", d1: "At the moment of action" },
                { metric: "Coaching when needed", mailed: "No", d5: "No", d1: "Yes" },
                { metric: "Scales to 1,000s/night", mailed: "N/A", d5: "No (~$700K nursing cost)", d1: "Yes" },
                { metric: "Published outcome impact", mailed: "Baseline", d5: "No measurable improvement", d1: "+11pp prep adequacy" },
              ].map((row, idx) => (
                <tr key={row.metric} className={cn("border-b border-border last:border-b-0", idx % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                  <td className="px-4 py-3 font-semibold">{row.metric}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.mailed}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.d5}</td>
                  <td className="px-4 py-3 font-medium text-foreground border-l-2 border-l-primary bg-primary/5">{row.d1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CollapsibleDrawer title="See the scenario math">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[500px] text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold">Scenario</th>
                  <th className="px-4 py-3 text-left font-semibold">Inadequate prep rate after</th>
                  <th className="px-4 py-3 text-left font-semibold">Annual recovered value</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { s: "Conservative", rate: "14% (vs. 20% baseline)", value: "~$720K" },
                  { s: "Central", rate: "12%", value: "~$3.1M" },
                  { s: "Optimistic (full RCT effect)", rate: "9%", value: "~$4.8M" },
                ].map((row, idx) => (
                  <tr key={row.s} className={cn("border-b border-border last:border-b-0", idx === 1 && "font-semibold")}>
                    <td className="px-4 py-3">{row.s}</td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{row.rate}</td>
                    <td className="px-4 py-3">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Central case: 30,000 colonoscopies × 8 percentage point reduction in inadequate prep = 2,400 fewer inadequate prep cases per year. Of those, approximately 40% would have led to outright cancellation (recovered at $1,000 contribution margin per slot = $960K) and 60% would have led to repeat procedures within 12 months (avoided cost at $1,500 per case = $2.16M). Total: $3.1M recovered annually per high-volume site.
          </p>
        </CollapsibleDrawer>
      </Slide>

      <SectionDivider title="What the Agent Does" />

      {/* ─── 03: WHAT THE AGENT DOES ─── */}
      <Slide
        id="vision"
        badge="03 THE AGENT"
        title="Six PM. Every patient. Every evening."
        subtitle="A voice agent that calls every patient scheduled for colonoscopy at approximately 6 PM the evening before — coaches them through bowel prep, catches errors in real time, and escalates to a GI nurse when prep is failing."
      >
        {/* Dark anchor block */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="my-8 rounded-2xl bg-[#1c1c1c] px-6 py-8 md:px-10 md:py-12"
        >
          <p className="text-center text-xl font-semibold leading-snug text-gray-400 sm:text-2xl md:text-3xl">
            Every tool before this gave patients written instructions.
          </p>
          <p className="mt-2 text-center text-xl font-bold leading-snug text-white sm:text-2xl md:text-3xl">
            This agent calls the night it matters — when the patient is actually following them.
          </p>
          <div className="mx-auto mt-6 h-[2px] w-12 bg-primary" />
          <p className="mt-4 text-center text-sm text-gray-500">
            That's the difference between instructions and coaching.
          </p>
        </motion.div>

        {/* Does / Doesn't */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <div className="mb-3 grid grid-cols-1 sm:grid-cols-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-primary">WHAT IT DOES</p>
            <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground sm:mt-0">WHAT IT DELIBERATELY DOES NOT DO</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-border">
            <div className="sm:pr-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                {[
                  "Coaches through the exact prep regimen ordered by their physician",
                  "Confirms medication holds (anticoagulants, insulin, Ozempic)",
                  "Triages symptoms in real time (vomiting, bleeding, uncertainty)",
                  "Confirms logistics: nothing by mouth time, escort arranged",
                  "Documents structured note in Epic after the call ends",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="sm:pl-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                {[
                  "Does not schedule or reschedule appointments",
                  "Does not diagnose symptoms or interpret lab values",
                  "Does not address transportation barriers or financial questions",
                  "Does not replace the GI nurse — escalates to one",
                  "Does not make clinical judgment calls — only escalates when criteria are met",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground font-mono text-xs">×</span>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data flow stepper */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[11px] font-mono uppercase tracking-wider text-primary">Call day timeline</p>
          </div>
          <div className="mb-6 flex gap-2 overflow-x-auto">
            {dataFlowSteps.map((step, i) => (
              <button
                key={step.label}
                onClick={() => {
                  setActiveDataFlowStep(i)
                  if (i > 0) setHasInteracted(true)
                  trackMvpStepView(step.label, i)
                }}
                className={cn(
                  "shrink-0 rounded-lg border px-4 py-2 text-xs font-mono uppercase tracking-wider transition",
                  activeDataFlowStep === i ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {step.label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDataFlowStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-border bg-background p-5"
            >
              <p className="mb-1 text-xs font-mono uppercase tracking-wider text-primary">{dataFlowSteps[activeDataFlowStep].who}</p>
              <p className="mb-3 text-sm leading-[1.72] text-foreground">{dataFlowSteps[activeDataFlowStep].what}</p>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="mb-1 text-xs font-mono text-primary">WHY THIS MATTERS</p>
                <p className="text-xs text-muted-foreground">{dataFlowSteps[activeDataFlowStep].why}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setActiveDataFlowStep((p) => Math.max(0, p - 1))} disabled={activeDataFlowStep === 0} className="text-xs text-muted-foreground transition hover:text-primary disabled:opacity-30">← Previous</button>
            <button onClick={() => setActiveDataFlowStep((p) => Math.min(dataFlowSteps.length - 1, p + 1))} disabled={activeDataFlowStep === dataFlowSteps.length - 1} className="text-xs text-muted-foreground transition hover:text-primary disabled:opacity-30">Next →</button>
          </div>
        </div>

        {/* Prototype placeholder */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs font-mono uppercase tracking-wider text-primary">SAFETYPORTAL DEMO</p>
          <span className="text-xs text-muted-foreground italic">— to be recorded</span>
        </div>
        <div className="h-[350px] rounded-2xl border-2 border-dashed border-border bg-muted/20 flex items-center justify-center md:h-[500px]">
          <div className="text-center p-8">
            <p className="font-mono text-sm text-muted-foreground mb-2">{SAFETYPORTAL_PLACEHOLDER}</p>
            <p className="text-xs text-muted-foreground/60">A 2–3 minute walkthrough showing the happy path (90 seconds) followed by the failure case: patient throwing up the prep, agent escalating to GI nurse with warm transfer.</p>
          </div>
        </div>

        <button
          onClick={() => { setImpactModalOpen(true); trackButtonClick("impact_modal", "vision") }}
          className="mt-4 ml-auto inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10"
        >
          See who this changes things for →
        </button>

        <CollapsibleDrawer title="See the conversation flow">
          <div className="space-y-4 text-sm text-muted-foreground">
            {[
              { step: "01 Greeting", desc: "Identity verification: confirm date of birth and last 4 of phone number before any clinical content." },
              { step: "02 Frame the call", desc: "\"This is an automated call from [Clinic] to help you prepare for your colonoscopy tomorrow. This will take about 5 minutes.\"" },
              { step: "03 Prep status check", desc: "Walk through the specific prep regimen ordered by their physician. Ask when they started, whether they've completed each phase. Branch on any deviation." },
              { step: "04 Medication confirmations", desc: "Confirm holds for anticoagulants, diabetes medications, and any flagged drugs from the pre-load. Escalate to nurse if patient hasn't held a required medication." },
              { step: "05 Logistics confirmation", desc: "Confirm nothing-by-mouth time, that an escort is arranged, and arrival time. Flag missing escort as escalation criterion if site config requires it." },
              { step: "06 Wrap-up / escalation", desc: "If all clear: confirm arrival time, provide clinic number for questions. If escalation triggered: warm transfer to GI nurse on-call. Structured note fires to Epic within seconds of call end." },
            ].map((item) => (
              <div key={item.step} className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs font-mono uppercase tracking-wider text-primary mb-1">{item.step}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CollapsibleDrawer>
      </Slide>

      <SectionDivider title="Configuration" />

      {/* ─── 04: CONFIGURATION ─── */}
      <Slide
        id="whyglean"
        badge="04 CONFIGURATION"
        title="Deployed in Hippocratic's SafetyPortal. Configured in a week."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {configCards.map((card) => (
            <div key={card.title} className="overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">{card.icon}</span>
                <h3 className="text-lg font-semibold tracking-[-0.01em]">{card.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-[1.72] text-muted-foreground">{card.body}</p>
              <div className="mt-4 space-y-1.5">
                {card.items.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tab switcher for per-customer / per-physician / demo */}
        <div className="mt-6 w-full overflow-hidden rounded-2xl border border-border bg-card p-6">
          <p className="mb-4 text-[11px] font-mono uppercase tracking-wider text-primary">Configuration details</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {([
              { key: "per-customer", label: "Per-customer" },
              { key: "per-physician", label: "Per-physician" },
              { key: "demo", label: "Demo walkthrough" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveConfigTab(tab.key); trackTabSwitch(tab.key, "configuration") }}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm transition-all duration-150",
                  activeConfigTab === tab.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground hover:border-primary/40 hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeConfigTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {activeConfigTab === "per-customer" && (
                <div className="space-y-4">
                  {[
                    { label: "Service-type codes", desc: "Your local codes for colonoscopy. Varies per site. Could be SNOMED, Epic-internal, or local." },
                    { label: "In-Basket pool routing", desc: "Which nurse pool gets escalations. Different sites route differently." },
                    { label: "Note type for write-back", desc: "Which Epic note type our structured notes file under. Must match an existing template the GI nurses already review." },
                    { label: "Escalation triggers", desc: "Site-specific risk thresholds. Vomiting count, prep timing slippage, missing escort." },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-background p-4">
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}
              {activeConfigTab === "per-physician" && (
                <div className="space-y-4">
                  {[
                    { label: "Prep regimens by physician", desc: "Each GI doc has standing preferences. Dr. Smith uses split-dose SUPREP. Dr. Patel uses MoviPrep. Captured in deployment week one." },
                    { label: "Perioperative protocol per physician", desc: "Anticoagulant hold rules, insulin adjustments. Per-site, sometimes per-physician within a site." },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-background p-4">
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <p className="text-sm font-medium text-primary">The hardest deployment problem isn't the technology.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Bowel prep regimen choice doesn't live in a standard FHIR field. It's a 30-minute working session per customer in deployment week one. Not a code problem — a configuration problem.</p>
                  </div>
                </div>
              )}
              {activeConfigTab === "demo" && (
                <div>
                  <div className="h-[280px] rounded-xl border-2 border-dashed border-border bg-muted/20 flex items-center justify-center mb-4">
                    <div className="text-center p-6">
                      <p className="font-mono text-sm text-muted-foreground">{SAFETYPORTAL_PLACEHOLDER}</p>
                      <p className="mt-2 text-xs text-muted-foreground/60">2–3 minute video walkthrough recorded from SafetyPortal.<br/>Happy path (90 sec) then failure case with warm-transfer escalation.</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-sm font-semibold mb-2">The Day -1 call for Mrs. Chen (composite patient)</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">58 years old, screening colonoscopy tomorrow, type 2 diabetic on Ozempic, on Eliquis. The first 90 seconds show the happy path. At 1:45 we walk through the failure case — patient throwing up the prep — and the warm-transfer escalation to the GI nurse on-call.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Slide>

      <SectionDivider title="Integration" />

      {/* ─── 05: INTEGRATION ─── */}
      <Slide
        id="mvp"
        badge="05 INTEGRATION"
        title="Five components. Four connections. FHIR R4 throughout."
        subtitle="Epic EHR pre-loads the patient chart at 3 PM. The agent calls at 6 PM using Polaris LLM over Twilio SIP. Structured write-back fires within seconds of the call ending."
      >
        {/* Architecture + FHIR flow stepper */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[11px] font-mono uppercase tracking-wider text-primary">System architecture</p>
          </div>
          <div className="flex flex-col gap-0 md:flex-row md:items-stretch md:gap-0 mb-6">
            {[
              { step: "Epic EHR", tech: "FHIR R4 / HL7 v2", desc: "Pre-call reads at 3 PM; write-backs at 6:05 PM" },
              { step: "Agent", tech: "Polaris LLM", desc: "Reasoning, turn-taking, escalation decisions" },
              { step: "Voice Stack", tech: "Twilio SIP", desc: "Outbound call, real-time audio, warm transfer" },
              { step: "Patient", tech: "Mobile phone", desc: "Real-time prep coaching conversation" },
              { step: "GI Nurse", tech: "In-Basket + warm transfer", desc: "Receives escalations when criteria met" },
            ].map((item, i, arr) => (
              <div key={item.step} className="flex items-stretch md:flex-1">
                <div className="flex flex-1 flex-col rounded-lg border border-border bg-background p-3 text-center">
                  <p className="text-xs font-semibold text-foreground">{item.step}</p>
                  <p className="mt-1 text-[10px] font-mono text-primary">{item.tech}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex items-center justify-center px-1 text-muted-foreground/30 md:px-2">
                    <span className="hidden md:inline">→</span>
                    <span className="md:hidden">↓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-2.5 text-center">
            <p className="text-xs text-muted-foreground">
              All FHIR reads happen at 3 PM. Pre-loaded data drives the call. No live EHR calls during the conversation. <span className="text-foreground font-medium">Voice doesn't tolerate mid-conversation latency.</span>
            </p>
          </div>
        </div>

        {/* Three-tab spec */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">EXPLORE THE INTEGRATION</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {([
              { key: "architecture", label: "Architecture" },
              { key: "dataflow", label: "Data flow" },
              { key: "auth", label: "Auth & deployment" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveIntegrationTab(tab.key); trackTabSwitch(tab.key, "integration") }}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm transition-all duration-150",
                  activeIntegrationTab === tab.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground hover:border-primary/40 hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeIntegrationTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

              {activeIntegrationTab === "architecture" && (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { title: "FHIR-first, hybrid in reality.", body: "The primary path is FHIR R4 for reads and most writes. HL7 v2 fallback for sites not yet FHIR-current. Epic-specific operations such as Communication.$send-in-basket for In-Basket messaging where standard FHIR doesn't cover the workflow." },
                      { title: "Pre-load discipline.", body: "The agent doesn't fetch data live during conversations. Comprehensive pre-load at 3 PM means zero EHR-dependent latency during patient calls. Voice doesn't tolerate the silence of a mid-conversation tool call. This is a deliberate safety and UX choice." },
                      { title: "The hardest deployment problem.", body: "Bowel prep regimen choice doesn't live in a standard FHIR field. It's a 30-minute working session per customer in deployment week one. Not a code problem — a configuration problem." },
                    ].map((card) => (
                      <div key={card.title} className="rounded-xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{card.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{card.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeIntegrationTab === "dataflow" && (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      {
                        time: "3 PM — pre-call pull",
                        items: ["Appointment", "Patient", "ServiceRequest", "Practitioner, Location", "Condition (filtered)", "MedicationStatement (filtered)", "Observation (recent labs)", "AllergyIntolerance", "DocumentReference (prep templates)"],
                      },
                      {
                        time: "6 PM — the call",
                        items: ["Voice over Twilio SIP", "Polaris LLM reasoning", "Real-time turn-taking", "Warm transfer on escalation", "No live FHIR calls during the call"],
                      },
                      {
                        time: "6:05 PM — write-back",
                        items: ["DocumentReference (structured note)", "Communication (call disposition)", "Flag (if risk identified)", "Observation (patient-reported data)", "In-Basket message (if escalation needed)"],
                      },
                    ].map((col) => (
                      <div key={col.time} className="rounded-xl border border-border bg-background p-4">
                        <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3 pb-2 border-b border-border">{col.time}</p>
                        <ul className="space-y-1">
                          {col.items.map((item) => (
                            <li key={item} className="text-xs font-mono text-muted-foreground border-b border-border/50 py-1 last:border-b-0">{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <CollapsibleDrawer title="Full FHIR resource map">
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full min-w-[600px] text-sm">
                        <thead className="bg-muted/40">
                          <tr className="border-b border-border">
                            <th className="px-4 py-3 text-left font-semibold">Resource</th>
                            <th className="px-4 py-3 text-left font-semibold">What we read</th>
                            <th className="px-4 py-3 text-left font-semibold">Why we read it</th>
                            <th className="px-4 py-3 text-left font-semibold">Variability</th>
                          </tr>
                        </thead>
                        <tbody>
                          {["Appointment", "ServiceRequest", "Patient", "Practitioner", "Location", "Condition", "MedicationStatement", "Observation", "AllergyIntolerance", "DocumentReference", "Procedure", "Communication"].map((resource, idx) => (
                            <tr key={resource} className={cn("border-b border-border last:border-b-0", idx % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                              <td className="px-4 py-3 font-mono text-xs">{resource}</td>
                              <td className="px-4 py-3 text-xs italic text-muted-foreground">[PLACEHOLDER]</td>
                              <td className="px-4 py-3 text-xs italic text-muted-foreground">[PLACEHOLDER]</td>
                              <td className="px-4 py-3 text-xs italic text-muted-foreground">[PLACEHOLDER]</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 text-xs italic text-muted-foreground/60">FHIR resource map to be completed during deployment week one discovery session.</p>
                  </CollapsibleDrawer>
                </div>
              )}

              {activeIntegrationTab === "auth" && (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">Auth & Security</p>
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        {[
                          "OAuth 2.0 + SMART-on-FHIR Backend Services profile",
                          "JWT-signed assertions, system-level scopes via Epic Vendor Services",
                          "TLS 1.3 in transit, audit logging at every PHI access point",
                          "HIPAA + HITRUST certified pipeline (Hippocratic-side)",
                          "PHI never logged to LLM provider; minimum-necessary in agent prompt",
                          "Identity verification (DOB + last 4 of phone) before any clinical content",
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 md:col-span-2">
                      <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">Deployment Timeline</p>
                      <div className="space-y-2">
                        {[
                          { phase: "Week 1", desc: "Discovery — service-type codes, In-Basket pool, note type mapping, prep regimen capture per physician" },
                          { phase: "Weeks 2–4", desc: "Integration build — FHIR/HL7 channel setup with customer's interface engine team, security review, scope provisioning" },
                          { phase: "Weeks 5–8", desc: "Configuration and shadow mode — agent runs in shadow, no actual calls placed; outputs reviewed by GI nurses" },
                          { phase: "Weeks 9–12", desc: "Pilot — limited patient cohort with explicit consent and nurse oversight on every call" },
                          { phase: "Weeks 13–16", desc: "Production rollout — full volume, weekly performance review for first quarter" },
                          { phase: "Additional sites (same Epic instance)", desc: "2–3 weeks (configuration only, no integration build)" },
                        ].map((item) => (
                          <div key={item.phase} className="rounded-lg border border-border/50 bg-background px-3 py-2">
                            <span className="text-xs font-semibold text-primary">{item.phase}: </span>
                            <span className="text-xs text-muted-foreground">{item.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </Slide>

      <SectionDivider title="Risks & Tradeoffs" />

      {/* ─── 06: RISKS & TRADEOFFS ─── */}
      <Slide
        id="openquestions"
        badge="06 RISKS &amp; TRADEOFFS"
        title="Three things will be hard. Here's how I'd handle each."
        subtitle="And a fourth that surprised me when I dug into the integration."
      >
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          {hippocraticRisks.map((risk) => (
            <div key={risk.num} className="flex flex-col gap-4 rounded-2xl border border-border border-l-[3px] border-l-primary bg-card p-6">
              <div>
                <p className="mb-2 text-[11px] font-mono uppercase tracking-wider text-primary">{risk.num}</p>
                <p className="text-base font-semibold leading-snug tracking-[-0.015em] text-foreground">{risk.title}</p>
              </div>
              <p className="text-sm italic leading-relaxed text-muted-foreground">{risk.why}</p>
              <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3">
                <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-primary">MITIGATION</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{risk.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </Slide>

      <SectionDivider title="Roadmap" />

      {/* ─── 07: CLOSE / ROADMAP ─── */}
      <section
        id="close"
        className="min-h-screen border-b border-border/60 px-6 py-28 md:px-10 lg:px-14 scroll-mt-16"
        style={{ backgroundColor: "#1c1c1c", color: "#ffffff", paddingBottom: "80px" }}
      >
        <div className="mx-auto w-full max-w-4xl">
          <header className="mb-10">
            <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.18em] text-primary">07 ROADMAP</p>
            <h2 className="max-w-4xl text-3xl font-semibold leading-[1.08] tracking-[-0.02em] md:text-5xl" style={{ color: "#ffffff" }}>
              What happens after the pilot.
            </h2>
          </header>

          <p className="mb-8 text-sm leading-relaxed text-gray-300 md:text-base" style={{ lineHeight: 1.85 }}>
            This agent addresses the prep-related share of colonoscopy misses — about 30% of the failure modes. Other failure types (transportation, fear of findings, financial access) each deserve their own agent with different conversational depth, different integrations, and different safety architecture. The provider deployment generates the outcome data that makes the payor expansion fast.
          </p>

          {/* Roadmap phases */}
          <div className="grid gap-5 md:grid-cols-3 mb-8">
            {roadmapPhases.map((phase, i) => (
              <motion.div
                key={phase.version}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  "rounded-xl border p-5",
                  phase.version === "NOW"
                    ? "border-primary/40 bg-primary/10"
                    : "border-gray-700 bg-gray-800/60"
                )}
              >
                <p className="text-[10px] font-mono uppercase tracking-wider text-primary">{phase.window}</p>
                <p className="mt-1 text-lg font-semibold text-white">{phase.version}</p>
                <p className="mb-3 mt-1 text-xs text-gray-400">{phase.headline}</p>
                {phase.items.map((item) => (
                  <div key={item} className="mt-1 flex items-start gap-2 text-xs text-gray-400">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {item}
                  </div>
                ))}
              </motion.div>
            ))}
          </div>

          {/* Why provider-first collapsible */}
          <div className="rounded-2xl border border-gray-700 bg-gray-800/40">
            <button
              onClick={() => { setOpenProviderFirst((v) => { trackToggle("provider_first", !v); return !v }) }}
              className="flex w-full items-center justify-between px-6 py-5 text-left"
            >
              <span className="text-base font-semibold text-white tracking-[-0.01em]">Why provider-first, payor-second</span>
              <ChevronRight className={cn("h-4 w-4 text-gray-400 transition-transform", openProviderFirst && "rotate-90")} />
            </button>
            <AnimatePresence>
              {openProviderFirst && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-gray-700 px-6 py-6 space-y-4 text-sm text-gray-300" style={{ lineHeight: 1.8 }}>
                    <p>Payors have a real and growing interest in colonoscopy outcomes. The new HEDIS COL-FU measure tracks completion of follow-up colonoscopy after positive stool tests — currently sitting around 35–65% completion. Federal regulations as of January 2023 eliminated patient cost-sharing for these follow-up procedures, which puts payors more financially on the hook for completion.</p>
                    <p>A Medicare Advantage plan with 200,000 members in the screening-age population sees roughly 20,000 colonoscopies per year. If our agent reduces inadequate prep rate by 8 percentage points, that's 1,600 fewer repeat procedures within 12 months — about $2.4M in avoided medical spend.</p>
                    <p>But the right sequence is <strong className="text-white">provider deployment first</strong>. Providers feel the pain immediately through cancelled OR slots. Payors feel it annually through HEDIS attestation. The provider deployment generates per-call outcome data that makes the payor sale fast and defensible. Going to a payor first means making claims about effect size we can't yet prove.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ width: "48px", height: "1px", background: "#374151", margin: "48px 0" }} />

          <p className="text-base font-semibold leading-relaxed text-white sm:text-lg md:text-xl" style={{ lineHeight: 1.6 }}>
            The pilot proves the prep coaching loop. The loop generates the data. The data closes the payor contract.
          </p>

          <div className="mt-12">
            <p className="text-[11px] font-mono uppercase tracking-wider" style={{ color: "#6b7280" }}>
              WANT TO CONTINUE THE CONVERSATION?
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <a
                href="https://www.linkedin.com/in/iamgauravmittal/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackExternalLink("linkedin_footer", "https://www.linkedin.com/in/iamgauravmittal/")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-primary hover:text-primary"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5zM.5 8h4V23h-4V8zm7 0h3.8v2.05h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-7.63c0-1.82-.03-4.16-2.54-4.16-2.54 0-2.93 1.98-2.93 4.03V23h-4V8z" />
                </svg>
                Connect on LinkedIn
              </a>
              <a
                href="mailto:gmittal1557@gmail.com"
                onClick={() => trackExternalLink("email_footer", "mailto:gmittal1557@gmail.com")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-primary hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                <span className="truncate">gmittal1557@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-xs text-muted-foreground md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p>Hippocratic AI · Agent Deployment Architect · Built by Gaurav Mittal</p>
          <button onClick={() => { scrollTo("cover"); trackButtonClick("back_to_top", "footer") }} className="inline-flex items-center gap-1 text-primary">
            Back to top
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </footer>

      {/* ─── WHO IT CHANGES MODAL ─── */}
      <AnimatePresence>
        {impactModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-6"
            onClick={() => setImpactModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-8 shadow-2xl"
            >
              <button onClick={() => setImpactModalOpen(false)} className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
              <p className="mb-2 text-xs font-mono uppercase tracking-wider text-primary">The full impact</p>
              <h3 className="mb-6 text-2xl font-semibold tracking-[-0.01em]">How this changes things for everyone in the room</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {whoItChanges.map((node, i) => (
                  <motion.div
                    key={node.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="cursor-pointer rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-primary/5"
                    onClick={() => setHoveredNode(hoveredNode === i ? null : i)}
                    onMouseEnter={() => setHoveredNode(i)}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 p-1.5">
                        {node.icon === "gi-clinic" && <Stethoscope className="h-5 w-5 text-primary" />}
                        {node.icon === "patient" && <ShieldCheck className="h-5 w-5 text-primary" />}
                        {node.icon === "nurses" && <GraduationCap className="h-5 w-5 text-primary" />}
                        {node.icon === "payors" && <Check className="h-5 w-5 text-primary" />}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{node.label}</p>
                        <p className="text-xs text-muted-foreground">{node.tagline}</p>
                      </div>
                    </div>
                    <AnimatePresence>
                      {hoveredNode === i && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-1 overflow-hidden"
                        >
                          {node.outcomes.map((outcome) => (
                            <li key={outcome} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                              {outcome}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
