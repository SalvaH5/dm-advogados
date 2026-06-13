import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  region: process.env.DO_SPACES_REGION || 'nyc3',
  credentials: {
    accessKeyId:     process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
  forcePathStyle: false,
});

const BUCKET = process.env.DO_SPACES_BUCKET || 'dm-advogados';

export async function uploadDocumento(params: {
  buffer: Buffer;
  mimeType: string;
  nomeOriginal: string;
  clienteId: string;
  processoId?: string;
  tipo?: string;
}): Promise<{ caminho: string }> {
  const ext = params.nomeOriginal.split('.').pop();
  const pasta = params.processoId
    ? `clientes/${params.clienteId}/processos/${params.processoId}/documentos`
    : `clientes/${params.clienteId}/uploads`;
  const caminho = `${pasta}/${uuidv4()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: caminho,
    Body: params.buffer,
    ContentType: params.mimeType,
    ACL: 'private',
  }));

  return { caminho };
}

export async function gerarUrlTemporaria(caminho: string, expiresInSeconds = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: caminho });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export async function deletarDocumento(caminho: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: caminho }));
}
