import React, { useState } from "react";
import { ContaBancaria } from "../types";
import { Plus, Trash2, Edit2, Check, X, ArrowUp, ArrowDown, Wallet } from "lucide-react";
import { formatCurrency } from "../utils";

interface AccountsTableProps {
  accounts: ContaBancaria[];
  onAddAccount: (account: Omit<ContaBancaria, "id" | "order">) => Promise<void>;
  onUpdateAccount: (id: string, updated: Partial<ContaBancaria>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onReorderAccounts: (reordered: ContaBancaria[]) => Promise<void>;
}

export default function AccountsTable({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onReorderAccounts,
}: AccountsTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);

  // Form states for adding
  const [instituicao, setInstituicao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [saldo, setSaldo] = useState("");

  // Form states for editing
  const [editInstituicao, setEditInstituicao] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editResponsavel, setEditResponsavel] = useState("");
  const [editSaldo, setEditSaldo] = useState("");

  // Quick balance edit state
  const [quickSaldo, setQuickSaldo] = useState("");

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instituicao || !descricao || !responsavel || saldo === "") return;
    try {
      await onAddAccount({
        instituicao,
        descricao,
        responsavel,
        saldo: parseFloat(saldo) || 0,
      });
      setInstituicao("");
      setDescricao("");
      setResponsavel("");
      setSaldo("");
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (acc: ContaBancaria) => {
    setEditingId(acc.id);
    setEditInstituicao(acc.instituicao);
    setEditDescricao(acc.descricao);
    setEditResponsavel(acc.responsavel);
    setEditSaldo(acc.saldo.toString());
  };

  const handleSaveEdit = async (id: string) => {
    if (!editInstituicao || !editDescricao || !editResponsavel || editSaldo === "") return;
    try {
      await onUpdateAccount(id, {
        instituicao: editInstituicao,
        descricao: editDescricao,
        responsavel: editResponsavel,
        saldo: parseFloat(editSaldo) || 0,
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const startQuickEdit = (acc: ContaBancaria) => {
    setQuickEditId(acc.id);
    setQuickSaldo(acc.saldo.toString());
  };

  const handleSaveQuickEdit = async (id: string) => {
    if (quickSaldo === "") return;
    try {
      await onUpdateAccount(id, {
        saldo: parseFloat(quickSaldo) || 0,
      });
      setQuickEditId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const moveItem = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= accounts.length) return;

    const list = [...accounts];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Reassign orders
    const updated = list.map((item, idx) => ({
      ...item,
      order: idx,
    }));
    await onReorderAccounts(updated);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" id="accounts-table-container">
      {/* Header */}
      <div className="bg-slate-100 px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 text-white p-1.5 rounded-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <h2 className="text-md font-bold text-slate-800 uppercase tracking-wide">Contas Bancárias</h2>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? "Cancelar" : "Nova Conta"}
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleSaveAdd} className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Instituição</label>
            <input
              type="text"
              placeholder="Ex: CAIXA, BRADESCO"
              value={instituicao}
              onChange={(e) => setInstituicao(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição / Conta</label>
            <input
              type="text"
              placeholder="Ex: CONTA CORRENTE..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsável</label>
            <input
              type="text"
              placeholder="Ex: RODRIGO, LUANA"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              required
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Saldo (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 45497"
                value={saldo}
                onChange={(e) => setSaldo(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                required
              />
            </div>
            <button
              type="submit"
              className="h-[38px] px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center justify-center focus:outline-none"
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
              <th className="py-3 px-4 w-12 text-center">Ordem</th>
              <th className="py-3 px-4">Instituição</th>
              <th className="py-3 px-4">Descrição</th>
              <th className="py-3 px-4">Responsável</th>
              <th className="py-3 px-4 text-right">Saldo</th>
              <th className="py-3 px-4 w-28 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                  Nenhuma conta bancária cadastrada.
                </td>
              </tr>
            ) : (
              accounts.map((acc, index) => {
                const isEditing = editingId === acc.id;
                const isQuickEditing = quickEditId === acc.id;

                return (
                  <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* Reorder actions */}
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => moveItem(index, "up")}
                          disabled={index === 0}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(index, "down")}
                          disabled={index === accounts.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Instituição */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editInstituicao}
                          onChange={(e) => setEditInstituicao(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-purple-500"
                        />
                      ) : (
                        acc.instituicao
                      )}
                    </td>

                    {/* Descrição */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDescricao}
                          onChange={(e) => setEditDescricao(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-purple-500"
                        />
                      ) : (
                        acc.descricao
                      )}
                    </td>

                    {/* Responsável */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editResponsavel}
                          onChange={(e) => setEditResponsavel(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-purple-500"
                        />
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {acc.responsavel}
                        </span>
                      )}
                    </td>

                    {/* Saldo */}
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editSaldo}
                          onChange={(e) => setEditSaldo(e.target.value)}
                          className="w-28 px-2 py-1 text-sm border border-slate-300 rounded text-right focus:outline-none focus:border-purple-500"
                        />
                      ) : isQuickEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            step="0.01"
                            value={quickSaldo}
                            onChange={(e) => setQuickSaldo(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveQuickEdit(acc.id);
                              if (e.key === "Escape") setQuickEditId(null);
                            }}
                            className="w-24 px-2 py-1 text-sm border-2 border-emerald-500 rounded text-right focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveQuickEdit(acc.id)}
                            className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setQuickEditId(null)}
                            className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startQuickEdit(acc)}
                          className="cursor-pointer hover:text-emerald-600 border-b border-dashed border-slate-300 hover:border-emerald-500 inline-block transition-colors"
                          title="Clique duas vezes ou clique para edição rápida de saldo"
                        >
                          {formatCurrency(acc.saldo)}
                        </div>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(acc.id)}
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
                              onClick={() => startEdit(acc)}
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                              title="Editar tudo"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir a conta de ${acc.instituicao}?`)) {
                                  onDeleteAccount(acc.id);
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
