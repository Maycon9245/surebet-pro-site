// Script simples para feedback (futuro: pode filtrar os jogos)
document.querySelectorAll(".sidebar input").forEach(input => {
  input.addEventListener("change", () => {
    console.log("Filtro alterado:", input.type, input.value || input.checked);
  });
});
