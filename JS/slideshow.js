// Slideshow configuration
const slides = [
    'Imagens/Slideshow/LoboIbericoA1.png',
    'Imagens/Slideshow/LoboIbericoA2.png',
    'Imagens/Slideshow/LoboIbericoA3.png',
    'Imagens/Slideshow/LoboIbericoA4.png',
    'Imagens/Slideshow/LoboIbericoA5.png',
    'Imagens/Slideshow/LoboIbericoA6.png',
    'Imagens/Slideshow/LoboIbericoA7.png'
    // Add more image paths here as needed
];

let currentSlide = 0;
let autoSlideTimer = null;
const AUTO_SLIDE_INTERVAL = 10000; // 10s

// Initialize slideshow
function initSlideshow() {
    const slideImg = document.getElementById('slideShow');
    const indicatorsContainer = document.getElementById('slideIndicators');
    
    // Create indicator dots for each slide
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'slide-dot';
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(dot);
    });
    
    // Set initial image
    updateSlide();
    
    // Add event listeners
    document.getElementById('prevBtn').addEventListener('click', previousSlide);
    document.getElementById('nextBtn').addEventListener('click', nextSlide);
    
    // Start auto-slide
    startAutoSlide();
    
    // Pause auto-slide on hover, resume on mouse leave
    const container = document.getElementById('slideShowContainer');
    container.addEventListener('mouseenter', stopAutoSlide);
    container.addEventListener('mouseleave', startAutoSlide);
}

// Update slide display
function updateSlide() {
    const slideImg = document.getElementById('slideShow');
    slideImg.src = slides[currentSlide];
    
    // Update indicator dots
    document.querySelectorAll('.slide-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

// Go to specific slide
function goToSlide(index) {
    currentSlide = index;
    updateSlide();
    // Reset auto-slide timer
    stopAutoSlide();
    startAutoSlide();
}

// Next slide
function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlide();
    stopAutoSlide();
    startAutoSlide();
}

// Previous slide
function previousSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlide();
    stopAutoSlide();
    startAutoSlide();
}

// Auto-slide functionality
function startAutoSlide() {
    autoSlideTimer = setInterval(() => {
        nextSlide();
    }, AUTO_SLIDE_INTERVAL);
}

function stopAutoSlide() {
    if (autoSlideTimer) {
        clearInterval(autoSlideTimer);
        autoSlideTimer = null;
    }
}

// Start slideshow when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlideshow);
} else {
    initSlideshow();
}
