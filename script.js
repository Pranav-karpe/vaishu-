console.clear();

/* AUDIO SETUP */
const music = document.getElementById("bg-music");
const musicBtn = document.getElementById("music-btn");
const musicIcon = document.getElementById("music-icon");
const musicText = document.getElementById("music-text");

function updateMusicUI(isPlaying) {
  if (isPlaying) {
    musicBtn.classList.add("playing");
    musicIcon.textContent = "🎶";
    musicText.textContent = "Music Playing";
  } else {
    musicBtn.classList.remove("playing");
    musicIcon.textContent = "🎵";
    musicText.textContent = "Play Music";
  }
}

musicBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (music.paused) {
    music.play().then(() => updateMusicUI(true)).catch(console.error);
  } else {
    music.pause();
    updateMusicUI(false);
  }
});

music.volume = 0.8;
music.play().then(() => updateMusicUI(true)).catch(() => {
  const unlock = () => {
    music.play().then(() => updateMusicUI(true)).catch(() => {});
    window.removeEventListener("click", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("click", unlock);
  window.addEventListener("keydown", unlock);
});

/* THREE.JS SCENE */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.z = 520;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* ORBIT CONTROLS — inline since THREE.OrbitControls path varies */
let isDragging = false, prevMouse = { x: 0, y: 0 };
renderer.domElement.addEventListener("mousedown", e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
window.addEventListener("mouseup", () => isDragging = false);
window.addEventListener("mousemove", e => {
  if (!isDragging) return;
  scene.rotation.y += (e.clientX - prevMouse.x) * 0.005;
  scene.rotation.x += (e.clientY - prevMouse.y) * 0.005;
  prevMouse = { x: e.clientX, y: e.clientY };
});
renderer.domElement.addEventListener("wheel", e => {
  camera.position.z = Math.max(200, Math.min(900, camera.position.z + e.deltaY * 0.3));
});

/* HEART POINTS from SVG path */
const svgPath = document.querySelector("path");
const pathLen = svgPath.getTotalLength();
const COUNT = 4000;

// Target positions (heart shape)
const targets = [];
for (let i = 0; i < COUNT; i++) {
  const pt = svgPath.getPointAtLength((i / COUNT) * pathLen);
  targets.push({
    x: pt.x - 300 + (Math.random() - 0.5) * 20,
    y: -(pt.y - 276) + (Math.random() - 0.5) * 20,
    z: (Math.random() - 0.5) * 60
  });
}

// Current positions start scattered (explosion origin)
const positions = new Float32Array(COUNT * 3);
const scatter = 600;
for (let i = 0; i < COUNT; i++) {
  positions[i * 3]     = (Math.random() - 0.5) * scatter;
  positions[i * 3 + 1] = (Math.random() - 0.5) * scatter;
  positions[i * 3 + 2] = (Math.random() - 0.5) * scatter;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
  color: 0xff3875,
  blending: THREE.AdditiveBlending,
  size: 3.2,
  transparent: true,
  opacity: 0.95
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

/* ANIMATION STATE */
let progress = 0; // 0 → 1 over ~2.5s
let formed = false;
const FORM_DURATION = 2500; // ms
let startTime = null;

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function onHeartFormed() {
  formed = true;

  // Glow backdrop
  document.getElementById("heart-glow").classList.add("active");

  // Reveal message
  document.getElementById("golden-message").classList.add("show");

  // Heartbeat pulse via JS
  let beat = 0;
  setInterval(() => {
    beat++;
    const s = beat % 2 === 0 ? 1.08 : 1.0;
    gsap.to(particles.scale, { x: s, y: s, z: s, duration: 0.18, ease: "power2.out" });
  }, 400);

  // Glow pulse
  gsap.to(material, { size: 4.2, opacity: 1, duration: 1.0, repeat: -1, yoyo: true, ease: "sine.inOut" });

  // Start emoji rain
  startFallingEmojis();
}

/* RENDER LOOP */
function render(ts) {
  requestAnimationFrame(render);

  if (!formed) {
    if (!startTime) startTime = ts;
    progress = Math.min((ts - startTime) / FORM_DURATION, 1);
    const eased = easeOutCubic(progress);

    const pos = geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     += (targets[i].x - pos[i * 3])     * eased * 0.08;
      pos[i * 3 + 1] += (targets[i].y - pos[i * 3 + 1]) * eased * 0.08;
      pos[i * 3 + 2] += (targets[i].z - pos[i * 3 + 2]) * eased * 0.08;
    }
    geometry.attributes.position.needsUpdate = true;

    if (progress >= 1) onHeartFormed();
  }

  // Gentle sway
  if (!isDragging) {
    scene.rotation.y = Math.sin(Date.now() * 0.0004) * 0.18;
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(render);

/* FALLING EMOJIS */
function startFallingEmojis() {
  const container = document.getElementById("emoji-rain");
  const pool = ["🧿", "💖", "❤️", "💕", "✨", "🥰", "💗", "❤️🩹"];

  function spawn() {
    const el = document.createElement("div");
    el.className = "falling-emoji";
    el.textContent = pool[Math.floor(Math.random() * pool.length)];
    const dur = 4.5 + Math.random() * 4;
    el.style.left = `${Math.random() * 95}vw`;
    el.style.fontSize = `${20 + Math.random() * 24}px`;
    el.style.animationDuration = `${dur}s`;
    el.style.setProperty("--drift", `${(Math.random() - 0.5) * 120}px`);
    el.style.setProperty("--spin", `${(Math.random() - 0.5) * 360}deg`);
    container.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000);
  }

  for (let i = 0; i < 8; i++) setTimeout(spawn, i * 150);
  setInterval(spawn, 320);
}

/* RESIZE */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
