console.clear();

/* AUDIO SETUP */
const music = document.getElementById("bg-music");
const musicBtn = document.getElementById("music-btn");
const musicIcon = document.getElementById("music-icon");
const musicText = document.getElementById("music-text");

function updateMusicUI(isPlaying) {
  if (isPlaying) {
    if (musicBtn) musicBtn.classList.add("playing");
    if (musicIcon) musicIcon.textContent = "🎶";
    if (musicText) musicText.textContent = "Music Playing";
  } else {
    if (musicBtn) musicBtn.classList.remove("playing");
    if (musicIcon) musicIcon.textContent = "🎵";
    if (musicText) musicText.textContent = "Play Music";
  }
}

function toggleMusic() {
  if (!music) return;
  if (music.paused) {
    music.play().then(() => updateMusicUI(true)).catch(console.error);
  } else {
    music.pause();
    updateMusicUI(false);
  }
}

if (musicBtn) {
  musicBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMusic();
  });
}

// Attempt immediate playback or unlock on first user gesture
if (music) {
  music.volume = 0.8;
  music.play().then(() => {
    updateMusicUI(true);
  }).catch(() => {
    const unlockAudio = () => {
      if (music.paused) {
        music.play().then(() => updateMusicUI(true)).catch(() => {});
      }
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
  });
}

/* SETUP THREE.JS SCENE */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.z = 520;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* ORBIT CONTROLS */
const controlsWebGL = new THREE.OrbitControls(camera, renderer.domElement);
controlsWebGL.enableDamping = true;
controlsWebGL.dampingFactor = 0.05;
controlsWebGL.enableZoom = true;

/* HEART PARTICLES SETUP */
const path = document.querySelector("path");
const length = path.getTotalLength();
const vertices = [];
let isForming = true;

// GSAP timeline starts immediately when website opens
const tl = gsap.timeline({
  onComplete: onHeartTransitionComplete
});

// Generate heart boundary points with jittered 3D depth
for (let i = 0; i < length; i += 0.15) {
  const point = path.getPointAtLength(i);
  const targetX = point.x + (Math.random() - 0.5) * 28;
  const targetY = -point.y + (Math.random() - 0.5) * 28;
  const targetZ = (Math.random() - 0.5) * 75;

  const vector = new THREE.Vector3(targetX, targetY, targetZ);
  vertices.push(vector);

  // Transition: Particles fly and explode out from center into heart shape
  tl.from(vector, {
    x: 600 / 2 + (Math.random() - 0.5) * 20,
    y: -552 / 2 + (Math.random() - 0.5) * 20,
    z: (Math.random() - 0.5) * 50,
    ease: "power2.out",
    duration: gsap.utils.random(2.0, 3.4)
  }, (i / length) * 2.2);
}

const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
const material = new THREE.PointsMaterial({
  color: 0xff3875,
  blending: THREE.AdditiveBlending,
  size: 3.2,
  transparent: true,
  opacity: 0.95
});

const particles = new THREE.Points(geometry, material);
// Center the heart and position slightly elevated for message breathing room
particles.position.x -= 600 / 2;
particles.position.y += 552 / 2 + 35;
scene.add(particles);

// Subtle continuous rotation sway
gsap.fromTo(scene.rotation, {
  y: -0.16
}, {
  y: 0.16,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
  duration: 3.5
});

/* ON TRANSITION COMPLETE */
function onHeartTransitionComplete() {
  isForming = false;
  // Ensure points are locked into final positions
  geometry.setFromPoints(vertices);

  // 1. Activate ambient glowing backdrop behind heart
  const heartGlow = document.getElementById('heart-glow');
  if (heartGlow) heartGlow.classList.add('active');

  // 2. Continuous Glowing and Heartbeat on the Heart
  // Pulse particle size & color brightness for radiant glow
  gsap.to(material, {
    size: 4.4,
    opacity: 1,
    duration: 1.1,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  // Heartbeat pulse rhythm
  const heartbeat = gsap.timeline({ repeat: -1, repeatDelay: 0.55 });
  heartbeat
    .to(particles.scale, { x: 1.09, y: 1.09, z: 1.09, duration: 0.18, ease: "power2.out" })
    .to(particles.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.18, ease: "power2.in" })
    .to(particles.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.14, ease: "power2.out" })
    .to(particles.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.22, ease: "power2.inOut" });

  // 3. Reveal Golden Message
  const goldenMessage = document.getElementById('golden-message');
  if (goldenMessage) {
    goldenMessage.classList.add('show');
  }

  // 4. Start Falling Love & Evil Eye Emojis
  startFallingEmojis();
}

/* FALLING EMOJIS (LOVE & EVIL EYE) */
function startFallingEmojis() {
  const container = document.getElementById('emoji-rain');
  if (!container) return;

  const emojiPool = ['🧿', '💖', '❤️', '💕', '🧿', '✨', '🥰', '💗', '🧿', '❤️‍🩹'];

  function spawnEmoji() {
    const el = document.createElement('div');
    el.className = 'falling-emoji';
    el.textContent = emojiPool[Math.floor(Math.random() * emojiPool.length)];

    const startX = Math.random() * 95; // 0 to 95 vw
    const size = 20 + Math.random() * 24; // 20px to 44px
    const duration = 4.5 + Math.random() * 4.0; // 4.5s to 8.5s
    const drift = (Math.random() - 0.5) * 120; // horizontal wobble drift
    const spin = (Math.random() - 0.5) * 360; // rotation

    el.style.left = `${startX}vw`;
    el.style.fontSize = `${size}px`;
    el.style.animationDuration = `${duration}s`;
    el.style.setProperty('--drift', `${drift}px`);
    el.style.setProperty('--spin', `${spin}deg`);

    container.appendChild(el);

    // Clean up when animation finishes
    setTimeout(() => {
      el.remove();
    }, duration * 1000);
  }

  // Initial burst of emojis
  for (let j = 0; j < 6; j++) {
    setTimeout(spawnEmoji, j * 180);
  }

  // Continuous rain
  setInterval(spawnEmoji, 320);
}

/* RENDERING LOOP */
function render() {
  requestAnimationFrame(render);
  if (isForming) {
    geometry.setFromPoints(vertices);
  }
  controlsWebGL.update();
  renderer.render(scene, camera);
}
requestAnimationFrame(render);

/* WINDOW RESIZE */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize, false);
