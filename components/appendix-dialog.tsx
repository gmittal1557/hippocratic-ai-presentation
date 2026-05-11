"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Info } from "lucide-react"

interface AppendixDialogProps {
  title: string
  content: string[]
  triggerLabel?: string
}

export function AppendixDialog({ title, content, triggerLabel }: AppendixDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/50 border border-border/40 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/20 transition-colors">
          <Info className="w-3 h-3" />
          {triggerLabel || title}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-card border-border/50 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-serif text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5 mt-3">
          {content.map((paragraph, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-[10px] font-mono text-primary/60 mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{paragraph}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
