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
            .fromTo("#video-hero .hero-lead-in",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" },
                "-=1.0")
            .fromTo("#video-hero .hero-main-title",
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" },
                "-=1.0")
            .fromTo("#video-hero .christmas-subtitle",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" },
                "-=0.9")
            .fromTo("#video-hero .premium-btn",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" },
                "-=0.9");
    } else {
        // Fallback if elements missing
        if (preloader) preloader.style.display = 'none';

        // Force show hero elements in case preloader fails
        gsap.set(["#video-hero .hero-lead-in", "#video-hero .hero-main-title", "#video-hero .christmas-subtitle", "#video-hero .premium-btn"], { opacity: 1, y: 0 });
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
    color: 0x00F3FF, // Electric Blue
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
    color: 0x00F3FF, // Electric Blue
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
var sprinklerActive = false; // Global celebration flag


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

    giftModel.scale.set(12.0, 12.0, 12.0); // Make gift box much bigger
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

giftGroup.position.set(-9, 0.5, 0);
giftGroup.scale.set(0, 0, 0); // Start hidden
scene.add(giftGroup);


// --- Interaction Logic (Santa Gift) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', onDocClick);

const claimBtn = document.getElementById('claim-stake-btn');
if (claimBtn) {
    claimBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent raycast click
        openGift();
    });
}

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

// --- 3D Confetti Logic (Vibrant Colorful Bits) ---
const confettiCount = 800;
const confettiProto = new THREE.PlaneGeometry(0.15, 0.25);
const confettiMat = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    vertexColors: false // Using setColorAt instead
});
const confettiMesh = new THREE.InstancedMesh(confettiProto, confettiMat, confettiCount);
giftGroup.add(confettiMesh);

const confettiData = [];
const palette = [0xff0055, 0x00ff44, 0x0088ff, 0xffff00, 0xff00ff, 0xffffff];
const dummyMatrix = new THREE.Matrix4();
const dummyColor = new THREE.Color();

for (let i = 0; i < confettiCount; i++) {
    // Random Color
    dummyColor.setHex(palette[Math.floor(Math.random() * palette.length)]);
    confettiMesh.setColorAt(i, dummyColor);

    confettiData.push({
        pos: new THREE.Vector3(0, 0, 0),
        vel: new THREE.Vector3(
            (Math.random() - 0.5) * 1.0,
            (Math.random() * 1.5), // Upward initial burst
            (Math.random() - 0.5) * 1.0
        ),
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        rVel: new THREE.Euler(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2),
        scale: 1.0
    });
}
confettiMesh.instanceMatrix.needsUpdate = true;
let animatingConfetti = false;

function explodeConfetti() {
    animatingConfetti = true;
    confettiMat.opacity = 1;

    // Reset data
    for (let i = 0; i < confettiCount; i++) {
        confettiData[i].pos.set(0, 0, 0);
        confettiData[i].vel.set(
            (Math.random() - 0.5) * 12,
            (Math.random() * 12) + 5,
            (Math.random() - 0.5) * 12
        );
        confettiData[i].scale = 1.0;
    }

    let dummy = { t: 0 };
    gsap.to(dummy, {
        t: 1,
        duration: 2.5,
        onUpdate: () => {
            for (let i = 0; i < confettiCount; i++) {
                const d = confettiData[i];
                // Physics
                d.pos.add(d.vel.clone().multiplyScalar(0.08));
                d.vel.y -= 0.4; // Gravity
                d.vel.multiplyScalar(0.98); // Drag

                // Rotation
                d.rot.x += d.rVel.x;
                d.rot.y += d.rVel.y;
                d.rot.z += d.rVel.z;

                // Matrix Update
                dummyMatrix.makeRotationFromEuler(d.rot);
                dummyMatrix.setPosition(d.pos);
                confettiMesh.setMatrixAt(i, dummyMatrix);
            }
            confettiMesh.instanceMatrix.needsUpdate = true;
        },
        onComplete: () => {
            gsap.to(confettiMat, { opacity: 0, duration: 0.5 });
            animatingConfetti = false;
        }
    });
}


