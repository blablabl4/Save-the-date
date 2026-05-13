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

// ─── LOADING SEQUENCE ───
window.addEventListener('load', () => {
    const tl = gsap.timeline();
    tl.to('#loader-text', { opacity: 0, duration: 0.8, delay: 1 })
      .to('#psyche-bg', { opacity: 0.5, duration: 2, ease: "power2.inOut" }, "-=0.3")
      .to('#loader-phrase', { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.5, ease: "power3.out" }, "-=1")
      .to('#loader-phrase', { skewX: 8, duration: 0.06, repeat: 5, yoyo: true }, "+=0.6")
      .to('#loader', { opacity: 0, duration: 1.2, ease: "expo.inOut",
          onComplete: () => {
              document.getElementById('loader').style.display = 'none';
              // Auto-play background music
              const music = document.getElementById('bg-music');
              if (music) {
                  music.volume = 0.4;
                  music.play().catch(() => {
                      // Browser blocked autoplay — will play on first click
                      document.addEventListener('click', function playOnce() {
                          music.play();
                          document.removeEventListener('click', playOnce);
                      }, { once: true });
                  });
              }
          }
      }, "+=0.5")
      .from('.hero__line span', { y: '100%', duration: 1.2, stagger: 0.2, ease: "expo.out" }, "-=0.5")
      .to('#hero-sub', { opacity: 1, duration: 0.8 }, "-=0.5")
      .to('#enter-btn', { opacity: 1, duration: 0.8 }, "-=0.4");
});
setTimeout(() => {
    const l = document.getElementById('loader');
    if (l && l.style.display !== 'none') {
        gsap.to(l, { opacity: 0, duration: 1, onComplete: () => { l.style.display = 'none'; } });
    }
}, 7000);

// ─── THREE.JS SETUP ───
const canvas = document.getElementById('tunnel-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(isMobile ? 1 : Math.min(devicePixelRatio, 2));

// ─── SPIRAL TUNNEL (helix curves) ───
const tunnelGroup = new THREE.Group();
for (let s = 0; s < 6; s++) {
    const pts = [];
    const off = (s / 6) * Math.PI * 2;
    for (let i = 0; i <= 480; i++) {
        const t = i / 480;
        const a = t * 8 * Math.PI * 2 + off;
        const r = 2 + Math.sin(t * Math.PI) * 1.5;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, -t * 80));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({ color: s % 2 === 0 ? 0xC8A96B : 0x2D1B4E, transparent: true, opacity: 0.12 });
    tunnelGroup.add(new THREE.Line(g, m));
}
scene.add(tunnelGroup);

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
            const mat = new THREE.MeshBasicMaterial({ 
                map: tex, transparent: true, opacity: 0.5, 
                side: THREE.DoubleSide, 
                blending: THREE.AdditiveBlending 
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
    tunnelGroup.scale.set(1 + pulse, 1 + pulse, 1);
    tunnelGroup.rotation.z += 0.002;

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
          onStart: () => nextPanel.classList.add('is-active'),
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

// ─── WOW #1: ENTER BUTTON — REALITY WARP ───
document.getElementById('enter-btn').addEventListener('click', () => {
    document.body.classList.add('falling');
    // Dramatic spin into the tunnel
    gsap.to(tunnelGroup.rotation, { z: "+=4", duration: 2.5, ease: "power4.inOut" });
    
    // Fade in the hat button
    nextBtn.style.display = 'block';
    nextBtn.style.opacity = '0';
    gsap.to(nextBtn, { opacity: 1, duration: 1, delay: 1 });

    setTimeout(() => {
        document.body.classList.remove('falling');
        goToPanel(1);
    }, 1500);
});

// Hat button logic
nextBtn.addEventListener('click', () => {
    // Add a little click feedback animation to the hat
    gsap.fromTo(nextBtn, { scale: 0.8 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
    goToPanel(currentPanelIndex + 1);
});

// ─── WOW #2: COUNTDOWN CLOCK EXPAND ───
ScrollTrigger.create({
    trigger: '#scroll-container',
    start: `${(4/totalPanels)*100}% top`,
    end: `${(5/totalPanels)*100}% top`,
    onEnter: () => document.getElementById('panel-countdown').setAttribute('data-wow','active'),
    onLeaveBack: () => document.getElementById('panel-countdown').removeAttribute('data-wow'),
});

// ─── WOW #3: OUTRO CARD EXPLOSION ───
ScrollTrigger.create({
    trigger: '#scroll-container',
    start: `${(6/totalPanels)*100}% top`,
    onEnter: () => {
        const box = document.getElementById('card-explosion');
        for (let i = 0; i < 20; i++) {
            const c = document.createElement('div');
            c.textContent = ['♠','♥','♦','♣'][i%4];
            c.style.cssText = `position:absolute;font-size:${1.5+Math.random()*2}rem;color:${i%2===0?'var(--gold)':'var(--suit-red)'};opacity:0;left:50%;top:50%;pointer-events:none;`;
            box.appendChild(c);
            gsap.to(c, { x: (Math.random()-0.5)*600, y: (Math.random()-0.5)*400, rotation: Math.random()*720-360, opacity: 0.6, duration: 2+Math.random(), ease: "power2.out" });
            gsap.to(c, { opacity: 0, duration: 1, delay: 2+Math.random() });
        }
    }, once: true
});

// ─── COUNTDOWN WITH GLITCH ───
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
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ─── SUIT CARD 3D TILT ───
document.querySelectorAll('.suit-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX-r.left)/r.width-0.5)*2;
        const y = ((e.clientY-r.top)/r.height-0.5)*2;
        gsap.to(card, { rotateY: x*15, rotateX: -y*15, duration: 0.3, transformPerspective: 800 });
    });
    card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
    });
});

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
