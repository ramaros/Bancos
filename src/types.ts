export interface ContaBancaria {
  id: string;
  instituicao: string;
  descricao: string;
  responsavel: string;
  saldo: number;
  order: number;
  updatedAt?: string;
}

export interface Investimento {
  id: string;
  instituicao: string;
  descricao: string;
  saldo: number;
  order: number;
  updatedAt?: string;
}

export interface HistoricoMensal {
  id: string; // usually year-month like "2025-07" or the literal month name "julho-25"
  data: string; // e.g. "julho-25"
  contaBancaria: number;
  investimentos: number;
  total: number;
  updatedAt?: string;
}

export interface SecurityConfig {
  id: string;
  pinHash: string;
}
