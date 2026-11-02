import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Key, Users, Layers, ShoppingBag, FileSpreadsheet, BarChart3, 
  Settings, LogOut, Plus, Trash2, Edit3, RefreshCw, Download, CheckCircle, 
  AlertTriangle, DollarSign, Cpu, Search, Eye, EyeOff, Save, ArrowUpRight, 
  ChevronRight, Box, Clock, TrendingUp, Lock, UserPlus, Check, X, Calculator,
  Filter, ShoppingCart, GitCompare, ArrowRightLeft, AlertCircle, Database, HelpCircle
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';

// ==========================================
// MOCK INITIAL DATA & OMIE API SIMULATION
// ==========================================

const INITIAL_OMIE_PRODUCTS = [
  { sku: 'EIX-ALKO-1000', nome: 'Eixo de Torção AL-KO 1000kg Frado', categoria: 'Chassi & Rodante', precoUnitario: 2850.00, unidade: 'UN', estoque: 14, minEstoque: 5, leadTimeDias: 15, fornecedor: 'AL-KO Brasil' },
  { sku: 'ACO-TUB-8040', nome: 'Tubo de Aço Estrutural 80x40x3mm', categoria: 'Chassi & Rodante', precoUnitario: 34.50, unidade: 'MT', estoque: 420, minEstoque: 150, leadTimeDias: 7, fornecedor: 'Açotubo' },
  { sku: 'ACO-CAN-50', nome: 'Cantoneira de Aço 2" x 3/16"', categoria: 'Chassi & Rodante', precoUnitario: 22.80, unidade: 'MT', estoque: 80, minEstoque: 100, leadTimeDias: 7, fornecedor: 'Açotubo' },
  { sku: 'ACM-BR-3MM', nome: 'Chapa ACM 3mm Branca (1.22x2.44m)', categoria: 'Carroceria & Fechamento', precoUnitario: 198.00, unidade: 'CH', estoque: 12, minEstoque: 30, leadTimeDias: 10, fornecedor: 'Alubond Direct' },
  { sku: 'COM-NAV-15', nome: 'Compensado Naval Plastificado 15mm', categoria: 'Carroceria & Fechamento', precoUnitario: 245.00, unidade: 'CH', estoque: 40, minEstoque: 15, leadTimeDias: 5, fornecedor: 'Madereira Ramos' },
  { sku: 'COL-PU-40', nome: 'Selante PU 40 Estrutural Cinza 400g', categoria: 'Carroceria & Fechamento', precoUnitario: 36.00, unidade: 'TB', estoque: 150, minEstoque: 40, leadTimeDias: 3, fornecedor: 'Tekbond Industrial' },
  { sku: 'PER-ALU-001', nome: 'Perfil Acabamento Alumínio Anodizado', categoria: 'Carroceria & Fechamento', precoUnitario: 28.90, unidade: 'MT', estoque: 310, minEstoque: 100, leadTimeDias: 8, fornecedor: 'Alcoa' },
  { sku: 'LAN-SIN-LED', nome: 'Kit Lanternas LED Bivolt Sinalsul', categoria: 'Sistema Elétrico', precoUnitario: 185.00, unidade: 'JG', estoque: 6, minEstoque: 10, leadTimeDias: 12, fornecedor: 'Sinalsul' },
  { sku: 'CAB-PP-7V', nome: 'Cabo PP Automotivo 7 Vias 1.5mm', categoria: 'Sistema Elétrico', precoUnitario: 14.20, unidade: 'MT', estoque: 500, minEstoque: 100, leadTimeDias: 4, fornecedor: 'Cobrecom' },
  { sku: 'TOM-7P-MACH', nome: 'Tomada Engate 7 Pinos Alumínio', categoria: 'Sistema Elétrico', precoUnitario: 42.00, unidade: 'UN', estoque: 60, minEstoque: 15, leadTimeDias: 5, fornecedor: 'DNI' },
  { sku: 'REB-POP-48', nome: 'Rebite Pop Alumínio 4.8 x 16mm', categoria: 'Consumíveis & Fixadores', precoUnitario: 0.28, unidade: 'UN', estoque: 12000, minEstoque: 3000, leadTimeDias: 2, fornecedor: 'Ciser' },
  { sku: 'PAR-INOX-M8', nome: 'Parafuso Inox M8 x 30mm Sextavado', categoria: 'Consumíveis & Fixadores', precoUnitario: 2.10, unidade: 'UN', estoque: 3500, minEstoque: 1000, leadTimeDias: 3, fornecedor: 'Ciser' },
  { sku: 'SOL-AR-MIG', nome: 'Arame Solda MIG ER70S-6 0.8mm (15kg)', categoria: 'Consumíveis & Fixadores', precoUnitario: 195.00, unidade: 'RO', estoque: 18, minEstoque: 5, leadTimeDias: 4, fornecedor: 'Esab' },
  { sku: 'ENG-ALKO-15', nome: 'Acoplador / Engate Inercial 1500kg', categoria: 'Chassi & Rodante', precoUnitario: 1250.00, unidade: 'UN', estoque: 3, minEstoque: 5, leadTimeDias: 20, fornecedor: 'AL-KO Brasil' },
];

