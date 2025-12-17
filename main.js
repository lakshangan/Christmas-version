import './style.css';
// import './preloader.js'; // Handled in main.js now
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register GSAP Plugin
// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

// --- Configuration ---
const CONFIG = {
    colors: {
        bg: 0x020b14,
        gold: 0xd4af37,
        silver: 0xe0e6ed,
        red: 0x8a0000,
        beam: 0x4fc3f7,
        giftInside: 0xffaa00,
    },
    camera: {
        fov: 45,
        near: 0.1,
        far: 500,
    }
};

// --- Scene Setup ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
// scene.background = new THREE.Color(CONFIG.colors.bg); // Removed to allow CSS background
// scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.02); // Removed fog to keep red background clean

const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, window.innerWidth / window.innerHeight, CONFIG.camera.near, CONFIG.camera.far);
camera.position.set(0, 2, 8); // Standard centered starting position

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); // Boosted Ambient
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 3.0); // Strong White Light
dirLight.position.set(0, 5, 10);
scene.add(dirLight);

const mainLight = new THREE.SpotLight(CONFIG.colors.gold, 3);
mainLight.position.set(5, 10, 5);
mainLight.castShadow = true;
mainLight.angle = 0.5;
mainLight.penumbra = 0.5;
scene.add(mainLight);

const blueBackLight = new THREE.PointLight(0x0044ff, 1.5);
blueBackLight.position.set(-5, 5, -10);
scene.add(blueBackLight);

// --- Objects ---

// 1. Reflective Floor (Ice Lake) - REMOVED for clean CSS background integration
/*
const outputPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({
        color: 0x051121,
        roughness: 0.2,
        metalness: 0.6,
    })
);
outputPlane.rotation.x = -Math.PI / 2;
outputPlane.receiveShadow = true;
scene.add(outputPlane);
*/




// 2. Global Particles (Dense Christmas Snow)
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 5000;
const posArray = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount * 3; i++) {
    // Spread them wider and taller
    posArray[i] = (Math.random() - 0.5) * 100;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

// Initial Opacity 0 (Hidden in Hero)
const softSnowMat = new THREE.PointsMaterial({
    size: 0.15,
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, softSnowMat);
scene.add(particlesMesh);

// 3. Magic Dust (Twinkling floating particles)
const dustGeo = new THREE.BufferGeometry();
const dustCount = 600; // Reduced dust
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount * 3; i++) {
    dustPos[i] = (Math.random() - 0.5) * 80;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustMat = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xffd700, // Gold dust
    transparent: true,
    opacity: 0, // Hidden in Hero (was 0.5)
    blending: THREE.AdditiveBlending
});
const dustMesh = new THREE.Points(dustGeo, dustMat);
scene.add(dustMesh);

// 4. Atmosphere Fog (Subtle Volumetric Glow)
// Large sphere with inverse faces or just localized?
// Let's use a sprite or a simple giant plane with a gradient texture for depth if needed.
// For now, let's stick to particles as the CSS handles the gradient nicely.
// We can add "Stars" way in the back.
const starsGeo = new THREE.BufferGeometry();
const starsCount = 1000;
const starsPos = new Float32Array(starsCount * 3);
for (let i = 0; i < starsCount * 3; i++) {
    const r = 200; // Far away
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    // Fix: Float32Array does not support push. Use index assignment.
    starsPos[i * 3] = x;
    starsPos[i * 3 + 1] = y;
    starsPos[i * 3 + 2] = z;
}
starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsPos, 3));
const starsMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: 0 // Hidden in Hero (was 0.8)
});
const starsMesh = new THREE.Points(starsGeo, starsMat);
scene.add(starsMesh);

// 5. Narrative Objects
// Loading Manager for Preloader
const loadingManager = new THREE.LoadingManager();
const preloader = document.querySelector('#preloader');
const beamCore = document.querySelector('.beam-core');
const beamFlare = document.querySelector('.beam-flare');
const loaderContent = document.querySelector('.loader-content');

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progressRatio = itemsLoaded / itemsTotal;
    if (beamCore) {
        gsap.to(beamCore, {
            height: progressRatio * 100 + '%',
            duration: 0.5,
            ease: "power2.out"
        });
    }
};

