// =========================================================
// AJUSTE DINÂMICO DA ALTURA DO HEADER
// Objetivo: quando o usuário clica em um link do menu
// (Sobre, Jogos, etc), a página precisa parar de rolar
// exatamente abaixo do header fixo, sem escondê-lo e sem
// deixar um espaço vazio grande demais.
//
// Como o header pode mudar de altura (ex: em telas menores
// o menu quebra para uma segunda linha), não é seguro usar
// um número fixo de pixels no CSS. Por isso medimos a altura
// real do header aqui em JavaScript e guardamos esse valor
// numa variável CSS (--header-height), que é usada no
// style.css nas propriedades scroll-padding-top e
// scroll-margin-top.
//
// Ajuste futuro: se o header ganhar mais uma linha de
// conteúdo (ex: um sub-menu), não precisa mexer em nada
// aqui — a altura é recalculada automaticamente.
// =========================================================

const headerEl = document.querySelector("header");

function atualizarAlturaHeader() {
    if (!headerEl) return;
    // offsetHeight = altura real do header já renderizado na tela,
    // incluindo padding e borda.
    document.documentElement.style.setProperty("--header-height", headerEl.offsetHeight + "px");
}

atualizarAlturaHeader(); // calcula assim que o script carrega

// Recalcula sempre que a janela for redimensionada (ex: usuário
// girando o celular, ou o header mudando de layout)
window.addEventListener("resize", atualizarAlturaHeader);

// Recalcula de novo quando a página terminar de carregar tudo
// (fontes, imagens etc podem alterar a altura do header)
window.addEventListener("load", atualizarAlturaHeader);


// =========================================================
// FUNÇÃO GENÉRICA DE CARROSSEL (usada no banner do HOME)
// Recebe os elementos do carrossel e faz a troca automática
// de slides, além de permitir clicar nas bolinhas (dots)
// para pular direto para um slide específico.
//
// Parâmetros:
//   trackEl     -> elemento "trilho" que contém os slides
//                  (é ele que se move de um lado para o outro)
//   slideEls    -> lista de elementos de cada slide
//   dotEls      -> lista das bolinhas de navegação
//   intervalTime-> tempo (em ms) entre a troca automática de slides
// =========================================================

function initCarousel(trackEl, slideEls, dotEls, intervalTime) {
    if (!trackEl || slideEls.length === 0) return;

    let currentIndex = 0;
    let autoSlideInterval;

    // Move o trilho para mostrar o slide do índice indicado
    function goToSlide(index) {
        currentIndex = index;
        trackEl.style.transform = `translateX(-${index * 100}%)`;

        // Atualiza qual bolinha fica destacada (classe "active")
        dotEls.forEach(dot => dot.classList.remove("active"));
        if (dotEls[index]) dotEls[index].classList.add("active");
    }

    // Avança para o próximo slide (volta para o primeiro
    // depois do último, usando o resto da divisão %)
    function nextSlide() {
        goToSlide((currentIndex + 1) % slideEls.length);
    }

    // Liga a troca automática de slides em intervalos de tempo
    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, intervalTime);
    }

    // Reinicia a contagem do tempo (usado depois de um clique manual,
    // para não trocar de slide logo em seguida de forma abrupta)
    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    // Clique manual em uma bolinha leva direto para aquele slide
    dotEls.forEach(dot => {
        dot.addEventListener("click", () => {
            const index = parseInt(dot.getAttribute("data-index"));
            goToSlide(index);
            resetAutoSlide();
        });
    });

    startAutoSlide();
}

// =========================================================
// CARROSSEL DO BANNER PRINCIPAL (HOME)
// Pega os elementos do banner no HTML e inicia o carrossel
// genérico definido acima, trocando de slide a cada 5 segundos.
// =========================================================

const heroTrack = document.querySelector(".hero-track");
const heroSlides = document.querySelectorAll(".hero-slide");
const heroDots = document.querySelectorAll(".hero-dots .dot");

initCarousel(heroTrack, heroSlides, heroDots, 5000); // troca a cada 5s

// =========================================================
// ESTEIRA CONTÍNUA DA SEÇÃO "MEUS JOGOS"
// Diferente do carrossel do banner (que troca de slide em
// "saltos"), aqui os cards deslizam continuamente da direita
// para a esquerda, como uma esteira, e voltam ao início de
// forma invisível graças aos cards duplicados no HTML.
// =========================================================

const jogosTrack = document.querySelector(".jogos-carousel .carousel-track");
const jogosDots = document.querySelectorAll(".jogos-dots .dot");

