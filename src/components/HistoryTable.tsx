import React, { useState } from "react";
import { HistoricoMensal } from "../types";
import { Plus, Trash2, Edit2, Check, X, Calendar, Save } from "lucide-react";
import { formatCurrency, MONTHS_PT, sortHistoryChronologically } from "../utils";

interface HistoryTableProps {
  history: HistoricoMensal[];
  onAddHistory: (item: Omit<HistoricoMensal, "id">) => Promise<void>;
  onUpdateHistory: (id: string, updated: Partial<HistoricoMensal>) => Promise<void>;
  onDeleteHistory: (id: string) => Promise<void>;
  activeTotals: { accounts: number; investments: number };
  activeMonthStr: string;
}

export default function HistoryTable({
  history,
  onAddHistory,
  onUpdateHistory,
  onDeleteHistory,
  activeTotals,
  activeMonthStr,
}: HistoryTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for adding
  const [selectedMonth, setSelectedMonth] = useState("janeiro");
  const [selectedYear, setSelectedYear] = useState("26");
  const [contaBancaria, setContaBancaria] = useState("");
  const [investimentos, setInvestimentos] = useState("");

  // Form states for editing
  const [editContaBancaria, setEditContaBancaria] = useState("");
  const [editInvestimentos, setEditInvestimentos] = useState("");

  const sortedHistory = sortHistoryChronologically(history);

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const monthStr = `${selectedMonth}-${selectedYear}`;
    
    // Check if month already exists
    if (history.some((h) => h.data === monthStr)) {
      alert(`O mês ${monthStr} já possui um registro. Edite-o na tabela se desejar alterar.`);
      return;
    }

    const cbVal = parseFloat(contaBancaria) || 0;
    const invVal = parseFloat(investimentos) || 0;

    try {
      await onAddHistory({
        data: monthStr,
        contaBancaria: cbVal,
        investimentos: invVal,
        total: cbVal + invVal,
      });
      setContaBancaria("");
      setInvestimentos("");
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (item: HistoricoMensal) => {
    setEditingId(item.id);
    setEditContaBancaria(item.contaBancaria.toString());
    setEditInvestimentos(item.investimentos.toString());
  };

  const handleSaveEdit = async (id: string) => {
    const cbVal = parseFloat(editContaBancaria) || 0;
    const invVal = parseFloat(editInvestimentos) || 0;

    try {
      await onUpdateHistory(id, {
        contaBancaria: cbVal,
        investimentos: invVal,
        total: cbVal + invVal,
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncCurrentMonth = async () => {
    // Check if the current month already exists in history
    const existing = history.find((h) => h.data === activeMonthStr);
    const cbVal = activeTotals.accounts;
    const invVal = activeTotals.investments;

    if (existing) {
      if (
        confirm(
          `Atualizar o registro de ${activeMonthStr} no histórico com os saldos atuais (${formatCurrency(
            cbVal
          )} em contas e ${formatCurrency(invVal)} em investimentos)?`
        )
      ) {
        await onUpdateHistory(existing.id, {
          contaBancaria: cbVal,
          investimentos: invVal,
          total: cbVal + invVal,
        });
      }
    } else {
      await onAddHistory({
        data: activeMonthStr,
        contaBancaria: cbVal,
        investimentos: invVal,
        total: cbVal + invVal,
      });
      alert(`Saldos do mês de ${activeMonthStr} salvos com sucesso no histórico!`);
    }
  };

  const currentYearOptions = ["24", "25", "26", "27", "28"];

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" id="history-table-container">
      {/* Header */}
      <div className="bg-slate-100 px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 text-white p-1.5 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <h2 className="text-md font-bold text-slate-800 uppercase tracking-wide">Histórico Mensal</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Sync Button */}
          <button
            onClick={handleSyncCurrentMonth}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            title={`Salvar saldos atuais no mês de ${activeMonthStr}`}
          >
            <Save className="w-4 h-4" />
            <span>Salvar Mês Atual ({activeMonthStr})</span>
          </button>
          
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors focus:outline-none"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "Cancelar" : "Novo Mês"}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleSaveAdd} className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mês</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none"
            >
              {MONTHS_PT.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ano (2 Dígitos)</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none"
            >
              {currentYearOptions.map((y) => (
                <option key={y} value={y}>
                  20{y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Conta Bancária (R$)</label>
            <input
              type="number"
              placeholder="Ex: 38573"
              value={contaBancaria}
              onChange={(e) => setContaBancaria(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none"
              required
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Investimentos (R$)</label>
              <input
                type="number"
                placeholder="Ex: 30536"
                value={investimentos}
                onChange={(e) => setInvestimentos(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="h-[38px] px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors flex items-center justify-center focus:outline-none"
            >
              Adicionar
            </button>
          </div>
        </form>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-6">Mês / Referência</th>
              <th className="py-3 px-6 text-right">Contas Bancárias</th>
              <th className="py-3 px-6 text-right">Investimentos</th>
              <th className="py-3 px-6 text-right">Total Acumulado</th>
              <th className="py-3 px-6 w-24 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {sortedHistory.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                  Nenhum registro de histórico encontrado. Clique em "Salvar Mês Atual" acima para sincronizar ou "Novo Mês" para cadastrar anteriores.
                </td>
              </tr>
            ) : (
              sortedHistory.map((item) => {
                const isEditing = editingId === item.id;
                const isCurrentMonth = item.data === activeMonthStr;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/50 transition-colors ${
                      isCurrentMonth ? "bg-emerald-50/30 font-medium" : ""
                    }`}
                  >
                    {/* Mês/Ano */}
                    <td className="py-3 px-6 font-semibold text-slate-800 flex items-center gap-1.5">
                      {isCurrentMonth && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Mês ativo atual" />
                      )}
                      <span className="capitalize">{item.data}</span>
                    </td>

                    {/* Contas Bancárias */}
                    <td className="py-3 px-6 text-right text-purple-700 font-medium">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editContaBancaria}
                          onChange={(e) => setEditContaBancaria(e.target.value)}
                          className="w-28 px-2 py-1 text-sm border border-slate-300 rounded text-right focus:outline-none"
                        />
                      ) : (
                        formatCurrency(item.contaBancaria)
                      )}
                    </td>

                    {/* Investimentos */}
                    <td className="py-3 px-6 text-right text-blue-700 font-medium">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editInvestimentos}
                          onChange={(e) => setEditInvestimentos(e.target.value)}
                          className="w-28 px-2 py-1 text-sm border border-slate-300 rounded text-right focus:outline-none"
                        />
                      ) : (
                        formatCurrency(item.investimentos)
                      )}
                    </td>

                    {/* Total */}
                    <td className="py-3 px-6 text-right font-bold text-slate-900">
                      {isEditing ? (
                        <span className="text-slate-400 italic">Auto</span>
                      ) : (
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-800">
                          {formatCurrency(item.total)}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="Salvar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-amber-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja excluir o histórico do mês de ${item.data}?`)) {
                                  onDeleteHistory(item.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
