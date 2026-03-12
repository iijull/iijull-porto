const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 35); camera.lookAt(0, -5, 0);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
if (container) container.appendChild(renderer.domElement);

const isDefaultLight = document.body.classList.contains('theme-light');
let defaultTerrainColor = isDefaultLight ? 0x111111 : 0xcccccc;
let defaultTreeColor = isDefaultLight ? 0x111111 : 0xffffff;
let defaultTerrainOpacity = isDefaultLight ? 0.35 : 0.2;
let defaultTreeOpacity = isDefaultLight ? 0.45 : 0.3;

function getElevation(x, z, time) {
    const flowZ = z + time * 15;
    const valley = Math.pow(Math.abs(x) * 0.05, 2) * 2;
    const hills = Math.sin(x * 0.03) * Math.cos(flowZ * 0.03) * 15;
    const peaks = Math.abs(Math.sin(x * 0.08) * Math.cos(flowZ * 0.08)) * 10;
    const details = Math.sin(x * 0.2) * Math.cos(flowZ * 0.2) * 2;
    return hills + peaks + details + valley - 20;
}

const geometry = new THREE.PlaneGeometry(250, 200, 120, 90); geometry.rotateX(-Math.PI / 2);
const positions = geometry.attributes.position.array;
const originalZ = [];
for (let i = 0; i < positions.length; i += 3) originalZ.push(positions[i + 2]);

window.terrainMat = new THREE.MeshBasicMaterial({ color: defaultTerrainColor, wireframe: true, transparent: true, opacity: defaultTerrainOpacity });
const terrain = new THREE.Mesh(geometry, window.terrainMat); scene.add(terrain);

const treeCount = 600;
window.treeMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.8, 4, 3), new THREE.MeshBasicMaterial({ color: defaultTreeColor, wireframe: true, transparent: true, opacity: defaultTreeOpacity }), treeCount);
const treeData = [];
for(let i = 0; i < treeCount; i++) {
    let tx = (Math.random() - 0.5) * 200; let tz = (Math.random() - 0.5) * 180;
    if(Math.abs(tx) < 20) tx += (tx > 0 ? 20 : -20);
    treeData.push({ x: tx, z: tz });
}
scene.add(window.treeMesh);

const clock = new THREE.Clock(); const dummy = new THREE.Object3D();
function animateTerrain() {
    requestAnimationFrame(animateTerrain);
    const time = clock.getElapsedTime() * 0.4;
    for (let i = 0; i < positions.length; i += 3) positions[i + 1] = getElevation(positions[i], originalZ[i / 3], time);
    geometry.attributes.position.needsUpdate = true;
    for(let i = 0; i < treeCount; i++) {
        const d = treeData[i]; const y = getElevation(d.x, d.z, time);
        dummy.position.set(d.x, y + 2, d.z); dummy.updateMatrix(); window.treeMesh.setMatrixAt(i, dummy.matrix);
    }
    window.treeMesh.instanceMatrix.needsUpdate = true; renderer.render(scene, camera);
}
animateTerrain();

const mContainer = document.getElementById('main-3d-canvas');
const mScene = new THREE.Scene();
const mCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
mCamera.position.z = 100;
const mRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
mRenderer.setSize(window.innerWidth, window.innerHeight);
mRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
if (mContainer) mContainer.appendChild(mRenderer.domElement);