const santaMessages = [
    "Ho Ho Ho! While the elves are busy making toys, we're busy making history. Your data is now yours forever. Merry Christmas!",
    "Checking the ledger twice... looks like you've been Naughty-proofed by decentralization! Enjoy your ownership.",
    "The best gift isn't under the tree, it's on the chain. Here's to a future that belongs to you. Happy Holidays!",
    "Wrapped with encryption, delivered with trust. You've officially claimed your piece of the Open Future.",
    "From the North Pole to the Node Network: May your transactions be fast and your gas fees low. Cheers!",
    "Intern Santa here! I snuck this gift onto the ledger just for you. Don't tell the big guy. Verified and immutable joy!"
];

// --- Greeting Card Logic ---
let userName = "Builder"; // Default

function openGift() {
    // Show Modal to Capture Name
    const modal = document.getElementById('username-modal');
    const instruction = document.getElementById('santa-instruction');
    const claimBtn = document.getElementById('claim-stake-btn');

    if (modal && instruction) {
        // Hide initial interaction elements
        gsap.to([instruction, claimBtn], {
            opacity: 0, duration: 0.3, onComplete: () => {
                if (instruction) instruction.style.display = 'none';
                if (claimBtn) claimBtn.style.display = 'none';

                // Show Modal
                modal.style.display = 'flex';
                gsap.to(modal, { opacity: 1, duration: 0.5 });

                // Auto-focus input
                const input = document.getElementById('username-input');
                if (input) setTimeout(() => input.focus(), 100);
            }
        });
    } else {
        // Fallback if modal missing
        revealGiftSequence();
    }
}