loadingManager.onLoad = () => {
    const tl = gsap.timeline({
        onComplete: () => {
            if (preloader) preloader.style.display = 'none';
        }
    });

    if (loaderContent && beamCore && beamFlare && preloader) {
        tl.to(loaderContent, { scale: 1.5, opacity: 0, duration: 0.6, ease: "power3.in" }) // Zoom into text
            .to(beamCore, { width: '100%', height: '2px', duration: 0.6, ease: "expo.in" }, "-=0.4")
            .to(beamFlare, {
                width: '300vw',
                height: '300vw',
                opacity: 1,
                duration: 0.8,
                ease: "expo.out"
            }, "<")
            .to(preloader, { opacity: 0, duration: 1.5, ease: "power2.inOut" }, "-=0.5")

            // Hero Entrance (Staggered & Smooth)
            .fromTo(".hero-lead-in",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" },
                "-=1.0")
            .fromTo(".hero-main-title",
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" },
                "-=1.0")
            .fromTo(".mascot-description",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 0.9, duration: 1.2, ease: "power3.out" },
                "-=0.9")
            .fromTo(".premium-btn",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" },
                "-=0.9");
    } else {
        // Fallback if elements missing
        if (preloader) preloader.style.display = 'none';
    }
};

// A. Hero: Santa Sleigh (GLB)
const heroGroup = new THREE.Group();
let santaModel = null;
const loader = new GLTFLoader(loadingManager);

loader.load('/santa_sleigh.glb', (gltf) => {
    santaModel = gltf.scene;
    // Center and scale the model
    const box = new THREE.Box3().setFromObject(santaModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    santaModel.position.x += (santaModel.position.x - center.x);
    santaModel.position.y += (santaModel.position.y - center.y);
    santaModel.position.z += (santaModel.position.z - center.z);

    // Normalize scale to fit roughly in 7 units (Standard Size)
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 7 / maxDim;
    santaModel.scale.setScalar(scaleFactor);

    santaModel.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            // Enhance materials for premium look
            if (node.material) {
                // node.material.metalness = 0.3; // Removed to prevent darkness
                node.material.roughness = 0.4;
                node.material.emissiveIntensity = 0.2; // Self-illuminate slightly
            }
        }
    });

    heroGroup.add(santaModel);
}, undefined, (error) => {
    console.error("Error loading model:", error);
    // Fallback if model fails
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshStandardMaterial({ color: CONFIG.colors.gold }));
    heroGroup.add(sphere);
});

// Add orbital rings to Hero (keep these for abstract tech feel) - REMOVED per user request
/*
const ringGeo = new THREE.TorusGeometry(2, 0.02, 16, 100);
const ringMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.gold, transparent: true, opacity: 0.5 });
const ring1 = new THREE.Mesh(ringGeo, ringMat);
const ring2 = new THREE.Mesh(ringGeo, ringMat);
ring1.rotation.x = Math.PI / 2 + 0.2;
ring2.rotation.y = Math.PI / 2 + 0.2;
heroGroup.add(ring1);
heroGroup.add(ring2);
*/

// Background Highlight for Mascot (Enhanced)
// Background Highlight for Mascot (Enhanced)
const highlightGroup = new THREE.Group();

// Removed Gold Halo per user request for a cleaner look

// Blue Rim Light for contrast (Kept for clarity)
const rimLight = new THREE.SpotLight(0x44aaff, 10);
rimLight.position.set(-5, 5, -5);
rimLight.lookAt(0, 0, 0);
heroGroup.add(rimLight);

const highlightSpot = new THREE.SpotLight(0xffffff, 8); // White spot
highlightSpot.position.set(0, 5, 5);
highlightSpot.angle = 0.6;
highlightSpot.penumbra = 0.5;
highlightSpot.distance = 50;
highlightGroup.add(highlightSpot);

heroGroup.add(highlightGroup);

// Place on RIGHT side initially - ALIGNED with Nav Items (Vision/Tech)
// STARTS BELOW SCREEN (Vertical Scroll Effect)
heroGroup.position.set(0, -20, 0); // Far below
heroGroup.rotation.set(0.1, -1.0, 0); // Semi right side view (3/4 angle)
scene.add(heroGroup);


// B. The Crystalline Network (Network Orb)
const crystalGroup = new THREE.Group();

