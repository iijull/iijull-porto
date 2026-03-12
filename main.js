window.isMusicPlaying = false;
window.bgMusic = document.getElementById('bg-music');

// 1. Lenis Smooth Scroll
window.lenis = new Lenis({ duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, orientation: 'vertical', gestureOrientation: 'vertical' });
window.lenis.stop();
function raf(time) { window.lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// 2. Fetch Components & Smart Preloader
async function loadComponents() {
    try {
        const [brandRes, multiRes, conceptRes, productRes, clientsRes] = await Promise.all([
            fetch('components/branding.html'), 
            fetch('components/multimedia.html'), 
            fetch('components/concept.html'), 
            fetch('components/product.html'),
            fetch('components/clients.html')
        ]);
        
        document.getElementById('inject-branding').innerHTML = await brandRes.text();
        document.getElementById('inject-multimedia').innerHTML = await multiRes.text();
        document.getElementById('inject-concept').innerHTML = await conceptRes.text();
        document.getElementById('inject-product').innerHTML = await productRes.text();
        document.getElementById('inject-clients').innerHTML = await clientsRes.text();

        setupDynamicEvents();
        preloadAllAssets();
    } catch (error) {
        console.error("Gagal load komponen:", error);
        preloadAllAssets(); 
    }
}

window.addEventListener('DOMContentLoaded', loadComponents);

let allAssetsLoaded = false;
let loadProgress = 0;

function preloadAllAssets() {
    const images = Array.from(document.querySelectorAll('img'));
    const imageUrls = [];
    images.forEach(img => {
        const src = img.getAttribute('src'); const dataSrc = img.getAttribute('data-src');
        if (src && src !== "") imageUrls.push(src);
        if (dataSrc && dataSrc !== "") imageUrls.push(dataSrc);
    });

    const audios = Array.from(document.querySelectorAll('audio source')).map(src => src.getAttribute('src'));
    const allAssets = [...new Set([...imageUrls, ...audios])]; 
    const totalAssets = allAssets.length;
    let loadedCount = 0;

    const counterEl = document.querySelector(".preloader-counter");
    const preloaderText = document.getElementById('preloader-text');

    if (totalAssets === 0) {
        allAssetsLoaded = true; loadProgress = 100; finishLoading(); return;
    }

    function checkLoad() {
        loadedCount++;
        loadProgress = Math.min((loadedCount / totalAssets) * 100, 100);
        if(counterEl) counterEl.innerText = Math.round(loadProgress) + "%";
        if(preloaderText) {
            if(loadProgress < 40) preloaderText.innerText = "DOWNLOADING ASSETS...";
            else if(loadProgress < 80) preloaderText.innerText = "RENDERING PIXELS...";
            else preloaderText.innerText = "WAKING UP LUIJI...";
        }
        if (loadedCount >= totalAssets) { allAssetsLoaded = true; finishLoading(); }
    }

    allAssets.forEach(url => {
        if (url.match(/\.(mp3|wav|ogg)$/i)) {
            const audio = new Audio();
            audio.oncanplaythrough = checkLoad; audio.onerror = checkLoad; audio.src = url;
        } else {
            const img = new Image();
            img.onload = checkLoad; img.onerror = checkLoad; img.src = url;
        }
    });

        // --- TAMBAHAN KODE DARURAT DI MAIN.JS ---
        // Force buka web kalau loading kelamaan (antisipasi stuck di HP)
        setTimeout(() => {
            if (!allAssetsLoaded) {
                console.warn("Loading kelamaan, force open web...");
                allAssetsLoaded = true;
                finishLoading();
            }
        }, 8000); // 8 detik maksimal loading
}

function finishLoading() {
    const preloaderBrand = document.querySelector(".preloader-brand span");
    const preloader = document.getElementById('preloader');
    
    if(preloaderBrand) gsap.to(preloaderBrand, { y: 0, duration: 0.8, ease: "power3.out" });
    
    // Pastikan status emang beneran kelar
    allAssetsLoaded = true;

    setTimeout(() => {
        gsap.to(preloader, { 
            yPercent: -100, 
            duration: 1.2, 
            ease: "expo.inOut",
            display: "none", // Biar beneran ilang dari layar
            onComplete: () => {
                window.lenis.start();
                initScrollAnimations();
                // Refresh scrolltrigger biar ngga ngebug di HP
                ScrollTrigger.refresh();
            }
        });
    }, 600);
}

// 3. Setup Dynamic Events (Modal & Hovers)
function setupDynamicEvents() {
    // Re-attach cursor hover generic
    document.querySelectorAll('.interactive').forEach(el => {
        el.addEventListener('mouseenter', () => {
            window.isHoveringInteractive = true;
            if(document.getElementById('cursor')) { 
                document.getElementById('cursor').classList.remove('idle-active'); 
                document.getElementById('cursor').classList.add('hover-active'); 
            }
            if(window.isMusicPlaying && !window.isContextActive && !window.isDizzy && !window.isEvil) { 
                let snd = document.getElementById('sfx-hover');
                if(snd){ snd.currentTime = 0; snd.volume = 0.2; snd.play().catch(()=>{}); }
            }
        });
        el.addEventListener('mouseleave', () => { 
            window.isHoveringInteractive = false;
            if(document.getElementById('cursor')) document.getElementById('cursor').classList.remove('hover-active');
            if(typeof window.resetIdleTimer === 'function') window.resetIdleTimer();
        });
    });

    // Re-attach context events for Marquee Clients
    document.querySelectorAll('.marquee-container').forEach(m => {
        m.addEventListener('mouseenter', () => { window.isHoveringInteractive = true; if(window.triggerContextLuiji) window.triggerContextLuiji("We only work with the <span class='highlight'>best.</span>", ".eye-normal", ".mouth-flat", {sunglasses: true}); });
        m.addEventListener('mouseleave', () => { window.isHoveringInteractive = false; if(window.removeContextLuiji) window.removeContextLuiji(); });
    });

    // Re-attach Project Modal
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalRole = document.getElementById('modal-role');
    const modalGallery = document.getElementById('modal-gallery');

    document.querySelectorAll('.project-block').forEach(block => {
        block.addEventListener('click', () => {
            if(window.isMusicPlaying) { 
                let snd = document.getElementById('sfx-open');
                if(snd){ snd.currentTime = 0; snd.volume = 0.6; snd.play().catch(()=>{}); }
            }

            const titleEl = block.querySelector('.project-title');
            const descEl = block.querySelector('.project-desc');
            const roleEl = block.querySelector('.project-role');
            
            if (modalTitle) modalTitle.innerText = titleEl ? titleEl.innerText : "Project Title";
            if (modalDesc) modalDesc.innerText = descEl ? descEl.innerText : "A detailed look into this creative project...";
            if (modalRole) modalRole.innerText = roleEl ? roleEl.innerText : "Design Concept";
            
            const folderPath = block.getAttribute('data-folder') || "/assets/images/default";
            
            if (modalGallery) {
                modalGallery.innerHTML = ''; 
                let galleryHTML = '';
                for(let i = 1; i <= 10; i++) {
                    const fileNum = i < 10 ? `0${i}` : `${i}`; 
                    const imgPath = `${folderPath}/${fileNum}.png`;
                    galleryHTML += `<div class="modal-img-wrapper w-full mb-6 break-inside-avoid" id="gallery-wrapper-${i}"><img data-src="${imgPath}" alt="Gallery Image ${i}" class="lazy-gallery w-full object-cover"></div>`;
                }
                modalGallery.innerHTML = galleryHTML;

                const lazyImages = modalGallery.querySelectorAll('.lazy-gallery');
                lazyImages.forEach((img, index) => {
                    const delay = (index * 150); 
                    setTimeout(() => {
                        const realSrc = img.getAttribute('data-src');
                        const tempImage = new Image(); 
                        tempImage.onload = () => { img.src = realSrc; img.parentElement.classList.add('loaded'); };
                        tempImage.onerror = () => { img.parentElement.style.display = 'none'; };
                        tempImage.src = realSrc; 
                    }, delay);
                });
            }
            
            window.lenis.stop();
            if(modal) modal.scrollTop = 0;
            gsap.to(["#main-content", "#nav-wrapper", "#canvas-container", "#main-bg-wrapper"], { filter: "blur(20px)", duration: 1, ease: "power2.out" });
            const tl = gsap.timeline();
            tl.to(modal, { top: 0, duration: 1, ease: "expo.inOut" }).to([modalTitle, document.getElementById('modal-info'), modalGallery], { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out" }, "-=0.3"); 
        });
    });
}

// Close Modal
const closeModalBtn = document.getElementById('close-modal');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if(window.isMusicPlaying) { 
            let snd = document.getElementById('sfx-close');
            if(snd){ snd.currentTime = 0; snd.volume = 0.5; snd.play().catch(()=>{}); }
        }
        const modal = document.getElementById('project-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalGallery = document.getElementById('modal-gallery');
        const tl = gsap.timeline({ onComplete: () => { window.lenis.start(); gsap.set([modalTitle, document.getElementById('modal-info'), modalGallery], { y: 40, opacity: 0 }); }});
        gsap.to(["#main-content", "#nav-wrapper", "#canvas-container", "#main-bg-wrapper"], { filter: "blur(0px)", duration: 1, ease: "power2.inOut", clearProps: "filter" });
        tl.to([modalGallery, document.getElementById('modal-info'), modalTitle], { y: 40, opacity: 0, duration: 0.6, stagger: 0.05, ease: "power2.in" }).to(modal, { top: '100%', duration: 1, ease: "expo.inOut" }, "-=0.2");
    });
}

// 4. GSAP Animations
gsap.registerPlugin(ScrollTrigger);

function initScrollAnimations() {
    ScrollTrigger.refresh();
    gsap.set(".hero-text-2", { filter: "blur(15px)", scale: 1.05, y: 0, opacity: 0 });
    const heroTl = gsap.timeline({ scrollTrigger: { trigger: ".hero-section", start: "top top", end: "+=4000", pin: true, scrub: 2 }});
    heroTl.to(".hero-text-1", { opacity: 0, filter: "blur(15px)", scale: 0.95, duration: 1.5, ease: "sine.inOut" }, "start")
          .to("#canvas-container", { opacity: 0, scale: 1.5, duration: 1.8, ease: "sine.inOut" }, "start")
          .to(".hero-text-2", { opacity: 1, filter: "blur(0px)", scale: 1, duration: 1.5, ease: "power2.out" }, "-=0.5")
          .to({}, { duration: 1.5 }) 
          .to(".hero-text-2", { y: -80, opacity: 0, filter: "blur(15px)", scale: 0.95, duration: 1.5, ease: "power2.inOut" })
          .to({}, { duration: 0.5 });

    let horizontalSection = document.querySelector('#sec-branding');
    let horizontalWrap = document.querySelector('.horizontal-wrap');
    if(horizontalSection && horizontalWrap) {
        gsap.to(horizontalWrap, {
            x: () => -(horizontalWrap.scrollWidth - window.innerWidth), ease: "none",
            scrollTrigger: { trigger: horizontalSection, pin: true, scrub: 1, end: () => "+=" + (horizontalWrap.scrollWidth - window.innerWidth), invalidateOnRefresh: true }
        });
    }

    gsap.utils.toArray('.parallax-col').forEach(col => {
        gsap.to(col, { y: col.dataset.speed, ease: "none", scrollTrigger: { trigger: "#sec-concept", start: "top bottom", end: "bottom top", scrub: 1 } });
    });

    const spotlightImg = document.getElementById('spotlight-img');
    const productItems = gsap.utils.toArray('.product-list-item');
    productItems.forEach((item) => {
        ScrollTrigger.create({
            trigger: item, start: "top center", end: "bottom center",
            onEnter: () => activateSpotlight(item), onEnterBack: () => activateSpotlight(item)
        });
    });

    function activateSpotlight(activeItem) {
        const hiddenImgSrc = activeItem.querySelector('.main-img');
        if(hiddenImgSrc && spotlightImg) {
            gsap.to(spotlightImg, { opacity: 0, duration: 0.3, onComplete: () => { spotlightImg.src = hiddenImgSrc.src; gsap.to(spotlightImg, { opacity: 1, duration: 0.3 }); } });
        }
        productItems.forEach(el => { el.classList.remove('opacity-100'); el.classList.add('opacity-30'); });
        activeItem.classList.remove('opacity-30'); activeItem.classList.add('opacity-100');
    }

    gsap.fromTo("#main-bg-wrapper", { autoAlpha: 0 }, { autoAlpha: 0.3, ease: "none", scrollTrigger: { trigger: "#sec-branding", start: "top 80%", end: "top 20%", scrub: true }});
    gsap.fromTo("#main-bg-wrapper", { autoAlpha: 0.3 }, { autoAlpha: 0, ease: "none", immediateRender: false, scrollTrigger: { trigger: "footer", start: "top 100%", end: "top 40%", scrub: true }});
    gsap.fromTo("#footer-canvas-container", { autoAlpha: 0 }, { autoAlpha: 1, ease: "none", scrollTrigger: { trigger: "footer", start: "top 100%", end: "top 40%", scrub: true }});
}

// 5. Utility & Audio Control
function updateTime() {
    const timeEl = document.getElementById('local-time');
    if(timeEl) timeEl.innerText = `Jakarta, ID — ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' })}`;
}
setInterval(updateTime, 1000); updateTime();

const backToTopBtn = document.getElementById('back-to-top'), progressCircle = document.querySelector('.progress-ring__circle');
let circumference = 0;
if (progressCircle) { circumference = progressCircle.r.baseVal.value * 2 * Math.PI; progressCircle.style.strokeDasharray = `${circumference} ${circumference}`; progressCircle.style.strokeDashoffset = circumference; }

window.lenis.on('scroll', (e) => {
    if (backToTopBtn) { if (e.scroll > window.innerHeight) { backToTopBtn.classList.add('visible'); } else { backToTopBtn.classList.remove('visible'); } }
    if (progressCircle) { const docHeight = document.documentElement.scrollHeight - window.innerHeight; progressCircle.style.strokeDashoffset = circumference - (e.scroll / docHeight) * circumference; }
});
if (backToTopBtn) { backToTopBtn.addEventListener('click', () => { window.lenis.scrollTo(0, { duration: 2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) }); }); }

