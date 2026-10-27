// public/js/components/videoEngine.js
// Handles dual video playback, HTML5 Canvas generative fallback, and Web Audio ambient soundscape

export class VideoEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = true;
    this.oscNodes = [];
    this.gainNode = null;
    this.animationFrames = {};
  }

  // Initialize Landing Page Video Hero
  initLandingHero({ videoElementId, canvasElementId, soundButtonId }) {
    const video = document.getElementById(videoElementId);
    const canvas = document.getElementById(canvasElementId);
    const soundBtn = document.getElementById(soundButtonId);

    // Reliable public college campus life & event b-roll video sources
    const videoSources = [
      'https://assets.mixkit.co/videos/preview/mixkit-university-students-in-a-hall-4474-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-group-of-college-students-studying-in-a-hallway-4475-large.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    ];

    if (canvas) {
      this.startCanvasCinematic(canvas, 'landing');
    }

    if (video) {
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.loop = true;

      // Handle video error -> fallback gracefully to generative canvas
      video.addEventListener('error', () => {
        console.log('Video stream offline. Seamlessly utilizing canvas cinematic visualizer.');
        video.style.display = 'none';
        if (canvas) canvas.style.opacity = '1';
      });

      // Try autoplay
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented; canvas fallback is active
          if (canvas) canvas.style.opacity = '1';
        });
      }
    }

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.toggleSound(soundBtn, video);
      });
    }
  }

  // Initialize Dashboard Post-Login Welcome Video Hero
  initDashboardHero({ videoElementId, canvasElementId, soundButtonId }) {
    const video = document.getElementById(videoElementId);
    const canvas = document.getElementById(canvasElementId);
    const soundBtn = document.getElementById(soundButtonId);

    if (canvas) {
      this.startCanvasCinematic(canvas, 'dashboard');
    }

    if (video) {
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.loop = true;

      video.addEventListener('error', () => {
        video.style.display = 'none';
        if (canvas) canvas.style.opacity = '1';
      });

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (canvas) canvas.style.opacity = '1';
        });
      }
    }

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.toggleSound(soundBtn, video);
      });
    }
  }

  // Canvas Cinematic Generator (Fallback + Ambient Background)
  startCanvasCinematic(canvas, mode = 'landing') {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.parentElement.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight || 500);

    const onResize = () => {
      width = canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.offsetHeight || 500;
    };
    window.addEventListener('resize', onResize);

    // Particle nodes
    const particleCount = mode === 'landing' ? 65 : 45;
    const particles = [];
    const colors = ['#8b5cf6', '#3b82f6', '#06b6d4', '#ec4899'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    let t = 0;

    const render = () => {
      t += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Deep celestial gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#070814');
      grad.addColorStop(0.5, '#0b0f2a');
      grad.addColorStop(1, '#08091a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Aurora nebula blobs
      const auroraX1 = width * 0.3 + Math.sin(t) * 100;
      const auroraY1 = height * 0.4 + Math.cos(t * 0.8) * 60;
      const radGrad1 = ctx.createRadialGradient(auroraX1, auroraY1, 10, auroraX1, auroraY1, 280);
      radGrad1.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
      radGrad1.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = radGrad1;
      ctx.fillRect(0, 0, width, height);

      const auroraX2 = width * 0.7 + Math.cos(t * 0.7) * 90;
      const auroraY2 = height * 0.6 + Math.sin(t * 0.9) * 50;
      const radGrad2 = ctx.createRadialGradient(auroraX2, auroraY2, 10, auroraX2, auroraY2, 320);
      radGrad2.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
      radGrad2.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = radGrad2;
      ctx.fillRect(0, 0, width, height);

      // Draw particle constellation
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 110) * 0.18;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }
      }

      this.animationFrames[mode] = requestAnimationFrame(render);
    };

    render();
  }

  // Toggle Sound with Web Audio Synthesizer fallback
  toggleSound(button, videoElement) {
    if (this.isMuted) {
      // Unmute
      this.isMuted = false;
      if (videoElement) {
        videoElement.muted = false;
        videoElement.volume = 0.5;
      }
      this.startAmbientSynth();
      button.innerHTML = `
        <div class="audio-bars">
          <div class="audio-bar"></div>
          <div class="audio-bar"></div>
          <div class="audio-bar"></div>
          <div class="audio-bar"></div>
        </div>
        <span>Mute Audio</span>
      `;
      button.classList.add('active');
    } else {
      // Mute
      this.isMuted = true;
      if (videoElement) {
        videoElement.muted = true;
      }
      this.stopAmbientSynth();
      button.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
        <span>Sound Off</span>
      `;
      button.classList.remove('active');
    }
  }

  // Futuristic Ambient Campus Soundscape Generator via Web Audio API
  startAmbientSynth() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.12, this.audioCtx.currentTime + 2);
      this.gainNode.connect(this.audioCtx.destination);

      // Low pass filter for warm warmth
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, this.audioCtx.currentTime);
      filter.connect(this.gainNode);

      // Harmonious drone frequencies (D Minor 9 chord: D, A, F, C, E)
      const freqs = [146.83, 220.00, 261.63, 329.63];
      this.oscNodes = freqs.map((f, idx) => {
        const osc = this.audioCtx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, this.audioCtx.currentTime);

        const lfo = this.audioCtx.createOscillator();
        lfo.frequency.setValueAtTime(0.1 + idx * 0.05, this.audioCtx.currentTime);
        const lfoGain = this.audioCtx.createGain();
        lfoGain.gain.setValueAtTime(2.5, this.audioCtx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        osc.connect(filter);
        osc.start();
        return osc;
      });
    } catch (e) {
      console.warn('Web Audio Ambient Synth unavailable:', e);
    }
  }

  stopAmbientSynth() {
    if (this.gainNode && this.audioCtx) {
      try {
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.audioCtx.currentTime);
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.5);
        setTimeout(() => {
          this.oscNodes.forEach(o => {
            try { o.stop(); } catch (e) {}
          });
          this.oscNodes = [];
        }, 500);
      } catch (e) {}
    }
  }
}

export const videoEngine = new VideoEngine();