// 1. The Orb of Truth (Sphere of Nodes)
const orbGeo = new THREE.SphereGeometry(3, 32, 32);
const orbMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.1,
    wireframe: true
});
const orbBase = new THREE.Mesh(orbGeo, orbMat);
crystalGroup.add(orbBase);

// 2. Glowing Nodes on Surface
const nodesCount = 150;
const nodesGeo = new THREE.BufferGeometry();
const nodesPos = [];
for (let i = 0; i < nodesCount; i++) {
    const phi = Math.acos(-1 + (2 * i) / nodesCount);
    const theta = Math.sqrt(nodesCount * Math.PI) * phi;

    const r = 3;
    const x = r * Math.cos(theta) * Math.sin(phi);
    const y = r * Math.sin(theta) * Math.sin(phi);
    const z = r * Math.cos(phi);

    nodesPos.push(x, y, z);
}
nodesGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodesPos, 3));
const nodesMat = new THREE.PointsMaterial({
    color: 0xFF6600, // Electric Orange
    size: 0.1,
    transparent: true,
    opacity: 0.8
});
const nodesMesh = new THREE.Points(nodesGeo, nodesMat);
crystalGroup.add(nodesMesh);

// 3. Data Lines (Connecting some nodes)
// Purely decorative spinning lines inside
const innerLinesGeo = new THREE.IcosahedronGeometry(2.5, 1);
const innerLinesMat = new THREE.LineBasicMaterial({
    color: 0xFF6600, // Electric Orange
    transparent: true,
    opacity: 0.3
});
const innerLines = new THREE.LineSegments(
    new THREE.WireframeGeometry(innerLinesGeo),
    innerLinesMat
);
crystalGroup.add(innerLines);

crystalGroup.position.set(0, 0, -20);
crystalGroup.scale.set(0, 0, 0); // Start hidden
scene.add(crystalGroup);


// C. The Sleigh Forge
const forgeGroup = new THREE.Group();

// Materials (Christmas Tech)
const sleighRedMat = new THREE.MeshStandardMaterial({
    color: 0xaa0000, // Deep Red
    roughness: 0.2,
    metalness: 0.7,
    envMapIntensity: 1.5
});
const sleigGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Gold
    roughness: 0.2,
    metalness: 1.0
});

// 1. Octopus Intern (Replacing Sleigh Parts)
let forgeOctopus = null;
loader.load('/orange octopus 3d model.glb', (gltf) => {
    forgeOctopus = gltf.scene;

    // Auto-center and scale
    const box = new THREE.Box3().setFromObject(forgeOctopus);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    forgeOctopus.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    // Adjust scale to fit in the forge area (approx 4-5 units)
    const scaleFactor = 5 / maxDim;
    forgeOctopus.scale.setScalar(scaleFactor);

    forgeOctopus.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            // brightness boost for raw model
            if (node.material) {
                node.material.envMapIntensity = 1.0;
                node.material.needsUpdate = true;
            }
        }
    });

    // Mark as interactive
    forgeOctopus.name = 'forgeOctopus';

    forgeGroup.add(forgeOctopus);
}, undefined, (error) => {
    console.error("Error loading Octopus for Forge:", error);
});

// Attribution Beacon (Simplifed - Just Light)
const beaconLight = new THREE.PointLight(0xfffae0, 2, 10); // Warm White/Gold
beaconLight.position.set(0, 2, 0);
forgeGroup.add(beaconLight);

// Removed Beacon Ring (Circle) per user request

// Removed Dock Ring for Minimal look as requested

forgeGroup.position.set(20, 2, -5);
scene.add(forgeGroup);


// D. The Santa Gift (GLB Model)
const giftGroup = new THREE.Group();
let giftModel;
let isGiftOpen = false;

// Load Gift Box GLB
loader.load('/Gift Box.glb', (gltf) => {
    giftModel = gltf.scene;

    // Auto-center and scale
    const box = new THREE.Box3().setFromObject(giftModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    giftModel.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 3 / maxDim; // Size it to ~3 units
    giftModel.scale.setScalar(scaleFactor);

    giftModel.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            node.material.envMapIntensity = 2; // Shiny
            node.material.roughness = 0.2;
            node.material.metalness = 0.6;
        }
    });

    giftGroup.add(giftModel);
}, undefined, (error) => {
    console.error("Error loading Gift Box:", error);
    // Fallback Red Box
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    giftGroup.add(box);
});

