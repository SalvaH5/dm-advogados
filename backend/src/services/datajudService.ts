import https from 'https';

const DATAJUD_BASE = 'https://api-publica.datajud.cnj.jus.br';

const TRIBUNAIS: Record<string, string> = {
  'TJSP': 'api_publica_tjsp',
  'TRT15': 'api_publica_trt15',
};

async function datajudFetch(tribunal: string, numeroCnj: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const indice = TRIBUNAIS[tribunal];
    if (!indice) return reject(new Error(`Tribunal ${tribunal} não suportado`));

    const body = JSON.stringify({
      query: { match: { 'numeroProcesso': numeroCnj.replace(/\D/g, '') } },
      size: 1
    });

    const url = new URL(`${DATAJUD_BASE}/${indice}/_search`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${process.env.DATAJUD_API_KEY || 'cDZHYzlZa0JadVREZDJCendFbXNpTT'}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export interface AndamentoProcessual {
  data: string;
  descricao: string;
  codigo?: string;
}

export async function consultarProcesso(tribunal: string, numeroCnj: string): Promise<{
  encontrado: boolean;
  andamentos: AndamentoProcessual[];
  dadosProcesso?: Record<string, unknown>;
}> {
  try {
    const response = await datajudFetch(tribunal, numeroCnj) as {
      hits?: { hits?: Array<{ _source?: Record<string, unknown> }> }
    };

    const hits = response?.hits?.hits;
    if (!hits || hits.length === 0) {
      return { encontrado: false, andamentos: [] };
    }

    const processo = hits[0]._source as Record<string, unknown>;
    const movimentos = (processo?.movimentos as Array<{
      dataHora?: string;
      nome?: string;
      codigo?: number;
    }>) || [];

    const andamentos: AndamentoProcessual[] = movimentos.map(m => ({
      data: m.dataHora?.split('T')[0] || '',
      descricao: m.nome || '',
      codigo: m.codigo?.toString()
    }));

    return {
      encontrado: true,
      andamentos: andamentos.sort((a, b) => b.data.localeCompare(a.data)),
      dadosProcesso: processo
    };
  } catch (err) {
    console.error('DataJud error:', err);
    return { encontrado: false, andamentos: [] };
  }
}

export async function monitorarProcessos(processos: Array<{ id: string; numero_cnj: string; tribunal: string }>) {
  const resultados = [];
  for (const processo of processos) {
    const resultado = await consultarProcesso(processo.tribunal, processo.numero_cnj);
    resultados.push({ processo_id: processo.id, ...resultado });
    await new Promise(r => setTimeout(r, 500));
  }
  return resultados;
}
