/**
 * Combine YouTube clips API for Cloud Run.
 * POST /combine { urls: string[], title: string, userId: string }
 * Returns { reelId, combinedVideoUrl } or error.
 */

import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = String(url).trim().match(re);
    if (m) return m[1];
  }
  return null;
}

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: 'pipe', shell: true });
    let stderr = '';
    proc.stderr?.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${stderr}`))
    );
    proc.on('error', reject);
  });
}

async function downloadWithYtDlp(url, outDir, index) {
  const outPath = path.join(outDir, `clip_${index}.mp4`);
  await run('yt-dlp', [
    '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    '-o', outPath,
    '--no-playlist',
    '--no-warnings',
    url,
  ], outDir);
  if (!fs.existsSync(outPath)) throw new Error(`yt-dlp did not produce clip_${index}.mp4`);
  return outPath;
}

async function concatWithFfmpeg(files, outPath) {
  const dir = path.dirname(outPath);
  const listPath = path.join(dir, 'list.txt');
  const listContent = files.map((f) => `file '${path.basename(f)}'`).join('\n');
  fs.writeFileSync(listPath, listContent);
  await run('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outPath,
  ], dir);
}

app.post('/combine', async (req, res) => {
  try {
    const { urls = [], title = '', userId = '' } = req.body;
    if (!Array.isArray(urls) || urls.length < 2 || urls.length > 8) {
      return res.status(400).json({ error: 'Need 2-8 YouTube URLs' });
    }
    if (!title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const validUrls = urls.map((u) => String(u).trim()).filter((u) => extractYouTubeId(u));
    if (validUrls.length < 2) {
      return res.status(400).json({ error: 'At least 2 valid YouTube URLs required' });
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'combine-'));
    try {
      const files = [];
      for (let i = 0; i < validUrls.length; i++) {
        const p = await downloadWithYtDlp(validUrls[i], tmpDir, i);
        files.push(p);
      }

      const outPath = path.join(tmpDir, 'combined.mp4');
      await concatWithFfmpeg(files, outPath);

      const combinedBuffer = fs.readFileSync(outPath);

      // For now: upload to Supabase storage (no YouTube API in MVP - user can add later)
      let combinedVideoUrl = null;
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const storagePath = `${userId}/${crypto.randomUUID()}.mp4`;
        const { error: uploadErr } = await supabase.storage
          .from('videos')
          .upload(storagePath, combinedBuffer, { contentType: 'video/mp4', upsert: false });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('videos').getPublicUrl(storagePath);
          combinedVideoUrl = urlData.publicUrl;
        }
      }

      if (!combinedVideoUrl) {
        return res.status(500).json({
          error: 'Upload failed. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
        });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const clipIds = [];
      for (const u of validUrls) {
        const { data: clip } = await supabase
          .from('clips')
          .insert({
            user_id: userId,
            source_type: 'youtube',
            url_or_path: u,
            start_sec: 0,
            end_sec: null,
          })
          .select('id')
          .single();
        if (clip) clipIds.push(clip.id);
      }

      const { data: reel, error: reelErr } = await supabase
        .from('reels')
        .insert({
          user_id: userId,
          title: title.trim(),
          clip_ids: clipIds,
          combined_video_url: combinedVideoUrl,
        })
        .select('id')
        .single();

      if (reelErr) throw reelErr;

      return res.json({
        reelId: reel.id,
        combinedVideoUrl,
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error('Combine error:', err);
    return res.status(500).json({
      error: err.message || 'Combine failed',
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Combine service listening on ${PORT}`);
});
