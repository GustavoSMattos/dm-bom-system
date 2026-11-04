import React, { useState, useEffect, useMemo } from 'react';
import {
Package, Wrench, Shield, Layers, RefreshCw, Plus, Trash2,
Lock, CheckCircle2, AlertCircle, TrendingUp, Save, BarChart3,
FileSpreadsheet, LogOut, ShoppingBag, Calculator,
Truck, LayoutDashboard, PieChart as PieChartIcon, X
} from 'lucide-react';
import {
ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts';
// --- SUPABASE CLIENT CONFIG (INLINE SAFE FALLBACK) ---
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
export const supabase = (supabaseUrl && supabaseAnonKey)
? createClient(supabaseUrl, supabaseAnonKey)
: null;
// --- DADOS LOCAIS DE FALLBACK (CASO SUPABASE NÃO CONECTE) ---
const INITIAL_PRODUCTS = [
{ id: '1', omie_code: 'MP-001', name: 'Perfil de Alumínio Estrutural 50x50mm', unit: 'M', cost: 48.50, stock: 120 },
{ id: '2', omie_code: 'MP-002', name: 'Chapa ACM Prata 4mm 1.22x2.44m', unit: 'M²', cost: 95.00, stock: 35 },
{ id: '3', omie_code: 'MP-003', name: 'Eixo Torsional AL-KO 750kg com Freio', unit: 'UN', cost: 1450.00, stock: 4 },
{ id: '4', omie_code: 'MP-004', name: 'Lanternas LED Traseiras Seladas 12V', unit: 'PAR', cost: 180.00, stock: 12 },
{ id: '5', omie_code: 'MP-005', name: 'Acoplador de Engate Rápido 2000kg', unit: 'UN', cost: 320.00, stock: 8 },
{ id: '6', omie_code: 'MP-006', name: 'Tubos de Aço Carbono 80x40x3mm', unit: 'M', cost: 62.00, stock: 85 }
];
const INITIAL_BOMS = [
{ id: 'b1', code: 'TR-RACING-01', name: 'Trailer Fechado Racing P2 (2 Motos)', category: 'Trailer Fechado' },
{ id: 'b2', code: 'TR-UTV-PRO', name: 'Trailer Plataforma UTV & Quadriciclo', category: 'Plataforma' },
{ id: 'b3', code: 'TR-CARGO-BAU', name: 'Reboque Baú Carga Geral 2.50m', category: 'Baú Geral' }
];
const INITIAL_BOM_ITEMS = [
{ id: 'bi1', bom_id: 'b1', productId: '1', code: 'MP-001', name: 'Perfil de Alumínio Estrutural 50x50mm', unit: 'M', cost: 48.50, stock: 120, qty: 18, lossPercent: 5 },
{ id: 'bi2', bom_id: 'b1', productId: '2', code: 'MP-002', name: 'Chapa ACM Prata 4mm 1.22x2.44m', unit: 'M²', cost: 95.00, stock: 35, qty: 14, lossPercent: 4 },
{ id: 'bi3', bom_id: 'b1', productId: '3', code: 'MP-003', name: 'Eixo Torsional AL-KO 750kg com Freio', unit: 'UN', cost: 1450.00, stock: 4, qty: 1, lossPercent: 0 },
{ id: 'bi4', bom_id: 'b1', productId: '4', code: 'MP-004', name: 'Lanternas LED Traseiras Seladas 12V', unit: 'PAR', cost: 180.00, stock: 12, qty: 1, lossPercent: 0 },
{ id: 'bi5', bom_id: 'b1', productId: '5', code: 'MP-005', name: 'Acoplador de Engate Rápido 2000kg', unit: 'UN', cost: 320.00, stock: 8, qty: 1, lossPercent: 0 }
];
export default function App() {
// --- AUTENTICAÇÃO E SESSÃO ---
const [session, setSession] = useState(null);
const [userRole, setUserRole] = useState('admin'); // 'admin' ou 'operador'
const [authLoading, setAuthLoading] = useState(true);
const [loginEmail, setLoginEmail] = useState('');
const [loginPassword, setLoginPassword] = useState('');
const [authError, setAuthError] = useState('');
// --- NAVEGAÇÃO E SISTEMA ---
const [activeTab, setActiveTab] = useState('dashboard');
const [loading, setLoading] = useState(false);
const [statusMessage, setStatusMessage] = useState(null);
// --- DADOS ---
const [products, setProducts] = useState(INITIAL_PRODUCTS);
const [boms, setBoms] = useState(INITIAL_BOMS);
const [selectedBomId, setSelectedBomId] = useState('b1');
const [bomItems, setBomItems] = useState(INITIAL_BOM_ITEMS);
const [snapshots, setSnapshots] = useState([
{ id: 's1', created_at: new Date().toISOString(), title: 'Trailer Fechado Racing P2 - Lote Q1', total_cost: 4122.25, suggested_price: 8588.02, margin_percent: 25 }
]);
// --- MODAL DE NOVO TRAILER ---
const [showNewBomModal, setShowNewBomModal] = useState(false);
const [newBomCode, setNewBomCode] = useState('');
const [newBomName, setNewBomName] = useState('');
// --- FICHA DE PRODUÇÃO (MRP) ---
const [productionPlan, setProductionPlan] = useState([
{ bomId: 'b1', code: 'TR-RACING-01', name: 'Trailer Fechado Racing P2 (2 Motos)', qty: 2 }
]);
const [selectedPlanBomId, setSelectedPlanBomId] = useState('b1');
const [planQty, setPlanQty] = useState(1);
// --- PARÂMETROS FINANCEIROS (MARKUP POR DENTRO) ---
const [overheadPercent, setOverheadPercent] = useState(12);
const [taxPercent, setTaxPercent] = useState(15);
const [marginPercent, setMarginPercent] = useState(25);
// --- INCLUSÃO DE ITENS ---
const [selectedProductId, setSelectedProductId] = useState('');
const [inputQty, setInputQty] = useState(1);
const [inputLoss, setInputLoss] = useState(3);
// ==========================================
// INICIALIZAÇÃO SUPABASE E SESSÃO
// ==========================================
useEffect(() => {
if (supabase) {
supabase.auth.getSession().then(({ data: { session } }) => {
setSession(session);
if (session) {
fetchUserProfile(session.user);
loadDataFromSupabase();
}
setAuthLoading(false);
});
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) {
          fetchUserProfile(session.user);
          loadDataFromSupabase();
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // Mock session se não houver cliente Supabase ativo
      setSession({ user: { email: 'admin@dmtrailers.com.br' } });
      setAuthLoading(false);
    }
}, []);
const fetchUserProfile = (user) => {
const role = user?.user_metadata?.role || (user?.email?.includes('operador') ? 'operador' : 'admin');
setUserRole(role);
};
const loadDataFromSupabase = async () => {
if (!supabase) return;
setLoading(true);
try {
const { data: prodData } = await supabase.from('products').select('*').order('name');
if (prodData && prodData.length > 0) setProducts(prodData);
      const { data: bomData } = await supabase.from('boms').select('*').order('code');
      if (bomData && bomData.length > 0) {
        setBoms(bomData);
        if (!selectedBomId) setSelectedBomId(bomData[0].id);
      }

      const { data: snapData } = await supabase.from('pricing_snapshots').select('*').order('created_at', { ascending: false });
      if (snapData) setSnapshots(snapData);

    } catch (err) {
      showStatus('Carregando em modo local...', 'info');
    } finally {
      setLoading(false);
    }
};
const handleLogin = async (e) => {
e.preventDefault();
setAuthError('');
setLoading(true);
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) setAuthError('Falha na autenticação: ' + error.message);
    } else {
      setSession({ user: { email: loginEmail } });
    }
    setLoading(false);
};
const handleLogout = async () => {
if (supabase) await supabase.auth.signOut();
setSession(null);
};
const showStatus = (text, type = 'info') => {
setStatusMessage({ text, type });
setTimeout(() => setStatusMessage(null), 4000);
};
// ==========================================
// CÁLCULOS FINANCEIROS E ESTRUTURA
// ==========================================
const activeBomItems = useMemo(() => {
return bomItems.filter(item => item.bom_id === selectedBomId);
}, [bomItems, selectedBomId]);
const totalCost = useMemo(() => {
return activeBomItems.reduce((acc, item) => {
const effQty = item.qty * (1 + item.lossPercent / 100);
return acc + (effQty * item.cost);
}, 0);
}, [activeBomItems]);
const suggestedPrice = useMemo(() => {
const totalDeductions = overheadPercent + taxPercent + marginPercent;
if (totalDeductions >= 100) return 0;
return totalCost / (1 - (totalDeductions / 100));
}, [totalCost, overheadPercent, taxPercent, marginPercent]);
const taxValue = suggestedPrice * (taxPercent / 100);
const overheadValue = suggestedPrice * (overheadPercent / 100);
const netProfitValue = suggestedPrice * (marginPercent / 100);
// MANIPULAÇÃO DA BOM
const handleAddItem = async () => {
if (userRole !== 'admin') {
showStatus('Apenas administradores podem modificar a BOM de engenharia.', 'error');
return;
}
if (!selectedProductId || !selectedBomId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const newItem = {
      id: 'bi_' + Date.now(),
      bom_id: selectedBomId,
      product_id: prod.id,
      code: prod.omie_code || 'LOCAL',
      name: prod.name,
      unit: prod.unit,
      cost: parseFloat(prod.cost),
      stock: parseFloat(prod.stock || 0),
      qty: parseFloat(inputQty),
      lossPercent: parseFloat(inputLoss)
    };

    if (supabase) {
      const { error } = await supabase.from('bom_items').insert([{
        bom_id: selectedBomId,
        product_id: prod.id,
        quantity: parseFloat(inputQty),
        loss_percent: parseFloat(inputLoss)
      }]);
      if (error) {
        showStatus('Erro ao salvar no banco: ' + error.message, 'error');
        return;
      }
    }

    setBomItems(prev => [...prev, newItem]);
    showStatus(`Insumo "${prod.name}" adicionado à estrutura!`, 'success');
};
const handleRemoveItem = async (itemId) => {
if (userRole !== 'admin') return;
    if (supabase) {
      await supabase.from('bom_items').delete().eq('id', itemId);
    }
    setBomItems(prev => prev.filter(i => i.id !== itemId));
    showStatus('Componente removido.', 'info');
};
// CADASTRO NOVO TRAILER (BOM)
const handleCreateNewBom = async (e) => {
e.preventDefault();
if (!newBomCode.trim() || !newBomName.trim()) return;
    const newBom = {
      id: 'b_' + Date.now(),
      code: newBomCode.trim().toUpperCase(),
      name: newBomName.trim(),
      category: 'Trailer'
    };

    if (supabase) {
      const { data, error } = await supabase.from('boms').insert([{
        code: newBom.code,
        name: newBom.name,
        overhead_percent: overheadPercent,
        tax_percent: taxPercent,
        margin_percent: marginPercent
      }]).select('*');

      if (error) {
        showStatus('Erro ao cadastrar trailer: ' + error.message, 'error');
        return;
      } else if (data && data[0]) {
        newBom.id = data[0].id;
      }
    }

    setBoms(prev => [...prev, newBom]);
    setSelectedBomId(newBom.id);
    setShowNewBomModal(false);
    setNewBomCode('');
    setNewBomName('');
    showStatus(`Trailer "${newBom.name}" criado com sucesso!`, 'success');
};
// EXPLOSÃO MRP
const calculateMaterialNeeds = () => {
const needsMap = {};
productionPlan.forEach(plan => {
const planItems = bomItems.filter(i => i.bom_id === plan.bomId);
planItems.forEach(item => {
const requiredQty = item.qty * (1 + item.lossPercent / 100) * plan.qty;
if (!needsMap[item.productId || item.code]) {
needsMap[item.productId || item.code] = {
code: item.code,
name: item.name,
unit: item.unit,
cost: item.cost,
stock: item.stock || 0,
requiredQty: 0
};
}
needsMap[item.productId || item.code].requiredQty += requiredQty;
});
});
return Object.values(needsMap);
};
const materialNeeds = calculateMaterialNeeds();
// EXPORTAR CSV EXCEL BRASIL
const handleExportCSV = () => {
const headers = "Código;Insumo;Unidade;Estoque Atual;Necessidade Produção;Saldo Projetado;Comprar Sugerido;Custo Estimado (R$)\n";
const rows = materialNeeds.map(item => {
const balance = item.stock - item.requiredQty;
const toBuy = balance < 0 ? Math.abs(balance) : 0;
const buyCost = toBuy * item.cost;
return `${item.code};"${item.name}";${item.unit};${item.stock};${item.requiredQty.toFixed(2).replace('.', ',')};${balance.toFixed(2).replace('.', ',')};${toBuy.toFixed(2).replace('.', ',')};${buyCost.toFixed(2).replace('.', ',')}`;
}).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Necessidade_Materiais_MRP_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    showStatus('Relatório CSV baixado com sucesso!', 'success');
};
const chartData = [
{ name: 'Custo BOM Direto', value: totalCost, color: '#38bdf8' },
{ name: 'Overhead / Fixo', value: overheadValue, color: '#f59e0b' },
{ name: 'Impostos Retidos', value: taxValue, color: '#f43f5e' },
{ name: 'Lucro Líquido Target', value: netProfitValue, color: '#10b981' }
];
// RENDER: LOGIN
if (authLoading) {
return (
<div className="min-h-screen bg-[#060911] text-slate-100 flex items-center justify-center">
<RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
</div>
);
}
if (!session) {
return (
<div className="min-h-screen bg-[#060911] text-slate-100 flex items-center justify-center p-4 font-sans">
<div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-xl">
<div className="flex items-center gap-4">
<div className="p-3 bg-gradient-to-br from-sky-400 to-indigo-600 text-slate-950 rounded-2xl shadow-lg">
<Truck className="w-8 h-8" />
</div>
<div>
<h1 className="text-xl font-extrabold text-white">DM BOM SYSTEM</h1>
<p className="text-xs text-slate-400">DM Comércio e Indústria de Reboques</p>
</div>
</div>
          {authError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Corporativo</label>
              <input 
                type="email" 
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
                placeholder="seu.email@dmtrailers.com.br"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Senha</label>
              <input 
                type="password" 
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 bg-gradient-to-r from-sky-400 to-indigo-500 text-slate-950 font-bold rounded-2xl text-sm transition-all shadow-lg hover:brightness-110 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Entrar no Sistema
            </button>
          </form>
        </div>
      </div>
    );
}
// RENDER: PAINEL PRINCIPAL DFB (DARK MIDNIGHT GLASS)
return (
<div className="min-h-screen bg-[#060911] text-slate-100 flex font-sans selection:bg-sky-400 selection:text-slate-950">
      {/* SIDEBAR NAVEGAÇÃO LATERAL */}
      <aside className="w-64 bg-slate-900/40 border-r border-slate-800/60 backdrop-blur-2xl flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-sky-400 to-indigo-600 text-slate-950 rounded-2xl shadow-md">
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wide text-white">DM TRAILERS</h1>
              <p className="text-[10px] text-sky-400 font-mono tracking-wider font-semibold">ENGINEERING & MRP</p>
            </div>
          </div>

          <nav className="p-3 space-y-1.5 mt-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-sky-500/10 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:bg-slate-800/40'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview & KPI</span>
            </button>

            <button
              onClick={() => setActiveTab('engineering')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${activeTab === 'engineering' ? 'bg-sky-500/10 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:bg-slate-800/40'}`}
            >
              <Layers className="w-4 h-4" />
              <span>Engenharia & BOM</span>
            </button>

            <button
              onClick={() => setActiveTab('production')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${activeTab === 'production' ? 'bg-sky-500/10 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:bg-slate-800/40'}`}
            >
              <Calculator className="w-4 h-4" />
              <span>Ficha de Produção / MRP</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${activeTab === 'pricing' ? 'bg-sky-500/10 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:bg-slate-800/40'}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Precificação & DRE</span>
            </button>

            <button
              onClick={() => setActiveTab('snapshots')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${activeTab === 'snapshots' ? 'bg-sky-500/10 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:bg-slate-800/40'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Snapshots Financeiros</span>
            </button>
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800/60 space-y-3">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${userRole === 'admin' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-xs font-semibold capitalize text-slate-300">Modo: {userRole}</span>
            </div>
            <button 
              onClick={() => setUserRole(userRole === 'admin' ? 'operador' : 'admin')}
              className="text-[10px] text-sky-400 hover:underline font-mono"
            >
              Alternar
            </button>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-2xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ÁREA CENTRAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-20 bg-[#060911]/80 border-b border-slate-800/60 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase font-mono">
            {activeTab === 'dashboard' && 'Visão Geral & Métricas da Fábrica'}
            {activeTab === 'engineering' && 'Engenharia de Estruturas (BOM)'}
            {activeTab === 'production' && 'Ordens de Fabricação & MRP'}
            {activeTab === 'pricing' && 'Formação de Preço Sugerido (DRE)'}
            {activeTab === 'snapshots' && 'Histórico de Precificação Registrado'}
          </h2>

          <div className="flex items-center gap-4">
            {userRole === 'admin' && (
              <button
                onClick={() => setShowNewBomModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-sky-400 to-indigo-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Novo Trailer
              </button>
            )}
          </div>
        </header>

        {statusMessage && (
          <div className={`px-8 py-2.5 text-xs flex items-center justify-between border-b ${statusMessage.type === 'error' ? 'bg-rose-950/40 border-rose-800/60 text-rose-300' : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'}`}>
            <div className="flex items-center gap-2 font-medium">
              {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{statusMessage.text}</span>
            </div>
          </div>
        )}

        <main className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
                    <span>Modelos Ativos</span>
                    <Package className="w-4 h-4 text-sky-400" />
                  </div>
                  <p className="text-3xl font-extrabold text-white font-mono">{boms.length}</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
                    <span>Custo BOM Ativo</span>
                    <Wrench className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-3xl font-extrabold text-white font-mono">R$ {totalCost.toFixed(2)}</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
                    <span>Insumos Catálogo</span>
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-3xl font-extrabold text-white font-mono">{products.length}</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
                    <span>Margem Alvo</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-400 font-mono">{marginPercent}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-7 backdrop-blur-xl space-y-6">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-sky-400" /> Distribuição do Preço Final Sugerido
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={105}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-7 backdrop-blur-xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-200">Resumo de Formação de Preço</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Custo Direto:</span>
                      <span className="font-mono font-bold text-slate-200">R$ {totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Overhead ({overheadPercent}%):</span>
                      <span className="font-mono text-amber-400">R$ {overheadValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Impostos ({taxPercent}%):</span>
                      <span className="font-mono text-rose-400">R$ {taxValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Lucro Líquido ({marginPercent}%):</span>
                      <span className="font-mono text-emerald-400">R$ {netProfitValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-3 pt-4 font-bold text-sm">
                      <span className="text-white">Preço Sugerido:</span>
                      <span className="font-mono text-sky-400">R$ {suggestedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENGENHARIA BOM */}
          {activeTab === 'engineering' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase text-sky-400 flex items-center gap-2 font-mono">
                    <Package className="w-4 h-4" /> Selecionar Trailer
                  </h3>
                  <select 
                    value={selectedBomId} 
                    onChange={e => setSelectedBomId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-100 font-medium"
                  >
                    {boms.map(b => (
                      <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>

                {userRole === 'admin' && (
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                    <h3 className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-2 font-mono">
                      <Plus className="w-4 h-4" /> Incluir Componente
                    </h3>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Selecionar Insumo</label>
                      <select 
                        value={selectedProductId}
                        onChange={e => setSelectedProductId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200"
                      >
                        <option value="">Selecione...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>[{p.omie_code || 'LOCAL'}] {p.name} - R$ {parseFloat(p.cost).toFixed(2)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Quantidade</label>
                        <input 
                          type="number" 
                          step="0.0001"
                          value={inputQty}
                          onChange={e => setInputQty(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Perda (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={inputLoss}
                          onChange={e => setInputLoss(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 font-mono"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleAddItem}
                      disabled={!selectedProductId}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Adicionar à Estrutura
                    </button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-7 backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" /> Componentes do Modelo Selecionado
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px]">
                        <tr>
                          <th className="p-3">Código</th>
                          <th className="p-3">Insumo</th>
                          <th className="p-3 text-right">Qtd Base</th>
                          <th className="p-3 text-right">Perda %</th>
                          <th className="p-3 text-right">Custo Un.</th>
                          <th className="p-3 text-right">Subtotal</th>
                          {userRole === 'admin' && <th className="p-3 text-center">Ação</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {activeBomItems.map(item => {
                          const effQty = item.qty * (1 + item.lossPercent / 100);
                          const lineTotal = effQty * item.cost;
                          return (
                            <tr key={item.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-mono text-slate-400">{item.code}</td>
                              <td className="p-3 font-semibold text-slate-200">{item.name}</td>
                              <td className="p-3 text-right font-mono">{item.qty} {item.unit}</td>
                              <td className="p-3 text-right font-mono text-amber-400">{item.lossPercent}%</td>
                              <td className="p-3 text-right font-mono">R$ {item.cost.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono font-bold text-sky-400">R$ {lineTotal.toFixed(2)}</td>
                              {userRole === 'admin' && (
                                <td className="p-3 text-center">
                                  <button onClick={() => handleRemoveItem(item.id)} className="text-slate-500 hover:text-rose-400">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total Custo BOM Direto:</span>
                  <span className="text-2xl font-extrabold font-mono text-emerald-400">R$ {totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MRP E COMPRAS */}
          {activeTab === 'production' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-5">
                  <h3 className="text-xs font-bold uppercase text-sky-400 flex items-center gap-2 font-mono">
                    <Calculator className="w-4 h-4" /> Definir Lote Industrial
                  </h3>
                  
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Modelo de Trailer</label>
                    <select 
                      value={selectedPlanBomId} 
                      onChange={e => setSelectedPlanBomId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200"
                    >
                      {boms.map(b => (
                        <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Qtd Fabricar</label>
                    <input 
                      type="number" 
                      min="1"
                      value={planQty}
                      onChange={e => setPlanQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 font-mono"
                    />
                  </div>

                  <button 
                    onClick={() => {
                      const bomObj = boms.find(b => b.id === selectedPlanBomId);
                      if (bomObj) {
                        setProductionPlan(prev => [...prev, { bomId: selectedPlanBomId, code: bomObj.code, name: bomObj.name, qty: planQty }]);
                      }
                    }}
                    className="w-full py-3 bg-sky-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Adicionar ao Lote
                  </button>
                </div>

                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-7 backdrop-blur-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" /> Explosão MRP & Necessidade de Materiais
                      </h3>
                      <button 
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-2xl text-xs font-bold flex items-center gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" /> Exportar CSV
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px]">
                          <tr>
                            <th className="p-3">Insumo</th>
                            <th className="p-3 text-right">Estoque</th>
                            <th className="p-3 text-right">Demanda Lote</th>
                            <th className="p-3 text-right">Saldo Previsto</th>
                            <th className="p-3 text-right">Sugestão Compra</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {materialNeeds.map(item => {
                            const balance = item.stock - item.requiredQty;
                            const toBuy = balance < 0 ? Math.abs(balance) : 0;
                            return (
                              <tr key={item.code} className="hover:bg-slate-800/40">
                                <td className="p-3 font-semibold text-slate-200">{item.name}</td>
                                <td className="p-3 text-right font-mono text-slate-400">{item.stock}</td>
                                <td className="p-3 text-right font-mono text-sky-400 font-bold">{item.requiredQty.toFixed(2)}</td>
                                <td className={`p-3 text-right font-mono font-bold ${balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {balance.toFixed(2)}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-amber-400">
                                  {toBuy > 0 ? `${toBuy.toFixed(2)} ${item.unit}` : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRECIFICAÇÃO */}
          {activeTab === 'pricing' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
                <h3 className="text-xs font-bold uppercase text-emerald-400 font-mono">Simulador de Markup</h3>
                <div className="space-y-5">
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">Overhead Fixo: {overheadPercent}%</label>
                    <input type="range" min="0" max="30" value={overheadPercent} onChange={e => setOverheadPercent(parseFloat(e.target.value))} className="w-full accent-sky-400" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">Impostos: {taxPercent}%</label>
                    <input type="range" min="0" max="40" value={taxPercent} onChange={e => setTaxPercent(parseFloat(e.target.value))} className="w-full accent-rose-400" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">Lucro Líquido: {marginPercent}%</label>
                    <input type="range" min="0" max="50" value={marginPercent} onChange={e => setMarginPercent(parseFloat(e.target.value))} className="w-full accent-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-7 backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-6">Formação de Preço Sugerido (Tributação Por Dentro)</h3>
                  <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                    <span className="text-xs font-mono text-sky-400 uppercase">Preço Final de Venda Recomendado</span>
                    <p className="text-4xl font-extrabold font-mono text-white">R$ {suggestedPrice.toFixed(2)}</p>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs font-medium">
                      <div><span className="text-slate-500 block">Custo Direto:</span><span className="text-slate-200 font-mono">R$ {totalCost.toFixed(2)}</span></div>
                      <div><span className="text-slate-500 block">Impostos Total:</span><span className="text-rose-400 font-mono">R$ {taxValue.toFixed(2)}</span></div>
                      <div><span className="text-slate-500 block">Lucro Projetado:</span><span className="text-emerald-400 font-mono">R$ {netProfitValue.toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SNAPSHOTS */}
          {activeTab === 'snapshots' && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-7 backdrop-blur-xl space-y-6">
              <h3 className="text-sm font-bold text-slate-200">Histórico de Snapshots Registrados</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Data</th>
                      <th className="p-3">Descrição</th>
                      <th className="p-3 text-right">Custo BOM</th>
                      <th className="p-3 text-right">Preço Sugerido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                    {snapshots.map(snap => (
                      <tr key={snap.id} className="hover:bg-slate-800/40">
                        <td className="p-3">{new Date(snap.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3 font-semibold text-slate-200">{snap.title}</td>
                        <td className="p-3 text-right">R$ {parseFloat(snap.total_cost).toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-sky-400">R$ {parseFloat(snap.suggested_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL NOVO TRAILER */}
      {showNewBomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateNewBom} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Cadastrar Modelo de Trailer</h3>
              <button type="button" onClick={() => setShowNewBomModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input 
                type="text" 
                required
                placeholder="Código (EX: TR-RACING-02)" 
                value={newBomCode} 
                onChange={e => setNewBomCode(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-100 uppercase"
              />
              <input 
                type="text" 
                required
                placeholder="Nome do Modelo" 
                value={newBomName} 
                onChange={e => setNewBomName(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowNewBomModal(false)} className="w-1/2 py-3 bg-slate-800 rounded-2xl text-xs text-slate-300">Cancelar</button>
              <button 
                type="submit" 
                className="w-1/2 py-3 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold rounded-2xl text-xs transition-colors"
              >
                Cadastrar Modelo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
);
}
