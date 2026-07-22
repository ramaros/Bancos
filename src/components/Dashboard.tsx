import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { ContaBancaria, Investimento, HistoricoMensal } from "../types";
import { getCurrentMonthStr, formatCurrency } from "../utils";
import AccountsTable from "./AccountsTable";
import InvestmentsTable from "./InvestmentsTable";
import HistoryTable from "./HistoryTable";
import FinancialCharts from "./FinancialCharts";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Lock,
  RefreshCw,
  Database,
  ArrowRight,
  LogOut,
  Sparkles,
} from "lucide-react";

interface DashboardProps {
  onLock: () => void;
}

export default function Dashboard({ onLock }: DashboardProps) {
  const [accounts, setAccounts] = useState<ContaBancaria[]>([]);
  const [investments, setInvestments] = useState<Investimento[]>([]);
  const [history, setHistory] = useState<HistoricoMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState(getCurrentMonthStr());
  const [error, setError] = useState("");

  // Real-time listener for Firestore collections
  useEffect(() => {
    setLoading(true);

    const unsubAccounts = onSnapshot(
      collection(db, "accounts"),
      (snapshot) => {
        const list: ContaBancaria[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as ContaBancaria);
        });
        // Sort by order field
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setAccounts(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, "accounts");
        } catch (e: any) {
          setError("Erro ao ler contas bancárias. Verifique as permissões.");
        }
      }
    );

    const unsubInvestments = onSnapshot(
      collection(db, "investments"),
      (snapshot) => {
        const list: Investimento[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Investimento);
        });
        // Sort by order field
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setInvestments(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, "investments");
        } catch (e: any) {
          setError("Erro ao ler investimentos. Verifique as permissões.");
        }
      }
    );

    const unsubHistory = onSnapshot(
      collection(db, "history"),
      (snapshot) => {
        const list: HistoricoMensal[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as HistoricoMensal);
        });
        setHistory(list);
        setLoading(false);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, "history");
        } catch (e: any) {
          setError("Erro ao ler histórico. Verifique as permissões.");
        }
      }
    );

    return () => {
      unsubAccounts();
      unsubInvestments();
      unsubHistory();
    };
  }, []);

  // Calculate totals
  const totalAccounts = accounts.reduce((sum, item) => sum + (item.saldo || 0), 0);
  const totalInvestments = investments.reduce((sum, item) => sum + (item.saldo || 0), 0);
  const grandTotal = totalAccounts + totalInvestments;

  // Manage accounts
  const handleAddAccount = async (newAcc: Omit<ContaBancaria, "id" | "order">) => {
    try {
      const colRef = collection(db, "accounts");
      const nextOrder = accounts.length;
      await addDoc(colRef, {
        ...newAcc,
        order: nextOrder,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "accounts");
    }
  };

  const handleUpdateAccount = async (id: string, updated: Partial<ContaBancaria>) => {
    try {
      const docRef = doc(db, "accounts", id);
      await updateDoc(docRef, {
        ...updated,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `accounts/${id}`);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      const docRef = doc(db, "accounts", id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `accounts/${id}`);
    }
  };

  const handleReorderAccounts = async (reordered: ContaBancaria[]) => {
    try {
      const batch = writeBatch(db);
      reordered.forEach((acc) => {
        const docRef = doc(db, "accounts", acc.id);
        batch.update(docRef, { order: acc.order });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "accounts/reorder");
    }
  };

  // Manage investments
  const handleAddInvestment = async (newInv: Omit<Investimento, "id" | "order">) => {
    try {
      const colRef = collection(db, "investments");
      const nextOrder = investments.length;
      await addDoc(colRef, {
        ...newInv,
        order: nextOrder,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "investments");
    }
  };

  const handleUpdateInvestment = async (id: string, updated: Partial<Investimento>) => {
    try {
      const docRef = doc(db, "investments", id);
      await updateDoc(docRef, {
        ...updated,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `investments/${id}`);
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    try {
      const docRef = doc(db, "investments", id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `investments/${id}`);
    }
  };

  const handleReorderInvestments = async (reordered: Investimento[]) => {
    try {
      const batch = writeBatch(db);
      reordered.forEach((inv) => {
        const docRef = doc(db, "investments", inv.id);
        batch.update(docRef, { order: inv.order });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "investments/reorder");
    }
  };

  // Manage History
  const handleAddHistory = async (newItem: Omit<HistoricoMensal, "id">) => {
    try {
      const docId = newItem.data.toLowerCase();
      const docRef = doc(db, "history", docId);
      await setDoc(docRef, {
        ...newItem,
        id: docId,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `history/${newItem.data}`);
    }
  };

  const handleUpdateHistory = async (id: string, updated: Partial<HistoricoMensal>) => {
    try {
      const docRef = doc(db, "history", id);
      await updateDoc(docRef, {
        ...updated,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `history/${id}`);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const docRef = doc(db, "history", id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `history/${id}`);
    }
  };

  // Seed standard spreadsheet data if DB is empty
  const handleSeedData = async () => {
    try {
      setLoading(true);
      setError("");

      const batch = writeBatch(db);

      // 1. Initial Bank Accounts
      const sampleAccounts = [
        { instituicao: "CAIXA", descricao: "CONTA CORRENTE [ 0136 3701 000598169691-1 ]", responsavel: "RODRIGO", saldo: 1 },
        { instituicao: "CAIXA", descricao: "CONTA POUPANÇA [ 0136 1288 000753088654-2 ]", responsavel: "RODRIGO", saldo: 45497 },
        { instituicao: "BRADESCO", descricao: "CONTA CORRENTE [632-7 26269-2 ]", responsavel: "RODRIGO", saldo: 1 },
        { instituicao: "CAIXA", descricao: "CONTA POUPANÇA [ 7713699261 ]", responsavel: "LUANA", saldo: 14407 },
        { instituicao: "CAIXA", descricao: "CONTA POUPANÇA [ 7676864845 ]", responsavel: "LUANA", saldo: 10023 },
        { instituicao: "XP INVESTIMENTOS", descricao: "CONTA CORRENTE [ 102 0001 12830498 ]", responsavel: "CASAL", saldo: 1680 },
      ];

      sampleAccounts.forEach((acc, idx) => {
        const docRef = doc(collection(db, "accounts"));
        batch.set(docRef, {
          ...acc,
          order: idx,
          updatedAt: new Date().toISOString(),
        });
      });

      // 2. Initial Investments
      const sampleInvestments = [
        { instituicao: "XP INVESTIMENTOS [12830498-8]", descricao: "AÇÕES", saldo: 5722 },
        { instituicao: "BTG PACTUAL", descricao: "FUNDOS DE INVESTIMENTO", saldo: 12431 },
        { instituicao: "BTG PACTUAL", descricao: "COPY TRADE - MINI DOLAR", saldo: 2000 },
        { instituicao: "RADIX", descricao: "TÍTULOS FLORESTAIS", saldo: 5000 },
      ];

      sampleInvestments.forEach((inv, idx) => {
        const docRef = doc(collection(db, "investments"));
        batch.set(docRef, {
          ...inv,
          order: idx,
          updatedAt: new Date().toISOString(),
        });
      });

      // 3. Initial History
      const sampleHistory = [
        { id: "junho-25", data: "junho-25", contaBancaria: 38573, investimentos: 30536, total: 69109 },
        { id: "julho-25", data: "julho-25", contaBancaria: 71609, investimentos: 25153, total: 96762 },
      ];

      sampleHistory.forEach((h) => {
        const docRef = doc(db, "history", h.id);
        batch.set(docRef, {
          ...h,
          updatedAt: new Date().toISOString(),
        });
      });

      await batch.commit();
    } catch (err) {
      console.error(err);
      setError("Erro ao importar planilha inicial.");
    } finally {
      setLoading(false);
    }
  };

  const isDbEmpty = accounts.length === 0 && investments.length === 0 && history.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800" id="dashboard-loading">
        <RefreshCw className="w-10 h-10 animate-spin text-purple-600 mb-4" />
        <p className="text-sm font-medium text-slate-500">Sincronizando com o banco de dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-12" id="dashboard-main">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-purple-600 to-blue-600 p-2.5 rounded-xl text-white shadow-md">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Controle Bancário e Investimentos</h1>
              <p className="text-xs text-slate-500">Sincronizado em tempo real com o Firestore</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-xs font-semibold text-slate-400">MÊS DE REFERÊNCIA</span>
              <span className="text-sm font-bold text-slate-700 capitalize">{activeMonth}</span>
            </div>

            <button
              onClick={onLock}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors focus:outline-none"
            >
              <Lock className="w-4 h-4" />
              <span>Bloquear App</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-6 mt-8 flex-1 flex flex-col gap-8">
        {/* Error notification */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-500 hover:text-red-700 font-bold">X</button>
          </div>
        )}

        {/* Empty State Banner (Spreadsheet Seeder) */}
        {isDbEmpty && (
          <div className="bg-gradient-to-r from-purple-50 via-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Primeiro Acesso</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Deseja preencher seu app com a planilha inicial?</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Detectamos que seu banco de dados no Firestore está vazio. Podemos criar automaticamente todas as contas bancárias, investimentos e histórico (junho-25 e julho-25) iguais aos do seu modelo de planilha para você começar imediatamente!
              </p>
            </div>
            <button
              onClick={handleSeedData}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 whitespace-nowrap"
            >
              <span>Carregar Planilha Inicial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Metric Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6" id="summary-metrics">
          {/* Card Contas Bancárias */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Conta Bancária</span>
              <span className="text-2xl font-black text-purple-700">{formatCurrency(totalAccounts)}</span>
            </div>
            <div className="bg-purple-50 text-purple-600 p-4 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          {/* Card Investimentos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Investimentos</span>
              <span className="text-2xl font-black text-blue-600">{formatCurrency(totalInvestments)}</span>
            </div>
            <div className="bg-blue-50 text-blue-600 p-4 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Card Total */}
          <div className="bg-slate-900 p-6 rounded-2xl shadow-md flex items-center justify-between text-white border border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Soma de Recursos</span>
              <span className="text-2xl font-black text-emerald-400">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="bg-slate-800 text-emerald-400 p-4 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* 2. Charts Visualizations */}
        <section className="mt-2">
          <FinancialCharts history={history} />
        </section>

        {/* 3. Tables Section (Accounts & Investments Side-by-Side on LG screens, stacked on Mobile) */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          <AccountsTable
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
            onReorderAccounts={handleReorderAccounts}
          />
          <InvestmentsTable
            investments={investments}
            onAddInvestment={handleAddInvestment}
            onUpdateInvestment={handleUpdateInvestment}
            onDeleteInvestment={handleDeleteInvestment}
            onReorderInvestments={handleReorderInvestments}
          />
        </section>

        {/* 4. History Table Section */}
        <section className="mt-2">
          <HistoryTable
            history={history}
            onAddHistory={handleAddHistory}
            onUpdateHistory={handleUpdateHistory}
            onDeleteHistory={handleDeleteHistory}
            activeTotals={{ accounts: totalAccounts, investments: totalInvestments }}
            activeMonthStr={activeMonth}
          />
        </section>

        {/* Month reference changer */}
        <section className="bg-slate-100 p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
          <div>
            <h4 className="text-sm font-bold text-slate-700">Mês de Referência de Saldos</h4>
            <p className="text-xs text-slate-500">Sincronize os saldos das suas contas correntes e investimentos para este mês no histórico.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-500">MUDAR MÊS ATIVO:</label>
            <input
              type="text"
              placeholder="Ex: julho-26"
              value={activeMonth}
              onChange={(e) => setActiveMonth(e.target.value.toLowerCase())}
              className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none font-bold text-slate-700 text-center w-32"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
