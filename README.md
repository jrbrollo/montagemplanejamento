# Montagem de Planejamento Financeiro

Sistema web de planejamento financeiro pessoal para planejadores. Substitui planilha Excel complexa de 37 abas.

## Stack

- **Next.js 16** (App Router) + **TypeScript** strict
- **Tailwind CSS** + componentes UI próprios
- **Zustand** (estado global + persistência localStorage)
- **Recharts** (gráficos)
- **Sem backend** — dados salvos no localStorage do navegador

## Módulos

| Módulo | Descrição |
|--------|-----------|
| Overview | Indicadores de mercado, dados pessoais, rendas, benefícios, objetivos, patrimônio |
| Orçamento | Fluxo de caixa atual vs sugerido com saldo automático |
| Reserva de Emergência | Multiplicador por perfil, simulação multi-fase, gráfico de evolução |
| Aposentadoria | Previdência (VGBL/PGBL), outros investimentos, comparação, IR regressivo |
| Resumo | Diagnóstico, barras de progresso, timeline do patrimônio |

## Engine Financeira

- `rates.ts` — CDI, taxas de curto/médio/longo prazo derivadas da Selic
- `compound.ts` — `futureValue()` e `payment()` idênticos às funções FV/PMT do Excel
- `emergency.ts` — multiplicador inteligente (3 + 3×fatores de risco), simulação de acúmulo
- `retirement.ts` — simulação multi-fase, alíquota IR regressiva ponderada por fase, VGBL vs PGBL
- `tax.ts` — tabela regressiva completa, alíquota efetiva para múltiplas fases

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Persistência

Dados salvos automaticamente no `localStorage` com a chave `brauna-planner-data`. Múltiplos planejamentos suportados simultaneamente.

