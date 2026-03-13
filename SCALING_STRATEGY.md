# Scaling Strategy: Keep It Free as You Grow

## Your System (Scan Results)

| Resource | Value |
|----------|-------|
| **RAM** | ~191 GB (131 GB available) |
| **CPU** | AMD Ryzen (Zen 5) ~4.7 GHz |
| **GPU** | 2× NVIDIA RTX A5000 (24GB VRAM each = 48GB total) |
| **Ollama** | Installed at `AppData\Local\Programs\Ollama` |
| **Docker** | Docker Desktop WSL distro present (may need to add to PATH) |
| **Tailscale** | Installed – can expose local services to the internet |

**Bottom line:** Your machine can run Llama 3.2 Vision and ComfyUI locally with plenty of headroom. This is your main cost advantage.

---

## Why Docker Does NOT Give You More Cloudflare Neurons

- Cloudflare Workers AI free tier is **per Cloudflare account**, not per container or process.
- One account = 10,000 neurons/day, regardless of how many Docker containers you run.
- Creating multiple Cloudflare accounts to bypass limits violates ToS and risks bans.
- Docker cannot multiply Cloudflare’s free tier.

---

## What Docker CAN Do

1. **Run Ollama in a container** – portable, easy to move to a server later.
2. **Run multiple models** – e.g. one container for Llama Vision, one for a smaller model.
3. **Isolate environments** – ComfyUI, Ollama, and your app in separate containers.

Docker does not increase Cloudflare neurons; it helps you run and manage your own AI stack.

---

## Strategy: Stay Free as You Scale

### Phase 1: Cloudflare Only (Current)

- Use Cloudflare Workers AI for Rules Bot + Director.
- Free tier: 10k neurons/day.
- When exceeded: fall back to keyword matching (no extra cost).
- **Cost:** $0.

### Phase 2: Add Ollama as Primary (Your PC)

- Run Ollama with Llama 3.2 Vision on your machine.
- Route AI requests to Ollama when your PC is on; use Cloudflare when it’s off.
- Your hardware: 48GB VRAM can handle many concurrent vision requests.
- **Cost:** $0 (your electricity).

**Exposure options:**

- **Tailscale:** Expose Ollama only to your app server or trusted IPs.
- **ngrok:** Temporary public URL for testing.
- **VPS reverse proxy:** Your PC → Tailscale → VPS → public internet (more setup).

### Phase 3: Per-User Metering + Paid Overage

- Track usage per user in Supabase (e.g. `ai_calls_today`, `ai_calls_limit`).
- Free tier: e.g. 20 Rules Bot + 10 Director polls per user per day.
- When over: block or offer a paid tier (Stripe).
- You pay Cloudflare (or use Ollama) and charge users a markup.

**Example:**

- Free: 20 calls/day.
- Paid: $5/mo for 500 calls/day.
- Your cost: ~$0.50 in neurons for 500 calls → margin ~$4.50.

### Phase 4: Move Heavy Load to Your Hardware

- Run Ollama (and optionally ComfyUI) on your PC or a home server.
- Use Cloudflare only when:
  - Your machine is off.
  - You want redundancy.
  - You need edge latency.
- **Cost:** $0 for inference; only power and optional VPS for exposure.

---

## Recommended Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           Your Next.js App               │
                    │     (GitHub Pages / Vercel / etc.)        │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │         AI Router (Backend/Proxy)       │
                    │  - Track per-user usage                 │
                    │  - Enforce free tier limits             │
                    │  - Route to Ollama or Cloudflare        │
                    └─────┬───────────────────────┬───────────┘
                          │                       │
                          │ (PC on)               │ (PC off / overflow)
                          ▼                       ▼
                    ┌─────────────┐         ┌─────────────────┐
                    │   Ollama    │         │ Cloudflare      │
                    │ (Your PC)   │         │ Workers AI      │
                    │ $0          │         │ 10k neurons/day │
                    └─────────────┘         └─────────────────┘
```

---

## Immediate Next Steps

1. **Add Ollama to PATH** (if needed):
   ```powershell
   # Add to PATH: C:\Users\Flying Phoenix PCs\AppData\Local\Programs\Ollama
   ```

2. **Pull Llama Vision:**
   ```powershell
   ollama pull llama3.2-vision
   ```

3. **Expose Ollama via Tailscale:**
   - Enable Tailscale Serve for the Ollama port (e.g. 11434).
   - Your app can call `http://100.115.39.102:11434` from a server that’s on the same Tailscale network.

4. **Install Docker Desktop** (optional): If Docker isn’t in PATH, install or repair Docker Desktop. Use it later for Ollama/ComfyUI when you move to a server.

5. **Add usage tracking:** Add a `user_ai_usage` table in Supabase to count calls per user per day and enforce limits.

---

## Cost Summary

| Approach | Monthly Cost | Scale |
|----------|--------------|-------|
| Cloudflare only | $0 | ~300–400 AI calls/day |
| Ollama on your PC | $0 | Thousands of calls/day |
| Cloudflare + Ollama hybrid | $0 | Best of both |
| VPS + Ollama (GPU) | $50–100 | Always-on, no home PC needed |

---

## Summary

- Docker does not give you more Cloudflare neurons.
- Your PC (RTX A5000s, 191GB RAM) is ideal for running Ollama and ComfyUI locally.
- Use Ollama as primary AI backend when your PC is on; use Cloudflare as fallback.
- Add per-user metering and a paid tier when users exceed free limits.
- Tailscale can expose Ollama to your app without opening your home network to the public.
