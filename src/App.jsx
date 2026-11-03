import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  Package, Wrench, Shield, Layers, RefreshCw, Plus, Trash2, 
  Download, Lock, CheckCircle2, AlertCircle, Search, Edit3, 
  TrendingUp, Save, BarChart3, Key, FileSpreadsheet, ArrowRight, LogOut, FileText
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function App() {
  // --- ESTADOS DE AUTENTICAÇÃO ---
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- ESTADOS DO SISTEMA ---
  const [activeTab, setActiveTab] = useState('engineering');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // --- DADOS DA ENGENHARIA & COMPONENTES ---
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);
  const [selectedBomId, setSelectedBomId] = useState(null);
  const [bomItems, setBomItems] = useState([]);
  const [snapshots, setSnapshots] = useState([]);

  // --- PARÂMETROS FINANCEIROS (FORMULÁRIO) ---
  const [overheadPercent, setOverheadPercent] = useState(12);
  const [taxPercent, setTaxPercent] = useState(15);
  const [marginPercent, setMarginPercent] = useState(25);

  // --- FILTROS E SELEÇÃO DE ADIÇÃO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [inputQty, setInputQty] = useState(1);
  const [inputLoss, setInputLoss] = useState(0);

  // ==========================================
  // 1. GESTÃO DE SESSÃO COM SUPABASE
  // ==========================================
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carregar dados iniciais ao autenticar
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
      // Buscar Produtos
      const { data: prodData } = await supabase.from('products').select('*');
      setProducts(prodData || []);

      // Buscar Estruturas (BOMs)
      const { data: bomData } = await supabase.from('boms').select('*');
      setBoms(bomData || []);

      if (bomData && bomData.length > 0) {
        setSelectedBomId(bomData[0].id);
        loadBomItems(bomData[0].id);
      }

      // Buscar Snapshots
      const { data: snapData } = await supabase.from('pricing_snapshots').select('*').order('created_at', { ascending: false });
      setSnapshots(snapData || []);

    } catch (err) {
      showStatus('Erro ao carregar dados do Supabase', 'error');
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
        showStatus(`${data.total} produtos sincronizados com a Omie!`, 'success');
        loadInitialData();
      } else {
        showStatus('Erro ao integrar com Omie: ' + data.error, 'error');
      }
    } catch (err) {
      showStatus('Falha ao conectar à Serverless Function /api/omie/produtos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (text, type = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // ==========================================
  // 3. CÁLCULO DE CUSTOS E MARKUP POR DENTRO
  // ==========================================
  const calculateTotalCost = () => {
    return bomItems.reduce((acc, item) => {
      const effectiveQty = item.qty * (1 + item.lossPercent / 100);
      return acc + (effectiveQty * item.cost);
    }, 0);
  };

  const totalCost = calculateTotalCost();

  // Precificação Industrial Tributária "Por Dentro" (Brasil)
  const calculateSuggestedPrice = () => {
    const totalDeductionsPercent = overheadPercent + taxPercent + marginPercent;
    if (totalDeductionsPercent >= 100) return 0;
    return totalCost / (1 - (totalDeductionsPercent / 100));
  };

  const suggestedPrice = calculateSuggestedPrice();

  // ==========================================
  // 4. OPERAÇÕES DE BOM
  // ==========================================
  const handleAddItem = async () => {
    if (!selectedProductId || !selectedBomId) return;

    const selectedProd = products.find(p => p.id === selectedProductId);
    if (!selectedProd) return;

    const newItem = {
      bom_id: selectedBomId,
      product_id: selectedProductId,
      quantity: parseFloat(inputQty),
      loss_percent: parseFloat(inputLoss)
    };

    const { data, error } = await supabase.from('bom_items').insert([newItem]).select('*, products(*)');

    if (error) {
      showStatus('Erro ao adicionar item: ' + error.message, 'error');
    } else if (data && data[0]) {
      const added = data[0];
      setBomItems(prev => [...prev, {
        id: added.id,
        productId: added.product_id,
        code: added.products?.omie_code || 'LOCAL',
        name: added.products?.name || 'Insumo',
        unit: added.products?.unit || 'UN',
        cost: parseFloat(added.products?.cost || 0),
        qty: parseFloat(added.quantity),
        lossPercent: parseFloat(added.loss_percent || 0)
      }]);
      showStatus('Item adicionado à estrutura!', 'success');
    }
  };

  const handleRemoveItem = async (itemId) => {
    const { error } = await supabase.from('bom_items').delete().eq('id', itemId);
    if (!error) {
      setBomItems(prev => prev.filter(i => i.id !== itemId));
      showStatus('Item removido da BOM.', 'info');
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
      showStatus('Snapshot financeiro salvo no banco!', 'success');
      loadInitialData();
    } else {
      showStatus('Erro ao salvar snapshot: ' + error.message, 'error');
    }
  };

  // Exportação CSV formatada com BOM UTF-8 para Excel Brasil
  const handleExportCSV = () => {
    const headers = "Código;Item;Unidade;Quantidade;Perda (%);Custo Unitario (R$);Custo Total (R$)\n";
    const rows = bomItems.map(item => {
      const effQty = item.qty * (1 + item.lossPercent / 100);
      const itemCost = effQty * item.cost;
      return `${item.code};"${item.name}";${item.unit};${item.qty.toString().replace('.', ',')};${item.lossPercent.toString().replace('.', ',')};${item.cost.toFixed(2).replace('.', ',')};${itemCost.toFixed(2).replace('.', ',')}`;
    }).join("\n");

    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BOM_DM_Trailers_${new Date().toISOString().slice(0,10)}.csv`);
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
              <h1 className="text-xl font-bold tracking-wide">DM BOM SYSTEM</h1>
              <p className="text-xs text-slate-400">Engenharia, MRP & Precificação Real</p>
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
      {/* BARRA SUPERIOR / HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 flex items-center justify-between backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">DM BOM SYSTEM</h1>
            <p className="text-xs text-slate-400">DM Comércio e Indústria de Reboques LTDA</p>
          </div>
        </div>

        {/* NAVEGAÇÃO POR ABAS */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
          <button 
            onClick={() => setActiveTab('engineering')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${activeTab === 'engineering' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Layers className="w-4 h-4" /> Engenharia BOM
          </button>
          <button 
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${activeTab === 'pricing' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <TrendingUp className="w-4 h-4" /> Precificação
          </button>
          <button 
            onClick={() => setActiveTab('snapshots')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${activeTab === 'snapshots' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 className="w-4 h-4" /> Snapshots
          </button>
        </nav>

        {/* AÇÕES DE CONEXÃO & PERFIL */}
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

      {/* MENSAGEM DE STATUS */}
      {statusMessage && (
        <div className={`px-6 py-2 text-xs flex items-center justify-between border-b ${statusMessage.type === 'error' ? 'bg-red-950/60 border-red-800 text-red-300' : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'}`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* TAB: ENGENHARIA E MONTAGEM DA BOM */}
        {activeTab === 'engineering' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* PAINEL ESQUERDO: SELEÇÃO DA ESTRUTURA E ADIÇÃO */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" /> Modelo de Reboque (BOM)
                </h2>
                <select 
                  value={selectedBomId || ''} 
                  onChange={e => {
                    setSelectedBomId(e.target.value);
                    loadBomItems(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
                >
                  {boms.map(b => (
                    <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" /> Adicionar Componente
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
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Incluir na Estrutura
                </button>
              </div>
            </div>

            {/* PAINEL DIREITO: TABELA DA BOM */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" /> Estrutura da Árvore de Materiais
                  </h2>
                  <button 
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Exportar CSV
                  </button>
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
                        <th className="p-3 text-center">Ações</th>
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
                            <td className="p-3 text-center">
                              <button 
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-slate-500 hover:text-red-400 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RODAPÉ COM RESUMO DE CUSTO BASE */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Total de Insumos da BOM:</span>
                <span className="text-xl font-bold font-mono text-emerald-400">R$ {totalCost.toFixed(2)}</span>
              </div>
            </div>

          </div>
        )}

        {/* TAB: PRECIFICAÇÃO E SIMULAÇÃO DE MARGEM */}
        {activeTab === 'pricing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CONFIGURAÇÃO DE ALÍQUOTAS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Parâmetros Tributários e Margem
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Overhead / Custos Fixos (%)</label>
                  <input 
                    type="number" 
                    value={overheadPercent}
                    onChange={e => setOverheadPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Impostos e Tributos (%)</label>
                  <input 
                    type="number" 
                    value={taxPercent}
                    onChange={e => setTaxPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Margem de Lucro Desejada (%)</label>
                  <input 
                    type="number" 
                    value={marginPercent}
                    onChange={e => setMarginPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveSnapshot}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors mt-4"
              >
                <Save className="w-4 h-4" /> Congelar Snapshot de Precificação
              </button>
            </div>

            {/* DEMONSTRATIVO FINANCEIRO */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" /> DRE Simplificado de Venda (Cálculo Por Dentro)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Custo Direto de Produção (BOM)</span>
                    <span className="text-lg font-bold font-mono text-slate-200">R$ {totalCost.toFixed(2)}</span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Deduções Totais (Imposto + Overhead + Lucro)</span>
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
                * Fórmula aplicada: Preço = Custo / (1 - % Deduções). Garante a margem real sobre o faturamento bruto.
              </div>
            </div>

          </div>
        )}

        {/* TAB: SNAPSHOTS SALVOS */}
        {activeTab === 'snapshots' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" /> Histórico de Snapshots Financeiros
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
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