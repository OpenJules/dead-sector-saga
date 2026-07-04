export class AudioEngine {
  private ctx: AudioContext;
  private mainGain: GainNode;
  private musicGain: GainNode;
  private currentMusic: {
    osc: OscillatorNode[],
    gain: GainNode,
    interval: ReturnType<typeof setInterval> | null
  } | null = null;

  constructor() {
    if (typeof window === "undefined") {
      this.ctx = {} as any;
      this.mainGain = {} as any;
      this.musicGain = {} as any;
      return;
    }
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.mainGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    
    this.mainGain.connect(this.ctx.destination);
    this.musicGain.connect(this.mainGain);
    this.musicGain.gain.value = 0.3;
  }

  async resume() {
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  // --- Sound Effects ---

  playShoot(type: string) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "square";
    const freq = type === "plasma" ? 150 : type === "rifle" ? 400 : 200;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.mainGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playHit() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.mainGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playHurt() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.mainGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playInteract() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.mainGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // --- Procedural Music ---

  playMusic(track: "main" | "boss" | "ambient") {
    if (this.currentMusic && this.currentMusic.interval) {
      clearInterval(this.currentMusic.interval);
    }
    if (this.currentMusic?.osc) {
      this.currentMusic.osc.forEach(o => o.stop());
    }

    const musicGain = this.ctx.createGain();
    musicGain.connect(this.musicGain);
    musicGain.gain.value = 0.2;

    let sequence: number[][] = [];
    let tempo = 0.25;

    if (track === "main") {
      sequence = [[110, 130], [110, 150], [110, 130], [160, 140]]; // Simple bass loop
      tempo = 0.2;
    } else if (track === "boss") {
      sequence = [[80, 82], [80, 82], [60, 62], [40, 42]]; // Aggressive dark loop
      tempo = 0.15;
    } else {
      sequence = [[220, 240], [220, 200], [220, 240], [200, 180]]; // Eerie ambient
      tempo = 0.4;
    }

    let step = 0;
    const interval = setInterval(() => {
      const notes = sequence[step % sequence.length];
      const osc = this.ctx.createOscillator();
      osc.type = track === "boss" ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(notes[0], this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(notes[1], this.ctx.currentTime + tempo);
      
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.1, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + tempo);
      
      osc.connect(g);
      g.connect(musicGain);
      
      osc.start();
      osc.stop(this.ctx.currentTime + tempo);
      step++;
    }, tempo * 1000);

    this.currentMusic = { osc: [], gain: musicGain, interval };
  }

  stopMusic() {
    if (this.currentMusic?.interval) {
      clearInterval(this.currentMusic.interval);
      this.currentMusic = null;
    }
  }
}

export const audio = new AudioEngine();
