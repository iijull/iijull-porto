const cursor = document.getElementById('cursor');
const cursorText = document.getElementById('cursor-text');
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let cursorX = mouseX, cursorY = mouseY;

let idleTimer;
window.isIdle = false; window.isWakingUp = false; window.isEvil = false; window.isDizzy = false; window.isContextActive = false; window.isHoveringInteractive = false;
let rapidClicks = 0, clickTimer, typingTimeout, blinkInterval, lookInterval, dizzyInterval, faceTimeline, zzzTween;
const idleBubble = document.getElementById('idle-bubble');

let lastMouseX = mouseX, lastMouseTime = Date.now(), shakeCount = 0, lastDirection = 0, shakeResetTimer;

if (cursor) gsap.set(cursor, { xPercent: -50, yPercent: -50 });

function setExpression(eyeClass, mouthClass, extras = {}) {
    gsap.to([".eye-normal", ".eye-happy", ".eye-sad", ".eye-angry", ".eye-dizzy", ".mouth-smile", ".mouth-sad", ".mouth-flat", ".mouth-o", ".mouth-w", ".mouth-zigzag", ".blush", ".sweat-drop"], {opacity: 0, duration: 0.15});
    if(eyeClass) gsap.to(eyeClass, {opacity: 1, duration: 0.15});
    if(mouthClass) gsap.to(mouthClass, {opacity: 1, duration: 0.15});
    if(extras.blush !== undefined) gsap.to(".blush", {opacity: extras.blush, duration: 0.15});
    if(extras.sweat) gsap.to(".sweat-drop", {opacity: 1, duration: 0.15});
    if(extras.sunglasses) gsap.to(".sunglasses", {opacity: 1, y: 0, duration: 0.3, ease: "back.out(2)"});
    else gsap.to(".sunglasses", {opacity: 0, y: -5, duration: 0.2});
}

const updateBubble = (msg) => {
    if (!idleBubble || (window.isWakingUp && !window.isEvil && !window.isDizzy && !window.isContextActive)) return;
    idleBubble.classList.add('show');
    if(!window.isEvil && !window.isDizzy && !window.isContextActive) idleBubble.innerHTML = '<span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span>';
    if(typingTimeout) clearTimeout(typingTimeout);

    let rawHtml = msg, currentHTML = '', charIndex = 0;
    let initialDelay = (window.isEvil || window.isDizzy || window.isContextActive) ? 0 : 800;

    typingTimeout = setTimeout(() => {
        function typeChar() {
            if ((!window.isIdle && !window.isEvil && !window.isDizzy && !window.isContextActive) || !idleBubble) return; 
            while (charIndex < rawHtml.length && rawHtml.charAt(charIndex) === '<') {
                let tagEnd = rawHtml.indexOf('>', charIndex);
                if (tagEnd !== -1) { currentHTML += rawHtml.substring(charIndex, tagEnd + 1); charIndex = tagEnd + 1; } 
                else { break; }
            }
            if (charIndex < rawHtml.length) {
                currentHTML += rawHtml.charAt(charIndex);
                idleBubble.innerHTML = currentHTML + '<span class="cursor-blink"></span>';
                charIndex++;
                typingTimeout = setTimeout(typeChar, 30 + Math.random() * 50);
            } else { idleBubble.innerHTML = rawHtml; }
        }
        typeChar();
    }, initialDelay); 
};

