import https from 'https';

const ZAPSIGN_URL = process.env.ZAPSIGN_API_URL || 'https://api.zapsign.com.br/api/v1';
const ZAPSIGN_TOKEN = process.env.ZAPSIGN_TOKEN || '';

interface Signatario {
  name: string;
  email: string;
  phone_country?: string;
  phone_number?: string;
}

interface CriarDocumentoParams {
  nome: string;
  conteudoBase64?: string;
  urlDocumento?: string;
  signatarios: Signatario[];
  clienteNome: string;
}

async function zapFetch(path: string, method: string, body?: object): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const url = new URL(`${ZAPSIGN_URL}${path}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${ZAPSIGN_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

export async function criarDocumento(params: CriarDocumentoParams): Promise<{ token: string; sign_url: string }> {
  const body: Record<string, unknown> = {
    name: params.nome,
    signers: params.signatarios.map(s => ({
      name: s.name,
      email: s.email,
      phone_country: s.phone_country || '55',
      phone_number: s.phone_number || '',
      auth_mode: 'assinaturaTela',
      send_automatic_email: true,
      send_automatic_whatsapp: !!s.phone_number,
    })),
    lang: 'pt-BR',
    disable_signer_emails: false,
  };

  if (params.conteudoBase64) {
    body.base64_pdf = params.conteudoBase64;
  } else if (params.urlDocumento) {
    body.url_pdf = params.urlDocumento;
  }

  const response = await zapFetch('/docs/', 'POST', body) as { token: string; signers: Array<{ sign_url: string }> };
  return {
    token: response.token,
    sign_url: response.signers?.[0]?.sign_url || '',
  };
}

export async function verificarStatus(docToken: string): Promise<{ status: string; signed_file_url?: string }> {
  const response = await zapFetch(`/docs/${docToken}/`, 'GET') as {
    status: string;
    signed_file_url?: string;
  };
  return {
    status: response.status,
    signed_file_url: response.signed_file_url,
  };
}
