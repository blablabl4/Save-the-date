// ═══════════════════════════════════════════════
// ALICE IN WONDERLAND — CINEMATIC DESCENT ENGINE
// ═══════════════════════════════════════════════

// Scroll removed in favor of click-based navigation

// Mobile detection
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

// ─── CURSOR ───
const dot = document.getElementById('cursor-dot');
const glow = document.getElementById('cursor-glow');
if (dot && glow) {
    document.addEventListener('mousemove', (e) => {
        dot.style.transform = `translate(${e.clientX - 5}px, ${e.clientY - 5}px)`;
        glow.style.transform = `translate(${e.clientX - 60}px, ${e.clientY - 60}px)`;
    });
}

// ─── BUTTON RIPPLE ───
const enterBtn = document.getElementById('enter-btn');
if (enterBtn) {
    enterBtn.addEventListener('mousemove', (e) => {
        const r = enterBtn.getBoundingClientRect();
        enterBtn.style.setProperty('--ripple-x', ((e.clientX - r.left) / r.width * 100) + '%');
        enterBtn.style.setProperty('--ripple-y', ((e.clientY - r.top) / r.height * 100) + '%');
    });
}

// ─── NEW LOADING & INTRO SEQUENCE ───
let audioPlaying = false; // Global audio state

window.addEventListener('load', () => {
    // Hide everything initially
    gsap.set('.panel', { opacity: 0, scale: 0.2, pointerEvents: 'none' });
    gsap.set('#next-btn', { display: 'none', opacity: 0 });
    
    const music = document.getElementById('bg-music');
    const tl = gsap.timeline();
    
    // Text 1: Atravessar a toca
    tl.to('#intro-text-1', { opacity: 1, duration: 2, ease: "power2.inOut", delay: 0.5 })
      .to('#intro-text-1', { opacity: 0, duration: 1.5, ease: "power2.inOut", delay: 2 })
      
      // Text 2: Aumente o volume
      .to('#intro-text-2', { 
          opacity: 1, duration: 2, ease: "power2.inOut",
          onStart: () => {
              if (music) {
                  music.volume = 0.4;
                  music.play().then(() => { audioPlaying = true; }).catch(() => {});
              }
          }
      })
      .to('#intro-text-2', { opacity: 0, duration: 1.5, ease: "power2.inOut", delay: 2 })
      
      // Show Hat Centered
      .to('#intro-sequence', { display: 'none', duration: 0 })
      .add(() => {
          const btn = document.getElementById('next-btn');
          btn.style.display = 'block';
          btn.classList.add('nav-hat-btn--center'); // Center it
          gsap.to(btn, { opacity: 1, duration: 2 });
      });
});