// Inner Light (Hidden initially)
const internalLight = new THREE.PointLight(0xffd700, 0, 5);
internalLight.position.set(0, 0, 0);
giftGroup.add(internalLight);

giftGroup.position.set(-15, 0.75, -5);
scene.add(giftGroup);


// --- Interaction Logic (Santa Gift) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', onDocClick);

// Close button logic
const closeBtn = document.getElementById('close-letter');
if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent re-triggering raycast if overlay overlaps canvas click
        closeGift();
    });
}

function onDocClick(event) {
    // Raycast only works if giftGroup is visible/near
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    // Intersect all relevant groups
    const objectsToTest = [...giftGroup.children, ...forgeGroup.children];
    const intersects = raycaster.intersectObjects(objectsToTest, true);

    if (intersects.length > 0) {
        // Check for Gift
        if (!isGiftOpen && intersects.some(hit => giftGroup.children.includes(hit.object) || hit.object.parent === giftGroup || hit.object.parent?.parent === giftGroup)) {
            openGift();
            return;
        }

        // Check for Forge Octopus (Interactive Poke)
        const hitOctopus = intersects.find(hit => {
            // Traverse up to find if it's the octopus
            let obj = hit.object;
            while (obj) {
                if (obj.name === 'forgeOctopus') return true;
                obj = obj.parent;
            }
            return false;
        });

        if (hitOctopus) {
            interactOctopus();
        }
    }
}

function interactOctopus() {
    if (!forgeOctopus) return;

    // fun bounce/spin animation
    gsap.to(forgeOctopus.scale, {
        x: forgeOctopus.scale.x * 1.2,
        y: forgeOctopus.scale.y * 0.8,
        z: forgeOctopus.scale.z * 1.2,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
    });

    gsap.to(forgeOctopus.rotation, {
        y: forgeOctopus.rotation.y + Math.PI * 2,
        duration: 1,
        ease: "elastic.out(1, 0.5)"
    });
}

function openGift() {
    isGiftOpen = true;

    // 1. Camera Move (Full Screen Focus)
    // Zoom extremely close to center of gift, or slightly above
    gsap.to(camera.position, {
        x: -15,
        y: 2,
        z: -2, // Very close
        duration: 1.5,
        ease: "power2.inOut"
    });
    gsap.to(cameraTarget, {
        x: -15, y: 1, z: -5,
        duration: 1.5
    });

    // 2. Gift Animation (Float up and spin fast like opening)
    gsap.to(giftGroup.position, { y: 2, duration: 1, ease: "back.out" });
    gsap.to(giftGroup.rotation, { y: Math.PI * 4, duration: 2, ease: "power2.inOut" });

    // 3. Light Burst
    gsap.to(internalLight, { intensity: 10, duration: 0.5, yoyo: true, repeat: 1, delay: 1 });

    // 4. Show Letter Overlay
    setTimeout(() => {
        const letter = document.getElementById('santa-letter');
        const hint = document.getElementById('santa-instruction');
        if (letter) letter.classList.add('active');
        if (hint) hint.style.opacity = 0;
    }, 1200);
}

function closeGift() {
    isGiftOpen = false;

    // 1. Hide Letter
    const letter = document.getElementById('santa-letter');
    const hint = document.getElementById('santa-instruction');
    if (letter) letter.classList.remove('active');
    if (hint) hint.style.opacity = 1;

    // 2. Reset Gift
    gsap.to(giftGroup.position, { y: 0.75, duration: 1, ease: "power2.out" });

    // 3. Reset Camera (Back to Scene 3 view)
    gsap.to(camera.position, { x: -12, y: 0.75, z: 0, duration: 1.5 });
    gsap.to(cameraTarget, { x: -15, y: 0.75, z: -5, duration: 1.5 });

    // Dim Light
    gsap.to(internalLight, { intensity: 0, duration: 1.0 });
}


// --- Scroll / Animation ---

const cameraTarget = new THREE.Vector3(0, 2, 0);

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "#main-wrapper",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.0, // More responsive (was 1.5)
        // snap: 1 / 4 // Optional: snap to sections
    }
});