window.resetIdleTimer = function() {
    if(window.isEvil || window.isDizzy || window.isContextActive || window.isHoveringInteractive) return; 
    if (window.isIdle && !window.isWakingUp) {
        window.isWakingUp = true; window.isIdle = false;
        if(idleBubble) idleBubble.classList.remove('show');
        if(typingTimeout) clearTimeout(typingTimeout);
        if(blinkInterval) clearInterval(blinkInterval);
        if(lookInterval) clearInterval(lookInterval);
        if(dizzyInterval) clearInterval(dizzyInterval);
        if(faceTimeline) faceTimeline.kill();
        if(zzzTween) zzzTween.kill();
        gsap.killTweensOf([".face-group", ".sweat-drop", ".spin-eye", ".sunglasses"]);
        setExpression(".eye-normal", ".mouth-o");
        gsap.to(".face-group", {
            scale: 1.2, y: -10, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out",
            onComplete: () => {
                if(cursor && !window.isHoveringInteractive) cursor.classList.remove('idle-active');
                gsap.set(".face-group", {x: 0, y: 0, scale: 1});
                gsap.set(".zzz-group", {opacity: 0});
                gsap.set(".zzz-text", {opacity: 1, y: 0, x: 0, scale: 1});
                window.isWakingUp = false;
            }
        });
    }
    
    if(!window.isWakingUp && !window.isHoveringInteractive) {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            window.isIdle = true;
            if(cursor) cursor.classList.add('idle-active'); 
            if(idleBubble) {
                idleBubble.style.left = mouseX + 'px';
                idleBubble.style.top = (mouseY < 100) ? (mouseY + 80) + 'px' : (mouseY - 80) + 'px'; 
            }
            faceTimeline = gsap.timeline();
            faceTimeline.add(() => { updateBubble("Hi, I'm <span class='highlight'>Luiji.</span>"); setExpression(".eye-happy", ".mouth-smile", {blush: 0.8}); }, 0);

            if (window.isMusicPlaying) {
                faceTimeline.add(() => {
                    updateBubble("Vibin' to the <span class='highlight'>tune...</span>");
                    setExpression(".eye-happy", ".mouth-w", {blush: 0.4});
                    gsap.to(".face-group", {y: 4, duration: 0.8, yoyo: true, repeat: -1, ease: "sine.inOut"});
                }, 4);
                faceTimeline.add(() => {
                    gsap.killTweensOf(".face-group"); gsap.to(".face-group", {y: 0, duration: 0.5});
                    updateBubble("Are you just <span class='highlight'>listening?</span>");
                    setExpression(".eye-normal", ".mouth-flat");
                    lookInterval = setInterval(() => { gsap.to(".face-group", {x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10, duration: 0.8, ease: "power2.inOut"}); }, 1500);
                }, 10);
            } else {
                faceTimeline.add(() => { updateBubble("It's so quiet... <span class='highlight'>Wanna play music?</span>"); setExpression(".eye-normal", ".mouth-flat"); }, 4);
                faceTimeline.add(() => {
                    updateBubble("I'm getting <span class='highlight'>bored...</span>");
                    setExpression(".eye-sad", ".mouth-flat");
                    lookInterval = setInterval(() => { gsap.to(".face-group", {x: (Math.random() - 0.5) * 16, y: (Math.random() - 0.5) * 16, duration: 0.8, ease: "power2.inOut"}); }, 1500);
                }, 10);
                faceTimeline.add(() => {
                    updateBubble("<span class='highlight'>Zzz...</span>");
                    clearInterval(lookInterval); gsap.to(".face-group", {x: 0, y: 0, duration: 1}); 
                    setExpression(".eye-sad", ".mouth-o", {blush: 0.3});
                    gsap.to(".zzz-group", {opacity: 1, duration: 1}); 
                    zzzTween = gsap.fromTo(".zzz-text", {opacity: 1, y: 0, x: 0, scale: 0.8}, {opacity: 0, y: -20, x: 5, scale: 1.5, duration: 2, stagger: 0.6, repeat: -1, ease: "power1.out"});
                }, 16);
            }
            blinkInterval = setInterval(() => {
                const isSleeping = (!window.isMusicPlaying && faceTimeline.time() >= 15);
                if (!isSleeping && Math.random() > 0.4) { gsap.to(".eyes", {scaleY: 0.1, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: "center"}); }
            }, 3500);
        }, 7000); 
    }
};

function triggerDizzyLuiji() {
    clearTimeout(idleTimer);
    if(typingTimeout) clearTimeout(typingTimeout);
    if(blinkInterval) clearInterval(blinkInterval);
    if(lookInterval) clearInterval(lookInterval);
    if(dizzyInterval) clearInterval(dizzyInterval);
    if(faceTimeline) faceTimeline.kill();
    if(zzzTween) zzzTween.kill();
    
    window.isDizzy = true; window.isIdle = true; 
    if(cursor) cursor.classList.add('idle-active');
    gsap.ticker.add(updateDizzyBubblePos);
    gsap.killTweensOf([".face-group", ".sweat-drop", ".spin-eye"]);
    gsap.set(".face-group", {x: 0, y: 0, scale: 1}); gsap.set(".zzz-group", {opacity: 0}); gsap.set(".spin-eye", {rotation: 0}); 
    
    setExpression(".eye-dizzy", ".mouth-zigzag", {sweat: true});
    gsap.to(".spin-eye", {rotation: 360, transformOrigin: "center", duration: 1, repeat: -1, ease: "linear"});
    gsap.fromTo(".sweat-drop", {y: 0}, {y: 10, duration: 0.8, repeat: -1, yoyo: true});
    updateBubble("Whoa! I'm getting <span class='highlight'>dizzy!</span> Stop shaking me!");
    dizzyInterval = setInterval(() => { gsap.to(".face-group", {x: "random(-15, 15)", y: "random(-10, 10)", rotation: "random(-15, 15)", duration: 0.4, ease: "sine.inOut"}); }, 400);
    
    setTimeout(() => {
        window.isDizzy = false; gsap.ticker.remove(updateDizzyBubblePos); clearInterval(dizzyInterval);
        gsap.killTweensOf(".spin-eye"); gsap.to(".face-group", {rotation: 0, duration: 0.3}); window.resetIdleTimer(); 
    }, 5000); 
}

function updateDizzyBubblePos() {
    if(idleBubble && (window.isDizzy || window.isContextActive)) {
        idleBubble.style.left = mouseX + 'px'; let newTop = mouseY - 80;
        if(mouseY < 100) newTop = mouseY + 80;
        gsap.to(idleBubble, {top: newTop, duration: 0.1, ease: "none"});
    }
}

