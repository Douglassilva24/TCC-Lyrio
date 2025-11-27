// Atributos de seleção de elementos
const topicInput = document.getElementById("topic-input");
const sendBtn = document.getElementById("send-btn");
const pexelsContainer = document.getElementById("pexels-images");
const responseDiv = document.getElementById("response");
const errorMessage = document.getElementById("error-message");

// Chave da API Pexels
const apiKeyPexels = 'TN0CONsrrVOgnqByrvzHsaZ4hf5OCWRCVVsjbMhsCS9u0Nj8iFKuORdN';

// Variável para armazenar a instância do SpeechSynthesisUtterance
let speechInstance = null;

// Função para mostrar/ocultar o carregamento
function showLoading(show) {
  const loadingSpinner = document.getElementById("loading-spinner");
  loadingSpinner.style.display = show ? "block" : "none";
  sendBtn.disabled = show;
}

// Função para exibir uma mensagem de erro
function showError(msg) {
  errorMessage.style.display = "block";
  errorMessage.textContent = msg;
}

// Função para ocultar a mensagem de erro
function hideError() {
  errorMessage.style.display = "none";
}

document.querySelector(".result-wrapper").classList.add("centered");

// Função para exibir a seção de resultado
function showSection(section) {
  document.getElementById("input-section").classList.remove("active");
  document.getElementById("result-section").classList.remove("active");
  section.classList.add("active");
  section.scrollIntoView({ behavior: "smooth" });
}

// Função para buscar imagens da Pexels API
async function fetchPexelsImages(topic) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(topic  )}&per_page=4`;


  try {
    const response = await fetch(url, {
      headers: { 'Authorization': apiKeyPexels }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar imagens.');
    }

    const data = await response.json();
    const images = data.photos;

    // Limpar o container antes de adicionar novas imagens
    pexelsContainer.innerHTML = '';

    if (images.length > 0) {
      images.forEach((image) => {
        const img = document.createElement("img");
        img.src = image.src.medium; // Usando o tamanho médio da imagem
        img.alt = image.alt;
        img.classList.add("pexels-image");
        pexelsContainer.appendChild(img);
      });
    } else {
      pexelsContainer.innerHTML = "<p>Nenhuma imagem encontrada para este tópico.</p>";
    }
  } catch (error) {
    console.error(error);
    pexelsContainer.innerHTML = "<p>Erro ao buscar imagens.</p>";
  }
}

// Função para gerar o plano de aula
sendBtn.addEventListener("click", async () => {
  const topic = topicInput.value.trim();

  if (!topic) {
    showError("⚠️ Por favor, insira um tópico para a aula.");
    return;
  }

  showLoading(true);
  hideError();
  responseDiv.innerHTML = "";

  // Limpar as imagens antigas antes de buscar novas
  pexelsContainer.innerHTML = "<p>Buscando imagens...</p>";

  try {
    const prompt = `
Você é um assistente para professores eventuais.
Dado o seguinte tema: "${topic}", escreva um texto contínuo no formato de plano de aula.
O texto deve conter:

- Introdução breve sobre o tema.
- Objetivos da aula (marcar os principais com <mark>).
- Desenvolvimento: descrevendo a sequência de ensino, com marcação <mark> nos momentos-chave.
- Atividades sugeridas (com <mark> nos pontos importantes).
- Conclusão resumindo a importância do tema.

