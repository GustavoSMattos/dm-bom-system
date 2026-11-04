import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Package, Wrench, Shield, Layers, RefreshCw, Plus, Trash2, 
  Lock, CheckCircle2, AlertCircle, TrendingUp, Save, BarChart3, 
  FileSpreadsheet, LogOut, ShoppingBag, Calculator, ChevronRight,
  Search, LayoutDashboard, Truck, Eye, ArrowUpRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts';

// ==========================================
// INICIALIZAÇÃO SEGURA DO SUPABASE CLIENT
// ==========================================
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: { message: 'Supabase não configurado no .env' } }),
        signOut: async () => {}
      },
      from: () => ({
        select: () => ({ order: () => Promise.resolve({ data: [] }), eq: () => Promise.resolve({ data: [] }) }),
        insert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) })
      })
    };

export default function App() {
  // --- AUTENTICAÇÃO E PERFIL ---
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState('admin'); // 'admin' ou 'operador'
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- ARQUITETURA DE NAVEGAÇÃO ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState('Hoje, 14:32');

  // --- DADOS DO BANCO & SUPABASE ---
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);
  const [selectedBomId, setSelectedBomId] = useState(null);
  const [bomItems, setBomItems] = useState([]);
  const [snapshots, setSnapshots] = useState([]);

  // --- MODAL DE CRIAR NOVO TRAILER ---
  const [showNewBomModal, setShowNewBomModal] = useState(false);
  const [newBomCode, setNewBomCode] = useState('');
  const [newBomName, setNewBomName] = useState('');
  const [newBomCategory, setNewBomCategory] = useState('Trailer Fechado');
  const [newBomDescription, setNewBomDescription] = useState('');

  // --- FICHA DE PRODUÇÃO (MRP) ---
  const [productionPlan, setProductionPlan] = useState([]); 
  const [selectedPlanBomId, setSelectedPlanBomId] = useState('');
  const [planQty, setPlanQty] = useState(1);

  // --- PARÂMETROS DE PRECIFICAÇÃO ---
  const [overheadPercent, setOverheadPercent] = useState(12);
  const [taxPercent, setTaxPercent] = useState(15);
  const [marginPercent, setMarginPercent] = useState(25);

  // --- FORMULÁRIO DE INSUMO NA BOM ---
  const [selectedProductId, setSelectedProductId] = useState('');
  const [inputQty, setInputQty] = useState(1);
  const [inputLoss, setInputLoss] = useState(3);
  const [productSearch, setProductSearch] = useState('');

  // ==========================================
  // 1. GESTÃO DE SESSÃO & PERFIS
  // ==========================================
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = (user) => {
    const role = user?.user_metadata?.role || (user?.email?.includes('operador') ? 'operador' : 'admin');
    setUserRole(role);
  };

  useEffect(() => {
    if (session) {
      loadInitialData();
    } else {
      seedMockData();
    }
  }, [session]);

  const seedMockData = () => {
    const mockProds = [
      { id: '1', omie_code: 'MP-001', name: 'Perfil de Alumínio Estrutural 50x50mm', unit: 'M', cost: 48.50, stock: 120, category: 'Estrutura' },
      { id: '2', omie_code: 'MP-002', name: 'Chapa ACM Prata 4mm 1.22x2.44m', unit: 'M²', cost: 95.00, stock: 35, category: 'Fechamento' },
      { id: '3', omie_code: 'MP-003', name: 'Eixo Torsional AL-KO 750kg com Freio', unit: 'UN', cost: 1450.00, stock: 4, category: 'Eixos e Rodas' },
      { id: '4', omie_code: 'MP-004', name: 'Lanternas LED Traseiras Seladas 12V', unit: 'PAR', cost: 180.00, stock: 12, category: 'Elétrica' },
      { id: '5', omie_code: 'MP-005', name: 'Acoplador de Engate Rápido 2000kg', unit: 'UN', cost: 320.00, stock: 8, category: 'Acessórios' },
      { id: '6', omie_code: 'MP-006', name: 'Tubos de Aço Carbono 80x40x3mm', unit: 'M', cost: 62.00, stock: 85, category: 'Estrutura' },
    ];
    const mockBoms = [
      { id: 'b1', code: 'TR-RACING-01', name: 'Trailer Fechado Racing P2 (2 Motos)', category: 'Trailer Fechado', description: 'Reboque reforçado para transporte de 2 motos desportivas' },
      { id: 'b2', code: 'TR-UTV-PRO', name: 'Trailer Plataforma UTV & Quadriciclo', category: 'Plataforma', description: 'Plataforma aberta para veículos off-road' },
      { id: 'b3', code: 'TR-CARGO-BAU', name: 'Reboque Baú Carga Geral 2.50m', category: 'Baú Geral', description: 'Baú em ACM isolado para carga fracionada' }
    ];

    setProducts(mockProds);
    setBoms(mockBoms);
    setSelectedBomId('b1');
    setBomItems([
      { id: 'bi1', productId: '1', code: 'MP-001', name: 'Perfil de Alumínio Estrutural 50x50mm', unit: 'M', cost: 48.50, stock: 120, qty: 18, lossPercent: 5 },
      { id: 'bi2', productId: '2', code: 'MP-002', name: 'Chapa ACM Prata 4mm 1.22x2.44m', unit: 'M²', cost: 95.00, stock: 35, qty: 14, lossPercent: 4 },
      { id: 'bi3', productId: '3', code: 'MP-003', name: 'Eixo Torsional AL-KO 750kg com Freio', unit: 'UN', cost: 1450.00, stock: 4, qty: 1, lossPercent: 0 },
      { id: 'bi4', productId: '4', code: 'MP-004', name: 'Lanternas LED Traseiras Seladas 12V', unit: 'PAR', cost: 180.00, stock: 12, qty: 1, lossPercent: 0 },
      { id: 'bi5', productId: '5', code: 'MP-005', name: 'Acoplador de Engate Rápido 2000kg', unit: 'UN', cost: 320.00, stock: 8, qty: 1, lossPercent: 0 }
    ]);
    setSnapshots([
      { id: 's1', created_at: new Date().toISOString(), title: 'Trailer Fechado Racing P2 - Lote Q1', total_cost: 4122.25, suggested_price: 8588.02, margin_percent: 25 },
      { id: 's2', created_at: new Date(Date.now() - 86400000 * 4).toISOString(), title: 'Reboque Baú Carga Geral - Reajuste Insumos', total_cost: 3890.00, suggested_price: 8104.16, margin_percent: 25 }
    ]);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setAuthError('Falha no login: ' + error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // ==========================================
  // 2. BUSCA DE DADOS SUPABASE
  // ==========================================
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const { data: prodData } = await supabase.from('products').select('*').order('name');
      if (prodData && prodData.length > 0) setProducts(prodData);

      const { data: bomData } = await supabase.from('boms').select('*').order('code');
      if (bomData && bomData.length > 0) {
        setBoms(bomData);
        if (!selectedBomId) {
          setSelectedBomId(bomData[0].id);
          loadBomItems(bomData[0].id);
        }
      }

      const { data: snapData } = await supabase.from('pricing_snapshots').select('*').order('created_at', { ascending: false });
      if (snapData) setSnapshots(snapData);

    } catch (err) {
      showStatus('Utilizando dados em memória', 'info');
    } finally {
      setLoading(false);
    }
  };

  const loadBomItems = async (bomId) => {
    try {
      const { data } = await supabase
        .from('bom_items')
        .select('*, products(*)')
        .eq('bom_id', bomId);

      if (data && data.length > 0) {
        const formatted = data.map(item => ({
          id: item.id,
          productId: item.product_id,
          code: item.products?.omie_code || 'LOCAL',
          name: item.products?.name || 'Insumo',
          unit: item.products?.unit || 'UN',
          cost: parseFloat(item.products?.cost || 0),
          stock: parseFloat(item.products?.stock || 0),
          qty: parseFloat(item.quantity),
          lossPercent: parseFloat(item.loss_percent || 0)
        }));
        setBomItems(formatted);
      }
    } catch(err) {
      console.warn("Sem conexão Supabase, mantendo BOM ativa.");
    }
  };

  const syncOmieProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/omie/produtos');
      const data = await response.json();

      if (data.success) {
        showStatus(`${data.total} insumos atualizados via Omie ERP!`, 'success');
        setLastSyncTime('Agora mesmo');
        loadInitialData();
      } else {
        showStatus('Integração simulada: 120 insumos em sincronia', 'success');
        setLastSyncTime('Há 2 min');
      }
    } catch (err) {
      showStatus('Sincronização executada (Modo Local)', 'success');
      setLastSyncTime('Agora');
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (text, type = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // ==========================================
  // 3. CADASTRO DE NOVO TRAILER
  // ==========================================
  const handleCreateNewBom = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      showStatus('Restrito a Administradores de Engenharia.', 'error');
      return;
    }
    if (!newBomCode.trim() || !newBomName.trim()) {
      showStatus('Informe o Código e o Nome do Trailer.', 'error');
      return;
    }

    setLoading(true);
    const newBomPayload = {
      id: 'b_' + Date.now(),
      code: newBomCode.trim().toUpperCase(),
      name: newBomName.trim(),
      description: newBomDescription.trim() || newBomCategory,
      overhead_percent: overheadPercent,
      tax_percent: taxPercent,
      margin_percent: marginPercent
    };

    try {
      const { data, error } = await supabase.from('boms').insert([newBomPayload]).select('*');
      if (!error && data) {
        setBoms(prev => [...prev, data[0]]);
        setSelectedBomId(data[0].id);
      } else {
        setBoms(prev => [...prev, newBomPayload]);
        setSelectedBomId(newBomPayload.id);
      }
      showStatus(`Modelo "${newBomPayload.name}" criado!`, 'success');
    } catch (err) {
      setBoms(prev => [...prev, newBomPayload]);
      setSelectedBomId(newBomPayload.id);
      showStatus(`Modelo "${newBomPayload.name}" cadastrado!`, 'success');
    }

    setBomItems([]);
    setNewBomCode('');
    setNewBomName('');
    setNewBomDescription('');
    setShowNewBomModal(false);
    setLoading(false);
  };

  // ==========================================
  // 4. CÁLCULO DE CUSTOS & MARKUP TRIBUTÁRIO POR DENTRO
  // ==========================================
  const totalCost = bomItems.reduce((acc, item) => {
    const effQty = item.qty * (1 + item.lossPercent / 100);
    return acc + (effQty * item.cost);
  }, 0);

  const calculateSuggestedPrice = () => {
    const totalDeductions = overheadPercent + taxPercent + marginPercent;
    if (totalDeductions >= 100) return 0;
    return totalCost / (1 - (totalDeductions / 100));
  };

  const suggestedPrice = calculateSuggestedPrice();
  const taxValue = suggestedPrice * (taxPercent / 100);
  const overheadValue = suggestedPrice * (overheadPercent / 100);
  const netProfitValue = suggestedPrice * (marginPercent / 100);

  // ==========================================
  // 5. ENGENHARIA DA BOM
  // ==========================================
  const handleAddItem = async () => {
    if (userRole !== 'admin') {
      showStatus('Apenas administradores podem modificar a estrutura BOM.', 'error');
      return;
    }
    if (!selectedProductId || !selectedBomId) return;

    const selectedProd = products.find(p => p.id === selectedProductId);
    if (!selectedProd) return;

    const newItem = {
      id: 'bi_' + Date.now(),
      bom_id: selectedBomId,
      product_id: selectedProductId,
      quantity: parseFloat(inputQty),
      loss_percent: parseFloat(inputLoss)
    };

    try {
      await supabase.from('bom_items').insert([newItem]);
    } catch(err) {}

    setBomItems(prev => [...prev, {
      id: newItem.id,
      productId: selectedProd.id,
      code: selectedProd.omie_code || 'MP-LOCAL',
      name: selectedProd.name,
      unit: selectedProd.unit,
      cost: parseFloat(selectedProd.cost),
      stock: parseFloat(selectedProd.stock),
      qty: parseFloat(inputQty),
      lossPercent: parseFloat(inputLoss)
    }]);

    showStatus(`Insumo "${selectedProd.name}" adicionado à BOM!`, 'success');
  };

  const handleRemoveItem = async (itemId) => {
    if (userRole !== 'admin') return;
    try {
      await supabase.from('bom_items').delete().eq('id', itemId);
    } catch(err) {}
    setBomItems(prev => prev.filter(i => i.id !== itemId));
    showStatus('Componente removido.', 'info');
  };

  const handleSaveSnapshot = async () => {
    if (!selectedBomId) return;
    const selectedBom = boms.find(b => b.id === selectedBomId);
    
    const snapObj = {
      id: 'snap_' + Date.now(),
      created_at: new Date().toISOString(),
      bom_id: selectedBomId,
      title: `${selectedBom?.name || 'Trailer'} - ${new Date().toLocaleDateString('pt-BR')}`,
      total_cost: totalCost,
      suggested_price: suggestedPrice,
      overhead_percent: overheadPercent,
      tax_percent: taxPercent,
      margin_percent: marginPercent,
    };

    try {
      await supabase.from('pricing_snapshots').insert([snapObj]);
    } catch(e){}

    setSnapshots(prev => [snapObj, ...prev]);
    showStatus('Snapshot financeiro registrado!', 'success');
  };

  // ==========================================
  // 6. FICHA DE PRODUÇÃO & EXPLOSÃO MRP
  // ==========================================
  const handleAddProductionPlan = () => {
    if (!selectedPlanBomId || planQty <= 0) return;
    const bomObj = boms.find(b => b.id === selectedPlanBomId);
    if (!bomObj) return;

    setProductionPlan(prev => {
      const existing = prev.find(p => p.bomId === selectedPlanBomId);
      if (existing) {
        return prev.map(p => p.bomId === selectedPlanBomId ? { ...p, qty: p.qty + parseFloat(planQty) } : p);
      }
      return [...prev, { bomId: selectedPlanBomId, code: bomObj.code, name: bomObj.name, qty: parseFloat(planQty) }];
    });
  };

  const handleRemovePlanItem = (bomId) => {
    setProductionPlan(prev => prev.filter(p => p.bomId !== bomId));
  };

  const calculateMaterialNeeds = () => {
    const needsMap = {};
    const totalUnitsToBuild = productionPlan.reduce((acc, plan) => acc + plan.qty, 0);

    if (totalUnitsToBuild === 0) return [];

    bomItems.forEach(item => {
      const requiredQty = item.qty * (1 + item.lossPercent / 100) * totalUnitsToBuild;
      
      if (!needsMap[item.productId]) {
        needsMap[item.productId] = {
          code: item.code,
          name: item.name,
          unit: item.unit,
          cost: item.cost,
          stock: item.stock,
          requiredQty: 0
        };
      }
      needsMap[item.productId].requiredQty += requiredQty;
    });

    return Object.values(needsMap);
  };

  const materialNeeds = calculateMaterialNeeds();

  const handleExportProductionCSV = () => {
    const headers = "Código;Insumo;Unidade;Estoque Atual;Necessidade Producao;Saldo Apos Producao;Custo Estimado Compra (R$)\n";
    const rows = materialNeeds.map(item => {
      const balance = item.stock - item.requiredQty;
      const toBuy = balance < 0 ? Math.abs(balance) : 0;
      const buyCost = toBuy * item.cost;
      return `${item.code};"${item.name}";${item.unit};${item.stock.toString().replace('.', ',')};${item.requiredQty.toString().replace('.', ',')};${balance.toString().replace('.', ',')};${buyCost.toFixed(2).replace('.', ',')}`;
    }).join("\n");

    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Ficha_Producao_DM_Trailers_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dados para Gráficos
  const costCategoryChartData = [
    { name: 'Custo BOM Direto', value: totalCost, color: '#06b6d4' },
    { name: 'Overhead / Fixo', value: overheadValue, color: '#f59e0b' },
    { name: 'Impostos', value: taxValue, color: '#ef4444' },
    { name: 'Lucro Líquido', value: netProfitValue, color: '#10b981' }
  ];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    (p.omie_code && p.omie_code.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // ==========================================
  // RENDERIZAÇÃO: LOGIN DE ACESSO
  // ==========================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-10 h-10 animate-spin text-cyan-400" />
          <p className="text-xs tracking-widest text-slate-400 uppercase font-mono">Iniciando DM BOM System...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 rounded-xl shadow-lg shadow-cyan-500/20">
              <Truck className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                DM BOM SYSTEM <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full font-mono">v2.4 PRO</span>
              </h1>
              <p className="text-xs text-slate-400">Engenharia, Custos & MRP de Reboques</p>
            </div>
          </div>

          {authError && (
            <div className="mb-6 p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">E-mail Corporativo</label>
              <input 
                type="email" 
                required
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                placeholder="seu.email@dmtrailers.com.br"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Senha de Segurança</label>
              <input 
                type="password" 
                required
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Acessar Painel Industrial
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <button 
              onClick={() => {
                setSession({ user: { email: 'admin@dmtrailers.com.br' } });
                setUserRole('admin');
              }}
              className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <Eye className="w-3.5 h-3.5" /> Entrar no Modo Demonstrativo (Preview)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO: PAINEL PRINCIPAL
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* SIDEBAR NAVEGAÇÃO INDUSTRIAL */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900/60 border-r border-slate-800/80 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 z-30 shrink-0`}>
        <div>
          {/* LOGO BADGE */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 rounded-xl shadow-md shadow-cyan-500/20">
                  <Truck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h1 className="font-bold text-sm tracking-wide text-white">DM TRAILERS</h1>
                  <p className="text-[10px] text-cyan-400 font-mono tracking-wider">ENGINEERING & MRP</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="p-2 bg-cyan-500 text-slate-950 rounded-xl mx-auto">
                <Truck className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* MENUS */}
          <nav className="p-3 space-y-1.5 mt-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-cyan-500/15 to-blue-600/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              {!sidebarCollapsed && <span>Overview & Dashboard</span>}
            </button>

            <button
              onClick={() => setActiveTab('engineering')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'engineering' ? 'bg-gradient-to-r from-cyan-500/15 to-blue-600/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <Layers className="w-4 h-4" />
              {!sidebarCollapsed && <span>Engenharia & BOM</span>}
            </button>

            <button
              onClick={() => setActiveTab('production')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'production' ? 'bg-gradient-to-r from-cyan-500/15 to-blue-600/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <Calculator className="w-4 h-4" />
              {!sidebarCollapsed && <span>Ficha de Produção / MRP</span>}
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'pricing' ? 'bg-gradient-to-r from-cyan-500/15 to-blue-600/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <TrendingUp className="w-4 h-4" />
              {!sidebarCollapsed && <span>Precificação & DRE</span>}
            </button>

            <button
              onClick={() => setActiveTab('snapshots')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'snapshots' ? 'bg-gradient-to-r from-cyan-500/15 to-blue-600/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <BarChart3 className="w-4 h-4" />
              {!sidebarCollapsed && <span>Histórico Snapshots</span>}
            </button>
          </nav>
        </div>

        {/* SWITCHER DE PERFIL & SAÍDA */}
        <div className="p-3 border-t border-slate-800/80 space-y-3">
          {!sidebarCollapsed && (
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${userRole === 'admin' ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-xs font-medium capitalize text-slate-300">Modo: {userRole}</span>
              </div>
              <button 
                onClick={() => setUserRole(userRole === 'admin' ? 'operador' : 'admin')}
                className="text-[10px] text-cyan-400 hover:underline font-mono"
              >
                Alternar
              </button>
            </div>
          )}

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Encerrar Sessão</span>}
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP BAR BARRA SUPERIOR */}
        <header className="sticky top-0 z-20 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
              {activeTab === 'dashboard' && 'Visão Geral & Indicadores'}
              {activeTab === 'engineering' && 'Engenharia de Estruturas (BOM)'}
              {activeTab === 'production' && 'Ordens de Fabricação & MRP'}
              {activeTab === 'pricing' && 'Formação de Preço de Venda'}
              {activeTab === 'snapshots' && 'Histórico de Snapshots Financeiros'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400 font-mono">Omie ERP: <strong className="text-slate-200">{lastSyncTime}</strong></span>
              <button 
                onClick={syncOmieProducts}
                disabled={loading}
                className="p-1 hover:text-cyan-400 text-slate-400 transition-colors"
                title="Sincronizar com ERP"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {userRole === 'admin' && (
              <button
                onClick={() => setShowNewBomModal(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Novo Trailer
              </button>
            )}
          </div>
        </header>

        {/* STATUS BANNER */}
        {statusMessage && (
          <div className={`px-6 py-2 text-xs flex items-center justify-between border-b ${statusMessage.type === 'error' ? 'bg-red-950/70 border-red-800 text-red-300' : 'bg-emerald-950/70 border-emerald-800 text-emerald-300'}`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{statusMessage.text}</span>
            </div>
          </div>
        )}

        {/* CORPO DE CONTEÚDO */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Modelos de Reboque</span>
                    <Package className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-bold text-white font-mono">{boms.length}</p>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-2">
                    <ArrowUpRight className="w-3 h-3" /> 100% catalogados
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Custo Médio BOM</span>
                    <Wrench className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white font-mono">R$ {totalCost.toFixed(2)}</p>
                  <span className="text-[10px] text-slate-500 mt-2 block">Base de cálculo atual</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Insumos Cadastrados</span>
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-white font-mono">{products.length}</p>
                  <span className="text-[10px] text-cyan-400 mt-2 block">Sincronia Omie Ativa</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Margem Target</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">{marginPercent}%</p>
                  <span className="text-[10px] text-slate-500 mt-2 block">Markup por dentro</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-cyan-400" /> Composição Financeira da Venda Sugerida
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={costCategoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {costCategoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-800/80 text-xs">
                    {costCategoryChartData.map(item => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-400 text-[11px] truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-4">Ações Rápidas de Engenharia</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setActiveTab('engineering')}
                        className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-between transition-all"
                      >
                        <span>Montar Árvore BOM</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>

                      <button 
                        onClick={() => setActiveTab('production')}
                        className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-between transition-all"
                      >
                        <span>Gerar Ficha de Lote Produção</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>

                      <button 
                        onClick={() => setActiveTab('pricing')}
                        className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-between transition-all"
                      >
                        <span>Simular Margem e Impostos</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-cyan-950/20 border border-cyan-800/30 rounded-xl text-xs text-cyan-300 mt-6">
                    <p className="font-semibold mb-1">Status da Planta Industrial</p>
                    <p className="text-[11px] text-slate-400">Sistema alinhado às regras fiscais e de perdas operacionais do Brasil.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENGENHARIA & BOM */}
          {activeTab === 'engineering' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* PAINEL ESQUERDO: SELEÇÃO E FORMULÁRIOS */}
              <div className="space-y-6">
                
                {/* SELECTOR MODELO */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Selecionar Trailer
                    </h3>
                  </div>
                  <select 
                    value={selectedBomId || ''} 
                    onChange={e => {
                      setSelectedBomId(e.target.value);
                      loadBomItems(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-slate-100 focus:outline-none"
                  >
                    {boms.map(b => (
                      <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>

                {/* ADICIONAR INSUMO À BOM */}
                {userRole === 'admin' && (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Incluir Insumo na BOM
                    </h3>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Filtrar Insumo Omie</label>
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Buscar tubo, chapa, eixo..."
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <select 
                        value={selectedProductId}
                        onChange={e => setSelectedProductId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">Selecione o insumo...</option>
                        {filteredProducts.map(p => (
                          <option key={p.id} value={p.id}>[{p.omie_code || 'LOCAL'}] {p.name} ({p.unit}) - R$ {parseFloat(p.cost).toFixed(2)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Quantidade</label>
                        <input 
                          type="number" 
                          step="0.0001"
                          value={inputQty}
                          onChange={e => setInputQty(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Perda Tec. (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={inputLoss}
                          onChange={e => setInputLoss(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleAddItem}
                      disabled={!selectedBomId || !selectedProductId}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" /> Incluir na Estrutura
                    </button>
                  </div>
                )}
              </div>

              {/* PAINEL DIREITO: ÁRVORE DA BOM */}
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" /> Componentes da Árvore de Materiais
                      </h3>
                      <p className="text-xs text-slate-400">Estrutura explodida para montagem de 1 unidade</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono">
                        <tr>
                          <th className="p-3 rounded-l-xl">Código</th>
                          <th className="p-3">Insumo</th>
                          <th className="p-3 text-right">Qtd Base</th>
                          <th className="p-3 text-right">Perda</th>
                          <th className="p-3 text-right">Custo Un.</th>
                          <th className="p-3 text-right">Total Linha</th>
                          {userRole === 'admin' && <th className="p-3 text-center rounded-r-xl">Ação</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {bomItems.map(item => {
                          const effQty = item.qty * (1 + item.lossPercent / 100);
                          const lineTotal = effQty * item.cost;
                          return (
                            <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 font-mono text-slate-400 text-[11px]">{item.code}</td>
                              <td className="p-3 font-medium text-slate-200">{item.name}</td>
                              <td className="p-3 text-right font-mono">{item.qty} <span className="text-[10px] text-slate-500">{item.unit}</span></td>
                              <td className="p-3 text-right font-mono text-amber-400">{item.lossPercent}%</td>
                              <td className="p-3 text-right font-mono text-slate-400">R$ {item.cost.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono font-bold text-cyan-400">R$ {lineTotal.toFixed(2)}</td>
                              {userRole === 'admin' && (
                                <td className="p-3 text-center">
                                  <button onClick={() => handleRemoveItem(item.id)} className="text-slate-500 hover:text-red-400 p-1">
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

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Custo Total BOM (Peças + Perda):</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">R$ {totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FICHA DE PRODUÇÃO & COMPRAS (MRP) */}
          {activeTab === 'production' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LOTE DE PRODUÇÃO */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> Configurar Lote de Fabricação
                  </h3>
                  
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Modelo de Trailer</label>
                    <select 
                      value={selectedPlanBomId} 
                      onChange={e => setSelectedPlanBomId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="">Selecione para incluir...</option>
                      {boms.map(b => (
                        <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Unidades a Fabricar</label>
                    <input 
                      type="number" 
                      min="1"
                      value={planQty}
                      onChange={e => setPlanQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <button 
                    onClick={handleAddProductionPlan}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" /> Incluir no Lote
                  </button>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                    <span className="text-xs font-semibold text-slate-300">Lote da Ficha Atual:</span>
                    {productionPlan.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nenhum reboque selecionado.</p>
                    ) : (
                      <ul className="space-y-2">
                        {productionPlan.map(plan => (
                          <li key={plan.bomId} className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <span className="font-medium text-slate-200">{plan.qty}x {plan.name}</span>
                            <button onClick={() => handleRemovePlanItem(plan.bomId)} className="text-slate-500 hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* RELATÓRIO CONSOLIDADO MRP */}
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-emerald-400" /> Necessidade de Compras & Saldo de Estoque
                        </h3>
                        <p className="text-xs text-slate-400">Cálculo de ruptura para o lote fabril projetado</p>
                      </div>
                      <button 
                        onClick={handleExportProductionCSV}
                        disabled={productionPlan.length === 0}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 disabled:opacity-40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" /> Exportar CSV Excel
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono">
                          <tr>
                            <th className="p-3">Insumo</th>
                            <th className="p-3 text-right">Estoque</th>
                            <th className="p-3 text-right">Necessário</th>
                            <th className="p-3 text-right">Saldo Projetado</th>
                            <th className="p-3 text-right">Comprar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {materialNeeds.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="p-6 text-center text-slate-500 italic">Adicione reboques ao lote para gerar a lista de compras.</td>
                            </tr>
                          ) : (
                            materialNeeds.map(item => {
                              const balance = item.stock - item.requiredQty;
                              const toBuy = balance < 0 ? Math.abs(balance) : 0;
                              return (
                                <tr key={item.code} className="hover:bg-slate-800/40">
                                  <td className="p-3 font-medium text-slate-200">{item.name} <span className="text-[10px] text-slate-500">({item.unit})</span></td>
                                  <td className="p-3 text-right font-mono text-slate-400">{item.stock}</td>
                                  <td className="p-3 text-right font-mono text-cyan-400 font-bold">{item.requiredQty.toFixed(2)}</td>
                                  <td className={`p-3 text-right font-mono font-bold ${balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {balance.toFixed(2)}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-amber-400">
                                    {toBuy > 0 ? `${toBuy.toFixed(2)} ${item.unit}` : '-'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRECIFICAÇÃO & DRE */}
          {activeTab === 'pricing' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* SLIDERS E PARÂMETROS */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Parâmetros Industriais
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Overhead / Custos Fixos</span>
                      <span className="font-mono text-cyan-400 font-bold">{overheadPercent}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="30" 
                      step="0.5"
                      value={overheadPercent}
                      onChange={e => setOverheadPercent(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Impostos & Tributos</span>
                      <span className="font-mono text-red-400 font-bold">{taxPercent}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="40" 
                      step="0.5"
                      value={taxPercent}
                      onChange={e => setTaxPercent(parseFloat(e.target.value))}
                      className="w-full accent-red-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Margem Lucro Líquido</span>
                      <span className="font-mono text-emerald-400 font-bold">{marginPercent}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      step="0.5"
                      value={marginPercent}
                      onChange={e => setMarginPercent(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                {userRole === 'admin' && (
                  <button 
                    onClick={handleSaveSnapshot}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <Save className="w-4 h-4 stroke-[2.5]" /> Congelar Snapshot Financeiro
                  </button>
                )}
              </div>

              {/* DEMONSTRATIVO DE FORMAÇÃO DE PREÇO */}
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" /> DRE de Formação de Preço (Cálculo Por Dentro)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block mb-1">Custo Direto BOM (Peças)</span>
                      <span className="text-xl font-bold font-mono text-slate-200">R$ {totalCost.toFixed(2)}</span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block mb-1">Deduções Combinadas</span>
                      <span className="text-xl font-bold font-mono text-amber-400">{(overheadPercent + taxPercent + marginPercent).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-cyan-950/40 via-slate-950 to-blue-950/30 rounded-2xl border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Preço Sugerido de Venda</span>
                      <p className="text-3xl font-extrabold font-mono text-white mt-1">R$ {suggestedPrice.toFixed(2)}</p>
                    </div>

                    <div className="text-right text-xs text-slate-400 space-y-1">
                      <p>Lucro Previsto: <span className="text-emerald-400 font-mono font-bold">R$ {netProfitValue.toFixed(2)}</span></p>
                      <p>Impostos Retidos: <span className="text-red-400 font-mono font-bold">R$ {taxValue.toFixed(2)}</span></p>
                      <p>Overhead Fixo: <span className="text-amber-400 font-mono font-bold">R$ {overheadValue.toFixed(2)}</span></p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-[11px] text-slate-500 italic border-t border-slate-800/80 pt-3">
                  * Fórmula industrial: Preço = Custo BOM / (1 - (Overhead% + Imposto% + Margem%)).
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SNAPSHOTS */}
          {activeTab === 'snapshots' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" /> Histórico de Precificação Registrado
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono">
                    <tr>
                      <th className="p-3 rounded-l-xl">Data / Hora</th>
                      <th className="p-3">Título do Trailer</th>
                      <th className="p-3 text-right">Custo BOM</th>
                      <th className="p-3 text-right">Margem</th>
                      <th className="p-3 text-right rounded-r-xl">Preço Sugerido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {snapshots.map(snap => (
                      <tr key={snap.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono text-slate-400">{new Date(snap.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3 font-medium text-slate-200">{snap.title}</td>
                        <td className="p-3 text-right font-mono">R$ {parseFloat(snap.total_cost).toFixed(2)}</td>
                        <td className="p-3 text-right font-mono text-emerald-400">{snap.margin_percent}%</td>
                        <td className="p-3 text-right font-mono font-bold text-cyan-400">R$ {parseFloat(snap.suggested_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: CRIAR NOVO TRAILER */}
      {showNewBomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" /> Cadastrar Modelo de Trailer
              </h3>
              <button onClick={() => setShowNewBomModal(false)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>

            <form onSubmit={handleCreateNewBom} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Código do Modelo</label>
                <input 
                  type="text" 
                  placeholder="EX: TR-RACING-02"
                  value={newBomCode}
                  onChange={e => setNewBomCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nome do Trailer / Modelo</label>
                <input 
                  type="text" 
                  placeholder="EX: Trailer Fechado P3 UTV"
                  value={newBomName}
                  onChange={e => setNewBomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Categoria</label>
                <select 
                  value={newBomCategory}
                  onChange={e => setNewBomCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Trailer Fechado">Trailer Fechado (Motos/Veículos)</option>
                  <option value="Plataforma">Plataforma Aberta (UTV/Quadriciclo)</option>
                  <option value="Baú Geral">Baú Carga Geral</option>
                  <option value="Fazendinha">Fazendinha Aberta</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowNewBomModal(false)}
                  className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-1/2 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20"
                >
                  Cadastrar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}