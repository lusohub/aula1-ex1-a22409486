document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const nomeUtilizador = document.querySelector('input[name="Username"]').value;

    if (nomeUtilizador.trim() !== "") {
        sessionStorage.setItem('nomeUsuario', nomeUtilizador);
        localStorage.setItem('nomeUsuario', nomeUtilizador);
        alert(`Bem-vindo, ${nomeUtilizador}!`);
        document.getElementById('login')
    }
});