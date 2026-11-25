import * as Tone from 'tone';
import type { BgmChannel } from '../types';

interface BgmNodes {
  rainNoise: Tone.Noise | null;
  rainFilter: Tone.Filter | null;
  fireNoise: Tone.Noise | null;
  fireFilter: Tone.Filter | null;
  fireLfo: Tone.LFO | null;
  pianoSynth: Tone.PolySynth | null;
  pianoLoop: Tone.Loop | null;
}

const nodes: BgmNodes = {
  rainNoise: null,
  rainFilter: null,
  fireNoise: null,
  fireFilter: null,
  fireLfo: null,
  pianoSynth: null,
  pianoLoop: null,
};

function sliderToDb(val: number, minDb = -36, maxDb = -6): number {
  if (val <= 0) return -60;
  return minDb + (maxDb - minDb) * (val / 100);
}

export async function ensureAudioStarted(): Promise<void> {
  await Tone.start();
}

export function stopBgmChannel(channel: BgmChannel): void {
  if (channel === 'rain') {
    if (nodes.rainNoise) {
      nodes.rainNoise.stop();
      nodes.rainNoise.dispose();
      nodes.rainNoise = null;
    }
    if (nodes.rainFilter) {
      nodes.rainFilter.dispose();
      nodes.rainFilter = null;
    }
  } else if (channel === 'fire') {
    if (nodes.fireLfo) {
      nodes.fireLfo.stop();
      nodes.fireLfo.dispose();
      nodes.fireLfo = null;
    }
    if (nodes.fireNoise) {
      nodes.fireNoise.stop();
      nodes.fireNoise.dispose();
      nodes.fireNoise = null;
    }
    if (nodes.fireFilter) {
      nodes.fireFilter.dispose();
      nodes.fireFilter = null;
    }
  } else if (channel === 'piano') {
    if (nodes.pianoLoop) {
      nodes.pianoLoop.stop();
      nodes.pianoLoop.dispose();
      nodes.pianoLoop = null;
    }
    if (nodes.pianoSynth) {
      nodes.pianoSynth.dispose();
      nodes.pianoSynth = null;
    }
  }
}

export function startBgmChannel(channel: BgmChannel, volume: number): void {
  stopBgmChannel(channel);

  if (channel === 'rain') {
    nodes.rainFilter = new Tone.Filter(650, 'lowpass').toDestination();
    nodes.rainNoise = new Tone.Noise('pink').connect(nodes.rainFilter);
    nodes.rainNoise.volume.value = sliderToDb(volume, -38, -10);
    nodes.rainNoise.start();
  } else if (channel === 'fire') {
    nodes.fireFilter = new Tone.Filter({
      type: 'bandpass',
      frequency: 420,
      Q: 1.4,
    }).toDestination();
    nodes.fireNoise = new Tone.Noise('brown').connect(nodes.fireFilter);
    nodes.fireNoise.volume.value = sliderToDb(volume, -36, -8);
    nodes.fireLfo = new Tone.LFO('3.5hz', 260, 680).connect(nodes.fireFilter.frequency);
    nodes.fireLfo.start();
    nodes.fireNoise.start();
  } else if (channel === 'piano') {
    nodes.pianoSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.4, decay: 1.2, sustain: 0.3, release: 2.5 },
    }).toDestination();
    nodes.pianoSynth.volume.value = sliderToDb(volume, -34, -8);

    const notes = ['C4', 'E4', 'G4', 'B4', 'A4', 'E4', 'F4', 'A4', 'C5', 'G4'];
    let idx = 0;
    nodes.pianoLoop = new Tone.Loop((time) => {
      nodes.pianoSynth?.triggerAttackRelease(notes[idx % notes.length], '2n', time);
      idx++;
    }, '1.4s').start(0);

    const transport = Tone.getTransport();
    if (transport.state !== 'started') {
      transport.start();
    }
  }
}

export function applyBgmChannelVolume(channel: BgmChannel, volume: number): void {
  if (channel === 'rain' && nodes.rainNoise) {
    nodes.rainNoise.volume.value = sliderToDb(volume, -38, -10);
  } else if (channel === 'fire' && nodes.fireNoise) {
    nodes.fireNoise.volume.value = sliderToDb(volume, -36, -8);
  } else if (channel === 'piano' && nodes.pianoSynth) {
    nodes.pianoSynth.volume.value = sliderToDb(volume, -34, -8);
  }
}

export function stopAllBgmChannels(): void {
  stopBgmChannel('rain');
  stopBgmChannel('fire');
  stopBgmChannel('piano');
}
