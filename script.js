// script.js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time)=>{
    lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// THREE.JS SCENE SETUP
const scene = new THREE.Scene();
// No establecer color de fondo aquí, el degradado CSS se encargará
// scene.background = new THREE.Color(0xfefdfd); // Removido para usar el fondo CSS

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true, // Habilita la transparencia para ver el fondo CSS
});

// renderer.setClearColor(0xffffff, 1); // Removido para usar el fondo CSS
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.5;

// Añadir el renderizador al div con clase 'model'
document.querySelector(".model").appendChild(renderer.domElement);

// --- LUCES PARA LA ILUMINACIÓN MEJORADA DE LA LATA ---
// Luz ambiental general (suaviza las sombras)
const ambientLight = new THREE.AmbientLight(0xffffff, 3); // Intensidad aumentada para más luz general
scene.add(ambientLight);

// Luz direccional principal (simula una fuente de luz fuerte, como el sol)
const mainLight = new THREE.DirectionalLight(0xffffff, 2); // Intensidad aumentada para más brillo
mainLight.position.set(5, 10, 7.5);
mainLight.castShadow = true; // Permite que esta luz proyecte sombras
mainLight.shadow.mapSize.width = 1024; // Resolución de sombra
mainLight.shadow.mapSize.height = 1024; // Resolución de sombra
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 50;
scene.add(mainLight);

// Luz de relleno (para suavizar las sombras y añadir luz a las partes oscuras)
const fillLight = new THREE.DirectionalLight(0xffffff, 4); // Intensidad aumentada
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

// Luz hemisférica (para un gradiente de luz del cielo al suelo)
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 3); // Intensidad aumentada
hemiLight.position.set(0, 25, 0);
scene.add(hemiLight);

// --- FIN DE LA CONFIGURACIÓN DE LUCES ---

// Función de animación básica para el renderizado inicial
function basicAnimate() {
    renderer.render(scene, camera);
    requestAnimationFrame(basicAnimate);
};
basicAnimate(); // Llama a la animación inicial

// Carga del modelo 3D
let model;
const loader = new THREE.GLTFLoader();
loader.load("./assets/josta.glb", function (gltf) {
    model = gltf.scene;
    model.traverse((node) => {
        if (node.isMesh) {
            if (node.material) {
                // Ajustes de material para mejor visualización
                node.material.metalness = 0.3;
                node.material.roughness = 0.4;
                node.material.envMapIntensity = 1.5;
            }
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    scene.add(model);

    // Ajuste de la cámara para que el modelo sea visible
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.z = maxDim * 1.5; // Ajustar la distancia de la cámara para que el modelo sea visible

    model.scale.set(0, 0, 0);
    playInitialAnimation();

    cancelAnimationFrame(basicAnimate); // Detener la animación básica una vez que el modelo se carga
    animate(); // Iniciar la animación principal
});

// Variables para animación y scroll
const floatAmplitude = 0.2;
const floatSpeed = 1.5;
const rotationSpeed = 0.5;
let isFloating = true;
let currentScroll = 0;

const stickyHeight = window.innerHeight;
const scannerSection = document.querySelector(".scanner");
const scannerPosition = scannerSection.offsetTop;
const scanContainer = document.querySelector(".scan-container");
const scanSound = new Audio("./assets/scanner.mp3");
gsap.set(scanContainer, { scale: 0 });

// Función para la animación inicial del modelo
function playInitialAnimation() {
    if (model) {
        gsap.to(model.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 1,
            ease: "power2.out",
        });
    }
    gsap.to(scanContainer, {
        scale: 1,
        duration: 1,
        ease: "power2.out",
    });
}

// GSAP ScrollTrigger para la animación de entrada/salida del modelo
ScrollTrigger.create({
    trigger: "body",
    start: "top top",
    end: "top -10",
    onEnterBack: () => {
        if (model) {
            gsap.to(model.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 1,
                ease: "power2.out"
            });
            isFloating = true;
        }
        gsap.to(scanContainer, {
            scale: 1,
            duration: 1,
            ease: "power2.out",
        });
    },
});

// GSAP ScrollTrigger para la sección del escáner
ScrollTrigger.create({
    trigger: ".scanner",
    start: "top top",
    end: `${stickyHeight}px`,
    pin: true,
    onEnter: () => {
        if (model) {
            isFloating = false;
            model.position.y = 0;

            setTimeout(() => {
                scanSound.currentTime = 0;
                scanSound.play();
            }, 500);

            gsap.to(model.rotation, {
                y: model.rotation.y + Math.PI * 2,
                duration: 1,
                ease: "power2.out",
                onComplete: () => {
                    gsap.to(model.scale, {
                        x: 0,
                        y: 0,
                        z: 0,
                        duration: 0.5,
                        ease: "power2.in",
                        onComplete: () => {
                            gsap.to(scanContainer, {
                                scale: 0,
                                duration: 0.5,
                                ease: "power2.in",
                            });
                        },
                    });
                },
            });
        }
    },
    onLeaveBack: () => {
        gsap.set(scanContainer, { scale: 0 });
        gsap.to(scanContainer, {
            scale: 1,
            duration: 1,
            ease: "power2.out",
        });
    },
});

// Event listener para el scroll de Lenis
lenis.on("scroll", (e) => {
    currentScroll = e.scroll;
});

// Función de animación principal
function animate() {
    if (model) {
        if (isFloating) {
            const floatOffset =
            Math.sin(Date.now() * 0.001 * floatSpeed) * floatAmplitude;
            model.position.y = floatOffset;
        }

        const scrollProgress = Math.min(currentScroll / scannerPosition, 1);

        if (scrollProgress < 1) {
            model.rotation.x = scrollProgress * Math.PI * 2;
        }

        if (scrollProgress < 1) {
            model.rotation.y += 0.001 * rotationSpeed;
        }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Manejar el redimensionamiento de la ventana para la responsividad
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Reajustar pixel ratio en resize
    if (model) {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        // Ajustar la distancia de la cámara para que el modelo sea visible
        camera.position.z = maxDim * 1.5;
    }
});