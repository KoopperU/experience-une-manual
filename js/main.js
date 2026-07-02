document.addEventListener('DOMContentLoaded', () => {
    const bookEl = document.getElementById('book');
    const loader = document.getElementById('loader-container');
    const appContainer = document.getElementById('app-container');
    
    // Configuración para el tamaño de la revista
    // Estos valores definirán la proporción base. El libro mantendrá su 'aspect-ratio' basado en width/height.
    const PAGE_WIDTH = 500;
    const PAGE_HEIGHT = 707; // Formato similar a A4 o revista (500x707)

    // Inicializamos StPageFlip
    // @ts-ignore
    const pageFlip = new St.PageFlip(bookEl, {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        size: 'stretch',     // Permite estirar y contraer de acuerdo al max/min
        minWidth: 315,
        maxWidth: 1000,
        minHeight: 420,
        maxHeight: 1350,
        drawShadow: true,    // Sombras dinámicas al arrastrar
        maxShadowOpacity: 0.5, // Oscuridad de la sombra
        showCover: true,     // Primer y última hoja se comportan como tapa (independientes)
        mobileScrollSupport: false, // Prevenir scrolling nativo al arrastrar
        autoCenter: true     // Centrar dinámicamente según si es portrait (una pág) o landscape (dos págs)
    });

    // Simular carga de imágenes
    // En una implementación real más compleja se puede usar un promise.all cargando las imágenes,
    // pero con window.onload o esperando un tiempo prudente podemos ocultar el loader.
    window.addEventListener('load', () => {
        // Un pequeño timeout extra para asegurar que las animaciones lottie sean visibles y la experiencia fluida
        setTimeout(() => {
            // Cargar páginas desde el HTML actual
            pageFlip.loadFromHTML(document.querySelectorAll('.page'));
            
            // Ocultar Loader y mostrar App
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                appContainer.style.display = 'flex';
                // Trigger window resize to ensure autoCenter kicks in
                window.dispatchEvent(new Event('resize'));
            }, 500); // 500ms de transición CSS
        }, 1000);
    });

    // Navegación UI
    document.getElementById('btn-prev').addEventListener('click', () => {
        pageFlip.flipPrev();
    });

    document.getElementById('btn-next').addEventListener('click', () => {
        pageFlip.flipNext();
    });

    // Navegación por teclado (Teclas direccionales)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            pageFlip.flipPrev();
        } else if (e.key === 'ArrowRight') {
            pageFlip.flipNext();
        }
    });

    // Añadir lógicas para los botones según estado de la página
    pageFlip.on('flip', (e) => {
        // e.data contiene el index de la página a la que se va a girar
        // Por ejemplo, ocultar botón "prev" si estamos en la 0, o "next" si estamos en el final.
        const prevBtn = document.getElementById('btn-prev');
        const nextBtn = document.getElementById('btn-next');
        
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

    // Trigger inicial manual para setear el estado del botón previo
    const prevBtn = document.getElementById('btn-prev');
    prevBtn.style.opacity = '0.3';
    prevBtn.style.pointerEvents = 'none';
});
