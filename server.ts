import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import JSZip from 'jszip';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const ALLOWED_MOODS = new Set(['기쁨', '평온', '설렘', '우울', '불안', '화남']);

const app = express();
app.use(express.json({ limit: '100kb' }));

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.post('/api/comfort', async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown> | undefined;
    const rawContent = typeof body?.content === 'string' ? body.content.trim() : '';
    const rawMood = typeof body?.mood === 'string' ? body.mood.trim() : '';
    const rawWeather = typeof body?.weather === 'string' ? body.weather.trim().slice(0, 8) : '';
    const rawDate = typeof body?.date === 'string' ? body.date.trim().slice(0, 20) : '';

    if (!rawContent) {
      res.status(400).json({ error: '일기 내용을 입력해 주세요.' });
      return;
    }

    if (rawContent.length > 5000) {
      res.status(400).json({ error: '일기 내용이 너무 깁니다. 5,000자 이하로 입력해 주세요.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(500).json({
        error: 'Gemini API 키가 설정되지 않았습니다. Settings > Secrets 패널을 확인해 주세요.',
      });
      return;
    }

    const moodText = ALLOWED_MOODS.has(rawMood) ? rawMood : '알 수 없음';
    const userPrompt = [
      rawDate ? `날짜: ${rawDate}` : '',
      rawWeather ? `날씨: ${rawWeather}` : '',
      `오늘의 감정: ${moodText}`,
      `오늘의 일기:\n${rawContent}`,
    ]
      .filter(Boolean)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: userPrompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          '당신은 감성 일기장 "밤의 조각"의 다정하고 사려 깊은 밤의 동반자입니다. ' +
          '사용자가 작성한 오늘의 일기와 감정, 날씨를 조용히 읽고, 그 하루에 꼭 맞는 따뜻한 위로와 공감의 한마디를 한국어로 건네주세요. ' +
          '분량은 1~2문장(공백 포함 50~130자 내외)으로 간결하면서도 여운이 남게 작성하세요. ' +
          '과장된 격려나 뻔한 조언, 마크다운 기호(*, #, 따옴표 등)나 이모지는 사용하지 말고, 부드러운 해요체로 진심이 느껴지게 말해주세요.',
      },
    });

    const message = (response.text ?? '').trim();
    if (!message) {
      res.status(502).json({ error: '위로의 말을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
      return;
    }

    res.json({ comfortMessage: message });
  } catch (err: unknown) {
    console.error('Gemini comfort generation error:', err);
    const errObj = err as { status?: number; message?: string };
    const status = typeof errObj?.status === 'number' ? errObj.status : 500;

    if (status === 400 || status === 403) {
      res.status(status).json({
        error: 'API 키 인증에 문제가 있습니다. Settings > Secrets 패널에서 GEMINI_API_KEY를 확인해 주세요.',
      });
      return;
    }

    if (status === 429) {
      res.status(429).json({
        error: '요청이 잠시 많습니다. 잠시 후 다시 시도해 주세요.',
      });
      return;
    }

    res.status(500).json({
      error: 'AI 위로 한마디를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    });
  }
});

const ALLOWED_ROOT_FILES = [
  'index.html',
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'metadata.json',
  '.env.example',
  '.gitignore',
  'server.ts',
];

function addDirectoryToZip(zip: JSZip, rootDir: string, currentDir: string) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') {
      continue;
    }
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
      continue;
    }
    const fullPath = path.resolve(currentDir, entry.name);
    if (!fullPath.startsWith(rootDir + path.sep)) {
      continue;
    }
    const relativePath = path.relative(rootDir, fullPath).split(path.sep).join('/');
    if (entry.isDirectory()) {
      addDirectoryToZip(zip, rootDir, fullPath);
    } else if (entry.isFile()) {
      zip.file(relativePath, fs.readFileSync(fullPath));
    }
  }
}

app.get('/api/download-code', async (_req: Request, res: Response) => {
  try {
    const zip = new JSZip();
    const rootDir = path.resolve(__dirname);

    for (const fileName of ALLOWED_ROOT_FILES) {
      const filePath = path.resolve(rootDir, fileName);
      if (filePath.startsWith(rootDir + path.sep) && fs.existsSync(filePath)) {
        zip.file(fileName, fs.readFileSync(filePath));
      }
    }

    const srcDir = path.resolve(rootDir, 'src');
    if (srcDir.startsWith(rootDir + path.sep) && fs.existsSync(srcDir)) {
      addDirectoryToZip(zip, rootDir, srcDir);
    }

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="pieces-of-night-source.zip"');
    res.send(buffer);
  } catch (err) {
    console.error('Source code zip error:', err);
    res.status(500).json({ error: '소스 코드 압축 파일을 생성하지 못했습니다.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
