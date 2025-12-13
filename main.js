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


// B. The Constellation Tracer
const constellationGroup = new THREE.Group();

// 1. The Core (Sticky Central Data Point)
const coreGeo = new THREE.SphereGeometry(0.5, 32, 32);
const coreMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.beam,
    emissive: 0x0088ff,
    emissiveIntensity: 2,
    roughness: 0.1
});
const coreMesh = new THREE.Mesh(coreGeo, coreMat);
constellationGroup.add(coreMesh);

// 2. Nodes & Lines
const nodeCount = 100; // Countless nodes
const nodesGeo = new THREE.BufferGeometry();
const linesGeo = new THREE.BufferGeometry();

const nodesPos = [];
const linesPos = [];

const constRadius = 15;

for (let i = 0; i < nodeCount; i++) {
    // Random position in a sphere around core
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 4 + Math.random() * constRadius; // Minimum distance

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    nodesPos.push(x, y, z);

    // Line from Center (0,0,0) to Node (x,y,z)
    linesPos.push(0, 0, 0); // Start
    linesPos.push(x, y, z); // End
}

nodesGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodesPos, 3));
linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linesPos, 3));

const nodesMat = new THREE.PointsMaterial({
    color: CONFIG.colors.silver,
    size: 0.1,
    transparent: true,
    opacity: 0.8
});
const nodesMesh = new THREE.Points(nodesGeo, nodesMat);
constellationGroup.add(nodesMesh);

const linesMat = new THREE.LineBasicMaterial({
    color: 0x4fc3f7,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending
});
const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
linesMesh.geometry.setDrawRange(0, 0); // Start hidden
constellationGroup.add(linesMesh);

constellationGroup.position.set(0, 5, -20); // Deep in space
scene.add(constellationGroup);


// C. The Model Factory Forge
const forgeGroup = new THREE.Group();

// Vessel Modules (Abstract Representation)
const vesselMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    roughness: 0.2,
    metalness: 0.8,
    envMapIntensity: 1
});

// 1. Core Module (Center)
const coreModGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
coreModGeo.rotateZ(Math.PI / 2); // Horizontal
const coreMod = new THREE.Mesh(coreModGeo, vesselMaterial);
forgeGroup.add(coreMod);

// 2. Engine Module (Rear)
const engineModGeo = new THREE.BoxGeometry(2, 1.2, 1.2);
const engineMod = new THREE.Mesh(engineModGeo, vesselMaterial);
// Start position (expanded)
engineMod.position.set(4, 0, 0);
forgeGroup.add(engineMod);

// 3. Sensor Module (Front)
const sensorModGeo = new THREE.ConeGeometry(0.6, 1.5, 16);
sensorModGeo.rotateZ(-Math.PI / 2); // Point forward
const sensorMod = new THREE.Mesh(sensorModGeo, vesselMaterial);
// Start position (expanded)
sensorMod.position.set(-4, 0, 0);
forgeGroup.add(sensorMod);

// Attribution Beacon (Light)
const beaconLight = new THREE.PointLight(0x00ff00, 0, 5); // Green "Success" light, starts off
beaconLight.position.set(0, 1.5, 0);
forgeGroup.add(beaconLight);

// Beacon Mesh (Visual indicator)
const beaconMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.2),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 })
);
beaconMesh.position.set(0, 1.2, 0);
beaconMesh.scale.set(0, 0, 0); // Hidden initially
forgeGroup.add(beaconMesh);

// Platform/Docking Bay (Wireframe for "Forge" feel)
const dockGeo = new THREE.RingGeometry(3, 3.2, 32);
const dockMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.beam, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
const dockRing = new THREE.Mesh(dockGeo, dockMat);
dockRing.rotation.x = Math.PI / 2;
dockRing.position.y = -1.5;
forgeGroup.add(dockRing);

forgeGroup.position.set(20, 2, -5);
scene.add(forgeGroup);


// D. Gift Box
const giftGroup = new THREE.Group();
const boxGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const boxMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.red,
    roughness: 0.3,
    metalness: 0.2
});
const boxBottom = new THREE.Mesh(boxGeo, boxMat);
giftGroup.add(boxBottom);

// Inner Light (Hidden initially)
const innerLight = new THREE.PointLight(CONFIG.colors.giftInside, 0, 5);
innerLight.position.set(0, 0.5, 0);
giftGroup.add(innerLight);

// Inner Glow Mesh
const innerGlow = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.1, 1.4),
    new THREE.MeshBasicMaterial({ color: CONFIG.colors.giftInside })
);
innerGlow.position.y = 0.5;
giftGroup.add(innerGlow);

const lidGeo = new THREE.BoxGeometry(1.6, 0.3, 1.6);
const lidMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.gold,
    roughness: 0.2,
    metalness: 0.9
});
const lid = new THREE.Mesh(lidGeo, lidMat);
lid.position.y = 0.9;
giftGroup.add(lid);

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

// Scene 1: Hero -> Constellation Tracer
// Constellation at (0, 5, -20)
// Camera moves to view it from a distance, creating "zoom out" effect
tl.to(camera.position, {
    x: 0,
    y: 5,
    z: -5, // Viewing position (15 units away from core)
    duration: 1.5,
    ease: "power2.inOut"
}, "scene1")
    .to(cameraTarget, {
        x: 0,
        y: 5,
        z: -20, // Look at Core
        duration: 1.5,
        ease: "power2.inOut"
    }, "scene1")
    // Hide Mascot Highlight
    .to(highlightGroup.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5
    }, "scene1")
    // Animate Lines shooting out
    .to({ val: 0 }, {
        val: nodeCount * 2,
        duration: 2,
        ease: "none", // Linear speed for "robotic/laser" feel
        onUpdate: function () {
            linesMesh.geometry.setDrawRange(0, Math.floor(this.targets()[0].val));
        }
    }, "scene1+=0.5");

// Scene 2: Constellation -> Forge
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
    // Hide Constellation (Fade out lines?)
    .to(constellationGroup.scale, {
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
    // Open Gift
    .to(lid.position, {
        y: 2.5,
        rotation: -0.5,
        duration: 0.5
    }, "scene3+=0.5")
    .to(innerLight, {
        intensity: 5,
        duration: 0.5
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

    // Constellation Animation
    if (constellationGroup) {
        constellationGroup.rotation.y = t * 0.05;
        constellationGroup.rotation.z = Math.sin(t * 0.2) * 0.05;
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
