import './style.css';
// import './preloader.js'; // Handled in main.js now
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

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

// 2. Global Particles (Snow)
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 3000;
const posArray = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 60;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.08,
    color: CONFIG.colors.silver,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// 3. Narrative Objects
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
        tl.to(loaderContent, { opacity: 0, duration: 0.5 })
            .to(beamCore, { width: '100%', duration: 0.8, ease: "power4.inOut" }, "-=0.2")
            .to(beamFlare, { width: '200vw', height: '200vw', opacity: 1, duration: 1, ease: "power2.out" }, "<")
            .to(preloader, { opacity: 0, duration: 1.5, ease: "power2.inOut" }, "-=0.5");
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

    // Normalize scale to fit roughly in 7 units (Increased size per user request)
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
heroGroup.position.set(3.2, 1.5, 0); // Moved Up
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
    color: 0x00ffff, // Cyan
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
    color: 0x0088ff,
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

// 1. Core Module (Body)
const coreModGeo = new THREE.CylinderGeometry(0.8, 1.0, 3, 16);
coreModGeo.rotateZ(Math.PI / 2); // Horizontal
const coreMod = new THREE.Mesh(coreModGeo, sleighRedMat); // Red Body
forgeGroup.add(coreMod);

// 2. Engine Module (Thrusters)
const engineModGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const engineMod = new THREE.Mesh(engineModGeo, sleighRedMat); // Red
// Add Gold detail to engine
const detailGeo = new THREE.TorusGeometry(0.5, 0.1, 8, 16);
const detailMesh = new THREE.Mesh(detailGeo, sleigGoldMat);
detailMesh.position.x = 0.8;
detailMesh.rotation.y = Math.PI / 2;
engineMod.add(detailMesh);

// Start position (expanded)
engineMod.position.set(4, 0, 0);
forgeGroup.add(engineMod);

// 3. Sensor Module (Nose Cone)
const sensorModGeo = new THREE.ConeGeometry(0.6, 1.5, 16);
sensorModGeo.rotateZ(-Math.PI / 2);
const sensorMod = new THREE.Mesh(sensorModGeo, sleighRedMat); // Red
// Rudolph Nose (Emissive Tip)
const noseGeo = new THREE.SphereGeometry(0.3);
const noseMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 });
const noseMesh = new THREE.Mesh(noseGeo, noseMat);
noseMesh.position.y = 0.8; // On the tip (which is rotated Y relative to cone group? No, cone is rotated Z)
// Relative to rotated cone... tip is at +X in global, but +Y in local.
noseMesh.position.set(0, 0.75, 0);
sensorMod.add(noseMesh);

// Start position (expanded)
sensorMod.position.set(-4, 0, 0);
forgeGroup.add(sensorMod);

// Attribution Beacon (Now a "Star" or "Attribution Authenticated" light)
const beaconLight = new THREE.PointLight(0xd4af37, 0, 5); // Gold light
beaconLight.position.set(0, 1.5, 0);
forgeGroup.add(beaconLight);

// Beacon Ring (Halo)
const beaconMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.05, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.8 })
);
beaconMesh.rotation.x = Math.PI / 2;
beaconMesh.position.set(0, 1.2, 0);
beaconMesh.scale.set(0, 0, 0); // Hidden initially
forgeGroup.add(beaconMesh);

// Platform/Docking Bay (Green Hologram)
const dockGeo = new THREE.RingGeometry(3, 3.2, 32);
const dockMat = new THREE.MeshBasicMaterial({ color: 0x00aa00, side: THREE.DoubleSide, transparent: true, opacity: 0.3 }); // Green dock
const dockRing = new THREE.Mesh(dockGeo, dockMat);
dockRing.rotation.x = Math.PI / 2;
dockRing.position.y = -1.5;
forgeGroup.add(dockRing);

forgeGroup.position.set(20, 2, -5);
scene.add(forgeGroup);


// D. Gift Box (Premium Procedural)
const giftGroup = new THREE.Group();

// Main Box
const boxGeo = new THREE.BoxGeometry(2, 2, 2);
const boxMat = new THREE.MeshStandardMaterial({
    color: 0xaa0000, // Rich Red
    roughness: 0.1, // Shiny
    metalness: 0.6,
    envMapIntensity: 1.5
});
const giftBox = new THREE.Mesh(boxGeo, boxMat);
giftGroup.add(giftBox);

// Ribbons (Torus cross)
const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Gold
    roughness: 0.2,
    metalness: 1.0
});
const rib1 = new THREE.Mesh(new THREE.BoxGeometry(2.05, 2.05, 0.4), ribbonMat);
const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.05, 2.05), ribbonMat);
giftGroup.add(rib1);
giftGroup.add(rib2);

// Bow (Spheres/Torus)
const bowGeo = new THREE.TorusKnotGeometry(0.5, 0.1, 64, 8);
const bow = new THREE.Mesh(bowGeo, ribbonMat);
bow.position.y = 1.2;
giftGroup.add(bow);

// Inner Light (For Atmosphere)
const innerLight = new THREE.PointLight(CONFIG.colors.giftInside, 0, 8);
innerLight.position.set(0, 0, 0);
giftGroup.add(innerLight);

giftGroup.position.set(-15, 0.75, -5);
scene.add(giftGroup);