Formato:
- Texto corrido, sem listas numeradas ou marcadores.
- Use <b> para subtítulos das partes.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDFvxfPhiNmBDuVNF97OkwDjwYTIGJNIGw`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }  ),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error?.message || "Falha ao se comunicar com a API.");
    }

    const data = await response.json();
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não foi possível gerar o conteúdo.";

    // Exibir o plano de aula gerado
    responseDiv.innerHTML = message;

    // Buscar imagens relacionadas ao tópico
    await fetchPexelsImages(topic);

    // Exibindo a seção de resultado
    showSection(document.getElementById("result-section"));
    document.querySelector(".result-wrapper").classList.remove("centered");
    
    // Oculta a logo da escola
    document.querySelector(".logo-escola").style.display = "none";


  } catch (error) {
    console.error("Erro:", error);
    showError(`❌ Erro ao gerar conteúdo: ${error.message}`);
  } finally {
    showLoading(false);
  }
});

// Função para escutar o plano de aula
const listenBtn = document.getElementById("listen-btn");
listenBtn.addEventListener("click", () => {
  const textToRead = responseDiv.innerText || responseDiv.textContent;
  
  if (textToRead && textToRead.trim() !== "") {
    // Verifica se o navegador tem a API de síntese de fala
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(textToRead);
      speech.lang = 'pt-BR';  // Define o idioma para português

      // Configuração opcional de voz (se preferir uma voz específica)
      const voices = speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.lang === 'pt-BR'); // Tenta selecionar uma voz brasileira
      if (selectedVoice) {
        speech.voice = selectedVoice;
      }

      // Armazena a instância da fala para poder parar depois
      speechInstance = speech;
      
      // Falar o texto
      window.speechSynthesis.speak(speech);
    } else {
      alert("A API de síntese de fala não é suportada neste navegador.");
    }
  } else {
    alert("Não há conteúdo para ler.");
  }
});

// Função para parar a fala
const stopBtn = document.getElementById("stop-btn");
stopBtn.addEventListener("click", () => {
  if (speechInstance) {
    window.speechSynthesis.cancel();  // Interrompe a fala
    speechInstance = null;  // Reseta a instância
    console.log("Fala interrompida.");
  } else {
    alert("Nenhuma fala está sendo reproduzida no momento.");
  }
});

// Função para o botão "Voltar"
const backBtn = document.getElementById("back-btn");
backBtn.addEventListener("click", () => {
  // 1. Exibe a seção de entrada e oculta a seção de resultado
  showSection(document.getElementById("input-section"));

  // 2. Limpa o texto da caixa de pesquisa
  topicInput.value = "";

  // 3. Limpa o plano de aula gerado
  responseDiv.innerHTML = "";

  // 4. Limpa as imagens do Pexels
  pexelsContainer.innerHTML = "";

  // 5. Garante que o card volte ao centro
  document.querySelector(".result-wrapper").classList.add("centered");

  // 6. Mostra a logo da escola novamente
  document.querySelector(".logo-escola").style.display = "inline";

  // 6. Opcional: Esconde qualquer mensagem de erro antiga
  hideError();
});

// Função para o botão "Copiar Conteúdo"
const copyBtn = document.getElementById("copy-btn");
copyBtn.addEventListener("click", () => {
  const contentToCopy = responseDiv.innerText || responseDiv.textContent;

  if (contentToCopy && contentToCopy.trim() !== "") {
    // Tenta copiar o conteúdo para a área de transferência
    navigator.clipboard.writeText(contentToCopy)
      .then(() => {
        alert("Conteúdo copiado com sucesso!");
      })
      .catch(err => {
        console.error("Erro ao copiar o conteúdo: ", err);
        alert("Falha ao copiar o conteúdo.");
      });
  } else {
    alert("Não há conteúdo para copiar.");
  }
});

// --- NOVO: Função para extrair texto e estilos (SEM SÍMBOLOS) ---
function extractTextWithStyles(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const nodes = Array.from(tempDiv.childNodes);
    const result = [];

    nodes.forEach(node => {
        if (node.nodeType === 3) { // TEXT_NODE
            if (node.textContent.trim()) {
                result.push({ text: node.textContent, style: 'normal' });
            }
        } else if (node.nodeType === 1) { // ELEMENT_NODE
            const tagName = node.tagName.toLowerCase();
            let style = 'normal';

            if (tagName === 'b') {
                style = 'bold';
            } else if (tagName === 'mark') {
                style = 'mark';
            }

            const content = extractTextWithStyles(node.innerHTML);
            
            if (tagName === 'b') {
                result.push({ text: node.textContent.trim(), style: style, isTitle: true });
            } else {
                result.push(...content.map(item => ({ ...item, style: item.style === 'normal' ? style : item.style })));
            }
        }
    });

    return result;
}

// PDF com capa personalizada (SEM SÍMBOLOS)
const downloadPdfBtn = document.getElementById("download-pdf-btn");

downloadPdfBtn.addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    unit: "mm",
    format: "a4"
  });

  const contentHTML = responseDiv.innerHTML;
  const topic = topicInput.value.trim() || "Tema não informado";
  const schoolName = "E.E. PROF. DORIVAL MONTEIRO DE OLIVEIRA";
  const date = new Date().toLocaleDateString("pt-BR");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  if (!contentHTML.trim()) {
    alert("Nada para exportar.");
    return;
  }

  // ==================== CAPA ====================
  
  // Fundo gradiente (simulado com retângulos)
  pdf.setFillColor(245, 245, 250);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // 1. Padrão decorativo no topo
  pdf.setFillColor(192, 0, 0);
  pdf.rect(0, 0, pageWidth, 8, 'F');


  // 2. Espaço após logo
  let yPos = 85;

  // 3. Título Principal
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(192, 0, 0);
  pdf.text("PLANO DE AULA", pageWidth / 2, yPos, { align: "center" });

  yPos += 12;

  // 4. Linha decorativa
  pdf.setDrawColor(192, 0, 0);
  pdf.setLineWidth(1.5);
  pdf.line(30, yPos, pageWidth - 30, yPos);

  yPos += 10;

  // 5. Nome da Escola
  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(12);
  pdf.setTextColor(60, 60, 60);
  const schoolLines = pdf.splitTextToSize(schoolName, pageWidth - 20);
  pdf.text(schoolLines, pageWidth / 2, yPos, { align: "center" });

  yPos += 15;

  // 6. Tema
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(30, 30, 30);
  pdf.text("TEMA:", 30, yPos);
  
  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(14);
  pdf.setTextColor(192, 0, 0);
  const topicLines = pdf.splitTextToSize(topic.toUpperCase(), pageWidth - 60);
  pdf.text(topicLines, 60, yPos);

  yPos += 15;

  // 7. Data
  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(30, 30, 30);
  pdf.text(`Data: ${date}`, 30, yPos);

  yPos += 30;

  // 8. Caixa informativa
  pdf.setFillColor(240, 245, 255);
  pdf.setDrawColor(192, 0, 0);
  pdf.setLineWidth(1);
  pdf.rect(25, yPos, pageWidth - 50, 25, 'FD');

  pdf.setFont("Helvetica", "italic");
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.text("Ferramenta Educacional - Assistente para Professores", 
           pageWidth / 2, yPos + 8, { align: "center" });
  pdf.text("Gerado automaticamente com inteligência artificial", 
           pageWidth / 2, yPos + 15, { align: "center" });

  // ==================== CONTEÚDO ====================
  
  pdf.addPage();

  let y = 20;
  const margin = 20;
  const lineHeight = 7;
  const textWidth = pageWidth - 2 * margin;

  // Cabeçalho da página de conteúdo
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(192, 0, 0);
  
  const headerLines = pdf.splitTextToSize(`Plano de Aula: ${topic}`, textWidth);
  headerLines.forEach((line, index) => {
    pdf.text(line, margin, y);
    y += 6;
  });

  // Linha divisória
  pdf.setDrawColor(192, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 8;

  // Extrai o conteúdo com os estilos
  const styledContent = extractTextWithStyles(contentHTML);

  // Processa o conteúdo
  styledContent.forEach((item, index) => {
    let text = item.text;
    let style = item.style;
    let isTitle = item.isTitle;

    // Define cores e estilos
    if (isTitle) {
      pdf.setFont("Helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(192, 0, 0);
      
      // Adiciona fundo para título
      const lineCount = pdf.splitTextToSize(text, textWidth).length;
      pdf.setFillColor(240, 248, 255);
      pdf.rect(margin - 2, y - 3, textWidth + 4, (lineCount * lineHeight) + 2, 'F');
    } else if (style === 'mark') {
      pdf.setFont("Helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(192, 0, 0);
    } else {
      pdf.setFont("Helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
    }

    // Quebra o texto em linhas
    const lines = pdf.splitTextToSize(text, textWidth);

    lines.forEach(line => {
      // Verifica se precisa de nova página
      if (y > pageHeight - 20) {
        pdf.addPage();
        y = 20;

        // Rodapé com número de página
        pdf.setFont("Helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Página ${pdf.internal.pages.length - 1}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      }

      // Adiciona a linha
      pdf.text(line, margin, y);
      y += lineHeight;
    });

    // Espaço após títulos
    if (isTitle) {
      y += 3;
    }

    // Espaço entre parágrafos normais
    if (!isTitle && style === 'normal' && text.length > 20) {
      y += 2;
    }
  });

  // ==================== RODAPÉ FINAL ====================
  
  // Adiciona última página com informações
  pdf.addPage();
  
  // Fundo
  pdf.setFillColor(245, 245, 250);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Padrão decorativo
  pdf.setFillColor(192, 0, 0);
  pdf.rect(0, 0, pageWidth, 8, 'F');
  pdf.rect(0, pageHeight - 8, pageWidth, 8, 'F');

  let finalY = 40;

  // Título
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(192, 0, 0);
  pdf.text("OBSERVAÇÕES FINAIS", pageWidth / 2, finalY, { align: "center" });

  finalY += 15;

  // Conteúdo de observações (SEM SÍMBOLOS)
  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(50, 50, 50);

  const observations = [
    "Adapte as atividades conforme o nível de aprendizado da turma",
    "Utilize recursos visuais e práticos para melhor engajamento",
    "Reserve tempo para dúvidas e discussões",
    "Avalie o desenvolvimento dos alunos durante a aula",
    "Mantenha flexibilidade no cronograma conforme necessário"
  ];

  observations.forEach((obs, index) => {
    // Linha decorativa antes de cada observação
    pdf.setDrawColor(192, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, finalY - 1, margin + 2, finalY - 1);
    
    pdf.text(obs, margin + 5, finalY);
    finalY += 8;
  });

  // Caixa de assinatura
  finalY += 15;
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(0.5);
  pdf.line(margin, finalY, margin + 60, finalY);
  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Assinatura do Professor", margin, finalY + 5);

  // Rodapé
  pdf.setFont("Helvetica", "italic");
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text("Assistente para Professores - Ferramenta Educacional 2024", 
           pageWidth / 2, pageHeight - 12, { align: "center" });

  pdf.save(`Plano - ${topic}.pdf`);
});