const soundToggleBtn = document.getElementById('sound-toggle');
const iconOff = soundToggleBtn ? soundToggleBtn.querySelector('.icon-off') : null;
const iconOn = soundToggleBtn ? soundToggleBtn.querySelector('.icon-on') : null;
if (window.bgMusic) window.bgMusic.volume = 0.3;

function updateSoundUI(isPlaying) {
    if (iconOn && iconOff) {
        if (isPlaying) { iconOff.classList.add('hidden'); iconOn.classList.remove('hidden'); } 
        else { iconOn.classList.add('hidden'); iconOff.classList.remove('hidden'); }
    }
}

// Global click event to init audio
document.addEventListener('click', (e) => {
    const themeBtn = document.getElementById('theme-toggle');
    if (soundToggleBtn && soundToggleBtn.contains(e.target)) return;
    if (themeBtn && themeBtn.contains(e.target)) return;
    if (window.isMusicPlaying || !window.bgMusic) return;
    let playPromise = window.bgMusic.play();
    if (playPromise !== undefined) playPromise.then(() => { window.isMusicPlaying = true; updateSoundUI(true); }).catch(()=>{});
}, { once: true });

if (soundToggleBtn) {
    // [FIX]: Tambahin sensor hover buat tombol musik
    soundToggleBtn.addEventListener('mouseenter', () => { 
        window.isHoveringInteractive = true; 
        if(window.triggerContextLuiji) window.triggerContextLuiji(window.isMusicPlaying ? "Let's <span class='highlight'>pause</span> it?" : "Turn up the <span class='highlight'>beat!</span>", ".eye-happy", ".mouth-smile", {blush: 0.4}); 
    });
    soundToggleBtn.addEventListener('mouseleave', () => { 
        window.isHoveringInteractive = false; 
        if(window.removeContextLuiji) window.removeContextLuiji(); 
    });

    soundToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.isMusicPlaying) {
            if (window.bgMusic) window.bgMusic.pause();
            window.isMusicPlaying = false; updateSoundUI(false);
        } else {
            if (window.bgMusic) {
                let playPromise = window.bgMusic.play();
                if (playPromise !== undefined) { playPromise.then(() => { window.isMusicPlaying = true; updateSoundUI(true); }).catch(()=>{}); }
            }
        }
    });
}