const INITIAL_MASTER_PRODUCTS = [
  {
    id: 'MST-TR-01',
    nome: 'Trailer Fechado Racing (2 Motos / UTV)',
    skuMaster: 'TR-RACING-2026',
    descricao: 'Trailer baú reforçado com fechamento ACM e sistema elétrico LED completo.',
    tempoLaborHoras: 48,
    custoHoraLabor: 45.00,
    overheadPct: 12,
    markupPct: 35,
    impostosPct: 15,
    componentes: [
      { sku: 'EIX-ALKO-1000', modulo: 'Chassi & Rodante', quantidade: 1, perdaPct: 0 },
      { sku: 'ENG-ALKO-15', modulo: 'Chassi & Rodante', quantidade: 1, perdaPct: 0 },
      { sku: 'ACO-TUB-8040', modulo: 'Chassi & Rodante', quantidade: 38, perdaPct: 5 },
      { sku: 'ACO-CAN-50', modulo: 'Chassi & Rodante', quantidade: 24, perdaPct: 4 },
      { sku: 'ACM-BR-3MM', modulo: 'Carroceria & Fechamento', quantidade: 8, perdaPct: 8 },
      { sku: 'COM-NAV-15', modulo: 'Carroceria & Fechamento', quantidade: 3, perdaPct: 2 },
      { sku: 'PER-ALU-001', modulo: 'Carroceria & Fechamento', quantidade: 22, perdaPct: 6 },
      { sku: 'COL-PU-40', modulo: 'Carroceria & Fechamento', quantidade: 10, perdaPct: 0 },
      { sku: 'LAN-SIN-LED', modulo: 'Sistema Elétrico', quantidade: 1, perdaPct: 0 },
      { sku: 'CAB-PP-7V', modulo: 'Sistema Elétrico', quantidade: 12, perdaPct: 5 },
      { sku: 'TOM-7P-MACH', modulo: 'Sistema Elétrico', quantidade: 1, perdaPct: 0 },
      { sku: 'REB-POP-48', modulo: 'Consumíveis & Fixadores', quantidade: 450, perdaPct: 10 },
      { sku: 'PAR-INOX-M8', modulo: 'Consumíveis & Fixadores', quantidade: 64, perdaPct: 5 },
      { sku: 'SOL-AR-MIG', modulo: 'Consumíveis & Fixadores', quantidade: 0.25, perdaPct: 0 },
    ]
  },
  {
    id: 'MST-TR-02',
    nome: 'Carretinha Plataforma Aberta Moto/Carga',
    skuMaster: 'TR-PLAT-OPEN',
    descricao: 'Plataforma articulada leve para transporte fácil.',
    tempoLaborHoras: 22,
    custoHoraLabor: 40.00,
    overheadPct: 10,
    markupPct: 30,
    impostosPct: 12,
    componentes: [
      { sku: 'EIX-ALKO-1000', modulo: 'Chassi & Rodante', quantidade: 1, perdaPct: 0 },
      { sku: 'ENG-ALKO-15', modulo: 'Chassi & Rodante', quantidade: 1, perdaPct: 0 },
      { sku: 'ACO-TUB-8040', modulo: 'Chassi & Rodante', quantidade: 26, perdaPct: 4 },
      { sku: 'LAN-SIN-LED', modulo: 'Sistema Elétrico', quantidade: 1, perdaPct: 0 },
      { sku: 'CAB-PP-7V', modulo: 'Sistema Elétrico', quantidade: 8, perdaPct: 5 },
      { sku: 'PAR-INOX-M8', modulo: 'Consumíveis & Fixadores', quantidade: 32, perdaPct: 5 },
      { sku: 'SOL-AR-MIG', modulo: 'Consumíveis & Fixadores', quantidade: 0.15, perdaPct: 0 },
    ]
  }
];

const INITIAL_USERS = [
  { id: '1', name: 'Administrador Omie', email: 'admin@empresa.com.br', password: 'admin', role: 'ADMIN', lastLogin: 'Primeiro Acesso' }
];

const INITIAL_HISTORY = [
  { 
    id: 'H-101', 
    data: '2026-10-15', 
    produto: 'Trailer Fechado Racing (2 Motos / UTV)', 
    masterId: 'MST-TR-01',
    sku: 'TR-RACING-2026', 
    custoMaterial: 8210.50, 
    custoLabor: 2160.00, 
    precoSugerido: 17450.00, 
    autor: 'admin@empresa.com.br',
    snapshotItems: [
      { sku: 'EIX-ALKO-1000', precoUnitario: 2650.00, quantidade: 1 },
      { sku: 'ACO-TUB-8040', precoUnitario: 31.00, quantidade: 38 },
      { sku: 'ACM-BR-3MM', precoUnitario: 180.00, quantidade: 8 },
      { sku: 'COL-PU-40', precoUnitario: 32.00, quantidade: 10 }
    ]
  },
  { 
    id: 'H-102', 
    data: '2026-11-01', 
    produto: 'Trailer Fechado Racing (2 Motos / UTV)', 
    masterId: 'MST-TR-01',
    sku: 'TR-RACING-2026', 
    custoMaterial: 8690.30, 
    custoLabor: 2160.00, 
    precoSugerido: 18220.00, 
    autor: 'engenharia@empresa.com.br',
    snapshotItems: [
      { sku: 'EIX-ALKO-1000', precoUnitario: 2800.00, quantidade: 1 },
      { sku: 'ACO-TUB-8040', precoUnitario: 33.50, quantidade: 38 },
      { sku: 'ACM-BR-3MM', precoUnitario: 195.00, quantidade: 8 },
      { sku: 'COL-PU-40', precoUnitario: 35.00, quantidade: 10 }
    ]
  }
];

