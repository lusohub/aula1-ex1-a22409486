const nome = localStorage.getItem("nomeUsuario") || "Não registado";

  const UserLoboComilao = JSON.parse(localStorage.getItem("rankings_lobo")) || "Não registado";
  const pLoboComilao = UserLoboComilao[UserLoboComilao.length - 1].score || "Não registado";

  const UserCacaOvelha = JSON.parse(localStorage.getItem("cacaOvelha_records_v1")) || "Não registado";
  const nCacaOvelha = UserCacaOvelha[UserCacaOvelha.length - 1].level || "Não registado";

  const pPacWolf = localStorage.getItem("UserScore") || "Não registado";
  const pQuiz = localStorage.getItem("bestScore") || "Não registado";


function emitirCertificado() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  const data = new Date().toLocaleDateString("pt-PT");

      
  doc.setFillColor(245, 245, 235);
  doc.rect(0, 0, 297, 210, "F");

  doc.setDrawColor(30, 100, 70);
  doc.setLineWidth(2);
  doc.rect(10, 10, 277, 190);

  doc.setFont("times", "bold");
  doc.setFontSize(32);
  doc.text("Certificado de Canis lupus signatus", 148.5, 45, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(18);
  doc.text("Certifica-se que o aluno:", 148.5, 75, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.text(nome, 148.5, 100, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(18);
  doc.text("Obteu os seguintes resultados:", 148.5, 125, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(18);
  doc.text("Pontos no Lobo Comilão: " + pLoboComilao , 148.5, 132, { align: "center" });
  doc.text("Nivel máximo no Caça Ovelha: " + nCacaOvelha , 148.5, 139, { align: "center" });
  doc.text("Pontos no Pac-Wolf: " + pPacWolf , 148.5, 146, { align: "center" });
  doc.text("Pontos no Quiz: " + pQuiz , 148.5, 153, { align: "center" });

  doc.setFontSize(14);
  doc.text("Data: " + data, 60, 165);

  doc.line(190, 160, 255, 160);
  doc.text("Assinatura", 222, 170, { align: "center" });

  doc.save("certificado_" + nome + ".pdf");

  localStorage.clear();
}

function unblockCertificado() {
  if (pLoboComilao != "Não registado" && nCacaOvelha != "Não registado" && pPacWolf != "Não registado" && pQuiz != "Não registado") {
  const certificadoBtn = document.getElementById("Certificado");
  certificadoBtn.disabled = false;
  certificadoBtn.style.cursor = "pointer";
  certificadoBtn.style.opacity = 1;
  }
}

onload = unblockCertificado;