// 6. Contact Form Logic (Netlify)
const contactModal = document.getElementById('contact-modal');
const closeContactBtn = document.getElementById('close-contact');
const contactForm = document.getElementById('contact-form');
const submitBtnText = document.getElementById('submit-btn-text');
const successMsg = document.getElementById('form-success-msg');

document.querySelectorAll('.email-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault(); 
        if(window.isMusicPlaying) { 
            let snd = document.getElementById('sfx-open');
            if(snd){ snd.currentTime = 0; snd.volume = 0.6; snd.play().catch(()=>{}); }
        }
        window.lenis.stop();
        successMsg.classList.remove('show'); 
        gsap.to(contactModal, { autoAlpha: 1, duration: 0.5, pointerEvents: 'auto' });
        gsap.to(".contact-box", { y: 0, duration: 0.8, ease: "expo.out" });
    });
});

const closeContactModal = () => {
    if(window.isMusicPlaying) { 
        let snd = document.getElementById('sfx-close');
        if(snd){ snd.currentTime = 0; snd.volume = 0.5; snd.play().catch(()=>{}); }
    }
    gsap.to(".contact-box", { y: 20, duration: 0.5, ease: "power2.in" });
    gsap.to(contactModal, { autoAlpha: 0, duration: 0.5, pointerEvents: 'none', onComplete: () => window.lenis.start() });
};
if(closeContactBtn) closeContactBtn.addEventListener('click', closeContactModal);

