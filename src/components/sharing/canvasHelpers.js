/**
 * canvasHelpers.js
 *
 * Partes comuns aos dois cards de compartilhamento (`ShareableQuoteCard` e
 * `ShareableWorkoutCard`), que desenham em `<canvas>` para virar imagem.
 *
 * Os cards desenham em canvas, e não em HTML, porque o compartilhamento do iOS
 * precisa de um arquivo de imagem. Isso tem um preço: nada aqui resolve variável
 * CSS, então as cores vêm em hexadecimal literal nos componentes.
 *
 * O que NÃO mora aqui é o `drawCanvas` de cada card — a composição é diferente
 * em cada um (um tem card flutuante com máscara arredondada, o outro é
 * sangrado), e tentar unificar isso trocaria duplicação por um emaranhado de
 * condicionais.
 */

/**
 * Cor de preenchimento mais sombra, em uma chamada só.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} cor Cor do texto ou da forma.
 * @param {string} corDaSombra
 * @param {{blur?: number, y?: number}} [deslocamento]
 */
export function applyGlow(ctx, cor, corDaSombra, deslocamento = {}) {
    ctx.fillStyle = cor;
    ctx.shadowColor = corDaSombra;
    ctx.shadowBlur = deslocamento.blur || 0;
    ctx.shadowOffsetY = deslocamento.y || 0;
    ctx.shadowOffsetX = 0;
}

/**
 * Desliga a sombra, preservando a cor de preenchimento.
 * Sem isto, a sombra do elemento anterior vaza para o próximo desenho.
 *
 * @param {CanvasRenderingContext2D} ctx
 */
export function resetShadow(ctx) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
}

/**
 * Medidas para cobrir o canvas inteiro mantendo a proporção da imagem, com o
 * excesso centralizado — o equivalente a `object-fit: cover` do CSS.
 *
 * @param {{width: number, height: number}} img
 * @param {number} larguraCanvas
 * @param {number} alturaCanvas
 * @returns {{dx: number, dy: number, largura: number, altura: number}}
 */
export function coverFit(img, larguraCanvas, alturaCanvas) {
    if (!img?.width || !img?.height) {
        return { dx: 0, dy: 0, largura: 0, altura: 0 };
    }

    const escala = Math.max(larguraCanvas / img.width, alturaCanvas / img.height);
    const largura = img.width * escala;
    const altura = img.height * escala;

    return {
        dx: larguraCanvas / 2 - largura / 2,
        dy: alturaCanvas / 2 - altura / 2,
        largura,
        altura
    };
}

/**
 * Desenha a imagem cobrindo o canvas. Imagem sem dimensão é ignorada — é o que
 * acontece quando o `onerror` disparou e o desenho seguiu mesmo assim.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} img
 * @param {number} larguraCanvas
 * @param {number} alturaCanvas
 */
export function drawImageCover(ctx, img, larguraCanvas, alturaCanvas) {
    const { dx, dy, largura, altura } = coverFit(img, larguraCanvas, alturaCanvas);
    if (largura <= 0) return;
    ctx.drawImage(img, dx, dy, largura, altura);
}

/**
 * Carrega todas as imagens e chama `desenhar` uma única vez, quando a última
 * resolver — tenha ela carregado ou falhado.
 *
 * Falha conta como resolvida de propósito: se uma imagem não vier, o card ainda
 * precisa ser desenhado, senão quem compartilha recebe um retângulo preto. O
 * `drawImageCover` cuida de ignorar a imagem que não carregou.
 *
 * @param {Array<[HTMLImageElement, string]>} pares Imagem e a URL dela.
 * @param {() => void} desenhar
 */
export function loadImagesThenDraw(pares, desenhar) {
    let resolvidas = 0;
    let jaDesenhou = false;

    const contar = () => {
        resolvidas += 1;
        if (resolvidas < pares.length || jaDesenhou) return;
        jaDesenhou = true;
        desenhar();
    };

    pares.forEach(([img, src]) => {
        // Sem isto o canvas fica "contaminado" e `toDataURL` lança.
        img.crossOrigin = 'anonymous';
        img.onload = contar;
        img.onerror = contar;
        img.src = src;
    });
}

/**
 * Nome para estampar no card, com "Atleta" quando não há nome utilizável.
 *
 * @param {unknown} nome
 * @returns {string}
 */
export function displayNameOf(nome) {
    return (nome || 'Atleta').toString().trim() || 'Atleta';
}