// --- Scroll / Animation ---

const cameraTarget = new THREE.Vector3(0, 2, 0);

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "#main-wrapper",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
        // snap: 1 / 4 // Optional: snap to sections
    }
});

// Scene 0: Mascot -> Hero (Right to Center)
// Move Sleigh from Right to Center
tl.to(heroGroup.position, {
    x: 0,
    y: 0.0,
    z: 1, // Bring closer
    duration: 1.5,
    ease: "power2.inOut"
}, "scene0")
    .to(heroGroup.rotation, {
        x: 0,
        y: 0.2, // Face front-right gently
        z: 0,
        duration: 1.5,
        ease: "power2.inOut"
    }, "scene0")
    // Ensure camera looks solid
    .to(camera.position, {
        x: 0,
        y: 2,
        z: 9,
        duration: 1.5,
        ease: "power2.inOut"
    }, "scene0");

// Scene 1: Hero -> Crystalline Network (Curtain Transition)
const leftCurtain = document.querySelector('.curtain-left');
const rightCurtain = document.querySelector('.curtain-right');

tl.to(camera.position, {
    x: 0,
    y: 0,
    z: 10,
    duration: 0.5,
    ease: "power2.in"
}, "scene1")
    // Close Curtains
    .to([leftCurtain, rightCurtain], { scaleX: 1, duration: 0.8, ease: "circ.inOut" }, "scene1+=0.3")

    // Move Camera Behind Curtains
    .to(camera.position, { x: 0, y: 0, z: -5, duration: 0.1 }, "scene1+=1.1") // Teleport
    .to(cameraTarget, { x: 0, y: 0, z: -20, duration: 0.1 }, "scene1+=1.1")
    .to(highlightGroup.scale, { x: 0, y: 0, z: 0, duration: 0.1 }, "scene1+=1.1")

    // Open Curtains
    .to([leftCurtain, rightCurtain], { scaleX: 0, duration: 0.8, ease: "circ.inOut" }, "scene1+=1.2")

    // Reveal Crystal Orb
    .to(crystalGroup.scale, {
        x: 1, y: 1, z: 1,
        duration: 1.5,
        ease: "back.out(1.2)"
    }, "scene1+=1.5");


// Scene 2: Crystal Orb -> Forge
// Forge at (20, 2, -5)
tl.to(camera.position, {
    x: 20,
    y: 4,
    z: 5,
    duration: 1.5,
    ease: "power2.inOut"
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

    // Animate Forge Assembly
    .to(engineMod.position, {
        x: 1.2, // Snap to core (Core width 2/2 = 1? Core Cylinder height 2. Radius 0.8)
        // Cylinder height is along X axis due to rotation. height 2.
        // Left side is -1, Right side is +1.
        // Engine is on Right (+x)?
        // Wait, Engine start at 4. Snap to 1.1 (gap) or 1.
        x: 1.1,
        duration: 1,
        ease: "back.out(1.7)"
    }, "scene2+=0.5")
    .to(sensorMod.position, {
        x: -1.1,
        duration: 1,
        ease: "back.out(1.7)"
    }, "scene2+=0.5") // Simultaneous snap

    // Beacon Activate
    .to(beaconMesh.scale, {
        x: 1, y: 1, z: 1,
        duration: 0.3
    }, "scene2+=1.3")
    .to(beaconLight, {
        intensity: 2,
        duration: 0.3
    }, "scene2+=1.3");

// Scene 3: Forge -> Gift
// Gift at (-15, 0.75, -5)
tl.to(camera.position, {
    x: -10,
    y: 3,
    z: 2,
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
        y: 1,
        z: -5,
        duration: 1.5,
        ease: "power2.inOut"
    }, "scene3")
    // Open Gift (Float & Glow since we can't guarantee lid structure)
    .to(giftGroup.position, {
        y: 1.5,
        duration: 1,
        ease: "power2.inOut"
    }, "scene3+=0.5")
    .to(giftGroup.rotation, {
        y: Math.PI * 2,
        duration: 2,
        ease: "power1.inOut"
    }, "scene3+=0.5")
    .to(innerLight, {
        intensity: 8,
        distance: 10,
        duration: 1
    }, "scene3+=0.5");


// --- Window Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Lenis ---
const lenis = new Lenis({
    duration: 2.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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
    particlesMesh.rotation.y = t * 0.05;

    // Crystal Orb Animation
    if (crystalGroup) {
        crystalGroup.rotation.y = t * 0.1;
        crystalGroup.rotation.z = Math.sin(t * 0.1) * 0.05;
        if (innerLines) {
            innerLines.rotation.x = t * 0.2;
        }
    }

    // Gift Animation
    if (giftGroup) {
        giftGroup.position.y = 0.75 + Math.sin(t * 1) * 0.1;
    }

    // Forge Animation
    if (forgeGroup) {
        forgeGroup.position.y = 2 + Math.sin(t * 0.5) * 0.2; // Gentle Float
        // Maybe rotate the dock ring?
        if (forgeGroup.children[4]) { // dockRing is likely index 4 or similar, lets search by type or var if strictly needed, but simple is ok here or just access child
            // Actually, I can't access 'dockRing' var here as it is scoped.
            // But I added it to forgeGroup.
            // Let's just rotate the whole group slightly or nothing.
        }
    }

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
