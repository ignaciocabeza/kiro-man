/// <reference types="vite/client" />

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module 'zzfx' {
  export function zzfx(...args: (number | undefined)[]): AudioBufferSourceNode;
  export let zzfxV: number;
  export let zzfxX: AudioContext;
}