// Scene 0: Video Hero -> Mascot Showcase (Vertical Reveal to "Side" Spot)
// 1. Move Sleigh Up & Right (Proper Right Position)
tl.to(heroGroup.position, {
    x: 3.5, // Move to Right Side (align with spacer column)
    y: 1.0,
    z: 0,
    duration: 2.0,
    ease: "power2.out"
}, "scene0")
    // 2. Rotate Sleigh (Side/3-4 View)
    .to(heroGroup.rotation, {
        x: 0.05,
        y: -0.8, // Angled towards user
        z: 0.0,
        duration: 2.0,
        ease: "power2.inOut"
    }, "scene0")
    // 3. Camera Move (Framing the Right Side)
    .to(camera.position, {
        x: 0, // Keep camera center to see both text and model
        y: 1.5,
        z: 9,
        duration: 2.0,
        ease: "power2.inOut"
    }, "scene0")
    // 4. Reveal Text 
    .to(".mascot-text-col", {
        y: 0,
        opacity: 1,
        duration: 1.0,
        ease: "power2.out"
    }, "scene0+=0.5");

// --- Scroll Spacer (Pause) ---
// Add a dummy tween to keep the state for a bit of scrolling
tl.to({}, { duration: 0.5 }, ">");

// Scene 0.5: Mascot (Right) -> center (For "Truth of Winter")
// Move Sleigh to Center
tl.to(heroGroup.position, {
    x: 0, // Center
    y: 0.5, // Slightly lower
    z: 0, // Keep distance (was 2 which was too close)
    duration: 1.5,
    ease: "power2.inOut"
}, "sceneCenter")
    .to(heroGroup.rotation, {
        x: 0.05, // Slight tilt down to see more
        y: -0.2, // Slight angle is better than flat 0
        z: 0.0,
        duration: 1.5,
        ease: "power2.inOut"
    }, "sceneCenter")
    .to(camera.position, {
        x: 0,
        y: 1.5, // Keep eye level
        z: 11, // Pull back to see full model (was 7)
        duration: 1.5
    }, "sceneCenter");

// Pause again for "Truth of Winter" reading
tl.to({}, { duration: 1.0 }, ">");

// Scene 1: Hero -> Crystalline Network (Curtain Transition)
const leftCurtain = document.querySelector('.curtain-left');
const rightCurtain = document.querySelector('.curtain-right');

tl.to(camera.position, {
    x: 0,
    y: 0,
    z: 10,
    duration: 0.5,
    ease: "expo.in"
}, "scene1")
    // Hide Particles
    .to([softSnowMat, dustMat, starsMat], { opacity: 0, duration: 0.5 }, "scene1")
    // Close Curtains
    .to([leftCurtain, rightCurtain], { scaleX: 1, duration: 0.8, ease: "circ.inOut" }, "scene1+=0.3")

    // Move Camera Behind Curtains
    .to(camera.position, { x: 0, y: 0, z: -5, duration: 0.1 }, "scene1+=1.1") // Teleport
    .to(cameraTarget, { x: 0, y: 0, z: -20, duration: 0.1 }, "scene1+=1.1")
    .to(highlightGroup.scale, { x: 0, y: 0, z: 0, duration: 0.1 }, "scene1+=1.1")
    .to(heroGroup.scale, { x: 0, y: 0, z: 0, duration: 0.1 }, "scene1+=1.1") // HIDE SANTA (Scale 0 is safer)

    // Open Curtains
    .to([leftCurtain, rightCurtain], { scaleX: 0, duration: 0.8, ease: "circ.inOut" }, "scene1+=1.2")

    // Reveal Crystal Orb
    .to(crystalGroup.scale, {
        x: 1, y: 1, z: 1,
        duration: 1.5,
        ease: "back.out(1.2)"
    }, "scene1+=1.5")

    // Restore Particles
    .to(softSnowMat, { opacity: 0.7, duration: 1.5 }, "scene1+=1.5")
    .to(dustMat, { opacity: 0.5, duration: 1.5 }, "scene1+=1.5")
    .to(starsMat, { opacity: 0.8, duration: 1.5 }, "scene1+=1.5");


