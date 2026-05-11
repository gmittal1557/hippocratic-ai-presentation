"use client"

import { motion, useInView } from "framer-motion"
import { useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionWrapperProps {
  children: ReactNode
  id: string
  className?: string
  fullHeight?: boolean
}

export function SectionWrapper({ children, id, className, fullHeight = true }: SectionWrapperProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        "relative w-full",
        fullHeight && "min-h-screen",
        "flex flex-col items-center justify-center",
        "px-6 py-20 md:px-12 lg:px-20",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-6xl mx-auto"
      >
        {children}
      </motion.div>
    </section>
  )
}

export function FadeIn({
  children,
  delay = 0,
  className,
  direction = "up",
}: {
  children: ReactNode
  delay?: number
  className?: string
  direction?: "up" | "down" | "left" | "right"
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  const directionMap = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { y: 0, x: 30 },
    right: { y: 0, x: -30 },
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, ...directionMap[direction] }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
