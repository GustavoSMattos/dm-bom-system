import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  Package, Wrench, Shield, Layers, RefreshCw, Plus, Trash2, 
  Lock, CheckCircle2, AlertCircle, TrendingUp, Save, BarChart3, 
  FileSpreadsheet, LogOut, ShoppingBag, Calculator
} from 'lucide-react';

export default function App() {
  // --- AUTENTICAÇÃO E PERFIL DE USUÁRIO ---
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState('admin'); // 'admin' ou 'operador'
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- NAVEGAÇÃO E ESTADO GERAL ---
  const [activeTab, setActiveTab] = useState('engineering');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // --- DADOS REAIS DO SUPABASE & OMIE ---
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);
  const [selectedBomId, setSelectedBomId] = useState(null);
  const [bomItems, setBomItems] = useState([]);
  const [snapshots, setSnapshots] = useState([]);

  // --- CADASTRO LOCAL DE NOVO MODELO DE TRAILER ---
  const [newBomCode, setNewBomCode] = useState('');
  const [newBomName, setNewBomName] = useState('');
  const [newBomDescription, setNewBomDescription] = useState('');

  // --- FICHA DE PRODUÇÃO (SIMULADOR MRP & LISTA DE COMPRAS) ---
  const [productionPlan, setProductionPlan] = useState([]); // [{ bomId, code, name, qty }]
  const [selectedPlanBomId, setSelectedPlanBomId] = useState('');
  const [planQty, setPlanQty] = useState(1);

  // --- PARÂMETROS DE PRECIFICAÇÃO E MARKUP TRIBUTÁRIO ---
  const [overheadPercent, setOverheadPercent] = useState(12);
  const [taxPercent, setTaxPercent] = useState(15);
  const [marginPercent, setMarginPercent] = useState(25);

  // --- FORMULÁRIO DE ADIÇÃO DE ITEM NA BOM ---
  const [selectedProductId, setSelectedProductId] = useState('');
  const [inputQty, setInputQty] = useState(1);
  const [inputLoss, setInputLoss] = useState(0);

  // ==========================================
  // 1. INICIALIZAÇÃO E GESTÃO DE SESSÃO
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
    // Define permissões com base no metadado do usuário ou fallback
    const role = user?.user_metadata?.role || (user?.email?.includes('operador') ? 'operador' : 'admin');
    setUserRole(role);
  };

  useEffect(() => {
    if (session) {
      loadInitialData();
    }
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setAuthError('Falha na autenticação: ' + error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ==========================================
  // 2. CARREGAMENTO E SINCRONIZAÇÃO DE DADOS
  // ==========================================
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Buscar Produtos/Insumos
      const { data: prodData } = await supabase.from('products').select('*').order('name');
      setProducts(prodData || []);

      // Buscar Estruturas de Reboques (BOMs)
      const { data: bomData } = await supabase.from('boms').select('*').order('code');
      setBoms(bomData || []);

      if (bomData && bomData.length > 0 && !selectedBomId) {
        setSelectedBomId(bomData[0].id);
        loadBomItems(bomData[0].id);
      }

      // Buscar Snapshots Financeiros
      const { data: snapData } = await supabase.from('pricing_snapshots').select('*').order('created_at', { ascending: false });
      setSnapshots(snapData || []);

    } catch (err) {
      showStatus('Erro ao carregar dados do banco de dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBomItems = async (bomId) => {
    const { data } = await supabase
      .from('bom_items')
      .select('*, products(*)')
      .eq('bom_id', bomId);

    if (data) {
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
  };

  const syncOmieProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/omie/produtos');
      const data = await response.json();

      if (data.success) {
        showStatus(`${data.total} insumos sincronizados com o ERP Omie!`, 'success');
        loadInitialData();
      } else {
        showStatus('Erro na integração Omie: ' + data.error, 'error');
      }
    } catch (err) {
      showStatus('Erro ao chamar a Serverless Function /api/omie/produtos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (text, type = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // ==========================================
  // 3. CRIAR NOVO MODELO DE TRAILER (LOCAL)
  // ==========================================
  const handleCreateNewBom = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      showStatus('Apenas administradores podem cadastrar novos modelos de trailers.', 'error');
      return;
    }
    if (!newBomCode.trim() || !newBomName.trim()) {
      showStatus('Preencha o código e o nome do modelo.', 'error');
      return;
    }

    setLoading(true);
    const newBomPayload = {
      code: newBomCode.trim().toUpperCase(),
      name: newBomName.trim(),
      description: newBomDescription.trim() || null,
      overhead_percent: overheadPercent,
      tax_percent: taxPercent,
      margin_percent: marginPercent
    };

    const { data, error } = await supabase.from('boms').insert([newBomPayload]).select('*');

    if (error) {
      showStatus('Erro ao cadastrar modelo: ' + error.message, 'error');
    } else if (data && data[0]) {
      showStatus(`Modelo "${data[0].name}" cadastrado com sucesso!`, 'success');
      setBoms(prev => [...prev, data[0]]);
      setSelectedBomId(data[0].id);
      setBomItems([]);
      setNewBomCode('');
      setNewBomName('');
      setNewBomDescription('');
    }
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

  // ==========================================
  // 5. GESTÃO DE ÍTENS DA BOM DA ENGENHARIA
  // ==========================================
  const handleAddItem = async () => {
    if (userRole !== 'admin') {
      showStatus('Apenas administradores podem modificar a BOM de engenharia.', 'error');
      return;
    }
    if (!selectedProductId || !selectedBomId) return;

    const newItem = {
      bom_id: selectedBomId,
      product_id: selectedProductId,
      quantity: parseFloat(inputQty),
      loss_percent: parseFloat(inputLoss)
    };

    const { error } = await supabase.from('bom_items').insert([newItem]);

    if (error) {
      showStatus('Erro ao adicionar componente: ' + error.message, 'error');
    } else {
      loadBomItems(selectedBomId);
      showStatus('Componente adicionado à estrutura!', 'success');
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (userRole !== 'admin') return;
    const { error } = await supabase.from('bom_items').delete().eq('id', itemId);
    if (!error) {
      setBomItems(prev => prev.filter(i => i.id !== itemId));
      showStatus('Componente removido.', 'info');
    }
  };

  const handleSaveSnapshot = async () => {
    if (!selectedBomId) return;

    const selectedBom = boms.find(b => b.id === selectedBomId);
    const snapshotPayload = {
      bom_id: selectedBomId,
      title: `${selectedBom?.name || 'Reboque'} - ${new Date().toLocaleDateString('pt-BR')}`,
      total_cost: totalCost,
      suggested_price: suggestedPrice,
      overhead_percent: overheadPercent,
      tax_percent: taxPercent,
      margin_percent: marginPercent,
      snapshot_data: bomItems
    };

    const { error } = await supabase.from('pricing_snapshots').insert([snapshotPayload]);

    if (!error) {
      showStatus('Snapshot financeiro congelado no banco de dados!', 'success');
      loadInitialData();
    } else {
      showStatus('Erro ao salvar snapshot: ' + error.message, 'error');
    }
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

  // ==========================================
  // RENDERIZAÇÃO: TELA DE LOGIN
  // ==========================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white">DM BOM SYSTEM</h1>
              <p className="text-xs text-slate-400">DM Comércio e Indústria de Reboques LTDA</p>
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-800/50 rounded-lg text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">E-mail Corporativo</label>
              <input 
                type="email" 
                required
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="seu.email@dmtrailers.com.br"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Senha de Acesso</label>
              <input 
                type="password" 
                required
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Entrar no Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO: PAINEL PRINCIPAL DFB
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* HEADER SUPERIOR */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 flex items-center justify-between backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">DM BOM SYSTEM</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Engenharia, Custos & MRP</span>
              <span className="text-slate-600">•</span>
              <span className="capitalize text-blue-400 font-semibold">Perfil: {userRole}</span>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
          <button 
            onClick={() => setActiveTab('engineering')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${activeTab === 'engineering' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Layers className="w-4 h-4" /> Engenharia BOM
          </button>
          <button 
            onClick={() => setActiveTab('production')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${activeTab === 'production' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Calculator className="w-4 h-4" /> Ficha de Produção / MRP
          </button>
          <button 
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${activeTab === 'pricing' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <TrendingUp className="w-4 h-4" /> Precificação
          </button>
          <button 
            onClick={() => setActiveTab('snapshots')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${activeTab === 'snapshots' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 className="w-4 h-4" /> Snapshots
          </button>
        </nav>

        {/* CONTROLES DE CONEXÃO */}
        <div className="flex items-center gap-3">
          <button 
            onClick={syncOmieProducts}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Omie
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* BANNER DE MENSAGEM */}
      {statusMessage && (
        <div className={`px-6 py-2 text-xs flex items-center justify-between border-b ${statusMessage.type === 'error' ? 'bg-red-950/60 border-red-800 text-red-300' : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'}`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* ÁREA CENTRAL */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* ABA: ENGENHARIA E ÁRVORE DE MATERIAIS */}
        {activeTab === 'engineering' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              
              {/* SELETOR DE MODELO */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" /> Selecionar Trailer (BOM)
                </h2>
                <select 
                  value={selectedBomId || ''} 
                  onChange={e => {
                    setSelectedBomId(e.target.value);
                    loadBomItems(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
                >
                  {boms.length === 0 && <option value="">Nenhum trailer cadastrado</option>}
                  {boms.map(b => (
                    <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                  ))}
                </select>
              </div>

              {/* FORMULÁRIO: CADASTRAR NOVO TRAILER (LOCAL) */}
              {userRole === 'admin' && (
                <form onSubmit={handleCreateNewBom} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-400" /> Criar Novo Modelo de Trailer
                  </h2>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Código do Modelo</label>
                    <input 
                      type="text" 
                      placeholder="EX: TR-RACING-01"
                      value={newBomCode}
                      onChange={e => setNewBomCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nome do Modelo</label>
                    <input 
                      type="text" 
                      placeholder="EX: Trailer Fechado Moto 2 Eixos"
                      value={newBomName}
                      onChange={e => setNewBomName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Cadastrar Modelo
                  </button>
                </form>
              )}

              {/* FORMULÁRIO: ADICIONAR INSUMO À BOM */}
              {userRole === 'admin' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" /> Adicionar Insumo à BOM
                  </h2>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Insumo / Matéria-Prima</label>
                    <select 
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
                    >
                      <option value="">Selecione um insumo...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.unit}) - R$ {parseFloat(p.cost).toFixed(2)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Quantidade</label>
                      <input 
                        type="number" 
                        step="0.0001"
                        value={inputQty}
                        onChange={e => setInputQty(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Perda (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={inputLoss}
                        onChange={e => setInputLoss(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleAddItem}
                    disabled={!selectedBomId}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Incluir Componente
                  </button>
                </div>
              )}
            </div>

            {/* TABELA DA ÁRVORE DE MATERIAIS */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" /> Componentes da Estrutura
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Código</th>
                        <th className="p-3">Item</th>
                        <th className="p-3 text-right">Qtd</th>
                        <th className="p-3 text-right">Perda</th>
                        <th className="p-3 text-right">Custo Un.</th>
                        <th className="p-3 text-right">Total</th>
                        {userRole === 'admin' && <th className="p-3 text-center">Ação</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {bomItems.map(item => {
                        const effQty = item.qty * (1 + item.lossPercent / 100);
                        const lineTotal = effQty * item.cost;
                        return (
                          <tr key={item.id} className="hover:bg-slate-800/50">
                            <td className="p-3 font-mono text-slate-400">{item.code}</td>
                            <td className="p-3 font-medium text-slate-200">{item.name}</td>
                            <td className="p-3 text-right font-mono">{item.qty} {item.unit}</td>
                            <td className="p-3 text-right font-mono text-amber-400">{item.lossPercent}%</td>
                            <td className="p-3 text-right font-mono">R$ {item.cost.toFixed(2)}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-100">R$ {lineTotal.toFixed(2)}</td>
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

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Custo Total Direto de Matéria-Prima:</span>
                <span className="text-xl font-bold font-mono text-emerald-400">R$ {totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ABA: FICHA DE PRODUÇÃO E COMPRAS (MRP) */}
        {activeTab === 'production' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-400" /> Ficha de Ordem de Fabricação
                </h2>
                <p className="text-xs text-slate-400">Monte o lote de trailers para calcular a lista de compra de insumos.</p>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Modelo do Reboque</label>
                  <select 
                    value={selectedPlanBomId} 
                    onChange={e => setSelectedPlanBomId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
                  >
                    <option value="">Selecione o trailer...</option>
                    {boms.map(b => (
                      <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Quantidade a Fabricar</label>
                  <input 
                    type="number" 
                    min="1"
                    value={planQty}
                    onChange={e => setPlanQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>

                <button 
                  onClick={handleAddProductionPlan}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Adicionar à Ficha
                </button>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300">Lote da Ficha Atual:</span>
                  {productionPlan.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Nenhum trailer no lote de produção.</p>
                  ) : (
                    <ul className="space-y-2">
                      {productionPlan.map(plan => (
                        <li key={plan.bomId} className="flex items-center justify-between text-xs bg-slate-950 p-2 rounded border border-slate-800">
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

              {/* LISTA CONSOLIDADA DE NECESSIDADE DE COMPRAS */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" /> Necessidade Consolidada de Compras (MRP)
                      </h2>
                    </div>
                    <button 
                      onClick={handleExportProductionCSV}
                      disabled={productionPlan.length === 0}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Exportar Lista de Compras
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase">
                        <tr>
                          <th className="p-3">Insumo</th>
                          <th className="p-3 text-right">Estoque</th>
                          <th className="p-3 text-right">Necessário</th>
                          <th className="p-3 text-right">Saldo Final</th>
                          <th className="p-3 text-right">Comprar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {materialNeeds.map(item => {
                          const balance = item.stock - item.requiredQty;
                          const toBuy = balance < 0 ? Math.abs(balance) : 0;
                          return (
                            <tr key={item.code} className="hover:bg-slate-800/50">
                              <td className="p-3 font-medium text-slate-200">{item.name} ({item.unit})</td>
                              <td className="p-3 text-right font-mono text-slate-400">{item.stock}</td>
                              <td className="p-3 text-right font-mono text-blue-400 font-bold">{item.requiredQty.toFixed(2)}</td>
                              <td className={`p-3 text-right font-mono font-bold ${balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
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

        {/* ABA: PRECIFICAÇÃO */}
        {activeTab === 'pricing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Markup Industrial Por Dentro
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Overhead / Custos Fixos (%)</label>
                  <input 
                    type="number" 
                    disabled={userRole !== 'admin'}
                    value={overheadPercent}
                    onChange={e => setOverheadPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Impostos (%)</label>
                  <input 
                    type="number" 
                    disabled={userRole !== 'admin'}
                    value={taxPercent}
                    onChange={e => setTaxPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Margem de Lucro (%)</label>
                  <input 
                    type="number" 
                    disabled={userRole !== 'admin'}
                    value={marginPercent}
                    onChange={e => setMarginPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 disabled:opacity-50"
                  />
                </div>
              </div>

              {userRole === 'admin' && (
                <button 
                  onClick={handleSaveSnapshot}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors mt-4"
                >
                  <Save className="w-4 h-4" /> Congelar Snapshot Financeiro
                </button>
              )}
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" /> DRE Simplificado de Venda (Cálculo Por Dentro)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Custo Direto BOM</span>
                    <span className="text-lg font-bold font-mono text-slate-200">R$ {totalCost.toFixed(2)}</span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Total Deduções</span>
                    <span className="text-lg font-bold font-mono text-amber-400">{(overheadPercent + taxPercent + marginPercent).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-br from-blue-950/40 to-slate-950 rounded-xl border border-blue-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Preço Sugerido de Venda</span>
                    <p className="text-3xl font-extrabold font-mono text-white mt-1">R$ {suggestedPrice.toFixed(2)}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>Lucro Bruto Previsto: <span className="text-emerald-400 font-mono font-bold">R$ {(suggestedPrice * (marginPercent / 100)).toFixed(2)}</span></p>
                    <p>Impostos Retidos: <span className="text-red-400 font-mono font-bold">R$ {(suggestedPrice * (taxPercent / 100)).toFixed(2)}</span></p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-xs text-slate-500 italic border-t border-slate-800/60 pt-3">
                * Cálculo por dentro: Preço = Custo / (1 - % Deduções).
              </div>
            </div>
          </div>
        )}

        {/* ABA: SNAPSHOTS */}
        {activeTab === 'snapshots' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" /> Snapshots Congelados
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Título / Reboque</th>
                    <th className="p-3 text-right">Custo BOM</th>
                    <th className="p-3 text-right">Margem %</th>
                    <th className="p-3 text-right">Preço Sugerido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {snapshots.map(snap => (
                    <tr key={snap.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono text-slate-400">{new Date(snap.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 font-medium text-slate-200">{snap.title}</td>
                      <td className="p-3 text-right font-mono">R$ {parseFloat(snap.total_cost).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-emerald-400">{snap.margin_percent}%</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-400">R$ {parseFloat(snap.suggested_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}