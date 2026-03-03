import React from "react";
import { cn } from "@/lib/utils";

interface ModuleHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function ModuleHeader({ title, description, actions, className }: ModuleHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between pb-6 border-b border-[hsl(var(--border))] mb-6", className)}>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 ml-4">{actions}</div>}
    </div>
  );
}
