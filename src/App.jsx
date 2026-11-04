import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Factory, 
  Calculator, 
  History, 
  Plus, 
  Trash2, 
  Download, 
  LogOut, 
  ShieldAlert, 
  Users,
  DollarSign, 
  UserCheck,
  Clock,
  RefreshCw
} from 'lucide-react';
import { supabase } from './lib/supabase';

export default function App() {
  // --- ESTADOS DE AUTENTICAÇÃO E NAVEGAÇÃO ---
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('Operador');
  const [activeTab, setActiveTab] = useState('bom');

  // --- ESTADO DA LISTA DE USUÁRIOS (GERENCIAMENTO) ---
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // --- ESTADOS DE DADOS (TRAILERS E INSUMOS) ---
  const [trailers, setTrailers] = useState([]);
  const [selectedTrailerId, setSelectedTrailerId] = useState('');
  const [bomItems, setBomItems] = useState([]);
  const [produtosOmie, setProdutosOmie] = useState([]);
  const [loadingOmie, setLoadingOmie] = useState(false);

  // --- MODAL DE NOVO TRAILER ---
  const [showNewBomModal, setShowNewBomModal] = useState(false);
  const [newBomCode, setNewBomCode] = useState('');
  const [newBomName, setNewBomName] = useState('');

  // --- FICHA DE PRODUÇÃO (MRP) ---
  const [productionPlan, setProductionPlan] = useState([]);
  const [selectedPlanBomId, setSelectedPlanBomId] = useState('');
  const [planQty, setPlanQty] = useState(1);

  // --- PARÂMETROS FINANCEIROS ---
  const [overheadPercent, setOverheadPercent] = useState(12);
  const [taxPercent, setTaxPercent] = useState(15);
  const [marginPercent, setMarginPercent] = useState(25);

  // --- INCLUSÃO DE ITENS ---
  const [selectedProductId, setSelectedProductId] = useState('');
  const [inputQty, setInputQty] = useState(1);
  const [inputLoss, setInputLoss] = useState(3);

  // ==========================================
  // BUSCA PERFIL E LISTA DE USUÁRIOS NO POSTGRESQL
  // ==========================================
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Erro ao buscar perfil:", error.message);
        setUserRole('Operador');
      } else if (data) {
        setUserRole(data.role);
      }
    } catch (err) {
      console.error("Erro ao carregar role:", err);
      setUserRole('Operador');
    }
  };

  const fetchRegisteredUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, nome, role, ultimo_acesso, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegisteredUsers(data || []);
    } catch (err) {
      console.error("Erro ao carregar lista de usuários:", err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  // FUNÇÃO DE SINCRONIZAÇÃO COM OMIE ERP (LIVRE PARA ADMIN E OPERADOR)
  const fetchOmieProdutos = async () => {
    setLoadingOmie(true);
    try {
      const res = await fetch('/api/omie/produtos');
      if (res.ok) {
        const data = await res.json();
        setProdutosOmie(data.produtos || []);
      } else {
        alert("Falha ao sincronizar com a API do Omie.");
      }
    } catch (err) {
      console.error("Erro ao carregar insumos do Omie:", err);
      alert("Erro na conexão com a API Omie.");
    } finally {
      setLoadingOmie(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserRole('Operador');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && userRole === 'Admin') {
      fetchRegisteredUsers();
    }
  }, [activeTab, userRole]);

  useEffect(() => {
    fetchOmieProdutos();
  }, []);

  const isAdmin = userRole === 'Admin';

  // Proteção de rotas ativas
  useEffect(() => {
    if (!isAdmin && (activeTab === 'pricing' || activeTab === 'snapshots' || activeTab === 'users')) {
      setActiveTab('bom');
    }
  }, [userRole, activeTab, isAdmin]);

  // ==========================================
  // AUTENTICAÇÃO (LOGIN / LOGOUT)
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Erro ao realizar login: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ==========================================
  // AÇÕES DE TRAILERS, INSUMOS E MRP
  // ==========================================
  const handleCreateTrailer = (e) => {
    e.preventDefault();
    if (!newBomCode || !newBomName) return;

    const newTrailer = {
      id: crypto.randomUUID(),
      code: newBomCode,
      name: newBomName,
    };

    setTrailers(prev => [...prev, newTrailer]);
    setSelectedTrailerId(newTrailer.id);
    setNewBomCode('');
    setNewBomName('');
    setShowNewBomModal(false);
  };

  const handleAddInsumo = (e) => {
    e.preventDefault();
    if (!selectedTrailerId || !selectedProductId) return;

    const prodObj = produtosOmie.find(p => String(p.codigo_produto) === String(selectedProductId));
    const nomeInsumo = prodObj ? prodObj.descricao : `Insumo #${selectedProductId}`;
    const custoUnit = prodObj ? (prodObj.valor_unitario || 10) : 10;

    const newInsumo = {
      id: crypto.randomUUID(),
      trailer_id: selectedTrailerId,
      insumo_nome: nomeInsumo,
      quantidade: parseFloat(inputQty),
      unidade: prodObj?.unidade || 'UN',
      custo_unitario: parseFloat(custoUnit),
      perda_tecnica_pct: parseFloat(inputLoss),
      lead_time_dias: 5
    };

    setBomItems(prev => [...prev, newInsumo]);
  };

  const handleRemoveInsumo = (insumoId) => {
    setBomItems(prev => prev.filter(item => item.id !== insumoId));
  };

  const handleAddToPlan = (e) => {
    e.preventDefault();
    if (!selectedPlanBomId) return;

    const trailerObj = trailers.find(t => t.id === selectedPlanBomId);
    if (!trailerObj) return;

    setProductionPlan(prev => [
      ...prev,
      {
        bomId: trailerObj.id,
        code: trailerObj.code,
        name: trailerObj.name,
        qty: parseInt(planQty, 10)
      }
    ]);
  };

  const handleRemoveFromPlan = (index) => {
    setProductionPlan(prev => prev.filter((_, i) => i !== index));
  };

  const exportMRPToCSV = () => {
    let csvContent = "\uFEFFInsumo;Quantidade Necessária;Unidade;Perda Técnica (%);Custo Estimado (R$)\n";
    
    bomItems.forEach(item => {
      const qtdTotal = item.quantidade * (1 + item.perda_tecnica_pct / 100);
      const custoTotal = qtdTotal * item.custo_unitario;
      csvContent += `${item.insumo_nome};${qtdTotal.toFixed(2).replace('.', ',')};${item.unidade};${item.perda_tecnica_pct};${custoTotal.toFixed(2).replace('.', ',')}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MRP_Producao_DM_Trailers_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // CÁLCULOS FINANCEIROS
  // ==========================================
  const selectedTrailer = trailers.find(t => t.id === selectedTrailerId);
  const currentBomItems = bomItems.filter(item => item.trailer_id === selectedTrailerId);
  
  const custoDiretoBOM = currentBomItems.reduce((acc, item) => {
    const qtdComPerda = item.quantidade * (1 + item.perda_tecnica_pct / 100);
    return acc + (qtdComPerda * item.custo_unitario);
  }, 0);

  const somaAliquotas = (parseFloat(overheadPercent) || 0) + (parseFloat(taxPercent) || 0) + (parseFloat(marginPercent) || 0);
  const divisorMarkup = 1 - (somaAliquotas / 100);
  const precoFinalCalculado = divisorMarkup > 0 ? custoDiretoBOM / divisorMarkup : 0;

  const valorOverhead = precoFinalCalculado * (overheadPercent / 100);
  const valorImpostos = precoFinalCalculado * (taxPercent / 100);
  const valorMargem = precoFinalCalculado * (marginPercent / 100);

  // ==========================================
  // MENUS DA SIDEBAR
  // ==========================================
  const allMenuItems = [
    { id: 'bom', label: 'Engenharia & BOM', icon: Wrench, roles: ['Admin', 'Operador'] },
    { id: 'mrp', label: 'Ficha de Produção / MRP', icon: Factory, roles: ['Admin', 'Operador'] },
    { id: 'pricing', label: 'Precificação Industrial', icon: Calculator, roles: ['Admin'] },
    { id: 'snapshots', label: 'Snapshots Financeiros', icon: History, roles: ['Admin'] },
    { id: 'users', label: 'Gerenciamento de Usuários', icon: Users, roles: ['Admin'] },
  ];

  const visibleMenuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  // TELA DE LOGIN
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#060911] flex items-center justify-center text-slate-400">
        Carregando DM BOM System...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#060911] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
              <Factory className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wider">DM TRAILERS</h1>
            <p className="text-xs text-slate-400 mt-1">Acesso Restrito à Plataforma</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">E-MAIL</label>
              <input 
                type="email" 
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                placeholder="seu.email@dmtrailers.com.br"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">SENHA</label>
              <input 
                type="password" 
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 text-sm mt-2"
            >
              ENTRAR NO SISTEMA
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center mt-6">
            Em caso de problemas tecnicos e solicitações, favor contatar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex overflow-hidden font-sans">
      
      {/* SIDEBAR LATERAL */}
      <aside className="w-64 bg-slate-950/80 border-r border-slate-900 flex flex-col justify-between backdrop-blur-xl">
        <div>
          <div className="p-6 border-b border-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Factory className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wider">DM TRAILERS</h2>
              <span className="text-[10px] text-slate-400 font-mono">v2.7 • INDUSTRIAL</span>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* PERFIL DO USUÁRIO LOGADO - CATEGORIA/ROLE EXIBIDA APENAS PARA ADMIN */}
        <div className="p-4 border-t border-slate-900">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3 mb-3">
            <div className="text-xs font-medium text-slate-300 truncate">{session.user.email}</div>
            
            {/* EXIBIÇÃO CONDICIONAL: Apenas se for Admin */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-slate-500">Perfil:</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                  {userRole}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-950/20">
        
        {/* HEADER PRINCIPAL */}
        <header className="px-8 py-5 border-b border-slate-900/80 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {activeTab === 'bom' && 'Engenharia de Produto & Árvore BOM'}
              {activeTab === 'mrp' && 'Planejamento de Fabricação (MRP)'}
              {activeTab === 'pricing' && 'Precificação Industrial (Markup por Dentro)'}
              {activeTab === 'snapshots' && 'Histórico de Snapshots Financeiros'}
              {activeTab === 'users' && 'Painel de Gerenciamento de Usuários'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">DM Comércio e Indústria de Reboques LTDA</p>
          </div>

          {/* BOTÕES DE AÇÃO: SINCRONIZAR OMIE + NOVO TRAILER */}
          <div className="flex items-center gap-3">
            {/* BOTÃO SINCRONIZAR OMIE (LIBERADO PARA ADMIN E OPERADOR) */}
            <button
              onClick={fetchOmieProdutos}
              disabled={loadingOmie}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 font-semibold px-4 py-2.5 rounded-xl transition-all text-xs shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOmie ? 'animate-spin' : ''}`} />
              <span>{loadingOmie ? 'SINCRONIZANDO...' : 'SINCRONIZAR OMIE'}</span>
            </button>

            <button 
              onClick={() => setShowNewBomModal(true)}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>NOVO MODELO TRAILER</span>
            </button>
          </div>
        </header>

        <div className="p-8">
          
          {/* VISÃO 1: ENGENHARIA & BOM */}
          {activeTab === 'bom' && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
                <label className="block text-xs font-semibold text-slate-400 mb-2">SELECIONE O MODELO DE REBOQUE</label>
                <select
                  value={selectedTrailerId}
                  onChange={e => setSelectedTrailerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Selecione um Modelo de Trailer --</option>
                  {trailers.map(t => (
                    <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                  ))}
                </select>
              </div>

              {selectedTrailer ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-cyan-400" /> Adicionar Insumo
                    </h3>
                    <form onSubmit={handleAddInsumo} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">INSUMO (OMIE ERP)</label>
                        <select
                          value={selectedProductId}
                          onChange={e => setSelectedProductId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">-- Escolher Produto --</option>
                          {produtosOmie.map(p => (
                            <option key={p.codigo_produto} value={p.codigo_produto}>
                              {p.descricao} (R$ {p.valor_unitario || 10})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">QTD. BASE</label>
                          <input
                            type="number"
                            step="0.01"
                            value={inputQty}
                            onChange={e => setInputQty(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">PERDA (%)</label>
                          <input
                            type="number"
                            value={inputLoss}
                            onChange={e => setInputLoss(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold py-2.5 rounded-xl transition-all text-xs"
                      >
                        INCLUIR NO TRAILER
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                      <span>Árvore de Materiais: {selectedTrailer.name}</span>
                      <span className="text-xs text-cyan-400 font-mono">Custo BOM: R$ {custoDiretoBOM.toFixed(2)}</span>
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="pb-3">Insumo</th>
                            <th className="pb-3">Qtd. Un</th>
                            <th className="pb-3">Perda %</th>
                            <th className="pb-3">Custo Un.</th>
                            <th className="pb-3">Total</th>
                            <th className="pb-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {currentBomItems.map(item => {
                            const qtdTotal = item.quantidade * (1 + item.perda_tecnica_pct / 100);
                            const itemTotal = qtdTotal * item.custo_unitario;
                            return (
                              <tr key={item.id} className="text-slate-300 hover:bg-slate-900/40">
                                <td className="py-3 font-medium text-white">{item.insumo_nome}</td>
                                <td className="py-3">{item.quantidade} {item.unidade}</td>
                                <td className="py-3 text-amber-400">{item.perda_tecnica_pct}%</td>
                                <td className="py-3">R$ {item.custo_unitario.toFixed(2)}</td>
                                <td className="py-3 font-semibold text-emerald-400">R$ {itemTotal.toFixed(2)}</td>
                                <td className="py-3 text-right">
                                  <button
                                    onClick={() => handleRemoveInsumo(item.id)}
                                    className="text-rose-400 hover:text-rose-300 p-1"
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
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-900/20 border border-slate-800/50 rounded-3xl text-slate-500 text-xs">
                  Selecione um modelo de trailer acima para visualizar e editar sua estrutura BOM.
                </div>
              )}
            </div>
          )}

          {/* VISÃO 2: FICHA DE PRODUÇÃO (MRP) */}
          {activeTab === 'mrp' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-white mb-4">Montar Lote de Fabricação</h3>
                  <form onSubmit={handleAddToPlan} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">MODELO DO TRAILER</label>
                      <select
                        value={selectedPlanBomId}
                        onChange={e => setSelectedPlanBomId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">-- Escolher Trailer --</option>
                        {trailers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">QUANTIDADE DO LOTE</label>
                      <input
                        type="number"
                        min="1"
                        value={planQty}
                        onChange={e => setPlanQty(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold py-2.5 rounded-xl transition-all text-xs"
                    >
                      ADICIONAR AO LOTE DE PRODUÇÃO
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Consolidação de Matéria-Prima (MRP)</h3>
                    <button
                      onClick={exportMRPToCSV}
                      className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Download className="w-4 h-4" /> Exportar CSV Excel
                    </button>
                  </div>

                  <div className="space-y-3 mb-6">
                    {productionPlan.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800/60 text-xs">
                        <span className="text-white font-medium">{item.name} ({item.code})</span>
                        <div className="flex items-center gap-3">
                          <span className="text-cyan-400 font-bold">{item.qty} Unidades</span>
                          <button onClick={() => handleRemoveFromPlan(idx)} className="text-rose-400 hover:text-rose-300">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-400 mb-2 font-semibold">Demanda Consolidada de Matérias-Primas:</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-2">Insumo</th>
                          <th className="pb-2">Demanda Total</th>
                          <th className="pb-2">Custo Consolidado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {bomItems.map(item => {
                          const qtdConsolidada = item.quantidade * (1 + item.perda_tecnica_pct / 100);
                          return (
                            <tr key={item.id} className="text-slate-300">
                              <td className="py-2.5 font-medium">{item.insumo_nome}</td>
                              <td className="py-2.5 text-cyan-400">{qtdConsolidada.toFixed(2)} {item.unidade}</td>
                              <td className="py-2.5 font-semibold text-emerald-400">R$ {(qtdConsolidada * item.custo_unitario).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISÃO 3: PRECIFICAÇÃO INDUSTRIAL (APENAS ADMIN) */}
          {activeTab === 'pricing' && (
            isAdmin ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-white mb-4">Markup por Dentro</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">OVERHEAD DIRETO (%)</label>
                      <input
                        type="number"
                        value={overheadPercent}
                        onChange={e => setOverheadPercent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">IMPOSTOS / SIMPLES (%)</label>
                      <input
                        type="number"
                        value={taxPercent}
                        onChange={e => setTaxPercent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">MARGEM LÍQUIDA (%)</label>
                      <input
                        type="number"
                        value={marginPercent}
                        onChange={e => setMarginPercent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-6">Demonstrativo Financeiro (DRE Estimado)</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-slate-400">Custo Direto BOM (Matéria-Prima):</span>
                        <span className="font-semibold text-white">R$ {custoDiretoBOM.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-slate-400">Overhead Rate ({overheadPercent}%):</span>
                        <span className="font-semibold text-indigo-400">R$ {valorOverhead.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-slate-400">Impostos Alíquota ({taxPercent}%):</span>
                        <span className="font-semibold text-rose-400">R$ {valorImpostos.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-slate-400">Margem Industrial ({marginPercent}%):</span>
                        <span className="font-semibold text-emerald-400">R$ {valorMargem.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-cyan-400 font-semibold block">PREÇO SUGERIDO DE VENDA</span>
                      <span className="text-2xl font-bold text-white">R$ {precoFinalCalculado.toFixed(2)}</span>
                    </div>
                    <DollarSign className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>
              </div>
            ) : <AccessDeniedView />
          )}

          {/* VISÃO 4: SNAPSHOTS (APENAS ADMIN) */}
          {activeTab === 'snapshots' && (
            isAdmin ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
                <h3 className="text-sm font-bold text-white mb-4">Congelamento de Histórico Financeiro</h3>
                <p className="text-xs text-slate-400">Nenhum snapshot financeiro gravado recentemente.</p>
              </div>
            ) : <AccessDeniedView />
          )}

          {/* VISÃO 5: DISPLAY DE GERENCIAMENTO DE USUÁRIOS (APENAS ADMIN) */}
          {activeTab === 'users' && (
            isAdmin ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Usuários Cadastrados na Plataforma</h3>
                      <p className="text-xs text-slate-400">Sincronização em tempo real com a base de dados do Supabase.</p>
                    </div>
                  </div>

                  <button
                    onClick={fetchRegisteredUsers}
                    className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-xl text-xs text-slate-300 font-semibold transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                    Atualizar Lista
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-3">Nome / Usuário</th>
                        <th className="pb-3">E-mail Cadastrado</th>
                        <th className="pb-3">Categoria (Role)</th>
                        <th className="pb-3">Último Acesso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {registeredUsers.length > 0 ? (
                        registeredUsers.map((u) => {
                          const isUserAdmin = u.role === 'Admin';
                          const ultimoAcessoFmt = u.ultimo_acesso 
                            ? new Date(u.ultimo_acesso).toLocaleString('pt-BR') 
                            : 'Nunca acessou';

                          return (
                            <tr key={u.id} className="text-slate-300 hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 font-semibold text-white flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-[11px]">
                                  {(u.nome || u.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                {u.nome || u.email.split('@')[0]}
                              </td>
                              <td className="py-3 font-mono text-slate-400">{u.email}</td>
                              <td className="py-3">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  isUserAdmin 
                                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                  {u.role || 'Operador'}
                                </span>
                              </td>
                              <td className="py-3 text-slate-400 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                  {ultimoAcessoFmt}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-500 text-xs">
                            {loadingUsers ? 'Carregando lista de usuários...' : 'Nenhum perfil encontrado no banco de dados.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <AccessDeniedView />
          )}

        </div>
      </main>

      {/* MODAL NOVO TRAILER */}
      {showNewBomModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-bold text-white">Novo Modelo de Trailer</h3>
            <form onSubmit={handleCreateTrailer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">CÓDIGO DO MODELO</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: TR-BAU-01"
                  value={newBomCode}
                  onChange={e => setNewBomCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">NOME DO REBOQUE</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Trailer Baú Motocross Premium"
                  value={newBomName}
                  onChange={e => setNewBomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBomModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 text-xs shadow-lg shadow-cyan-500/20"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// COMPONENTE DE ACESSO NEGADO
const AccessDeniedView = () => (
  <div className="flex flex-col items-center justify-center h-64 bg-slate-950/60 border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-md">
    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
      <ShieldAlert className="w-6 h-6 text-rose-500" />
    </div>
    <h3 className="text-lg font-bold text-white mb-1">Acesso Restrito</h3>
    <p className="text-sm text-slate-400 max-w-sm">
      Seu perfil de <span className="text-cyan-400 font-semibold">Operador</span> possui permissão de acesso exclusivamente à Engenharia (BOM) e MRP.
    </p>
  </div>
);