document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-container');
    const appContainer = document.getElementById('app-container');
    
    try {
        if (typeof St === 'undefined') {
            throw new Error("La librería StPageFlip no se cargó. ¿Tienes internet o un AdBlocker activo?");
        }

        const bookEl = document.getElementById('book');
        if (!bookEl) throw new Error("No se encontró el elemento #book");

        const PAGE_WIDTH = 500;
        const PAGE_HEIGHT = 707; 

        // Inicializamos StPageFlip de inmediato para mantener el scope global
        // @ts-ignore
        const pageFlip = new St.PageFlip(bookEl, {
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            size: 'fixed',
            drawShadow: true,
            maxShadowOpacity: 0.8, // Sombras más oscuras y dramáticas al doblar el papel
            showCover: true,
            mobileScrollSupport: false,
            autoCenter: true,
            usePortrait: false,
            flippingTime: 1200 // Animación ligeramente más lenta para apreciar la curvatura del papel
        });

        // Configuración de Sonido Premium (Foley)
        const flipAudio = new Audio('https://raw.githubusercontent.com/Nodws/St.PageFlip/master/demo/audio/page-flip.mp3');
        
        let currentTranslate = -25; // Inicia en la portada (desplazado a la izquierda para centrar la mitad derecha)

        const scaleBook = () => {
            const scaler = document.getElementById('book-scaler');
            if (!scaler) return;
            // El libro abierto mide 1000x707
            const bookWidth = PAGE_WIDTH * 2;
            const bookHeight = PAGE_HEIGHT;
            
            // Queremos que ocupe el 95% de la pantalla
            const availableWidth = window.innerWidth * 0.95;
            const availableHeight = window.innerHeight * 0.95;
            
            // Calculamos cuánto debemos escalarlo para que quepa sin deformarse
            let scale = Math.min(availableWidth / bookWidth, availableHeight / bookHeight);
            
            if (scale < 0.2) scale = 0.2;
            
            scaler.style.transform = `scale(${scale}) translateX(${currentTranslate}%)`;
        };

        const updatePageCounter = (targetIndex) => {
            const counter = document.getElementById('page-counter');
            if (!counter) return;
            // Protegemos contra uso antes de carga
            if (!pageFlip || !pageFlip.getPageCount) return;
            
            const total = pageFlip.getPageCount();
            if (total === 0) return;
            
            if (targetIndex === 0) {
                counter.innerText = `1 / ${total}`;
            } else if (targetIndex >= total - 1) {
                counter.innerText = `${total} / ${total}`;
            } else {
                counter.innerText = `${targetIndex + 1} - ${targetIndex + 2} / ${total}`;
            }
        };

        const initApp = async () => {
            try {
                const bookContainer = document.getElementById('book');
                
                // Función auxiliar para verificar si una imagen existe
                const checkImg = url => new Promise(resolve => {
                    const img = new Image();
                    img.onload = () => resolve({exists: true});
                    img.onerror = () => resolve({exists: false});
                    img.src = url;
                });

                const [inicioData, finalData] = await Promise.all([
                    checkImg('./assets/img/inicio.jpg'),
                    checkImg('./assets/img/final.jpg')
                ]);

                // Buscar páginas interiores (del 2 al 100)
                const MAX_PAGES = 100;
                const promises = [];
                for(let i = 2; i <= MAX_PAGES; i++) {
                    promises.push(
                        new Promise((resolve) => {
                            const img = new Image();
                            const url = `./assets/img/${i}.jpg`;
                            img.onload = () => resolve({index: i, exists: true, url: url});
                            img.onerror = () => resolve({index: i, exists: false});
                            img.src = url;
                        })
                    );
                }
                
                const results = await Promise.all(promises);
                let interiorPages = results.filter(r => r.exists).sort((a,b) => a.index - b.index);
                
                let validPages = [];

                // PORTADA
                validPages.push({ 
                    url: inicioData.exists ? './assets/img/inicio.jpg' : 'https://via.placeholder.com/500x707/2b2b2b/FFFFFF?text=INICIO.JPG+FALTA'
                });

                // INTERIORES
                interiorPages.forEach(p => validPages.push({ url: p.url }));

                // BALANCEO
                if ((validPages.length + 1) % 2 !== 0) {
                    validPages.push({ url: 'https://via.placeholder.com/500x707/FFFFFF/FFFFFF?text=' });
                }

                // CONTRAPORTADA
                validPages.push({ 
                    url: finalData.exists ? './assets/img/final.jpg' : 'https://via.placeholder.com/500x707/2b2b2b/FFFFFF?text=FINAL.JPG+FALTA'
                });

                // RECONSTRUIR HTML
                bookContainer.innerHTML = '';
                
                validPages.forEach((page, index) => {
                    const div = document.createElement('div');
                    div.className = 'page';
                    
                    // Al quitar data-density="hard", la portada y contraportada se curvarán como revista suave
                    
                    const img = document.createElement('img');
                    img.src = page.url;
                    img.className = 'page-img';
                    img.alt = `Página ${index + 1}`;
                    img.onerror = function() { this.onerror=null; this.src='https://via.placeholder.com/500x707/FFFFFF/2b2b2b?text=ERROR'; };
                    
                    div.appendChild(img);
                    bookContainer.appendChild(div);
                });

                // CARGAR EN STPAGEFLIP
                pageFlip.loadFromHTML(document.querySelectorAll('.page'));
                
                // Escalar inicialmente y en cada cambio de tamaño
                scaleBook();
                updatePageCounter(0); // Setear contador inicial
                window.addEventListener('resize', scaleBook);

                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                    // Disparar resize para asegurar que el centro interno de StPageFlip se ajuste al wrapper nuevo
                    window.dispatchEvent(new Event('resize'));
                }, 500);
            } catch (err) {
                alert("Error al cargar las páginas: " + err.message);
                loader.style.display = 'none';
            }
        };

        setTimeout(initApp, 1000);

        // Navegación UI
        document.getElementById('btn-prev').addEventListener('click', () => {
            pageFlip.flipPrev();
        });

        document.getElementById('btn-next').addEventListener('click', () => {
            pageFlip.flipNext();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                pageFlip.flipPrev();
            } else if (e.key === 'ArrowRight') {
                pageFlip.flipNext();
            }
        });

        // Añadir lógica de Pantalla Completa
        const btnFullscreen = document.getElementById('btn-fullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.log(`Error al intentar pantalla completa: ${err.message}`);
                    });
                } else {
                    document.exitFullscreen();
                }
            });
        }

        pageFlip.on('flip', (e) => {
            const prevBtn = document.getElementById('btn-prev');
            const nextBtn = document.getElementById('btn-next');
            
            // Matemáticas para centrar el libro
            if (e.data === 0) {
                currentTranslate = -25; // Portada (mover a la izquierda)
            } else if (e.data >= pageFlip.getPageCount() - 1) {
                currentTranslate = 25; // Contraportada (mover a la derecha)
            } else {
                currentTranslate = 0; // Páginas interiores (centro perfecto)
            }
            scaleBook(); // Disparar animación
            updatePageCounter(e.data); // Actualizar indicador numérico

            // 1. Reproducir sonido realista (Foley)
            try {
                flipAudio.currentTime = 0; // Reiniciar por si pasas rápido
                flipAudio.volume = 0.3 + Math.random() * 0.3; // Volumen aleatorio para evitar que suene robótico repetitivo
                flipAudio.play().catch(err => { /* Ignorar si el navegador bloquea autoplay sin interacción */ });
            } catch (err) {}

            // 2. Ocultar instrucciones cuando el usuario aprenda a usarlo
            const hint = document.getElementById('interaction-hint');
            if (hint) {
                hint.style.opacity = '0';
            }
            
            // 3. Lógica de los botones visuales
            if (e.data === 0) {
                prevBtn.style.opacity = '0.3';
                prevBtn.style.pointerEvents = 'none';
            } else {
                prevBtn.style.opacity = '1';
                prevBtn.style.pointerEvents = 'auto';
            }

            if (e.data >= pageFlip.getPageCount() - 1) {
                nextBtn.style.opacity = '0.3';
                nextBtn.style.pointerEvents = 'none';
            } else {
                nextBtn.style.opacity = '1';
                nextBtn.style.pointerEvents = 'auto';
            }
        });

        const prevBtn = document.getElementById('btn-prev');
        if (prevBtn) {
            prevBtn.style.opacity = '0.3';
            prevBtn.style.pointerEvents = 'none';
        }

    } catch (error) {
        alert("Error crítico: " + error.message);
        loader.style.display = 'none';
    }
});
