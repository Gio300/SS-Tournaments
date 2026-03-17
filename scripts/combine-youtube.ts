/**
 * Combine 2-8 YouTube clips via yt-dlp + FFmpeg.
 * Optionally upload to YouTube via API.
 *
 * Usage:
 *   tsx scripts/combine-youtube.ts --urls "url1" "url2" ... --title "My Reel"
 *   Or: echo '{"urls":["url1","url2"],"title":"My Reel"}' | tsx scripts/combine-youtube.ts
 *
 * Env: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN (optional for upload)
 */

import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { createInterface } from 'readline'

const MIN_CLIPS = 2
const MAX_CLIPS = 8

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const re of patterns) {
    const m = url.trim().match(re)
    if (m) return m[1]
  }
  return null
}

function run(cmd: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true })
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
    proc.on('error', reject)
  })
}

async function downloadWithYtDlp(url: string, outDir: string, index: number): Promise<string> {
  const outPath = path.join(outDir, `clip_${index}.mp4`)
  const args = [
    '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    '-o', outPath,
    '--no-playlist',
    '--no-warnings',
    url,
  ]
  await run('yt-dlp', args, outDir)
  if (!fs.existsSync(outPath)) {
    throw new Error(`yt-dlp did not produce ${outPath}`)
  }
  return outPath
}

async function concatWithFfmpeg(files: string[], outPath: string): Promise<void> {
  const listPath = path.join(path.dirname(outPath), 'list.txt')
  const listContent = files.map((f) => `file '${path.basename(f)}'`).join('\n')
  fs.writeFileSync(listPath, listContent)
  await run('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-c', 'copy',
    outPath,
  ], path.dirname(outPath))
}

async function main() {
  let urls: string[] = []
  let title = 'Combined Reel'

  const args = process.argv.slice(2)
  const urlIdx = args.indexOf('--urls')
  if (urlIdx >= 0) {
    const after = args.slice(urlIdx + 1)
    const endIdx = after.findIndex((a) => a.startsWith('--'))
    urls = (endIdx >= 0 ? after.slice(0, endIdx) : after).filter((a) => a.startsWith('http') || a.includes('youtube') || a.includes('youtu.be'))
    const titleIdx = args.indexOf('--title')
    if (titleIdx >= 0 && args[titleIdx + 1]) title = args[titleIdx + 1]
  } else if (process.stdin.isTTY === false) {
    const rl = createInterface({ input: process.stdin })
    let input = ''
    for await (const line of rl) input += line
    try {
      const json = JSON.parse(input)
      urls = json.urls || []
      if (json.title) title = json.title
    } catch {
      console.error('Invalid JSON stdin')
      process.exit(1)
    }
  }

  const validUrls = urls.map((u) => u.trim()).filter((u) => extractYouTubeId(u))
  if (validUrls.length < MIN_CLIPS || validUrls.length > MAX_CLIPS) {
    console.error(`Need ${MIN_CLIPS}-${MAX_CLIPS} valid YouTube URLs, got ${validUrls.length}`)
    process.exit(1)
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'combine-'))
  try {
    console.log('Downloading clips...')
    const files: string[] = []
    for (let i = 0; i < validUrls.length; i++) {
      const p = await downloadWithYtDlp(validUrls[i], tmpDir, i)
      files.push(p)
    }

    const outPath = path.join(tmpDir, 'combined.mp4')
    console.log('Combining with FFmpeg...')
    await concatWithFfmpeg(files, outPath)

    console.log('Done:', outPath)
    console.log(JSON.stringify({ outputPath: outPath, title }))
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