const defaultStarColor = isDefaultLight ? 0x000000 : 0xffffff;
const defaultCloudColor = isDefaultLight ? 0xcccccc : 0x666666;
const starGeo = new THREE.BufferGeometry();
const starCount = 3500; const starPos = new Float32Array(starCount * 3);
for(let i=0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 1000; 
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
window.starMat = new THREE.PointsMaterial({ color: defaultStarColor, size: 0.7, transparent: true, opacity: 0.5 });
const mStars = new THREE.Points(starGeo, window.starMat); mScene.add(mStars);

const cloudGeo = new THREE.TorusKnotGeometry(4, 1.5, 64, 8, Math.round(Math.random() * 3 + 1), Math.round(Math.random() * 4 + 2));
window.cloudMat = new THREE.MeshBasicMaterial({ color: defaultCloudColor, wireframe: true, transparent: true, opacity: 0.15 });
const mClouds = new THREE.InstancedMesh(cloudGeo, window.cloudMat, 60); 
const mCloudData = []; const mDummy = new THREE.Object3D();
for(let i=0; i<60; i++) {
    mCloudData.push({x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 500, z: (Math.random() - 0.5) * 300 - 50, rotX: Math.random() * Math.PI, rotY: Math.random() * Math.PI, scale: Math.random() * 2.5 + 0.5, speed: Math.random() * 0.003});
}
mScene.add(mClouds);

let targetScrollY = 0, currentScrollY = 0;
function animateMain3D() {
    requestAnimationFrame(animateMain3D);
    targetScrollY = window.scrollY || document.documentElement.scrollTop;
    currentScrollY += (targetScrollY - currentScrollY) * 0.05;
    mStars.rotation.y = (Date.now() * 0.00005) + currentScrollY * 0.0001; mStars.rotation.x = currentScrollY * 0.00005;
    mClouds.rotation.y = -(Date.now() * 0.0001) + currentScrollY * 0.00015; mClouds.rotation.z = currentScrollY * 0.00005;
    for(let i=0; i<60; i++) {
        const d = mCloudData[i]; d.rotX += d.speed; d.rotY += d.speed;
        mDummy.position.set(d.x, d.y, d.z); mDummy.rotation.set(d.rotX, d.rotY, 0); mDummy.scale.set(d.scale, d.scale, d.scale);
        mDummy.updateMatrix(); mClouds.setMatrixAt(i, mDummy.matrix);
    }
    mClouds.instanceMatrix.needsUpdate = true; mRenderer.render(mScene, mCamera);
}
animateMain3D();

const fContainer = document.getElementById('footer-canvas-container');
const fScene = new THREE.Scene();
let fCamAspect = window.innerWidth / (window.innerHeight * 0.8);
const fCamera = new THREE.PerspectiveCamera(75, fCamAspect, 0.1, 1000);
fCamera.position.set(0, 15, 45); fCamera.lookAt(0, 0, 0);

const fRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
fRenderer.setSize(window.innerWidth, window.innerHeight * 0.8);
fRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
if (fContainer) fContainer.appendChild(fRenderer.domElement);

const defaultFloorColor = isDefaultLight ? 0xcccccc : 0x333333;
const defaultCityColor = isDefaultLight ? 0xbbbbbb : 0x555555;
const gridSize = 300, gridSegments = 60;
const fFloorGeo = new THREE.PlaneGeometry(gridSize, gridSize, gridSegments, gridSegments); fFloorGeo.rotateX(-Math.PI / 2);
window.fFloorMat = new THREE.MeshBasicMaterial({ color: defaultFloorColor, wireframe: true, transparent: true, opacity: 0.15 });
const fFloor = new THREE.Mesh(fFloorGeo, window.fFloorMat); fFloor.position.y = -2; fScene.add(fFloor);

const bCount = 800; const cityGeo = new THREE.BoxGeometry(1, 1, 1);
window.cityMat = new THREE.MeshBasicMaterial({ color: defaultCityColor, wireframe: true, transparent: true, opacity: 0.25 });
const cityMesh = new THREE.InstancedMesh(cityGeo, window.cityMat, bCount);
const bData = [];
for(let i = 0; i < bCount; i++) {
    let tx = (Math.random() - 0.5) * 300, tz = (Math.random() - 0.5) * 300; 
    if(Math.abs(tx) < 45) tx += (tx > 0 ? 45 : -45); 
    bData.push({ x: tx, z: tz, w: Math.random() * 3 + 1.5, h: Math.pow(Math.random(), 4) * 45 + 2, d: Math.random() * 3 + 1.5 });
}
fScene.add(cityMesh);

const fClock = new THREE.Clock(); const fDummy = new THREE.Object3D(); window.footerSpeed = { multiplier: 0.8 }; const baseSpeed = 40; 
function animateFooterCity() {
    requestAnimationFrame(animateFooterCity);
    const delta = fClock.getDelta();
    fFloor.position.z += delta * window.footerSpeed.multiplier * baseSpeed;
    if(fFloor.position.z > (gridSize / gridSegments)) fFloor.position.z -= (gridSize / gridSegments);
    for(let i = 0; i < bCount; i++) {
        bData[i].z += delta * window.footerSpeed.multiplier * baseSpeed;
        if (bData[i].z > 60) bData[i].z -= gridSize; 
        fDummy.position.set(bData[i].x, (bData[i].h / 2) - 2, bData[i].z); fDummy.scale.set(bData[i].w, bData[i].h, bData[i].d);
        fDummy.updateMatrix(); cityMesh.setMatrixAt(i, fDummy.matrix);
    }
    cityMesh.instanceMatrix.needsUpdate = true; fRenderer.render(fScene, fCamera);
}
animateFooterCity();

window.addEventListener('resize', () => {
    if(container) { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }
    if(mContainer) { mCamera.aspect = window.innerWidth / window.innerHeight; mCamera.updateProjectionMatrix(); mRenderer.setSize(window.innerWidth, window.innerHeight); }
    if(fContainer && fContainer.clientHeight > 0) { fCamera.aspect = window.innerWidth / fContainer.clientHeight; fCamera.updateProjectionMatrix(); fRenderer.setSize(window.innerWidth, fContainer.clientHeight); }
});