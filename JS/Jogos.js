// Gallery image modal and Video Hover functionality
document.addEventListener('DOMContentLoaded', () => {
    const galleryImages = document.querySelectorAll('.gallery-img');
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.modal-close');
    const backBtn = document.getElementById('backBtn');
    
    // Novo: Seleciona as cartas dos jogos para os vídeos
    const gameCards = document.querySelectorAll('.game-container');

    
    gameCards.forEach(card => {
        const video = card.querySelector('.game-video');

        card.addEventListener('mouseenter', () => {
            // Verifica se o vídeo existe e se tem um ficheiro válido associado
            if (video && video.getAttribute('src') !== '.mp4') {
                video.play()
                    .then(() => {
                        video.classList.add('is-playing');
                    })
                    .catch(error => {
                        console.warn("A reprodução do vídeo foi bloqueada ou o ficheiro não existe:", error);
                    });
            }
        });

        card.addEventListener('mouseleave', () => {
            if (video && video.getAttribute('src') !== '.mp4') {
                video.pause();
                video.currentTime = 0; // Reinicia o vídeo para o início
                video.classList.remove('is-playing');
            }
        });
    });

    if (galleryImages.length > 0 && modal && modalImage) {
        galleryImages.forEach(img => {
            img.addEventListener('click', () => {
                modal.classList.add('show');
                modalImage.src = img.src;
                modal.style.display = 'flex';
            });
            img.style.cursor = 'pointer';
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
                modal.style.display = 'none';
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.classList.remove('show');
                modal.style.display = 'none';
            }
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    if (document.getElementById('startQuizBtn')) {
        document.getElementById('startQuizBtn').addEventListener('click', () => {
            window.location.href = 'LoboQuiz/QuizV3_Index.html';
        });
    }
});

function adicionarPontos(pontosGanhos) {
    let pontuacaoAtual = parseInt(sessionStorage.getItem('pontuacao')) || 0;
    
    pontuacaoAtual += pontosGanhos;
    
    sessionStorage.setItem('pontuacao', pontuacaoAtual.toString());
    
    console.log(`Pontuação atual: ${pontuacaoAtual}`);
}

// Exemplo de uso: Ganhou um quiz? Chama a função:
// adicionarPontos(10);