const MODULE_COLORS = {
  'Chassi & Rodante': '#3b82f6',
  'Carroceria & Fechamento': '#10b981',
  'Sistema Elétrico': '#f59e0b',
  'Consumíveis & Fixadores': '#ec4899',
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('omie_bom_auth_token') === 'true';
  });

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [users, setUsers] = useState(INITIAL_USERS);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('omie_bom_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0];
  });

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    const matchedUser = users.find(
      u => u.email.toLowerCase() === loginForm.email.toLowerCase() && 
           (u.password ? u.password === loginForm.password : loginForm.password.length >= 4)
    );

    if (matchedUser) {
      const updatedUser = { ...matchedUser, lastLogin: new Date().toLocaleString('pt-BR') };
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
      localStorage.setItem('omie_bom_auth_token', 'true');
      localStorage.setItem('omie_bom_user', JSON.stringify(updatedUser));
      showToast(`Bem-vindo de volta, ${updatedUser.name}!`);
    } else {
      setLoginError('E-mail ou senha incorretos. Verifique suas credenciais.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('omie_bom_auth_token');
    showToast('Sessão encerrada com segurança.');
  };

  const [activeTab, setActiveTab] = useState('bom_builder');

  const [omieConfig, setOmieConfig] = useState({
    appKey: '3834469034',
    appSecret: '50073004b9015d86efdd62bc02a28172',
    isConnected: true
  });

  const [catalog, setCatalog] = useState(INITIAL_OMIE_PRODUCTS);
  const [masterProducts, setMasterProducts] = useState(INITIAL_MASTER_PRODUCTS);
  const [selectedMasterId, setSelectedMasterId] = useState(INITIAL_MASTER_PRODUCTS[0].id);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [notification, setNotification] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');

  const [productionSchedule, setProductionSchedule] = useState({
    'MST-TR-01': 2,
    'MST-TR-02': 1
  });

  const [showNewMasterModal, setShowNewMasterModal] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  const [newMasterData, setNewMasterData] = useState({
    nome: '',
    skuMaster: '',
    descricao: '',
    tempoLaborHoras: 20,
    custoHoraLabor: 40,
    overheadPct: 10,
    markupPct: 30,
    impostosPct: 12
  });

  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERATOR'
  });

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) return;

    if (newUserData.password.length < 4) {
      showToast('A senha deve ter pelo menos 4 caracteres!', 'error');
      return;
    }

    const user = {
      id: String(Date.now()),
      ...newUserData,
      lastLogin: 'Nunca'
    };

    const updatedUsersList = [...users, user];
    setUsers(updatedUsersList);
    setShowNewUserModal(false);
    setNewUserData({ name: '', email: '', password: '', role: 'OPERATOR' });
    showToast(`Usuário ${user.name} cadastrado com sucesso!`);
  };

  const activeMaster = useMemo(() => {
    return masterProducts.find(m => m.id === selectedMasterId) || masterProducts[0];
  }, [masterProducts, selectedMasterId]);

  const calculatedBOM = useMemo(() => {
    let totalMaterial = 0;
    const moduleMap = {};

    const items = activeMaster.componentes.map(comp => {
      const catItem = catalog.find(c => c.sku === comp.sku) || {
        nome: comp.sku,
        precoUnitario: 0,
        unidade: 'UN'
      };

      const qtdComPerda = comp.quantidade * (1 + (comp.perdaPct / 100));
      const subtotal = qtdComPerda * catItem.precoUnitario;
      totalMaterial += subtotal;

      moduleMap[comp.modulo] = (moduleMap[comp.modulo] || 0) + subtotal;

      return {
        ...comp,
        nome: catItem.nome,
        unidade: catItem.unidade,
        precoUnitario: catItem.precoUnitario,
        qtdComPerda,
        subtotal
      };
    });

    const totalLabor = activeMaster.tempoLaborHoras * activeMaster.custoHoraLabor;
    const overheadValor = (totalMaterial + totalLabor) * (activeMaster.overheadPct / 100);
    const custoIndustrialTotal = totalMaterial + totalLabor + overheadValor;
    
    const valorMarkup = custoIndustrialTotal * (activeMaster.markupPct / 100);
    const precoAntesImposto = custoIndustrialTotal + valorMarkup;
    const valorImpostos = precoAntesImposto * (activeMaster.impostosPct / 100);
    const precoFinalVenda = precoAntesImposto + valorImpostos;

    return {
      items,
      totalMaterial,
      totalLabor,
      overheadValor,
      custoIndustrialTotal,
      valorMarkup,
      valorImpostos,
      precoFinalVenda,
      moduleMap
    };
  }, [activeMaster, catalog]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchSearch = item.nome.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                          item.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                          item.fornecedor.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchCat = catalogCategory === 'ALL' || item.categoria === catalogCategory;
      return matchSearch && matchCat;
    });
  }, [catalog, catalogSearch, catalogCategory]);

  const mrpCalculated = useMemo(() => {
    const grossDemand = {};

    Object.entries(productionSchedule).forEach(([masterId, numUnits]) => {
      if (numUnits <= 0) return;
      const master = masterProducts.find(m => m.id === masterId);
      if (!master) return;

      master.componentes.forEach(comp => {
        const reqQty = comp.quantidade * (1 + (comp.perdaPct / 100)) * numUnits;
        grossDemand[comp.sku] = (grossDemand[comp.sku] || 0) + reqQty;
      });
    });

    let totalCustoCompra = 0;
    const items = Object.entries(grossDemand).map(([sku, reqQty]) => {
      const catItem = catalog.find(c => c.sku === sku) || {
        nome: sku,
        categoria: 'Geral',
        estoque: 0,
        precoUnitario: 0,
        unidade: 'UN',
        leadTimeDias: 0,
        fornecedor: 'N/A'
      };

      const saldo = catItem.estoque - reqQty;
      const comprarQtd = saldo < 0 ? Math.abs(saldo) : 0;
      const custoEstimado = comprarQtd * catItem.precoUnitario;
      totalCustoCompra += custoEstimado;

      return {
        sku,
        nome: catItem.nome,
        categoria: catItem.categoria,
        necessidadeTotal: reqQty,
        estoqueAtual: catItem.estoque,
        saldo,
        comprarQtd,
        unidade: catItem.unidade,
        precoUnitario: catItem.precoUnitario,
        custoEstimado,
        leadTimeDias: catItem.leadTimeDias,
        fornecedor: catItem.fornecedor
      };
    });

    return { items, totalCustoCompra };
  }, [productionSchedule, masterProducts, catalog]);

  const handleUpdateComponentQty = (sku, field, value) => {
    const val = parseFloat(value) || 0;
    const updatedMasters = masterProducts.map(mp => {
      if (mp.id === selectedMasterId) {
        return {
          ...mp,
          componentes: mp.componentes.map(c => c.sku === sku ? { ...c, [field]: val } : c)
        };
      }
      return mp;
    });
    setMasterProducts(updatedMasters);
  };

  const handleAddComponentToBOM = (sku) => {
    if (activeMaster.componentes.some(c => c.sku === sku)) {
      showToast('Item já está presente na ficha técnica!', 'error');
      return;
    }

    const catItem = catalog.find(c => c.sku === sku);
    const updatedMasters = masterProducts.map(mp => {
      if (mp.id === selectedMasterId) {
        return {
          ...mp,
          componentes: [...mp.componentes, { sku, modulo: catItem.categoria, quantidade: 1, perdaPct: 0 }]
        };
      }
      return mp;
    });
    setMasterProducts(updatedMasters);
    showToast(`Item ${sku} adicionado com sucesso!`);
  };

  const handleRemoveComponent = (sku) => {
    const updatedMasters = masterProducts.map(mp => {
      if (mp.id === selectedMasterId) {
        return {
          ...mp,
          componentes: mp.componentes.filter(c => c.sku !== sku)
        };
      }
      return mp;
    });
    setMasterProducts(updatedMasters);
    showToast('Componente removido.');
  };

  const handleUpdateMasterParam = (field, value) => {
    const val = parseFloat(value) || 0;
    const updatedMasters = masterProducts.map(mp => {
      if (mp.id === selectedMasterId) {
        return { ...mp, [field]: val };
      }
      return mp;
    });
    setMasterProducts(updatedMasters);
  };

  const handleOmieSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Sincronização com API Omie concluída! Tabela de preços atualizada.');
    }, 1500);
  };

  const handleExportCSV = () => {
    let csv = `Ficha Tecnica BOM - ${activeMaster.nome} (${activeMaster.skuMaster})\n`;
    csv += `Data Exportacao: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    csv += `Modulo;SKU;Componente;Quantidade Base;Perda %;Quantidade Real;Unidade;Preco Unitario R$;Subtotal R$\n`;

    calculatedBOM.items.forEach(item => {
      csv += `"${item.modulo}";"${item.sku}";"${item.nome}";${item.quantidade};${item.perdaPct}%;${item.qtdComPerda.toFixed(2)};"${item.unidade}";${item.precoUnitario.toFixed(2)};${item.subtotal.toFixed(2)}\n`;
    });

    csv += `\nRESUMO FINANCEIRO INDUSTRIAL\n`;
    csv += `Custo Matéria-Prima (BOM):;R$ ${calculatedBOM.totalMaterial.toFixed(2)}\n`;
    csv += `Mão de Obra Direta (${activeMaster.tempoLaborHoras}h @ R$${activeMaster.custoHoraLabor}/h):;R$ ${calculatedBOM.totalLabor.toFixed(2)}\n`;
    csv += `Overhead Fabril (${activeMaster.overheadPct}%):;R$ ${calculatedBOM.overheadValor.toFixed(2)}\n`;
    csv += `Custo Industrial Direto:;R$ ${calculatedBOM.custoIndustrialTotal.toFixed(2)}\n`;
    csv += `Markup de Venda (${activeMaster.markupPct}%):;R$ ${calculatedBOM.valorMarkup.toFixed(2)}\n`;
    csv += `Impostos (${activeMaster.impostosPct}%):;R$ ${calculatedBOM.valorImpostos.toFixed(2)}\n`;
    csv += `PREÇO FINAL SUGERIDO DE VENDA:;R$ ${calculatedBOM.precoFinalVenda.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BOM_${activeMaster.skuMaster}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download do arquivo CSV iniciado!');
  };

  const handleExportMRPCSV = () => {
    let csv = `Planejamento de Necessidade de Materiais (MRP) - Projeção de Compras\n`;
    csv += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    csv += `SKU;Componente;Categoria;Necessidade Lote;Estoque Atual;Saldo Previsto;Sugerido Comprar;Unidade;Preco Unitario R$;Custo Total Pedido R$;Fornecedor;Lead Time (Dias)\n`;

    mrpCalculated.items.forEach(item => {
      csv += `"${item.sku}";"${item.nome}";"${item.categoria}";${item.necessidadeTotal.toFixed(2)};${item.estoqueAtual};${item.saldo.toFixed(2)};${item.comprarQtd.toFixed(2)};"${item.unidade}";${item.precoUnitario.toFixed(2)};${item.custoEstimado.toFixed(2)};"${item.fornecedor}";${item.leadTimeDias}\n`;
    });

    csv += `\nVALOR TOTAL ESTIMADO DA COMPRA DE LOTE:;R$ ${mrpCalculated.totalCustoCompra.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MRP_Pedido_Compras_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download da lista de compras MRP gerado com sucesso!');
  };

  const handleSaveSnapshot = () => {
    const newSnap = {
      id: `H-${Math.floor(100 + Math.random() * 900)}`,
      data: new Date().toISOString().slice(0,10),
      produto: activeMaster.nome,
      masterId: activeMaster.id,
      sku: activeMaster.skuMaster,
      custoMaterial: calculatedBOM.totalMaterial,
      custoLabor: calculatedBOM.totalLabor,
      precoSugerido: calculatedBOM.precoFinalVenda,
      autor: currentUser.email,
      snapshotItems: calculatedBOM.items.map(i => ({ sku: i.sku, precoUnitario: i.precoUnitario, quantidade: i.quantidade }))
    };

    setHistory([newSnap, ...history]);
    showToast('Snapshot histórico de preços salvo com sucesso!');
  };

  const handleExportSnapshotComparisonCSV = (snap) => {
    let csv = `Comparativo de Preços Snapshot (${snap.data}) vs Catálogo Omie Atual\n`;
    csv += `Produto: ${snap.produto} (${snap.sku})\n\n`;
    csv += `SKU;Preco Snap (${snap.data});Preco Atual Omie;Variacao R$;Variacao %\n`;

    snap.snapshotItems?.forEach(item => {
      const catItem = catalog.find(c => c.sku === item.sku);
      const precoAtual = catItem ? catItem.precoUnitario : item.precoUnitario;
      const diff = precoAtual - item.precoUnitario;
      const varPct = item.precoUnitario > 0 ? ((diff / item.precoUnitario) * 100).toFixed(2) : 0;

      csv += `"${item.sku}";${item.precoUnitario.toFixed(2)};${precoAtual.toFixed(2)};${diff.toFixed(2)};${varPct}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Comparativo_Snapshot_${snap.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV comparativo exportado com sucesso!');
  };

  const handleCreateMasterProduct = (e) => {
    e.preventDefault();
    if (!newMasterData.nome || !newMasterData.skuMaster) return;

    const newProduct = {
      id: `MST-TR-${Math.floor(10 + Math.random() * 90)}`,
      ...newMasterData,
      componentes: [
        { sku: 'EIX-ALKO-1000', modulo: 'Chassi & Rodante', quantidade: 1, perdaPct: 0 },
        { sku: 'ACO-TUB-8040', modulo: 'Chassi & Rodante', quantidade: 30, perdaPct: 5 },
        { sku: 'LAN-SIN-LED', modulo: 'Sistema Elétrico', quantidade: 1, perdaPct: 0 }
      ]
    };

    setMasterProducts([...masterProducts, newProduct]);
    setSelectedMasterId(newProduct.id);
    setShowNewMasterModal(false);
    setNewMasterData({ nome: '', skuMaster: '', descricao: '', tempoLaborHoras: 20, custoHoraLabor: 40, overheadPct: 10, markupPct: 30, impostosPct: 12 });
    showToast(`Modelo ${newProduct.nome} cadastrado com sucesso!`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-3.5 rounded-2xl shadow-xl text-slate-950">
              <Cpu className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">OMIE BOM SYSTEM</h1>
              <p className="text-xs text-slate-400 font-mono mt-1">Plataforma de Engenharia, Custos & MRP</p>
            </div>
          </div>

          {loginError && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-medium flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">E-mail Corporativo</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@empresa.com.br"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Senha de Acesso</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 mt-2 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Entrar no Sistema
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs">
            <p className="text-slate-400 font-medium">Acesso inicial de administrador:</p>
            <p className="font-mono text-amber-400 font-semibold mt-1">admin@empresa.com.br</p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border text-sm font-medium transition-all animate-bounce ${
          notification.type === 'error' 
            ? 'bg-rose-950 border-rose-700 text-rose-200' 
            : notification.type === 'info'
            ? 'bg-sky-950 border-sky-700 text-sky-200'
            : 'bg-emerald-950 border-emerald-700 text-emerald-200'
        }`}>
          {notification.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
          {notification.msg}
        </div>
      )}

      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-2.5 rounded-xl shadow-lg text-slate-950">
              <Cpu className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-white leading-tight">OMIE BOM</h1>
              <p className="text-xs text-slate-400 font-mono">Engenharia & Custos</p>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('bom_builder')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'bom_builder'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              Montador BOM (Ficha)
            </button>

            <button
              onClick={() => setActiveTab('mrp_projection')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'mrp_projection'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Projeção de Compras (MRP)
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Catálogo & Estoque
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Análise & Gráficos
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              Histórico de Snapshots
            </button>

            <div className="pt-4 pb-1">
              <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Configurações Admin</p>
            </div>

            <button
              onClick={() => {
                if (currentUser.role !== 'ADMIN') {
                  showToast('Acesso restrito ao Administrador!', 'error');
                  return;
                }
                setActiveTab('users');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : currentUser.role === 'ADMIN'
                  ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  : 'text-slate-600 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                Usuários & Permissões
              </div>
              {currentUser.role !== 'ADMIN' && <Lock className="w-3 h-3 text-slate-600" />}
            </button>

            <button
              onClick={() => {
                if (currentUser.role !== 'ADMIN') {
                  showToast('Acesso restrito ao Administrador!', 'error');
                  return;
                }
                setActiveTab('settings');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : currentUser.role === 'ADMIN'
                  ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  : 'text-slate-600 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4" />
                API Omie & Segurança
              </div>
              {currentUser.role !== 'ADMIN' && <Lock className="w-3 h-3 text-slate-600" />}
            </button>
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-900/50 space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0 border border-amber-500/30">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 inline-block">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Encerrar Sessão (Logout)"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {activeTab === 'bom_builder' && (
                <span className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>Estrutura & Precificação BOM</span>
                </span>
              )}
              {activeTab === 'mrp_projection' && (
                <span className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-400" />
                  <span>Projeção de Compras e Necessidade (MRP)</span>
                </span>
              )}
              {activeTab === 'catalog' && (
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <span>Catálogo & Sugestão de Compras</span>
                </span>
              )}
              {activeTab === 'analytics' && (
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <span>Dashboard Analytics de Custos</span>
                </span>
              )}
              {activeTab === 'history' && (
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>Histórico & Comparativo de Snapshots</span>
                </span>
              )}
              {activeTab === 'users' && (
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>Gerenciamento de Usuários (Admin)</span>
                </span>
              )}
              {activeTab === 'settings' && (
                <span className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  <span>Cofre de Credenciais da API Omie (Admin)</span>
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className={`w-2 h-2 rounded-full ${omieConfig.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="font-mono text-[11px]">API Omie: {omieConfig.isConnected ? 'Conectada' : 'Offline'}</span>
            </div>

            <button
              onClick={handleOmieSync}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sync Omie'}
            </button>

            {activeTab === 'bom_builder' && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-md shadow-amber-500/10"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                Exportar CSV
              </button>
            )}

            {activeTab === 'mrp_projection' && (
              <button
                onClick={handleExportMRPCSV}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                Exportar Pedido MRP (CSV)
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'bom_builder' && (
            <div className="space-y-6">
              
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Box className="w-5 h-5 text-amber-400" />
                  <div>
                    <label className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider block">Produto Master (Engenharia)</label>
                    <select
                      value={selectedMasterId}
                      onChange={(e) => setSelectedMasterId(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-white font-medium text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
                    >
                      {masterProducts.map(mp => (
                        <option key={mp.id} value={mp.id}>{mp.nome} ({mp.skuMaster})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNewMasterModal(true)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    Criar Produto Master
                  </button>

                  <button
                    onClick={handleSaveSnapshot}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold"
                  >
                    <Save className="w-4 h-4 text-amber-400" />
                    Salvar Snapshot
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Custo Total Matéria-Prima (BOM)</p>
                  <p className="text-xl font-bold text-white mt-1">R$ {calculatedBOM.totalMaterial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">{calculatedBOM.items.length} componentes listados</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Mão de Obra + Overhead Fabril</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">R$ {(calculatedBOM.totalLabor + calculatedBOM.overheadValor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">{activeMaster.tempoLaborHoras}h labor @ R$ {activeMaster.custoHoraLabor}/h</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Custo Industrial Direto</p>
                  <p className="text-xl font-bold text-sky-400 mt-1">R$ {calculatedBOM.custoIndustrialTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">Insumos + M.O + Estrutura</span>
                </div>

                <div className="bg-slate-900/80 border border-amber-500/30 bg-gradient-to-br from-slate-900 to-amber-950/20 p-4 rounded-xl">
                  <p className="text-xs text-amber-300/80 font-medium">Preço Sugerido de Venda</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">R$ {calculatedBOM.precoFinalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">Markup {activeMaster.markupPct}% | Impostos {activeMaster.impostosPct}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" /> Componentes da Ficha Técnica ({calculatedBOM.items.length})
                      </h3>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar SKU para adicionar..."
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-1.5 w-64 text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                        {searchFilter && (
                          <div className="absolute right-0 top-full mt-1 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-30 max-h-60 overflow-y-auto p-1">
                            {catalog
                              .filter(c => c.nome.toLowerCase().includes(searchFilter.toLowerCase()) || c.sku.toLowerCase().includes(searchFilter.toLowerCase()))
                              .slice(0, 6)
                              .map(item => (
                                <button
                                  key={item.sku}
                                  onClick={() => {
                                    handleAddComponentToBOM(item.sku);
                                    setSearchFilter('');
                                  }}
                                  className="w-full text-left p-2 hover:bg-slate-800 rounded text-xs flex justify-between items-center"
                                >
                                  <div>
                                    <p className="font-semibold text-white truncate">{item.nome}</p>
                                    <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
                                  </div>
                                  <span className="font-mono text-amber-400 font-bold">R$ {item.precoUnitario}</span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">Módulo / SKU</th>
                            <th className="py-3 px-4">Componente</th>
                            <th className="py-3 px-4 text-center">Qtd Base</th>
                            <th className="py-3 px-4 text-center">Perda %</th>
                            <th className="py-3 px-4 text-right">Preço Un. Omie</th>
                            <th className="py-3 px-4 text-right">Subtotal</th>
                            <th className="py-3 px-4 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {calculatedBOM.items.map((item) => (
                            <tr key={item.sku} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4">
                                <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase mb-1 ${
                                  item.modulo === 'Chassi & Rodante' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                                  item.modulo === 'Carroceria & Fechamento' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                  item.modulo === 'Sistema Elétrico' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                  'bg-pink-950 text-pink-300 border border-pink-800'
                                }`}>
                                  {item.modulo}
                                </span>
                                <div className="font-mono text-slate-400 text-[11px]">{item.sku}</div>
                              </td>

                              <td className="py-3 px-4 font-semibold text-slate-100 max-w-[200px] truncate">
                                {item.nome}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  value={item.quantidade}
                                  onChange={(e) => handleUpdateComponentQty(item.sku, 'quantidade', e.target.value)}
                                  className="w-16 bg-slate-950 border border-slate-700 text-center text-xs py-1 rounded text-white focus:border-amber-500 font-mono"
                                />
                                <span className="text-[10px] text-slate-500 ml-1">{item.unidade}</span>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={item.perdaPct}
                                  onChange={(e) => handleUpdateComponentQty(item.sku, 'perdaPct', e.target.value)}
                                  className="w-14 bg-slate-950 border border-slate-700 text-center text-xs py-1 rounded text-white focus:border-amber-500 font-mono"
                                />
                                <span className="text-[10px] text-slate-500 ml-0.5">%</span>
                              </td>

                              <td className="py-3 px-4 text-right font-mono text-slate-300">
                                R$ {item.precoUnitario.toFixed(2)}
                              </td>

                              <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                                R$ {item.subtotal.toFixed(2)}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleRemoveComponent(item.sku)}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800"
                                  title="Remover componente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <DollarSign className="w-4 h-4 text-amber-400" /> Parâmetros Industriais & Mão de Obra
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">Horas de Mão de Obra Direta (H/H)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={activeMaster.tempoLaborHoras}
                            onChange={(e) => handleUpdateMasterParam('tempoLaborHoras', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono focus:border-amber-500"
                          />
                          <span className="text-slate-500">Horas</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">Custo da Hora de Produção (R$/h)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={activeMaster.custoHoraLabor}
                            onChange={(e) => handleUpdateMasterParam('custoHoraLabor', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono focus:border-amber-500"
                          />
                          <span className="text-slate-500">R$/h</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">Taxa de Overhead Fabril (% Rateio)</label>
                        <input
                          type="number"
                          value={activeMaster.overheadPct}
                          onChange={(e) => handleUpdateMasterParam('overheadPct', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono focus:border-amber-500"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <label className="text-slate-400 font-semibold block mb-1">Markup de Venda / Lucro (%)</label>
                        <input
                          type="number"
                          value={activeMaster.markupPct}
                          onChange={(e) => handleUpdateMasterParam('markupPct', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono text-amber-400 font-bold focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">Alíquota de Impostos / Venda (%)</label>
                        <input
                          type="number"
                          value={activeMaster.impostosPct}
                          onChange={(e) => handleUpdateMasterParam('impostosPct', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'mrp_projection' && (
            <div className="space-y-6">
              
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-amber-400" /> Planejamento de Ordem de Produção
                    </h3>
                    <p className="text-xs text-slate-400">Informe a quantidade de veículos a produzir no lote para calcular a compra líquida necessária.</p>
                  </div>
                  
                  <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-right">
                    <span className="text-[11px] text-slate-400 font-semibold block uppercase">Custo Total de Compras</span>
                    <span className="text-xl font-black text-amber-400 font-mono">
                      R$ {mrpCalculated.totalCustoCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {masterProducts.map(master => (
                    <div key={master.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-white">{master.nome}</p>
                        <span className="text-xs font-mono text-slate-400">{master.skuMaster}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Qtd:</label>
                        <input
                          type="number"
                          min="0"
                          value={productionSchedule[master.id] || 0}
                          onChange={(e) => setProductionSchedule({
                            ...productionSchedule,
                            [master.id]: Math.max(0, parseInt(e.target.value) || 0)
                          })}
                          className="w-16 bg-slate-900 border border-slate-700 text-center font-bold text-white py-1.5 rounded focus:border-amber-500 font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-amber-400" /> Balanço de Materiais & Necessidade de Compra ({mrpCalculated.items.length} itens)
                  </h3>

                  <button
                    onClick={handleExportMRPCSV}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" /> Exportar Lista de Compras (CSV)
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">SKU / Categoria</th>
                        <th className="py-3 px-4">Componente</th>
                        <th className="py-3 px-4 text-center">Necessidade Lote</th>
                        <th className="py-3 px-4 text-center">Estoque Atual</th>
                        <th className="py-3 px-4 text-center">Saldo Previsto</th>
                        <th className="py-3 px-4 text-center">Sugerido Comprar</th>
                        <th className="py-3 px-4 text-right">Preço Un. Omie</th>
                        <th className="py-3 px-4 text-right">Custo Total Pedido</th>
                        <th className="py-3 px-4">Fornecedor / Lead Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {mrpCalculated.items.map((item) => (
                        <tr key={item.sku} className={`hover:bg-slate-800/40 ${item.comprarQtd > 0 ? 'bg-amber-500/5' : ''}`}>
                          <td className="py-3 px-4">
                            <span className="font-mono text-amber-400 font-bold block">{item.sku}</span>
                            <span className="text-[10px] text-slate-400">{item.categoria}</span>
                          </td>

                          <td className="py-3 px-4 text-white font-semibold">{item.nome}</td>

                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                            {item.necessidadeTotal.toFixed(1)} {item.unidade}
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-slate-400">
                            {item.estoqueAtual} {item.unidade}
                          </td>

                          <td className="py-3 px-4 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.saldo < 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}>
                              {item.saldo.toFixed(1)}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center font-mono">
                            {item.comprarQtd > 0 ? (
                              <span className="bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded shadow text-xs">
                                + {item.comprarQtd.toFixed(1)} {item.unidade}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-normal">Suficiente</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            R$ {item.precoUnitario.toFixed(2)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                            R$ {item.custoEstimado.toFixed(2)}
                          </td>

                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            <div>{item.fornecedor}</div>
                            <span className="text-[10px] text-slate-500 font-mono">Lead Time: {item.leadTimeDias} dias</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-4">
              
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por descrição, SKU ou fornecedor..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-xs rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={catalogCategory}
                      onChange={(e) => setCatalogCategory(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                    >
                      <option value="ALL">Todas as Categorias</option>
                      <option value="Chassi & Rodante">Chassi & Rodante</option>
                      <option value="Carroceria & Fechamento">Carroceria & Fechamento</option>
                      <option value="Sistema Elétrico">Sistema Elétrico</option>
                      <option value="Consumíveis & Fixadores">Consumíveis & Fixadores</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                    {filteredCatalog.length} itens exibidos
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">SKU Code</th>
                      <th className="py-3 px-4">Descrição do Material</th>
                      <th className="py-3 px-4">Categoria / Fornecedor</th>
                      <th className="py-3 px-4 text-center">Lead Time</th>
                      <th className="py-3 px-4 text-center">Estoque Mínimo</th>
                      <th className="py-3 px-4 text-center">Estoque Atual</th>
                      <th className="py-3 px-4 text-center">Sugestão Compra</th>
                      <th className="py-3 px-4 text-right">Preço Un. Omie</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredCatalog.map((item) => {
                      const isAbajoMin = item.estoque < item.minEstoque;
                      const sugestaoComprar = isAbajoMin ? (item.minEstoque * 2) - item.estoque : 0;

                      return (
                        <tr key={item.sku} className={`hover:bg-slate-800/40 transition-colors ${isAbajoMin ? 'bg-rose-950/20' : ''}`}>
                          <td className="py-3 px-4 font-mono text-amber-400 font-bold">{item.sku}</td>
                          <td className="py-3 px-4 text-slate-100 font-semibold">{item.nome}</td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700 block w-max">
                              {item.categoria}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.fornecedor}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-300">
                            {item.leadTimeDias} dias
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-400">
                            {item.minEstoque} {item.unidade}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isAbajoMin ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-300'
                            }`}>
                              {item.estoque} {item.unidade}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            {isAbajoMin ? (
                              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold px-2 py-0.5 rounded text-[10px]">
                                Comprar {sugestaoComprar} {item.unidade}
                              </span>
                            ) : (
                              <span className="text-emerald-400 text-[11px]">OK</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                            R$ {item.precoUnitario.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                const newStock = prompt(`Ajustar estoque para ${item.nome}:`, item.estoque);
                                if (newStock !== null) {
                                  const val = parseInt(newStock) || 0;
                                  setCatalog(catalog.map(c => c.sku === item.sku ? { ...c, estoque: val } : c));
                                  showToast('Estoque atualizado!');
                                }
                              }}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700"
                            >
                              Ajustar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" /> Distribuição de Custo por Módulo ({activeMaster.nome})
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(calculatedBOM.moduleMap).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {Object.keys(calculatedBOM.moduleMap).map((key, index) => (
                            <Cell key={`cell-${index}`} fill={MODULE_COLORS[key] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Custo']}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" /> Composição de Formação do Preço Final
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Materiais', valor: calculatedBOM.totalMaterial },
                          { name: 'Mão Obra', valor: calculatedBOM.totalLabor },
                          { name: 'Overhead', valor: calculatedBOM.overheadValor },
                          { name: 'Markup/Lucro', valor: calculatedBOM.valorMarkup },
                          { name: 'Impostos', valor: calculatedBOM.valorImpostos },
                        ]}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                        <Tooltip
                          formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                        />
                        <Bar dataKey="valor" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Snapshots Históricos de Custo</h3>
                  <p className="text-xs text-slate-400">Acompanhe e compare variações do custo de matéria-prima no tempo</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">ID Snapshot</th>
                      <th className="py-3 px-4">Data Registro</th>
                      <th className="py-3 px-4">Produto Master</th>
                      <th className="py-3 px-4 text-right">Custo Matéria-Prima (Snap)</th>
                      <th className="py-3 px-4 text-right">Preço Sugerido (Snap)</th>
                      <th className="py-3 px-4">Responsável</th>
                      <th className="py-3 px-4 text-center">Ações Comparativas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-slate-400">{h.id}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{h.data}</td>
                        <td className="py-3 px-4 text-white font-semibold">{h.produto} ({h.sku})</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">R$ {h.custoMaterial.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">R$ {h.precoSugerido.toFixed(2)}</td>
                        <td className="py-3 px-4 text-slate-400">{h.autor}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedSnapshot(h);
                                setShowSnapshotModal(true);
                              }}
                              className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 px-2.5 py-1 rounded border border-slate-700 font-semibold"
                            >
                              <GitCompare className="w-3.5 h-3.5" /> Comparar
                            </button>

                            <button
                              onClick={() => handleExportSnapshotComparisonCSV(h)}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded border border-slate-700"
                              title="Exportar Relatório CSV de Comparação"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && currentUser.role === 'ADMIN' && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Usuários com Acesso ao BOM System</h3>
                  <p className="text-xs text-slate-400">Gerencie engenheiros, compradores e diretores autorizados</p>
                </div>

                <button
                  onClick={() => setShowNewUserModal(true)}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  Adicionar Usuário
                </button>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Nome do Usuário</th>
                      <th className="py-3 px-4">E-mail Corporativo</th>
                      <th className="py-3 px-4">Nível de Permissão (Role)</th>
                      <th className="py-3 px-4">Último Acesso</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-white">{u.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            u.role === 'ADMIN' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{u.lastLogin}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              if (users.length <= 1) return showToast('Impossível deletar único usuário!', 'error');
                              setUsers(users.filter(x => x.id !== u.id));
                              showToast('Usuário removido.');
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && currentUser.role === 'ADMIN' && (
            <div className="max-w-4xl space-y-6">
              
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-5 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <Key className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">Cofre de Credenciais da API Omie ERP</h3>
                    <p className="text-xs text-slate-400">Chaves armazenadas e encriptadas no Cofre do Backend / Vercel Environment Variables</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">APP KEY (Omie API)</label>
                    <input
                      type="text"
                      value={omieConfig.appKey}
                      onChange={(e) => setOmieConfig({ ...omieConfig, appKey: e.target.value })}
                      placeholder="Ex: 3834469034"
                      className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-lg px-3 py-2 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">APP SECRET (Criptografado Vault)</label>
                    <input
                      type="password"
                      value={omieConfig.appSecret}
                      onChange={(e) => setOmieConfig({ ...omieConfig, appSecret: e.target.value })}
                      placeholder="Ex: 50073004b9015d86efdd62bc02a28172"
                      className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-lg px-3 py-2 focus:border-amber-500"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setOmieConfig({ ...omieConfig, isConnected: true });
                        showToast('Credenciais salvas no Vault com sucesso!');
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs"
                    >
                      Salvar & Testar Conexão
                    </button>
                    <span className="text-[11px] text-emerald-400 font-mono">✓ API Status: OK</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 p-6 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <Database className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Arquitetura de Armazenamento e Segurança dos Dados</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-amber-400 font-bold font-mono text-[11px] uppercase block">1. Modo de Testes (Frontend / Demo)</span>
                    <p className="text-slate-300 leading-relaxed">
                      Nesta versão demonstrativa no navegador, os dados de usuários e credenciais ficam salvos no <strong className="text-white font-mono">LocalStorage</strong> encriptado do próprio browser do usuário.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-emerald-400 font-bold font-mono text-[11px] uppercase block">2. Modo de Produção (Backend / Cloud)</span>
                    <p className="text-slate-300 leading-relaxed">
                      Em produção no GitHub/Vercel, as chaves da API ficam nas <strong className="text-white font-mono">Environment Variables (.env)</strong> e os usuários/senhas são armazenados com Hash Criptográfico (<strong className="text-white font-mono">bcrypt/argon2</strong>) em banco de dados seguro (<strong className="text-white font-mono">Supabase / PostgreSQL / Firebase</strong>).
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {showNewMasterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-amber-400" /> Cadastrar Novo Produto Master
              </h3>
              <button onClick={() => setShowNewMasterModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMasterProduct} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Nome do Veículo / Trailer</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Trailer Baú Mod. Off-Road"
                    value={newMasterData.nome}
                    onChange={(e) => setNewMasterData({ ...newMasterData, nome: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Código SKU Master</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: TR-OFFROAD-4X4"
                    value={newMasterData.skuMaster}
                    onChange={(e) => setNewMasterData({ ...newMasterData, skuMaster: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Horas Montagem (H/H)</label>
                  <input
                    type="number"
                    value={newMasterData.tempoLaborHoras}
                    onChange={(e) => setNewMasterData({ ...newMasterData, tempoLaborHoras: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Custo Mão Obra (R$/h)</label>
                  <input
                    type="number"
                    value={newMasterData.custoHoraLabor}
                    onChange={(e) => setNewMasterData({ ...newMasterData, custoHoraLabor: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Markup Padrao (%)</label>
                  <input
                    type="number"
                    value={newMasterData.markupPct}
                    onChange={(e) => setNewMasterData({ ...newMasterData, markupPct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-amber-400 font-bold focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Descrição Técnica Resumida</label>
                <textarea
                  rows="2"
                  value={newMasterData.descricao}
                  onChange={(e) => setNewMasterData({ ...newMasterData, descricao: e.target.value })}
                  placeholder="Especificações de aplicação e acabamento..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewMasterModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Criar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSnapshotModal && selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-4">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-amber-400" /> Comparativo: {selectedSnapshot.produto}
                </h3>
                <p className="text-xs text-slate-400 font-mono">Snapshot de {selectedSnapshot.data} vs Preços Atuais Omie</p>
              </div>
              <button onClick={() => setShowSnapshotModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Preço Snap ({selectedSnapshot.data})</th>
                    <th className="py-2.5 px-3 text-right">Preço Atual (Omie)</th>
                    <th className="py-2.5 px-3 text-right">Variação R$</th>
                    <th className="py-2.5 px-3 text-right">Variação %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {selectedSnapshot.snapshotItems?.map(item => {
                    const catItem = catalog.find(c => c.sku === item.sku);
                    const precoAtual = catItem ? catItem.precoUnitario : item.precoUnitario;
                    const diff = precoAtual - item.precoUnitario;
                    const varPct = item.precoUnitario > 0 ? ((diff / item.precoUnitario) * 100).toFixed(2) : 0;

                    return (
                      <tr key={item.sku} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-amber-400 font-bold">{item.sku}</td>
                        <td className="py-2 px-3 text-right text-slate-300">R$ {item.precoUnitario.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-white">R$ {precoAtual.toFixed(2)}</td>
                        <td className={`py-2 px-3 text-right font-bold ${diff > 0 ? 'text-rose-400' : diff < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {diff > 0 ? `+ R$ ${diff.toFixed(2)}` : `R$ ${diff.toFixed(2)}`}
                        </td>
                        <td className={`py-2 px-3 text-right ${diff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {varPct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950">
              <button
                onClick={() => handleExportSnapshotComparisonCSV(selectedSnapshot)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs"
              >
                <Download className="w-4 h-4 stroke-[2.5]" /> Exportar Relatório em CSV
              </button>

              <button
                onClick={() => setShowSnapshotModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" /> Adicionar Novo Usuário
              </h3>
              <button onClick={() => setShowNewUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="exemplo@empresa.com.br"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Senha de Acesso</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nível de Permissão (Role)</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-500"
                >
                  <option value="OPERATOR">OPERATOR (Acesso total a engenharia/MRP)</option>
                  <option value="ADMIN">ADMIN (Operador + Gestão Usuários & Chaves Omie)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
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
