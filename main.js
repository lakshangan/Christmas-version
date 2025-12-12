import './style.css';
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
scene.background = new THREE.Color(CONFIG.colors.bg);
scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.02);

const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, window.innerWidth / window.innerHeight, CONFIG.camera.near, CONFIG.camera.far);
camera.position.set(0, 2, 8);

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

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

// 1. Reflective Floor (Ice Lake)
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

// A. Hero: Santa Sleigh (GLB)
const heroGroup = new THREE.Group();
let santaModel = null;
const loader = new GLTFLoader();

loader.load('/santa_sleigh.glb', (gltf) => {
    santaModel = gltf.scene;
    // Center and scale the model
    const box = new THREE.Box3().setFromObject(santaModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    santaModel.position.x += (santaModel.position.x - center.x);
    santaModel.position.y += (santaModel.position.y - center.y);
    santaModel.position.z += (santaModel.position.z - center.z);

    // Normalize scale to fit roughly in 2-3 units
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 3 / maxDim;
    santaModel.scale.setScalar(scaleFactor);

    santaModel.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            // Enhance materials for premium look
            if (node.material) {
                node.material.metalness = 0.3;
                node.material.roughness = 0.4;
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

// Add orbital rings to Hero (keep these for abstract tech feel)
const ringGeo = new THREE.TorusGeometry(2, 0.02, 16, 100);
const ringMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.gold, transparent: true, opacity: 0.5 });
const ring1 = new THREE.Mesh(ringGeo, ringMat);
const ring2 = new THREE.Mesh(ringGeo, ringMat);
ring1.rotation.x = Math.PI / 2 + 0.2;
ring2.rotation.y = Math.PI / 2 + 0.2;
heroGroup.add(ring1);
heroGroup.add(ring2);

heroGroup.position.set(0, 2, 0);
scene.add(heroGroup);


// B. The Truth Beam (With Data Stream)
const beamGroup = new THREE.Group();
// Main beam
const beamMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 30, 32),
    new THREE.MeshBasicMaterial({ color: CONFIG.colors.beam, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })
);
beamGroup.add(beamMesh);

// Outer Glow
const outerBeamMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 30, 32),
    new THREE.MeshBasicMaterial({ color: CONFIG.colors.beam, transparent: true, opacity: 0.05, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
);
beamGroup.add(outerBeamMesh);

// Data Particles (Floating Blocks)
const dataInstances = 50;
const dataGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const dataMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const dataBlocks = new THREE.InstancedMesh(dataGeo, dataMat, dataInstances);
const dummy = new THREE.Object3D();

for (let i = 0; i < dataInstances; i++) {
    dummy.position.set(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 1.5
    );
    dummy.updateMatrix();
    dataBlocks.setMatrixAt(i, dummy.matrix);
}
beamGroup.add(dataBlocks);

beamGroup.position.set(0, 10, -25);
scene.add(beamGroup);


// C. Crystal Forest
const forestGroup = new THREE.Group();
const treeGeo = new THREE.ConeGeometry(0.6, 2.5, 4);
const treeMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.95,
    opacity: 1,
    metalness: 0.1,
    roughness: 0.05,
    ior: 1.5,
    thickness: 1,
    clearcoat: 1
});

for (let i = 0; i < 15; i++) {
    const tree = new THREE.Mesh(treeGeo, treeMat);
    const x = (Math.random() - 0.5) * 18;
    const z = (Math.random() - 0.5) * 18;
    tree.position.set(x, 1.25, z);
    tree.rotation.y = Math.random() * Math.PI;
    tree.castShadow = true;
    tree.scale.setScalar(0.7 + Math.random() * 0.6);
    forestGroup.add(tree);
}
forestGroup.position.set(15, 0, 5);
scene.add(forestGroup);


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
    }
});

// Scene 1: Hero -> Beam
// Beam is at (0, 10, -25)
tl.to(camera.position, {
    x: 0,
    y: 8,
    z: -8,
    duration: 1.5,
    ease: "power2.inOut"
}, "scene1")
    .to(cameraTarget, {
        x: 0,
        y: 10,
        z: -25,
        duration: 1.5,
        ease: "power2.inOut"
    }, "scene1");

// Scene 2: Beam -> Forest
// Forest at (15, 0, 5). 
// Camera needs to look from outside in
tl.to(camera.position, {
    x: 8,
    y: 3,
    z: 12,
    duration: 1.5,
    ease: "power2.inOut"
}, "scene2")
    .to(cameraTarget, {
        x: 15,
        y: 1.5,
        z: 5,
        duration: 1.5,
        ease: "power2.inOut"
    }, "scene2");

// Scene 3: Forest -> Gift
// Gift at (-15, 0.75, -5)
tl.to(camera.position, {
    x: -10,
    y: 3,
    z: 2,
    duration: 1.5,
    ease: "power2.inOut"
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
            santaModel.rotation.y = Math.sin(t * 0.5) * 0.1;
            santaModel.position.y = Math.sin(t) * 0.1;
        }
        // Rings rotation
        ring1.rotation.y += 0.002;
        ring2.rotation.x += 0.002;
    }

    // Data Beam Animation (Instanced)
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

    // Particles
    particlesMesh.rotation.y = t * 0.05;

    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
