import { callOmieAPI } from '../_lib/omie.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    // Consulta a lista de produtos no Omie
    const data = await callOmieAPI('geral/produtos/', 'ListarProdutos', [{
      pagina: 1,
      registros_por_pagina: 50,
      apenas_importados_api: "N",
      filtrar_apenas_ativos: "S"
    }]);

    // Mapeia o retorno do Omie para o formato do nosso BOM System
    const produtosFormatados = data.produto_servico_cadastro.map(prod => ({
      id: prod.codigo_produto.toString(),
      code: prod.codigo,
      name: prod.descricao,
      category: prod.descricao_familia || 'Insumo',
      unit: prod.unidade || 'UN',
      cost: prod.preco_unitario || 0,
      stock: prod.quantidade_estoque || 0,
      minStock: prod.estoque_minimo || 0
    }));

    return res.status(200).json({
      success: true,
      total: data.total_de_registros,
      items: produtosFormatados
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}