function revealGiftSequence() {
    isGiftOpen = true;

    // Double Check Input (Safety)
    const usernameInput = document.getElementById('username-input');
    if (usernameInput && usernameInput.value.trim() !== "") {
        userName = usernameInput.value.trim();
    }

    // Hide Modal if open
    const modal = document.getElementById('username-modal');
    if (modal) gsap.to(modal, { opacity: 0, duration: 0.3, onComplete: () => modal.style.display = 'none' });

    // 0. Update Card Text for Poster Layout
    const messageBody = document.querySelector('.santa-body');
    // Intern Santa Specific Message (Warm, 3-line average)
    const internMessages = [
        `"Wishing you a very well and beautiful Christmas, ${userName}. We hope you enjoy this magical day with your family and loved ones, creating memories that last forever. May the coming New Year bring you endless joy and success."`,
        `"Merry Christmas to you and your family, ${userName}! May your home be filled with laughter, your heart with love, and your life with the warmth of the holiday season. We can't wait to see what amazing things we'll achieve together in 2026."`,
        `"Sending you our warmest wishes this holiday season, ${userName}. May the peace and joy of Christmas stay with you throughout the New Year. Thank you for being such an incredible part of our journey—here's to a bright year ahead!"`,
        `"To our wonderful ${userName}, we wish you a Christmas filled with wonder and a New Year overflowing with possibility. Take this time to cherish those closest to you and recharge for a spectacular year. You deserve the very best this season!"`,
        `"Happy Holidays, ${userName}! May your Christmas be as bright as the northern star and your New Year as promising as a fresh snowfall. We hope you have a relaxing time with family, filled with good food and even better company."`,
        `"Warmest thoughts and best wishes for a wonderful Christmas, ${userName}. May you find joy in the little things and peace in the quiet moments with family. Here's to a healthy, happy, and prosperous 2026 for all of us."`,
        `"Merry Christmas, ${userName}! We hope your day is wrapped in joy and tied with love. May the magic of the holidays bring a smile to your face and the spirit of the New Year bring new adventures to your doorstep."`,
        `"Wishing you a season of blessings and a year of happiness, ${userName}. May your Christmas dinner be long and your worries be short. We're so grateful to have you in our network and wish you a truly beautiful holiday break."`,
        `"To ${userName}: May the melody and spirit of the holidays fill your home with love and peace. We wish you a beautiful Christmas celebration with your family and a New Year that surpasses all your expectations. Happy days ahead!"`,
        `"A very Merry Christmas to you, ${userName}! May the holiday spirit ignite a spark of joy in your heart that lasts throughout 2026. Enjoy every moment with your family and may your New Year be as immutable and solid as our ledger of truth."`,
        `"Sending festive cheers your way, ${userName}! We hope your Christmas is full of warmth and your New Year is paved with success and new discoveries. Enjoy the festive treats and the company of those who matter most."`,
        `"Wishing you a Christmas that is merry and bright, and a New Year that is full of light, ${userName}. May you be surrounded by family and friends, sharing in the true spirit of the season. We appreciate everything you do!"`,
        `"Merry Christmas and a brilliant New Year, ${userName}! We hope you find time to slow down and enjoy the beauty of the season with your family. May your path in the coming year be clear and filled with wonderful surprises."`,
        `"Warmest holiday greetings to you, ${userName}. May your Christmas be filled with the songs of angels and the laughter of children. We wish you a peaceful transition into the New Year and look forward to building a great future together."`,
        `"To our dear ${userName}, wishing you a Christmas full of grace and a New Year full of energy. May your holiday season be a time of rest, reflection, and immense happiness with your loved ones. Cheers to a beautiful holiday!"`
    ];
    const randomMsg = internMessages[Math.floor(Math.random() * internMessages.length)];

    if (messageBody) messageBody.innerHTML = `${randomMsg}<br><br><span style="font-size: 0.8em; opacity: 0.8;">— Love, OpenLedger Intern Santa 🎅</span>`;

    const seasonGreeting = document.querySelector('.season-greeting');
    if (seasonGreeting) seasonGreeting.innerText = "Merry";

    const senderInfo = document.querySelector('.sender-info');
    if (senderInfo) senderInfo.innerText = "Christmas";

    // Update Recipient Name cleanly
    const recipientSpan = document.querySelector('.recipient-name'); // Class selector based on CSS
    if (recipientSpan) recipientSpan.innerText = userName;

    // 1. Hide "Unwrap" UI & Navbar (Focus Mode)
    gsap.to("#artifact-reveal .center-content", { opacity: 0, duration: 0.5, pointerEvents: "none" });
    gsap.to("nav", { opacity: 0, duration: 0.5 }); // Hide Navbar

    // 2. CINEMATIC MOVE (Gift & Camera)
    // Move Gift to Absolute Center
    gsap.to(giftGroup.position, {
        x: -5, // Align with camera target center
        y: 2.0,
        z: 0,  // Move closer to camera
        duration: 2.0,
        ease: "power2.inOut"
    });

    // Move Camera to Center Close-Up
    gsap.to(camera.position, {
        x: -5,
        y: 2.0,
        z: 8, // Zoom In 
        duration: 2.0,
        ease: "power2.inOut",
        onComplete: () => {
            // 3. UNWRAP ANIMATION (Scale Up then Poof)
            gsap.to(giftModel.scale, {
                x: 1.2, y: 1.2, z: 1.2, // Swell up
                duration: 0.3,
                yoyo: true,
                repeat: 1
            });

            // Spin fast
            gsap.to(giftGroup.rotation, {
                y: giftGroup.rotation.y + Math.PI * 4,
                duration: 0.8,
                ease: "power3.in"
            });

            // EXPLODE
            setTimeout(() => {
                gsap.to(giftModel.scale, { x: 0, y: 0, z: 0, duration: 0.2, ease: "back.in(2)" });
                explodeConfetti();
                startCelebration(); // Start ribbons and bg change

                // 5. Show Letter (Greeting Card Animated Entrance)
                setTimeout(() => {
                    const letter = document.getElementById('santa-letter');
                    const overlay = document.querySelector('.card-overlay');

                    if (letter && overlay) {
                        overlay.style.display = 'block';
                        letter.style.display = 'flex';

                        // Reset initial states for replay
                        gsap.set(".season-greeting, .sender-info, .recipient-box, .santa-body, .card-footer-decor, .card-actions", { opacity: 0, y: 15, scale: 0.98 });
                        // Specific reset to ensure visibility and centering without nuking display:flex
                        gsap.set(letter, {
                            xPercent: 0,
                            yPercent: 0,
                            x: 0,
                            y: 0,
                            scale: 0.9,
                            opacity: 0,
                            position: "fixed",
                            inset: "0",
                            margin: "auto",
                            display: "flex" // Reinforce display flex
                        });
                        gsap.set(overlay, { opacity: 0 });

                        const cardTl = gsap.timeline();

                        // 1. Fade in Overlay
                        cardTl.to(overlay, { opacity: 1, duration: 0.5 })
                            // 2. Pop Card Container
                            .to(letter, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.2)" }, "-=0.2")

                            // 3. Animate Text Elements Sequentially
                            .to(".season-greeting", { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power2.out" })
                            .to(".sender-info", { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" }, "-=0.2")
                            .to(".recipient-box", { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, "-=0.2")

                            .to(".santa-body", { opacity: 1, y: 0, scale: 1, duration: 0.5 }, "-=0.2")
                            .to(".card-actions", { opacity: 1, y: 0, duration: 0.5 }, "-=0.1");
                    }
                }, 800);
            }, 800);
        }
    }); // End of cinematic camera move
} // End of revealGiftSequence

// --- Restoring the Scene (Close Function) ---
function closeGift() {
    isGiftOpen = false;
    stopCelebration(); // Revert ribbons and bg change

    const letter = document.getElementById('santa-letter');
    const overlay = document.querySelector('.card-overlay');

    if (letter) {
        gsap.to(letter, {
            opacity: 0,
            scale: 0.9,
            duration: 0.4,
            ease: "power2.in",
            onComplete: () => {
                letter.style.display = 'none';
            }
        });
    }

    if (overlay) {
        gsap.to(overlay, {
            opacity: 0,
            duration: 0.4,
            onComplete: () => {
                overlay.style.display = 'none';
            }
        });
    }

    // 2. Clear Username Input for next time (Optional: nice UX)
    const usernameInput = document.getElementById('username-input');
    if (usernameInput) usernameInput.value = "";

    // 3. Respawn the Gift Box (Reverse Explosion)
    // First, Hide Confetti just in case
    gsap.to(confettiMat, { opacity: 0, duration: 0.5 });

    // Animate Box Back from "Center Stage" to "Original Position"
    // Original Pos: x: -15, y: 2.0, z: -5

    // Scale up from 0 (Assemblage Effect)
    gsap.to(giftModel.scale, { x: 12.0, y: 12.0, z: 12.0, duration: 0.8, ease: "back.out(1.2)", delay: 0.3 });

    gsap.to(giftGroup.position, {
        x: -9,
        y: 0.5,
        z: 0,
        duration: 1.5,
        ease: "power2.inOut"
    });

    gsap.to(giftGroup.rotation, {
        y: 0,
        duration: 1.5,
        ease: "power2.inOut"
    });

    // 4. Move Camera Back to Section View
    gsap.to(camera.position, {
        x: 0,
        y: 2,
        z: 8, // Original safe spot
        duration: 1.5,
        ease: "power2.inOut"
    });

    /* 5. Restore UI (Instructions & Claims) */
    setTimeout(() => {
        // Restore the main container's interactivity first
        gsap.to("#artifact-reveal .center-content", { opacity: 1, duration: 0.5, pointerEvents: "all" });

        const instruction = document.getElementById('santa-instruction');
        const claimBtn = document.getElementById('claim-stake-btn');
        const nav = document.querySelector('nav');

        // Show instruction block
        if (instruction) {
            instruction.style.display = 'block';
            gsap.to(instruction, { opacity: 1, duration: 0.5 });
        }

        // Explicitly show button again
        if (claimBtn) {
            claimBtn.style.display = 'inline-block';
            gsap.to(claimBtn, { opacity: 1, duration: 0.5 });
        }

        // Show Nav Bar
        if (nav) gsap.to(nav, { opacity: 1, duration: 0.5 });

        // Ensure Asset Display is hidden
        const assetDisplay = document.getElementById('verified-asset-display');
        if (assetDisplay) {
            assetDisplay.style.display = 'none';
            assetDisplay.style.opacity = '0';
        }

    }, 1000);
}

// Ensure close button is wired up for Greeting Card
const finalCloseBtn = document.getElementById('close-letter');
if (finalCloseBtn) {
    finalCloseBtn.onclick = (e) => {
        e.stopPropagation();
        closeGift();
    };
}



// Event Listeners for Modal
setTimeout(() => {
    const submitNameBtn = document.getElementById('submit-name-btn');
    const usernameInput = document.getElementById('username-input');
    const cancelModalBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('username-modal');

    if (submitNameBtn && usernameInput) {
        submitNameBtn.onclick = (e) => {
            e.stopPropagation();
            if (usernameInput.value.trim() !== "") {
                userName = usernameInput.value.trim();
            } else {
                userName = "Builder";
            }
            revealGiftSequence();
        };

        // Enter key support
        usernameInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (usernameInput.value.trim() !== "") {
                    userName = usernameInput.value.trim();
                } else {
                    userName = "Builder";
                }
                revealGiftSequence();
            }
        };
    }

    if (cancelModalBtn && modal) {
        cancelModalBtn.onclick = (e) => {
            e.stopPropagation();
            // Close modal and restore initial state
            gsap.to(modal, {
                opacity: 0, duration: 0.3, onComplete: () => {
                    modal.style.display = 'none';
                    // Restore interaction buttons
                    const instruction = document.getElementById('santa-instruction');
                    const claimBtn = document.getElementById('claim-stake-btn');
                    if (instruction) { instruction.style.display = 'block'; gsap.to(instruction, { opacity: 1 }); }
                    if (claimBtn) { claimBtn.style.display = 'inline-block'; gsap.to(claimBtn, { opacity: 1 }); }
                }
            });
        };
    }
    // Download Card Logic
    const downloadBtn = document.getElementById('download-card-btn');
    if (downloadBtn) {
        downloadBtn.onclick = (e) => {
            e.stopPropagation();
            const cardElement = document.getElementById('santa-letter');
            const actions = document.querySelector('.card-actions');
            if (actions) actions.style.display = 'none';

            if (typeof html2canvas === 'undefined') {
                alert("Greeting Card generator is loading... please try again in a moment.");
                if (actions) actions.style.display = 'flex';
                return;
            }

            html2canvas(cardElement, {
                backgroundColor: null,
                scale: 3,
                useCORS: true,
                logging: false
            }).then(canvas => {
                if (actions) actions.style.display = 'flex';
                const link = document.createElement('a');
                link.download = `OpenLedger-Gift-${userName}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }).catch(err => {
                console.error("Capture failed:", err);
                if (actions) actions.style.display = 'flex';
            });
        };
    }
}, 500);

// Duplicate closeGift() removed


// --- Scroll / Animation ---

const isMobile = window.innerWidth < 768;
const cameraTarget = new THREE.Vector3(0, 2, 0);

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "#main-wrapper",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.0,
    }
});

// Scene 0: Video Hero -> Mascot Showcase
tl.to(heroGroup.position, {
    x: isMobile ? 0 : 3.5,
    y: isMobile ? -1.5 : 1.0, // Move down on mobile to clear text
    z: 0,
    duration: 2.0,
    ease: "power2.out"
}, "scene0")
    .to(heroGroup.rotation, {
        x: 0.05,
        y: isMobile ? -0.1 : -0.8,
        z: 0.0,
        duration: 2.0,
        ease: "power2.inOut"
    }, "scene0")
    .to(camera.position, {
        x: 0,
        y: 1.5,
        z: isMobile ? 12 : 9, // Further zoom on mobile
        duration: 2.0,
        ease: "power2.inOut"
    }, "scene0")
    // 4. Reveal Text - STAGGERED
    .to([
        "#mascot-showcase .hero-lead-in",
        "#mascot-showcase .hero-main-title",
        "#mascot-showcase .christmas-subtitle",
        "#mascot-showcase .premium-btn"
    ], {
        y: 0,
        opacity: 1,
        duration: 1.0,
        stagger: 0.1,
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
    duration: isMobile ? 0 : 0.5,
    ease: "expo.in"
}, "scene1")
    // Hide Particles
    .to([softSnowMat, dustMat, starsMat], { opacity: 0, duration: isMobile ? 0 : 0.5 }, "scene1")
    // Close Curtains
    .to([leftCurtain, rightCurtain], {
        scaleX: isMobile ? 0 : 1,
        duration: isMobile ? 0 : 0.8,
        ease: "circ.inOut",
        onStart: () => {
            if (!isMobile) {
                const transSfx = document.getElementById('transition-sfx');
                if (transSfx) {
                    transSfx.volume = 0.4;
                    transSfx.play().catch(e => console.log("Audio blocked"));
                }
            }
        }
    }, "scene1+=0.3")

    // Move Camera Behind Curtains
    .to(camera.position, { x: 0, y: 0, z: -5, duration: 0.1 }, "scene1+=1.1") // Teleport
    .to(cameraTarget, { x: 0, y: 0, z: -20, duration: 0.1 }, "scene1+=1.1")
    .to(highlightGroup.scale, { x: 0, y: 0, z: 0, duration: 0.1 }, "scene1+=1.1")
    .to(heroGroup.scale, { x: 0, y: 0, z: 0, duration: 0.1 }, "scene1+=1.1")

    // Open Curtains
    .to([leftCurtain, rightCurtain], { scaleX: 0, duration: isMobile ? 0 : 0.8, ease: "circ.inOut" }, "scene1+=1.2")

    // Reveal Crystal Orb
    .to(crystalGroup.position, { x: isMobile ? 0 : -6, duration: 0 }, "scene1+=1.5")
    .to(crystalGroup.scale, {
        x: isMobile ? 0 : 1, y: isMobile ? 0 : 1, z: isMobile ? 0 : 1,
        duration: isMobile ? 0 : 1.5,
        ease: "back.out(1.2)"
    }, "scene1+=1.5")

    // Restore Particles
    .to(softSnowMat, { opacity: 0.7, duration: isMobile ? 0 : 1.5 }, "scene1+=1.5")
    .to(dustMat, { opacity: 0.5, duration: isMobile ? 0 : 1.5 }, "scene1+=1.5")
    .to(starsMat, { opacity: 0.8, duration: isMobile ? 0 : 1.5 }, "scene1+=1.5")

    // Reveal Crystalline Content
    .to("#crystalline-network .content-block", {
        opacity: isMobile ? 0 : 1,
        y: 0,
        duration: isMobile ? 0 : 1.0,
        ease: "power2.out"
    }, "scene1+=1.5");



// Scene 2: Crystal Orb -> Forge
// Forge at (20, 2, -5)
tl.to(camera.position, {
    x: 20,
    y: 2.5,
    z: 7,
    duration: isMobile ? 0 : 1.5,
    ease: "power3.inOut"
}, "scene2")
    .to(cameraTarget, {
        x: 20,
        y: 2,
        z: -5,
        duration: isMobile ? 0 : 1.5,
        ease: "power2.inOut"
    }, "scene2")
    // Hide Crystal
    .to(crystalGroup.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: isMobile ? 0 : 0.5
    }, "scene2")

    // Beacon Activate
    .to(beaconLight, {
        intensity: isMobile ? 0 : 3,
        duration: isMobile ? 0 : 0.3
    }, "scene2+=1.3")

    // Reveal Forge Content
    .to("#model-factory-forge .content-block", {
        opacity: isMobile ? 0 : 1,
        y: 0,
        duration: isMobile ? 0 : 1.0,
        ease: "power2.out"
    }, "scene2+=1.0");



// --- NEW SECTION: GIFT TEASER (Scene 2.5) ---
tl.to({}, { duration: 0.5 }, ">") // Pause

    // 1. Hide Forge Content
    .to("#model-factory-forge .content-block", { opacity: 0, y: -20, duration: 0.5 }, "sceneTeaser")
    // Hide Forge 3D
    .to(forgeGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5 }, "sceneTeaser")
    // HIDE HERO (SANTA) ON MOBILE - Ensure it doesn't linger
    .to(heroGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5 }, "sceneTeaser")

    .to(camera.position, { // Fly transition
        x: 0,
        y: isMobile ? 8 : 5,
        z: isMobile ? 40 : 30, // Stay further back on mobile
        duration: 2.0,
        ease: "power2.inOut"
    }, "sceneTeaser")

    // 2. Reveal Teaser Text
    .to("#gift-teaser .teaser-glass-container", {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: "power2.out"
    }, "sceneTeaser+=0.5")

    // Pause for reading
    .to({}, { duration: 1.5 })

    // 3. Hide Teaser Text
    .to("#gift-teaser .teaser-glass-container", {
        opacity: 0,
        y: -20,
        duration: 0.5
    }, "sceneTeaserEnd");


// Scene 3: Teaser -> Gift (SPLIT VIEW)
// Gift Box at (-15, 2.0, -5) -> We will frame it on the LEFT
tl.to(camera.position, {
    x: isMobile ? -5 : -5,
    y: isMobile ? 3.0 : 2.0,
    z: isMobile ? 18 : 12,
    duration: 1.5,
    ease: "power2.inOut"
}, "scene3")
    // Hide Forge/Teaser if not already hidden
    .to(forgeGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5 }, "scene3")
    .to(cameraTarget, {
        x: isMobile ? -5 : -5,
        y: isMobile ? 1.0 : 2.0,
        z: -5,
        duration: 1.5,
        ease: "power2.inOut"
    }, "scene3")

    // Reveal Gift Box
    .to(giftGroup.scale, { x: 1, y: 1, z: 1, duration: 1.0 }, "scene3")

    // Reveal Gift Content - Staggered (ON THE RIGHT)
    .to("#artifact-reveal .center-content h2, #artifact-reveal .center-content p, #artifact-reveal .center-content button, #artifact-reveal .instruction-text", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out"
    }, "scene3+=0.5");


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
        if (!isGiftOpen) {
            // Only float/rotate when IDLE. 
            // When open (isGiftOpen = true), GSAP controls position completely.
            giftGroup.position.y = 2.0 + Math.sin(t * 1) * 0.1; // Base 2.0 matches setup
            giftGroup.rotation.y = t * 0.2;
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

// --- Interactive Teaser Logic ---
const teaserSection = document.querySelector('.interactive-teaser');
const teaserCard = document.querySelector('.teaser-glass-box');

if (teaserSection && teaserCard) {
    // Mouse Tracking for Parallax & Tilt
    teaserSection.addEventListener('mousemove', (e) => {
        const rect = teaserSection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const xNorm = (x / rect.width) * 2 - 1;
        const yNorm = (y / rect.height) * 2 - 1;

        // Parallax for the card
        gsap.to(teaserCard, {
            x: xNorm * 20,
            y: yNorm * 20,
            rotationX: -yNorm * 8,
            rotationY: xNorm * 8,
            duration: 0.8,
            ease: "power2.out"
        });

        // Inverse parallax for the title inside for depth
        const title = teaserCard.querySelector('.teaser-title');
        if (title) {
            gsap.to(title, {
                x: -xNorm * 10,
                y: -yNorm * 10,
                duration: 0.8,
                ease: "power2.out"
            });
        }
    });

    // Reset on leave
    teaserSection.addEventListener('mouseleave', () => {
        gsap.to(teaserCard, { x: 0, y: 0, rotationX: 0, rotationY: 0, duration: 1.2, ease: "elastic.out(1, 0.5)" });
        const title = teaserCard.querySelector('.teaser-title');
        if (title) {
            gsap.to(title, { x: 0, y: 0, duration: 1.2, ease: "elastic.out(1, 0.5)" });
        }
    });
}

// --- Canvas Matrix Rain (Subtle Gold) Logic ---
const canvasEl = document.getElementById('teaser-canvas');
if (canvasEl) {
    const ctx = canvasEl.getContext('2d');
    // Initialize dimensions immediately
    let width = canvasEl.offsetWidth || window.innerWidth;
    let height = canvasEl.offsetHeight || window.innerHeight;
    canvasEl.width = width;
    canvasEl.height = height;

    // Resizing
    const resizeObserver = new ResizeObserver(() => {
        width = canvasEl.offsetWidth;
        height = canvasEl.offsetHeight;
        canvasEl.width = width;
        canvasEl.height = height;
    });
    resizeObserver.observe(canvasEl);

    /* Particles */
    const columns = 40;
    const drops = [];

    // Initialize drops
    for (let x = 0; x < columns; x++) {
        drops[x] = {
            x: Math.random() * width,
            y: Math.random() * height,
            speed: 1 + Math.random() * 2,
            length: 10 + Math.random() * 20,
            alpha: 0.1 + Math.random() * 0.3
        };
    }

    // Interaction Force
    let mouseX = -1000;
    let mouseY = -1000;

    canvasEl.parentElement.addEventListener('mousemove', (e) => {
        const rect = canvasEl.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvasEl.parentElement.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
    });

    const draw = () => {
        // Clear with fade for trail (optional, but clean clear is better for this style)
        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(212, 175, 55, 0.4)"; // Gold
        ctx.lineWidth = 1;

        drops.forEach(d => {
            // Draw Line
            ctx.beginPath();
            const grad = ctx.createLinearGradient(d.x, d.y, d.x, d.y - d.length);
            grad.addColorStop(0, `rgba(212, 175, 55, ${d.alpha})`); // Head
            grad.addColorStop(1, `rgba(212, 175, 55, 0)`); // Tail
            ctx.strokeStyle = grad;
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x, d.y - d.length);
            ctx.stroke();

            // Move
            d.y += d.speed;

            // Reset
            if (d.y - d.length > height) {
                d.y = -d.length;
                d.x = Math.random() * width;
                d.speed = 1 + Math.random() * 2;
            }

            // Interaction: Mouse repels drops horizontally
            const dist = Math.abs(d.x - mouseX);
            const yDist = Math.abs(d.y - mouseY);
            if (dist < 100 && yDist < 300) {
                if (d.x < mouseX) d.x -= 2;
                else d.x += 2;
            }
        });

        requestAnimationFrame(draw);
    };

    draw();
}
// --- Celebration Handlers ---

const sprinklerCanvas = document.getElementById('party-sprinklers');
const sCtx = sprinklerCanvas ? sprinklerCanvas.getContext('2d') : null;
let sWidth, sHeight;
const ribbons = [];

function initSprinklers() {
    if (!sprinklerCanvas) return;
    sWidth = window.innerWidth;
    sHeight = window.innerHeight;
    sprinklerCanvas.width = sWidth;
    sprinklerCanvas.height = sHeight;
}

window.addEventListener('resize', initSprinklers);
initSprinklers();

class ConfettiParticle {
    constructor() {
        this.reset();
    }
    reset(side) {
        // Randomize burst origin based on side
        const isLeft = side === 'left' || (side === undefined && Math.random() > 0.5);
        this.x = isLeft ? 0 : sWidth;
        this.y = sHeight * 0.7; // Lower burst

        // Stronger initial burst
        const force = 15 + Math.random() * 20;
        const angle = isLeft ? (Math.random() * -Math.PI / 3) : (Math.PI + Math.random() * Math.PI / 3);

        this.vx = Math.cos(angle) * force;
        this.vy = Math.sin(angle) * force - 10; // Upward bias

        this.grav = 0.3;
        this.friction = 0.96;

        // Vibrant Palette matching the user image
        this.color = [`#ff0055`, `#00ff44`, `#0088ff`, `#ffff00`, `#ff00ff`, `#ffffff`][Math.floor(Math.random() * 6)];

        this.life = 1.0;
        this.decay = 0.005 + Math.random() * 0.01;
        this.width = 10 + Math.random() * 15;
        this.height = 5 + Math.random() * 10;
        this.angle = Math.random() * Math.PI * 2;
        this.angleVel = (Math.random() - 0.5) * 0.3;
    }
    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.grav;
        this.angle += this.angleVel;
        this.life -= this.decay;

        if (this.life <= 0 && sprinklerActive) this.reset();
    }
    draw() {
        sCtx.save();
        sCtx.translate(this.x, this.y);
        sCtx.rotate(this.angle);
        sCtx.fillStyle = this.color;
        sCtx.globalAlpha = this.life;
        sCtx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        sCtx.restore();
    }
}

// Pre-fill particles
for (let i = 0; i < 150; i++) ribbons.push(new ConfettiParticle());

function animateSprinklers() {
    if (!sprinklerActive) return;
    sCtx.clearRect(0, 0, sWidth, sHeight);
    ribbons.forEach(r => {
        r.update();
        r.draw();
    });
    requestAnimationFrame(animateSprinklers);
}

function startCelebration() {
    sprinklerActive = true;
    document.body.classList.add('celebration-active');
    if (sprinklerCanvas) sprinklerCanvas.style.display = 'block';

    // Initial burst from sides
    ribbons.forEach((r, i) => {
        r.reset(i < ribbons.length / 2 ? 'left' : 'right');
    });

    // Play Audio
    const revealSfx = document.getElementById('reveal-sfx');
    const holidayBgm = document.getElementById('holiday-bgm');

    if (revealSfx) {
        revealSfx.volume = 0.5;
        revealSfx.play().catch(e => console.log("Audio blocked: click required"));
    }
    if (holidayBgm) {
        holidayBgm.volume = 0.3;
        holidayBgm.play().catch(e => console.log("Audio blocked: click required"));
    }

    animateSprinklers();
}

function stopCelebration() {
    sprinklerActive = false;
    document.body.classList.remove('celebration-active');

    // Fade out Music
    const holidayBgm = document.getElementById('holiday-bgm');
    if (holidayBgm) {
        gsap.to(holidayBgm, {
            volume: 0, duration: 1, onComplete: () => {
                holidayBgm.pause();
                holidayBgm.currentTime = 0;
            }
        });
    }

    if (sprinklerCanvas) {
        gsap.to(sprinklerCanvas, {
            opacity: 0, duration: 0.5, onComplete: () => {
                sprinklerCanvas.style.display = 'none';
                sprinklerCanvas.style.opacity = '1';
            }
        });
    }
}
