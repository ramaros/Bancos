import React from "react";
import { HistoricoMensal } from "../types";
import { formatCurrency, sortHistoryChronologically } from "../utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, PieChart } from "lucide-react";

interface FinancialChartsProps {
  history: HistoricoMensal[];
}

export default function FinancialCharts({ history }: FinancialChartsProps) {
  const sorted = sortHistoryChronologically(history);

  const formatYAxis = (tick: number) => {
    if (tick >= 1000) {
      return `R$ ${(tick / 1000).toFixed(0)}k`;
    }
    return `R$ ${tick}`;
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm mb-1 last:mb-0">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-slate-800">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (sorted.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
        <TrendingUp className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-sm font-bold text-slate-700 mb-1">Visualização de Gráficos</h3>
        <p className="text-xs text-slate-400 max-w-xs">
          Insira dados históricos na tabela ou salve o mês atual para poder visualizar o histórico de saldos graficamente.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="charts-container">
      {/* Chart 1: Total Wealth Area Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Evolução do Patrimônio Total</h3>
            <p className="text-[11px] text-slate-400">Patrimônio acumulado consolidado mês a mês</p>
          </div>
        </div>
        <div className="h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sorted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="data"
                tickLine={false}
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(tick) => tick.toUpperCase()}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={customTooltip} />
              <Area
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Accounts vs Investments comparison */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-purple-100 text-purple-700 p-1.5 rounded-lg">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Alocação de Recursos</h3>
            <p className="text-[11px] text-slate-400">Comparação entre Contas Correntes/Poupança e Investimentos</p>
          </div>
        </div>
        <div className="h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="data"
                tickLine={false}
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(tick) => tick.toUpperCase()}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={customTooltip} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="contaBancaria" name="Contas Bancárias" fill="#9333ea" radius={[4, 4, 0, 0]} />
              <Bar dataKey="investimentos" name="Investimentos" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
