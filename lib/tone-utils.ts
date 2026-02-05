import * as Tone from 'tone';

export interface MusicNote {
  note: string;
  duration: string;
  time: string;
}

export interface InstrumentTrack {
  instrument: string;
  notes: MusicNote[];
  volume?: number;
}

export interface MusicComposition {
  bpm: number;
  tracks: InstrumentTrack[];
  duration: number;
}

const INSTRUMENT_MAP: Record<string, any> = {
  synth: Tone.Synth,
  amsynth: Tone.AMSynth,
  fmsynth: Tone.FMSynth,
  duosynth: Tone.DuoSynth,
  membrane: Tone.MembraneSynth,
  metal: Tone.MetalSynth,
  pluck: Tone.PluckSynth,
  piano: Tone.Sampler,
};

export async function createMusicFromJSON(composition: MusicComposition): Promise<Blob> {
  await Tone.start();
  
  Tone.getTransport().bpm.value = composition.bpm;
  
  const synths: Tone.Synth[] = [];
  
  composition.tracks.forEach((track) => {
    const InstrumentClass = INSTRUMENT_MAP[track.instrument.toLowerCase()] || Tone.Synth;
    const synth = new InstrumentClass().toDestination();
    
    if (track.volume !== undefined) {
      synth.volume.value = track.volume;
    }
    
    const part = new Tone.Part((time, note) => {
      synth.triggerAttackRelease(note.note, note.duration, time);
    }, track.notes.map(n => [n.time, n]));
    
    part.start(0);
    synths.push(synth);
  });
  
  const recorder = new Tone.Recorder();
  Tone.getDestination().connect(recorder);
  
  recorder.start();
  Tone.getTransport().start();
  
  await new Promise(resolve => setTimeout(resolve, (composition.duration + 1) * 1000));
  
  Tone.getTransport().stop();
  const recording = await recorder.stop();
  
  synths.forEach(synth => synth.dispose());
  
  return recording;
}

export function downloadAudio(blob: Blob, filename: string = 'music.webm') {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = url;
  anchor.click();
  URL.revokeObjectURL(url);
}