// ─── THREE.JS SETUP ───
const canvas = document.getElementById('tunnel-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(isMobile ? 1 : Math.min(devicePixelRatio, 2));
scene.fog = new THREE.FogExp2(0x080808, 0.025);

// ─── CINEMATIC LIGHTING ───
const ambientLight = new THREE.AmbientLight(0x111111);
scene.add(ambientLight);

const mainLight = new THREE.PointLight(0xC8A96B, 1.5, 60);
mainLight.position.set(2, 2, 2);
scene.add(mainLight);

const lightingConfigs = [
    { color: 0xC8A96B, intensity: 1.5, fog: 0x080808 }, // Hero: Low intensity gold
    { color: 0x8B1A1A, intensity: 2.0, fog: 0x150505 }, // Rules: Dramatic wine/red
    { color: 0x6B4BCC, intensity: 1.8, fog: 0x0A0515 }, // Universes: Theatrical purple
    { color: 0xC8A96B, intensity: 1.5, fog: 0x080808 }, // Gifts: Gold
    { color: 0xFFFFFF, intensity: 0.8, fog: 0x000000 }, // Countdown: Monochromatic
    { color: 0xC8A96B, intensity: 1.5, fog: 0x080808 }, // RSVP: Gold
    { color: 0xC8A96B, intensity: 1.5, fog: 0x080808 }  // Outro: Gold
];

// ─── PARALLAX LAYERS ───
// Layer 0: Dust (0.3x) — removed on mobile for performance
const dustCount = isMobile ? 0 : 600;
const dustGeom = new THREE.BufferGeometry();
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
    dustPos[i*3] = (Math.random()-0.5)*16; dustPos[i*3+1] = (Math.random()-0.5)*16; dustPos[i*3+2] = -Math.random()*80;
}
dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeom, new THREE.PointsMaterial({ color: 0xC8A96B, size: 0.012, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
scene.add(dust);

// Layer 1: Alice objects — Real image textures (0.6x)
const iconGroup = new THREE.Group();
const texLoader = new THREE.TextureLoader();
const objImages = ['obj_watch.png','obj_key.png','obj_card.png','obj_hat.png'];
const objPerImage = isMobile ? 3 : 6;

objImages.forEach(src => {
    texLoader.load(src, (tex) => {
        for (let i = 0; i < objPerImage; i++) {
            const mat = new THREE.MeshLambertMaterial({ 
                map: tex, transparent: true, opacity: 0.7, 
                side: THREE.DoubleSide
            });
            const size = 0.4 + Math.random() * 0.5;
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
            mesh.position.set((Math.random()-0.5)*12, (Math.random()-0.5)*12, -Math.random()*70);
            mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
            mesh.userData = { speed: 0.6, rotSpeed: 0.002 + Math.random()*0.004 };
            iconGroup.add(mesh);
        }
    });
});
scene.add(iconGroup);

// Layer 2: Foreground sparkles (1.4x) — reduced on mobile
const sparkCount = isMobile ? 60 : 200;
const sparkGeom = new THREE.BufferGeometry();
const sparkPos = new Float32Array(sparkCount * 3);
for (let i = 0; i < sparkCount; i++) {
    sparkPos[i*3] = (Math.random()-0.5)*8; sparkPos[i*3+1] = (Math.random()-0.5)*8; sparkPos[i*3+2] = -Math.random()*30;
}
sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
const sparks = new THREE.Points(sparkGeom, new THREE.PointsMaterial({ color: 0xF3F1EA, size: 0.02, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
scene.add(sparks);

camera.position.z = 5;

// ─── TUNNEL BREATHING ───
let scrollProgress = 0, scrollVelocity = 0;

let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.01;
    const pulse = Math.sin(time * 1.5) * 0.12;
    
    // Animate light position slightly
    mainLight.position.x = 2 + Math.sin(time) * 1.5;
    mainLight.position.y = 2 + Math.cos(time * 0.8) * 1.5;

    // Parallax: dust 0.3x
    if (!isMobile) {
        const dp = dust.geometry.attributes.position.array;
        for (let i = 0; i < dustCount; i++) {
            dp[i*3+2] += 0.02;
            if (dp[i*3+2] > camera.position.z + 5) dp[i*3+2] -= 80;
        }
        dust.geometry.attributes.position.needsUpdate = true;
    }

    // Parallax: icons 0.6x
    iconGroup.children.forEach(m => {
        m.rotation.x += m.userData.rotSpeed;
        m.rotation.y += m.userData.rotSpeed * 0.7;
        m.position.z += 0.04;
        if (m.position.z > camera.position.z + 5) m.position.z -= 70;
    });

    // Parallax: sparks 1.4x
    const sp = sparks.geometry.attributes.position.array;
    for (let i = 0; i < sparkCount; i++) {
        sp[i*3+2] += 0.06;
        if (sp[i*3+2] > camera.position.z + 3) sp[i*3+2] -= 30;
    }
    sparks.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}
animate();

// ─── CLICK-BASED CINEMATIC DESCENT ───
const panels = document.querySelectorAll('.panel');
const totalPanels = panels.length;
let currentPanelIndex = 0;
let isAnimating = false;

const nextBtn = document.getElementById('next-btn');
document.getElementById('panels-wrapper').style.cssText = 'position:fixed;inset:0;overflow:hidden;';

function goToPanel(index) {
    if (isAnimating || index >= totalPanels || index < 0) return;
    isAnimating = true;

    const currentPanel = panels[currentPanelIndex];
    const nextPanel = panels[index];

    // Fade out current panel
    gsap.to(currentPanel, {
        scale: 4, opacity: 0, duration: 1.0, ease: "power2.in",
        onComplete: () => currentPanel.classList.remove('is-active')
    });

    // Dynamic Lighting Transition
    const targetLight = lightingConfigs[index];
    if (targetLight) {
        gsap.to(mainLight.color, { r: (targetLight.color >> 16 & 255)/255, g: (targetLight.color >> 8 & 255)/255, b: (targetLight.color & 255)/255, duration: 2 });
        gsap.to(mainLight, { intensity: targetLight.intensity, duration: 2 });
        gsap.to(scene.fog.color, { r: (targetLight.fog >> 16 & 255)/255, g: (targetLight.fog >> 8 & 255)/255, b: (targetLight.fog & 255)/255, duration: 2 });
    }

    // Move camera deeper
    const targetZ = 5 - (index * 12); // Move 12 units per section
    gsap.to(camera.position, { z: targetZ, duration: 1.8, ease: "power2.inOut" });
    gsap.to(camera.rotation, { 
        z: Math.sin(index * Math.PI) * 0.12, 
        x: Math.sin(index * 2) * 0.05, 
        duration: 1.8, ease: "power2.inOut" 
    });

    // Fade in spiral if leaving hero
    if (index > 0 && currentPanelIndex === 0) {
        gsap.to('#spiral-bg', { opacity: 1, duration: 2 });
    }

    // Fade in next panel
    gsap.fromTo(nextPanel, 
        { scale: 0.15, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 1.2, delay: 0.6, ease: "power2.out",
          onStart: () => {
              nextPanel.classList.add('is-active');
              
              // Stagger modal contents
              const modal = nextPanel.querySelector('.glass-modal');
              if (modal) {
                  const items = modal.querySelectorAll('.suit-floating, .gift-floating, .btn-studio, .movie-card, .timer__block, .form-group, .btn-submit, .rules__title, .universes__title, .gifts__title, .countdown__title, .rsvp__title, .gifts__sub');
                  if (items.length > 0) {
                      gsap.fromTo(items, 
                          { y: 40, opacity: 0 }, 
                          { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power2.out", delay: 0.8 }
                      );
                  }
              }

              // WOW Effects & Audio
              if (index === 4) { // Countdown
                  document.getElementById('panel-countdown').setAttribute('data-wow','active');
                  if (typeof audioPlaying !== 'undefined' && audioPlaying && bgMusic) {
                      gsap.to(bgMusic, { playbackRate: 0.8, volume: 0.4, duration: 2 });
                  }
              } else {
                  document.getElementById('panel-countdown').removeAttribute('data-wow');
                  if (typeof audioPlaying !== 'undefined' && audioPlaying && bgMusic) {
                      gsap.to(bgMusic, { playbackRate: 1.0, volume: 1.0, duration: 2 });
                  }
              }

              if (index === 5) { // Outro
                  const box = document.getElementById('card-explosion');
                  if (box && box.children.length === 0) { // once
                      for (let i = 0; i < 20; i++) {
                          const c = document.createElement('div');
                          c.textContent = ['♠','♥','♦','♣'][i%4];
                          c.style.cssText = `position:absolute;font-size:${1.5+Math.random()*2}rem;color:${i%2===0?'var(--gold)':'var(--suit-red)'};opacity:0;left:50%;top:50%;pointer-events:none;`;
                          box.appendChild(c);
                          gsap.to(c, { x: (Math.random()-0.5)*600, y: (Math.random()-0.5)*400, rotation: Math.random()*720-360, opacity: 0.6, duration: 2+Math.random(), ease: "power2.out" });
                          gsap.to(c, { opacity: 0, duration: 1, delay: 2+Math.random() });
                      }
                  }
              }
          },
          onComplete: () => {
              currentPanelIndex = index;
              isAnimating = false;
              // Hide button if last panel
              if (currentPanelIndex === totalPanels - 1) {
                  gsap.to(nextBtn, { opacity: 0, duration: 0.5, onComplete: () => nextBtn.style.display = 'none' });
              }
          }
        }
    );
}

// WOW #1 (Reality Warp) is now handled directly by the first hat click.

// Hat button logic (Living entity)
nextBtn.addEventListener('mousemove', (e) => {
    const r = nextBtn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) * 0.1;
    const dy = (e.clientY - cy) * 0.1;
    gsap.to(nextBtn, { x: dx, y: dy, rotation: dx * 0.5, duration: 0.3 });
});
nextBtn.addEventListener('mouseleave', () => {
    gsap.to(nextBtn, { x: 0, y: 0, rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
});

nextBtn.addEventListener('click', () => {
    // If it's the first click (centered)
    if (nextBtn.classList.contains('nav-hat-btn--center')) {
        const music = document.getElementById('bg-music');
        if (music && typeof audioPlaying !== 'undefined' && !audioPlaying) {
            music.play().then(() => { audioPlaying = true; }).catch(() => {});
        }
        
        // Remove center class so it goes to bottom right
        nextBtn.classList.remove('nav-hat-btn--center');
        
        // Trigger dive
        gsap.to(camera.position, { z: 5, duration: 2, ease: "power2.inOut" }); 
        
        // Show spiral and spin fast
        gsap.to('#spiral-bg', { opacity: 1, duration: 2 });
        
        // Teleport/glitch feedback on button
        gsap.fromTo(nextBtn, 
            { scale: 0.5, filter: "blur(10px) brightness(2)" }, 
            { scale: 1, filter: "blur(0px) brightness(1)", duration: 0.6, ease: "back.out(2)" }
        );
        
        // Go to panel 1 (Rules)
        goToPanel(1);
    } else {
        // Normal navigation
        gsap.fromTo(nextBtn, 
            { scale: 0.5, filter: "blur(10px) brightness(2)" }, 
            { scale: 1, filter: "blur(0px) brightness(1)", duration: 0.6, ease: "back.out(2)" }
        );
        goToPanel(currentPanelIndex + 1);
    }
});

// ─── COUNTDOWN WITH EMOTIONAL GLITCH ───
const eventDate = new Date('2026-06-21T16:00:00').getTime();
let prevMin = '';
function updateCountdown() {
    const d = eventDate - Date.now();
    if (d < 0) return;
    const days = String(Math.floor(d/86400000)).padStart(2,'0');
    const hrs = String(Math.floor((d%86400000)/3600000)).padStart(2,'0');
    const mins = String(Math.floor((d%3600000)/60000)).padStart(2,'0');
    
    document.getElementById('days').textContent = days;
    document.getElementById('hours').textContent = hrs;
    const mEl = document.getElementById('minutes');
    if (mins !== prevMin) {
        mEl.classList.add('glitch');
        setTimeout(() => mEl.classList.remove('glitch'), 350);
        prevMin = mins;
    }
    mEl.textContent = mins;

    // Emotional scale (distortion when < 10 days)
    if (d < 864000000) { // 10 days
        const watch = document.getElementById('pocket-watch');
        if (watch) watch.style.filter = "drop-shadow(0 0 15px rgba(139, 26, 26, 0.4)) contrast(1.2)";
    }
}
setInterval(updateCountdown, 1000);
updateCountdown();


// ─── UNIVERSES ───
const movieData = {
    disney: ["Frozen","Tangled","Moana","The Little Mermaid","Beauty and the Beast","Cinderella","Aladdin","Encanto"],
    dreamworks: ["Shrek","Kung Fu Panda","How to Train Your Dragon","Madagascar","Megamind","Trolls","Puss in Boots","The Bad Guys"],
    marvel: ["Wanda Maximoff","Loki","Spider-Man","Doctor Strange","Black Panther","Thor","Iron Man","Deadpool"]
};

document.querySelectorAll('.btn-studio').forEach(btn => {
    btn.addEventListener('click', () => {
        const studio = btn.dataset.studio;
        const grid = document.getElementById('movies-grid');
        grid.innerHTML = '';
        document.querySelectorAll('.btn-studio').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        movieData[studio].forEach((name, i) => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.style.opacity = '0';
            card.innerHTML = `<div class="movie-card__name font-display">${name}</div>`;
            grid.appendChild(card);
            gsap.to(card, { opacity: 1, y: 0, duration: 0.5, delay: i*0.06, ease: "power2.out" });
        });
        gsap.to(grid, { opacity: 1, y: 0, duration: 0.5 });
    });
});

// ─── RSVP ───
document.getElementById('rsvp-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-submit');
    btn.textContent = 'Seu nome foi adicionado!';
    btn.style.background = 'var(--wine)'; btn.style.color = 'var(--white)';
    gsap.to(e.target, { opacity: 0.5, pointerEvents: 'none', duration: 1 });
});

// ─── AMBIENT AUDIO & BG MUSIC ───
let audioCtx, audioPlaying = false;
const bgMusic = document.getElementById('bg-music');

document.getElementById('audio-toggle').addEventListener('click', () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    if (audioPlaying) {
        if (audioCtx.state === 'running') audioCtx.suspend();
        if (bgMusic) bgMusic.pause();
        audioPlaying = false;
        document.getElementById('audio-toggle').textContent = '♪';
        return;
    }

    audioCtx.resume();
    if (bgMusic) {
        bgMusic.play().catch(e => console.log("Audio play blocked by browser. Interaction required."));
    }

    // Procedural Ticking (Ambient)
    const tick = () => {
        if (!audioPlaying) return;
        const osc = audioCtx.createOscillator(); 
        const gain = audioCtx.createGain();
        osc.type = 'sine'; 
        osc.frequency.value = 800 + Math.random()*200;
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(); 
        osc.stop(audioCtx.currentTime + 0.08);
        setTimeout(tick, 1000 + Math.random()*500);
    };

    // Procedural Wind (Ambient)
    const bufSize = audioCtx.sampleRate * 2;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random()*2-1)*0.01;
    const wind = audioCtx.createBufferSource(); 
    wind.buffer = buf; 
    wind.loop = true;
    const filt = audioCtx.createBiquadFilter(); 
    filt.type = 'lowpass'; 
    filt.frequency.value = 250;
    wind.connect(filt).connect(audioCtx.destination); 
    wind.start();

    audioPlaying = true; 
    document.getElementById('audio-toggle').textContent = '🔇';
    tick();
});

// ─── RESIZE ───
window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
