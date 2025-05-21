const lenis = new lenis();
lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time)=>{
    lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

const scena = new THREE.Scene();


