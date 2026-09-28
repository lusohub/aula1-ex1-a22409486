// Gallery image modal functionality
document.addEventListener('DOMContentLoaded', () => {
    const galleryImages = document.querySelectorAll('.gallery-img');
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.modal-close');
    const backBtn = document.getElementById('backBtn');

    // Add click event to all gallery images
    galleryImages.forEach(img => {
        img.addEventListener('click', () => {
            modal.classList.add('show');
            modalImage.src = img.src;
            modal.style.display = 'flex';
        });

        // Make images selectable
        img.style.cursor = 'pointer';
    });

    // Close modal when clicking the X button
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        modal.style.display = 'none';
    });

    // Close modal when clicking outside the image
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    });

    // Back button functionality
    backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});
