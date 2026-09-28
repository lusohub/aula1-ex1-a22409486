document.getElementById('secretButton').addEventListener('click', function() {
    // 1. Tocar o som
    const som = document.getElementById('secretSound');
    som.currentTime = 0; // Reinicia o som caso cliquem duas vezes
    som.play();
    document.getElementById('secretButton').setAttribute('title', 'Segredo encontrado!');
    alert("Parabéns! Encontraste o uivar secreto! 🐺");
        
});