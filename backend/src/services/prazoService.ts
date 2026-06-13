import https from 'https';

interface Feriado {
  date: string;
  name: string;
  type: string;
}

const feriadosCache = new Map<number, Set<string>>();

async function fetchFeriados(ano: number): Promise<Set<string>> {
  if (feriadosCache.has(ano)) return feriadosCache.get(ano)!;

  return new Promise((resolve) => {
    const req = https.get(`https://brasilapi.com.br/api/feriados/v1/${ano}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const feriados: Feriado[] = JSON.parse(data);
          const datas = new Set(feriados.map(f => f.date));
          feriadosCache.set(ano, datas);
          resolve(datas);
        } catch {
          resolve(new Set());
        }
      });
    });
    req.on('error', () => resolve(new Set()));
  });
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function calcularPrazo(dataInicio: Date, diasUteis: number): Promise<Date> {
  const anos = new Set([dataInicio.getFullYear()]);
  const dataFim = new Date(dataInicio);
  dataFim.setFullYear(dataFim.getFullYear() + 1);
  anos.add(dataFim.getFullYear());

  const feriadosSets = await Promise.all([...anos].map(fetchFeriados));
  const feriados = new Set<string>();
  feriadosSets.forEach(s => s.forEach(d => feriados.add(d)));

  let diasContados = 0;
  const data = new Date(dataInicio);
  data.setDate(data.getDate() + 1);

  while (diasContados < diasUteis) {
    const dateStr = formatDate(data);
    if (!isWeekend(data) && !feriados.has(dateStr)) {
      diasContados++;
    }
    if (diasContados < diasUteis) {
      data.setDate(data.getDate() + 1);
    }
  }

  return data;
}

export async function diasUteisEntre(dataInicio: Date, dataFim: Date): Promise<number> {
  const anos = new Set([dataInicio.getFullYear(), dataFim.getFullYear()]);
  const feriadosSets = await Promise.all([...anos].map(fetchFeriados));
  const feriados = new Set<string>();
  feriadosSets.forEach(s => s.forEach(d => feriados.add(d)));

  let diasUteis = 0;
  const data = new Date(dataInicio);
  data.setDate(data.getDate() + 1);

  while (data <= dataFim) {
    const dateStr = formatDate(data);
    if (!isWeekend(data) && !feriados.has(dateStr)) {
      diasUteis++;
    }
    data.setDate(data.getDate() + 1);
  }

  return diasUteis;
}

export async function proximosDiasUteis(dataBase: Date, dias: number[]): Promise<Record<number, Date>> {
  const resultado: Record<number, Date> = {};
  for (const d of dias) {
    resultado[d] = await calcularPrazo(dataBase, d);
  }
  return resultado;
}