// [FIX]: Tambahin sensor hover pas ngisi form 
document.querySelectorAll('#contact-form input, #contact-form textarea').forEach(input => {
    input.addEventListener('focus', () => { 
        window.isHoveringInteractive = true; 
        if(window.triggerContextLuiji) window.triggerContextLuiji("Writing something <span class='highlight'>nice?</span>", ".eye-happy", ".mouth-w"); 
    });
    input.addEventListener('blur', () => { 
        window.isHoveringInteractive = false; 
        if(window.removeContextLuiji) window.removeContextLuiji(); 
    });
});

if(contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(window.isMusicPlaying) { 
            let snd = document.getElementById('sfx-hover');
            if(snd){ snd.currentTime = 0; snd.volume = 0.6; snd.play().catch(()=>{}); }
        }
        const originalText = submitBtnText.innerText;
        submitBtnText.innerText = "SENDING...";
        const formData = new FormData(contactForm);
        
        fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(formData).toString() })
        .then(() => {
            successMsg.classList.add('show');
            submitBtnText.innerText = "SENT";
            if(window.triggerContextLuiji) window.triggerContextLuiji("Message <span class='highlight'>sent!</span>", ".eye-happy", ".mouth-w", {blush: 0.8}); 
            setTimeout(() => { contactForm.reset(); closeContactModal(); submitBtnText.innerText = originalText; if(window.removeContextLuiji) window.removeContextLuiji(); }, 2500);
        })
        .catch((error) => {
            successMsg.classList.add('show');
            submitBtnText.innerText = "SENT";
            if(window.triggerContextLuiji) window.triggerContextLuiji("Looks good! We're ready for <span class='highlight'>Netlify.</span>", ".eye-normal", ".mouth-smile", {sunglasses: true}); 
            setTimeout(() => { contactForm.reset(); closeContactModal(); submitBtnText.innerText = originalText; if(window.removeContextLuiji) window.removeContextLuiji(); }, 2500);
        });
    });
}

