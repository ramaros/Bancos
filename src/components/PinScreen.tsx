import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Lock, Unlock, Check, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Cryptographically strong SHA-256 hashing for client-side security
async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "bancos-app-salt-2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface PinScreenProps {
  onUnlock: () => void;
}

export default function PinScreen({ onUnlock }: PinScreenProps) {
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [shake, setShake] = useState<boolean>(false);

  useEffect(() => {
    async function checkPinConfig() {
      try {
        const docRef = doc(db, "security", "config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().pinHash) {
          setIsSetup(false);
        } else {
          setIsSetup(true);
        }
      } catch (err) {
        console.error("Erro ao verificar configuração de PIN:", err);
        // Fallback to setup if anything fails or offline
        setIsSetup(true);
      } finally {
        setLoading(false);
      }
    }
    checkPinConfig();
  }, []);

  const handleNumberClick = (num: string) => {
    setError("");
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  useEffect(() => {
    if (pin.length === 4) {
      if (isSetup) {
        if (setupStep === 1) {
          // Go to confirmation step
          setConfirmPin(pin);
          setPin("");
          setSetupStep(2);
        } else {
          // Confirming setup
          handleRegisterPin();
        }
      } else {
        // Verification
        handleVerifyPin();
      }
    }
  }, [pin]);

  const handleVerifyPin = async () => {
    try {
      const enteredHash = await hashPIN(pin);
      const docRef = doc(db, "security", "config");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().pinHash === enteredHash) {
        onUnlock();
      } else {
        setShake(true);
        setError("PIN incorreto. Tente novamente.");
        setPin("");
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.GET, "security/config");
      } catch (e) {
        setError("Erro de conexão. Verifique sua internet.");
        setPin("");
      }
    }
  };

  const handleRegisterPin = async () => {
    if (pin !== confirmPin) {
      setShake(true);
      setError("Os PINs não coincidem. Reiniciando...");
      setPin("");
      setConfirmPin("");
      setSetupStep(1);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      setLoading(true);
      const hashed = await hashPIN(pin);
      await setDoc(doc(db, "security", "config"), {
        id: "config",
        pinHash: hashed,
        updatedAt: new Date().toISOString(),
      });
      setIsSetup(false);
      onUnlock();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, "security/config");
      } catch (e) {
        setError("Erro ao cadastrar PIN. Verifique as regras do Firebase.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800" id="pin-loading">
        <RefreshCw className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-sm font-medium text-slate-500">Conectando ao Firebase...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" id="pin-container">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 flex flex-col items-center">
        {/* Header Icon */}
        <div className="mb-6 bg-emerald-50 p-4 rounded-full text-emerald-600">
          {isSetup ? <Lock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
        </div>

        {/* Title & Instructions */}
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          {isSetup
            ? setupStep === 1
              ? "Cadastrar PIN de Acesso"
              : "Confirmar PIN de Acesso"
            : "Controle Bancário"}
        </h1>
        <p className="text-sm text-slate-500 text-center mb-8">
          {isSetup
            ? setupStep === 1
              ? "Crie um PIN de 4 dígitos para proteger suas informações financeiras de forma segura."
              : "Digite novamente o PIN de 4 dígitos para confirmar."
            : "Digite seu PIN de 4 dígitos para acessar o painel financeiro."}
        </p>

        {/* PIN Indicators */}
        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex justify-center gap-4 mb-6"
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > index
                  ? "bg-emerald-600 border-emerald-600 scale-110"
                  : "border-slate-300 bg-transparent"
              }`}
            />
          ))}
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-red-600 text-xs font-semibold mb-6"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="w-16 h-16 rounded-full bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center transition-colors focus:outline-none"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="w-16 h-16 rounded-full text-slate-400 hover:text-slate-600 font-semibold text-xs flex items-center justify-center transition-colors focus:outline-none"
          >
            LIMPAR
          </button>
          <button
            onClick={() => handleNumberClick("0")}
            className="w-16 h-16 rounded-full bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center transition-colors focus:outline-none"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full text-slate-400 hover:text-slate-600 font-semibold text-xs flex items-center justify-center transition-colors focus:outline-none"
          >
            APAGAR
          </button>
        </div>

        <div className="text-[10px] text-slate-400 mt-4 text-center">
          Sua segurança é nossa prioridade. O PIN é armazenado com criptografia no Firestore.
        </div>
      </div>
    </div>
  );
}
