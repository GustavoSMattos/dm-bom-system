import axios from 'axios';

const OMIE_APP_KEY = process.env.OMIE_APP_KEY;
const OMIE_APP_SECRET = process.env.OMIE_APP_SECRET;

export async function callOmieAPI(endpoint, callMethod, paramArray = []) {
  if (!OMIE_APP_KEY || !OMIE_APP_SECRET) {
    throw new Error("Credenciais do Omie não configuradas nas variáveis de ambiente.");
  }

  const payload = {
    call: callMethod,
    app_key: OMIE_APP_KEY,
    app_secret: OMIE_APP_SECRET,
    param: paramArray
  };

  try {
    const response = await axios.post(`https://app.omie.com.br/api/v1/${endpoint}`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error(`Erro na chamada Omie [${callMethod}]:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.faultstring || "Falha na comunicação com o Omie ERP.");
  }
}