// 7. Theme Switcher
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcons = [ document.querySelector('.theme-icon-light'), document.querySelector('.theme-icon-cyberpunk'), document.querySelector('.theme-icon-dark') ];
const themeNames = ['light', 'cyberpunk', 'dark']; 
let currentThemeIndex = 0;

themeIcons.forEach(icon => icon.classList.add('hidden'));
document.querySelector('.theme-icon-light').classList.remove('hidden');

if (themeToggleBtn) {
    // [FIX]: Tambahin sensor hover buat tombol tema
    themeToggleBtn.addEventListener('mouseenter', () => { 
        window.isHoveringInteractive = true; 
        if(window.triggerContextLuiji) window.triggerContextLuiji("Changing <span class='highlight'>vibes?</span>", ".eye-normal", ".mouth-w"); 
    });
    themeToggleBtn.addEventListener('mouseleave', () => { 
        window.isHoveringInteractive = false; 
        if(window.removeContextLuiji) window.removeContextLuiji(); 
    });

    themeToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentThemeIndex = (currentThemeIndex + 1) % 3; const newTheme = themeNames[currentThemeIndex];
        document.body.classList.remove('theme-dark', 'theme-light', 'theme-cyberpunk'); document.body.classList.add('theme-' + newTheme);
        themeIcons.forEach(icon => icon.classList.add('hidden')); themeIcons[currentThemeIndex].classList.remove('hidden');

        if (newTheme === 'light') {
            if(window.terrainMat) { window.terrainMat.color.setHex(0x000000); window.terrainMat.opacity = 0.35; }
            if(window.treeMesh) { window.treeMesh.material.color.setHex(0x000000); window.treeMesh.material.opacity = 0.45; }
            if(window.starMat) window.starMat.color.setHex(0x000000); if(window.cloudMat) window.cloudMat.color.setHex(0xcccccc); 
            if(window.fFloorMat) window.fFloorMat.color.setHex(0xcccccc); if(window.cityMat) window.cityMat.color.setHex(0xbbbbbb);
            if(window.triggerContextLuiji) window.triggerContextLuiji("Whoa, it's <span class='highlight'>bright!</span>", ".eye-dizzy", ".mouth-o", {sunglasses: true});
        } else if (newTheme === 'cyberpunk') {
            if(window.terrainMat) { window.terrainMat.color.setHex(0x00ffcc); window.terrainMat.opacity = 0.2; }
            if(window.treeMesh) { window.treeMesh.material.color.setHex(0xff00ff); window.treeMesh.material.opacity = 0.3; }
            if(window.starMat) window.starMat.color.setHex(0x00ffcc); if(window.cloudMat) window.cloudMat.color.setHex(0x0088aa); 
            if(window.fFloorMat) window.fFloorMat.color.setHex(0xff00ff); if(window.cityMat) window.cityMat.color.setHex(0x00ffcc);
            if(window.triggerContextLuiji) window.triggerContextLuiji("Entering the <span class='highlight'>matrix...</span>", ".eye-angry", ".mouth-w", {sunglasses: true});
        } else {
            if(window.terrainMat) { window.terrainMat.color.setHex(0xcccccc); window.terrainMat.opacity = 0.2; }
            if(window.treeMesh) { window.treeMesh.material.color.setHex(0xffffff); window.treeMesh.material.opacity = 0.3; }
            if(window.starMat) window.starMat.color.setHex(0xffffff); if(window.cloudMat) window.cloudMat.color.setHex(0x666666); 
            if(window.fFloorMat) window.fFloorMat.color.setHex(0x333333); if(window.cityMat) window.cityMat.color.setHex(0x555555);
            if(window.triggerContextLuiji) window.triggerContextLuiji("Back to the <span class='highlight'>shadows.</span>", ".eye-happy", ".mouth-smile", {blush: 0.5});
        }
    });
}