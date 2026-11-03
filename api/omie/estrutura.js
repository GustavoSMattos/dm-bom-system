import { callOmieAPI } from '../_lib/omie.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { codigoProdutoPai, itensEstrutura } = req.body;

    try {
      // Cadastra ou atualiza a estrutura do produto no Omie
      const result = await callOmieAPI('produtos/estrutura/', 'IncluirEstrutura', [{
        cod_prod_pai: codigoProdutoPai,
        itens: itensEstrutura.map(item => ({
          cod_prod_filho: item.idComponente,
          quant: item.quantidade,
          perda: item.perdaPercentual || 0
        }))
      }]);

      return res.status(200).json({ success: true, result });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}