// Scene 2: Crystal Orb -> Forge
// Forge at (20, 2, -5)
tl.to(camera.position, {
    x: 20,
    y: 2.5, // Eye level (was 4)
    z: 7,   // Better framing (was 5)
    duration: 1.5,
    ease: "power3.inOut"
}, "scene2")
    .to(cameraTarget, {
        x: 20,
        y: 2,
        z: -5,
        duration: 1.5,
        ease: "power2.inOut"
    }, "scene2")
    // Hide Crystal
    .to(crystalGroup.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5
    }, "scene2")

    // Animate Forge Assembly - REMOVED (Replaced by Static Octopus)
    /*
    .to(engineMod.position, {
        x: 1.1,
        duration: 1,
        ease: "back.out(1.7)"
    }, "scene2+=0.5")
    .to(sensorMod.position, {
        x: -1.1,
        duration: 1,
        ease: "back.out(1.7)"
    }, "scene2+=0.5")
    */

    // Beacon Activate
    .to(beaconLight, {
        intensity: 3,
        duration: 0.3
    }, "scene2+=1.3");

// Ensure Santa is hidden here too (safety)
// .to(heroGroup.scale, { x: 0, y: 0, z: 0, duration: 0 }, "scene2");

// Scene 3: Forge -> Gift
// Gift at (-15, 0.75, -5)
// SIMPLIFIED TRANSITION: Just slide camera to Gift, standard view.
tl.to(camera.position, {
    x: -12, // Standard offset
    y: 1.5, // Slight high angle
    z: 5,   // Comfortable distance
    duration: 1.5,
    ease: "power2.inOut"
}, "scene3")
    // Hide Forge
    .to(forgeGroup.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5
    }, "scene3")
    .to(cameraTarget, {
        x: -15,
        y: 0.75,
        z: -5,
        duration: 1.5,
        ease: "power2.inOut"
    }, "scene3");


// --- Window Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Lenis ---
const lenis = new Lenis({
    duration: 1.5, // Heavier, smoother feel
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1.2, // Faster response to input
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);


// --- Animation Loop ---
function animate(time) {
    const t = time * 0.001;

    // Hero Animation
    if (heroGroup) {
        // If santaModel exists, maybe float it slightly
        if (santaModel) {
            // Subtle "alive" movement
            santaModel.rotation.y = Math.sin(t * 0.5) * 0.1; // Gentle Yaw (Looking around)
            santaModel.position.y = Math.sin(t) * 0.1; // Float up/down relative to group center
        }
    }

    // Data Beam Animation (Instanced) - REMOVED
    /*
    // Move blocks up
    for (let i = 0; i < dataInstances; i++) {
        dataBlocks.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
 
        dummy.position.y += 0.05 + (Math.random() * 0.05);
        if (dummy.position.y > 10) dummy.position.y = -10;
 
        dummy.updateMatrix();
        dataBlocks.setMatrixAt(i, dummy.matrix);
    }
    dataBlocks.instanceMatrix.needsUpdate = true;
    */

    // Particles
    if (particlesMesh) {
        particlesMesh.rotation.y = t * 0.05;
    }

    // Magic Dust Float
    if (dustMesh) {
        dustMesh.rotation.y = -t * 0.02;
        dustMesh.position.y = Math.sin(t * 0.5) * 2;
    }
    // Stars don't move (or very slowly)
    if (starsMesh) {
        starsMesh.rotation.y = t * 0.005;
    }

    // Crystal Orb Animation
    if (crystalGroup) {
        crystalGroup.rotation.y = t * 0.1;
        crystalGroup.rotation.z = Math.sin(t * 0.1) * 0.05;
        if (typeof innerLines !== 'undefined' && innerLines) {
            innerLines.rotation.x = t * 0.2;
        }
    }

    // Gift Animation (Idle Float)
    if (giftGroup) {
        giftGroup.position.y = 0.75 + Math.sin(t * 1) * 0.1;
        if (!isGiftOpen) {
            giftGroup.rotation.y = t * 0.2; // Slow rotate idle
        }
    }

    // Forge Animation
    if (forgeOctopus) {
        forgeOctopus.rotation.y += 0.005; // Continuous Revolution
    }
    if (forgeGroup) {
        forgeGroup.position.y = 2 + Math.sin(t * 0.5) * 0.2; // Gentle Float
    }

    // Update Fog based on scroll or camera position if needed manually, 
    // but GSAP usually handles the timeline better.
    // Ensure fog density matches the "Deep Field" feel.

    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// --- Navbar Scroll Logic ---
const nav = document.querySelector('.glass-nav');
if (nav) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}