if (jogosTrack) {

    const totalOriginais = 3; // número de jogos reais (sem contar as cópias duplicadas no HTML)
    const velocidade = 55;    // velocidade da esteira em pixels por segundo (quanto maior, mais rápido)

    let cardStep = 0;      // largura de um card + o espaçamento (gap) entre eles
    let offset = 0;        // quanto a esteira já andou, em pixels
    let pausado = false;   // true quando o mouse está em cima do carrossel (pausa a animação)
    let ultimoTempo = null;
    let timeoutRetomar;

    // Calcula a largura de um "passo" da esteira: largura do
    // card somada ao espaçamento (gap) definido no CSS.
    // Isso é recalculado caso a tela mude de tamanho.
    function calcularPasso() {
        const primeiroCard = jogosTrack.querySelector(".jogo-card");
        if (!primeiroCard) return 0;

        const estilo = getComputedStyle(jogosTrack);
        const gap = parseFloat(estilo.gap) || 0;

        return primeiroCard.getBoundingClientRect().width + gap;
    }

    // Descobre qual bolinha deve ficar destacada de acordo com
    // a posição atual da esteira.
    function atualizarBolinhaAtiva() {
        const index = Math.round(offset / cardStep) % totalOriginais;

        jogosDots.forEach(dot => dot.classList.remove("active"));
        if (jogosDots[index]) jogosDots[index].classList.add("active");
    }

    // Loop de animação: roda a cada frame do navegador
    // (requestAnimationFrame), movendo a esteira de acordo
    // com o tempo que passou desde o último frame (delta).
    // Usar o tempo real (em vez de um valor fixo por frame)
    // garante uma velocidade constante mesmo se o navegador
    // desenhar mais ou menos frames por segundo.
    function animar(tempoAtual) {
        if (ultimoTempo === null) ultimoTempo = tempoAtual;

        const delta = (tempoAtual - ultimoTempo) / 1000; // diferença de tempo em segundos
        ultimoTempo = tempoAtual;

        if (!pausado) {
            offset += velocidade * delta;

            const larguraConjunto = cardStep * totalOriginais;

            // Quando a esteira anda a largura de um "conjunto"
            // inteiro de cards originais, volta o offset para 0.
            // Como logo depois dos cards originais existem cópias
            // idênticas (duplicadas no HTML), essa volta é
            // completamente disfarçada, sem corte visível.
            if (offset >= larguraConjunto) {
                offset -= larguraConjunto;
            }

            jogosTrack.style.transform = `translateX(-${offset}px)`;

            atualizarBolinhaAtiva();
        }

        requestAnimationFrame(animar);
    }

    cardStep = calcularPasso();

    // Recalcula o tamanho do passo se a janela for redimensionada
    // (a largura dos cards pode mudar em telas menores, ver
    // o media query em style.css)
    window.addEventListener("resize", () => {
        cardStep = calcularPasso();
    });

    requestAnimationFrame(animar); // inicia o loop de animação

    // Clique em uma bolinha pula direto para aquele grupo de cards
    jogosDots.forEach(dot => {
        dot.addEventListener("click", () => {
            const index = parseInt(dot.getAttribute("data-index"));

            offset = index * cardStep;

            // Usa uma transição suave só nesse pulo manual
            // (a animação automática normal não usa transition,
            // pois já se move a cada frame)
            jogosTrack.style.transition = "transform .4s ease";
            jogosTrack.style.transform = `translateX(-${offset}px)`;

            jogosDots.forEach(d => d.classList.remove("active"));
            dot.classList.add("active");

            pausado = true; // pausa a esteira automática por um tempo

            // Depois de 2.5s, remove a pausa e volta o movimento
            // automático normal (sem a transição suave, que é só
            // para o clique manual)
            clearTimeout(timeoutRetomar);
            timeoutRetomar = setTimeout(() => {
                jogosTrack.style.transition = "";
                pausado = false;
                ultimoTempo = null; // evita um "salto" no tempo decorrido
            }, 2500);
        });
    });

    // Pausa a esteira quando o mouse passa por cima do carrossel,
    // e retoma quando o mouse sai (facilita ler os cards)
    const jogosCarouselEl = document.querySelector(".jogos-carousel");

    jogosCarouselEl.addEventListener("mouseenter", () => { pausado = true; });
    jogosCarouselEl.addEventListener("mouseleave", () => {
        pausado = false;
        ultimoTempo = null;
    });
}