window.triggerContextLuiji = function(msg, eyeClass, mouthClass, extras = {}) {
    if(window.isEvil || window.isDizzy) return; 
    window.isContextActive = true; window.isIdle = false; 
    clearTimeout(idleTimer);
    if(typingTimeout) clearTimeout(typingTimeout);
    if(blinkInterval) clearInterval(blinkInterval);
    if(lookInterval) clearInterval(lookInterval);
    if(faceTimeline) faceTimeline.kill();
    if(zzzTween) zzzTween.kill();
    if(cursor) { cursor.classList.remove('idle-active'); cursor.classList.add('context-active'); }
    gsap.killTweensOf([".face-group", ".sweat-drop", ".spin-eye", ".sunglasses"]);
    gsap.set(".face-group", {x: 0, y: 0, scale: 1}); gsap.set(".zzz-group", {opacity: 0});
    gsap.set(".spin-eye", {rotation: 0}); gsap.set(".sunglasses", {opacity: 0, y: -5}); 
    setExpression(eyeClass, mouthClass, extras);
    gsap.ticker.add(updateDizzyBubblePos);
    updateBubble(msg);
}

window.removeContextLuiji = function() {
    if(!window.isContextActive) return;
    window.isContextActive = false;
    if(cursor) cursor.classList.remove('context-active');
    if(idleBubble) idleBubble.classList.remove('show');
    gsap.ticker.remove(updateDizzyBubblePos);
    gsap.to(".sunglasses", {opacity: 0, duration: 0.2});
    window.resetIdleTimer(); 
}

function triggerEvilLuiji() {
    clearTimeout(idleTimer);
    if(typingTimeout) clearTimeout(typingTimeout);
    if(blinkInterval) clearInterval(blinkInterval);
    if(lookInterval) clearInterval(lookInterval);
    if(faceTimeline) faceTimeline.kill();
    if(zzzTween) zzzTween.kill();
    window.isIdle = true; document.body.classList.add('evil-glitch');
    if(cursor) cursor.classList.add('idle-active');
    if(idleBubble) { idleBubble.style.left = mouseX + 'px'; idleBubble.style.top = (mouseY < 100) ? (mouseY + 80) + 'px' : (mouseY - 80) + 'px'; }
    gsap.killTweensOf([".face-group", ".sweat-drop", ".spin-eye"]);
    gsap.set(".face-group", {x: 0, y: 0, scale: 1}); gsap.set(".zzz-group", {opacity: 0});
    setExpression(".eye-angry", ".mouth-o");
    updateBubble("<span class='highlight'>OUCH.</span> DON'T DO THAT.");
    gsap.to(".face-group", {x: "random(-8, 8)", y: "random(-8, 8)", duration: 0.05, repeat: 40, yoyo: true});
    setTimeout(() => { document.body.classList.remove('evil-glitch'); window.isEvil = false; window.resetIdleTimer(); }, 3000);
}

document.addEventListener('click', (e) => { 
    if(!window.isEvil && !window.isDizzy && !window.isContextActive) {
        rapidClicks++; clearTimeout(clickTimer);
        if(rapidClicks >= 5) { window.isEvil = true; rapidClicks = 0; triggerEvilLuiji(); } 
        else { clickTimer = setTimeout(() => { rapidClicks = 0; }, 400); }
    }
    if(!window.isContextActive && !window.isHoveringInteractive) window.resetIdleTimer();
});

document.addEventListener('mousemove', (e) => { 
    let currentTime = Date.now(), dt = currentTime - lastMouseTime;
    if (dt > 10 && dt < 100) { 
        let dx = e.clientX - lastMouseX, velocity = Math.abs(dx) / dt;
        if (velocity > 3) {
            let dir = dx > 0 ? 1 : -1;
            if (dir !== lastDirection) {
                shakeCount++; lastDirection = dir;
                clearTimeout(shakeResetTimer); shakeResetTimer = setTimeout(() => { shakeCount = 0; }, 300); 
                if (shakeCount > 6 && !window.isDizzy && !window.isEvil && !window.isContextActive) { shakeCount = 0; triggerDizzyLuiji(); }
            }
        }
    }
    lastMouseX = e.clientX; lastMouseTime = currentTime; mouseX = e.clientX; mouseY = e.clientY; 
    if (!window.isDizzy && !window.isEvil && !window.isContextActive && !window.isHoveringInteractive) window.resetIdleTimer();
});

gsap.ticker.add((time) => {
    cursorX += (mouseX - cursorX) * 0.15; cursorY += (mouseY - cursorY) * 0.15;
    if (cursor) gsap.set(cursor, { x: cursorX, y: cursorY });
});

document.querySelectorAll('.magnetic-text').forEach(el => {
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
        gsap.to(el, { x: x, y: y, duration: 0.5, ease: "power2.out" });
    });
    el.addEventListener('mouseleave', () => { gsap.to(el, { x: 0, y: 0, duration: 1.5, ease: "elastic.out(1, 0.3)" }); });
});

window.resetIdleTimer();