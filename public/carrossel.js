// carrossel.js
const banners = [
  { image: "imagens/banner1.jpg", url: "https://anunciante1.com", alt: "Anunciante 1" },
  { image: "imagens/banner2.jpg", url: "https://anunciante2.com", alt: "Anunciante 2" },
  { image: "imagens/banner3.jpg", url: "https://anunciante3.com", alt: "Anunciante 3" },
  { image: "imagens/banner4.jpg", url: "https://anunciante4.com", alt: "Anunciante 4" },
  { image: "imagens/banner5.jpg", url: "https://anunciante5.com", alt: "Anunciante 5" },
  { image: "imagens/banner6.jpg", url: "https://anunciante6.com", alt: "Anunciante 6" },
];

const tempoTroca = 3000; // 3 segundos

document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector(".banner-track");
  if (!track) return;

  // Renderizar banners
  banners.forEach(banner => {
    const a = document.createElement("a");
    a.href = banner.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    const img = document.createElement("img");
    img.src = banner.image;
    img.alt = banner.alt;
    img.classList.add("banner-img");

    a.appendChild(img);
    track.appendChild(a);
  });

  // Clonar para looping infinito
  banners.forEach(banner => {
    const a = document.createElement("a");
    a.href = banner.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    const img = document.createElement("img");
    img.src = banner.image;
    img.alt = banner.alt;
    img.classList.add("banner-img");

    a.appendChild(img);
    track.appendChild(a);
  });

  // Rolagem automática
  let posicao = 0;
  function rolar() {
    posicao++;
    track.style.transform = `translateX(-${posicao * 260}px)`; // 260 = largura banner + gap
    if (posicao >= banners.length) {
      posicao = 0;
      track.style.transition = "none";
      track.style.transform = "translateX(0)";
      setTimeout(() => {
        track.style.transition = "transform 0.5s ease-in-out";
      }, 50);
    }
  }
  setInterval(rolar, tempoTroca);
});
