'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type OBSStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function OBSControl() {
  const [expanded, setExpanded] = useState(false);
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState('4455');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<OBSStatus>('disconnected');
  const [errorMsg, setErrorMsg] = useState('');
  const [scenes, setScenes] = useState<string[]>([]);
  const [currentScene, setCurrentScene] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLocalhost(
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.')
      );
    }
  }, []);

  const obsRef = useRef<InstanceType<typeof import('obs-websocket-js').OBSWebSocket> | null>(null);

  const disconnect = useCallback(async () => {
    try {
      const obs = obsRef.current;
      if (obs) {
        await obs.disconnect();
      }
      obsRef.current = null;
    } catch {
      // ignore
    }
    setStatus('disconnected');
    setScenes([]);
    setCurrentScene('');
    setStreaming(false);
    setErrorMsg('');
  }, []);

  async function connect() {
    if (!isLocalhost) {
      setErrorMsg('OBS control works only when running locally (npm run dev).');
      setStatus('error');
      return;
    }
    setStatus('connecting');
    setErrorMsg('');
    try {
      const { OBSWebSocket } = await import('obs-websocket-js');
      const obs = new OBSWebSocket();
      obsRef.current = obs;
      await obs.connect(`ws://${host}:${port}`, password || undefined);
      setStatus('connected');

      const sceneRes = await obs.call('GetSceneList') as unknown as { scenes?: { sceneName: string }[] };
      const sceneList = sceneRes.scenes ?? [];
      setScenes(sceneList.map((s) => s.sceneName));

      const currentRes = await obs.call('GetCurrentProgramScene') as unknown as { currentProgramSceneName?: string };
      setCurrentScene(currentRes.currentProgramSceneName ?? sceneList[0]?.sceneName ?? '');

      const streamRes = await obs.call('GetStreamStatus') as unknown as { outputActive?: boolean };
      const outputActive = streamRes.outputActive ?? false;
      setStreaming(!!outputActive);

      obs.on('ConnectionClosed', () => {
        setStatus('disconnected');
        setScenes([]);
      });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Connection failed');
    }
  }

  async function handleDisconnect() {
    await disconnect();
  }

  async function handleStartStream() {
    try {
      const obs = obsRef.current;
      if (obs) {
        await obs.call('StartStream');
        setStreaming(true);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to start stream');
    }
  }

  async function handleStopStream() {
    try {
      const obs = obsRef.current;
      if (obs) {
        await obs.call('StopStream');
        setStreaming(false);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to stop stream');
    }
  }

  async function handleSetScene(sceneName: string) {
    try {
      const obs = obsRef.current;
      if (obs) {
        await obs.call('SetCurrentProgramScene', { sceneName });
        setCurrentScene(sceneName);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to switch scene');
    }
  }

  return (
    <div className="rounded-xl border border-border bg-panel overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition"
      >
        <h2 className="font-semibold text-text-primary">OBS Control</h2>
        {expanded ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
      </button>
      {expanded && (
        <div className="px-6 pb-6 pt-0 border-t border-border">
          {!isLocalhost && (
            <p className="text-amber-500 text-sm mb-4">
              OBS control works only when running locally (npm run dev). Hosted sites cannot reach your OBS.
            </p>
          )}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">Host</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-32 px-3 py-2 rounded-lg bg-panel border border-border text-text-primary text-sm"
                  placeholder="127.0.0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Port</label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-20 px-3 py-2 rounded-lg bg-panel border border-border text-text-primary text-sm"
                  placeholder="4455"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Password (optional)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-32 px-3 py-2 rounded-lg bg-panel border border-border text-text-primary text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(status === 'disconnected' || status === 'error' || status === 'connecting') ? (
                <button
                  type="button"
                  onClick={connect}
                  disabled={status === 'connecting'}
                  className="px-4 py-2 rounded-lg bg-accent text-white font-medium text-sm disabled:opacity-50"
                >
                  {status === 'connecting' ? 'Connecting...' : 'Connect'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary text-sm"
                >
                  Disconnect
                </button>
              )}
              <span className={`text-sm ${status === 'connected' ? 'text-green-500' : status === 'error' ? 'text-red-500' : 'text-text-muted'}`}>
                {status === 'connected' && 'Connected'}
                {status === 'error' && errorMsg}
                {status === 'disconnected' && 'Disconnected'}
              </span>
            </div>
            {status === 'connected' && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleStartStream}
                    disabled={streaming}
                    className="px-3 py-1.5 rounded bg-green-600/80 text-white text-sm font-medium disabled:opacity-50"
                  >
                    Start Stream
                  </button>
                  <button
                    type="button"
                    onClick={handleStopStream}
                    disabled={!streaming}
                    className="px-3 py-1.5 rounded bg-red-600/80 text-white text-sm font-medium disabled:opacity-50"
                  >
                    Stop Stream
                  </button>
                </div>
                {scenes.length > 0 && (
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Scene</label>
                    <select
                      value={currentScene}
                      onChange={(e) => handleSetScene(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-panel border border-border text-text-primary text-sm"
                    >
                      {scenes.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-text-muted text-sm mb-2">Setup: OBS → Tools → obs-websocket Settings → Enable WebSocket server (port {port}).</p>
            <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
              <li><strong>YouTube:</strong> OBS → Settings → Stream → Service: YouTube Live.</li>
              <li><strong>Cloud:</strong> Use Mux, LiveKit, etc. – RTMP URL in OBS, playback URL in ButtonMasherz.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
