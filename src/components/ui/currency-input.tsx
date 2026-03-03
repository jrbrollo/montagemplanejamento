"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number;
  onChange: (value: number) => void;
  /** Se true, exibe e edita como percentual (ex: 0.105 → "10,50") */
  asPercent?: boolean;
  /** Sufixo exibido à direita (ex: "%" ou "a.a.") */
  suffix?: string;
  /** Número de casas decimais para exibição */
  decimals?: number;
}

/**
 * Input numérico com formatação brasileira.
 * Internamente armazena como number (reais ou decimal).
 * Exibe como string formatada pt-BR enquanto o usuário não está editando.
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChange,
      asPercent = false,
      suffix,
      decimals = 2,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [editing, setEditing] = React.useState(false);
    const [raw, setRaw] = React.useState("");

    // Converte o valor armazenado para exibição
    const displayValue = React.useMemo(() => {
      if (editing) return raw;
      const displayNum = asPercent ? value * 100 : value;
      return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(displayNum);
    }, [editing, raw, value, asPercent, decimals]);

    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
      const displayNum = asPercent ? value * 100 : value;
      setRaw(displayNum.toFixed(decimals).replace(".", ","));
      setEditing(true);
      // Seleciona tudo ao focar
      setTimeout(() => e.target.select(), 0);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      setRaw(e.target.value);
    }

    function handleBlur() {
      setEditing(false);
      // Tenta parsear o valor digitado (aceita ponto ou vírgula)
      const cleaned = raw.replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        onChange(asPercent ? parsed / 100 : parsed);
      }
      setRaw("");
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
    }

    return (
      <div className="relative flex items-center">
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          disabled={disabled}
          value={displayValue}
          onFocus={handleFocus}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[hsl(var(--muted))]",
            suffix ? "pr-12" : "",
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 text-xs text-[hsl(var(--muted-foreground))] select-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
