
// --- Preloader Logic ---
const preloader = document.getElementById('preloader');
if (preloader) {
    // wait for everything to load
    const fadeOut = () => {
        setTimeout(() => {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
            document.body.classList.remove('loading');

            setTimeout(() => {
                if (preloader.parentNode) {
                    preloader.parentNode.removeChild(preloader);
                }
            }, 1000);
        }, 2000);
    };

    if (document.readyState === 'complete') {
        fadeOut();
    } else {
        window.addEventListener('load', fadeOut);
    }
}
