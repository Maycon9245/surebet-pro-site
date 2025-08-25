// Expandir/recolher filtros
document.querySelectorAll('.filter-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const list = document.getElementById(targetId);

    if (list.style.display === "none") {
      list.style.display = "block";
      btn.querySelector(".arrow").style.transform = "rotate(0deg)";
    } else {
      list.style.display = "none";
      btn.querySelector(".arrow").style.transform = "rotate(-90deg)";
    }
  });
});
