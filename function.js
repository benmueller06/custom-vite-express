document.addEventListener("DOMContentLoaded", function () {
  let totalCalories = 0;

  function updateCalories() {
    document.getElementById("totalCalories").textContent = totalCalories;
  }

  window.addRecipeCalories = function (calories) {
    totalCalories += calories;
    updateCalories();
  };

  document.querySelectorAll("nav ul li a").forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const targetId = this.getAttribute("href").replace("#", "");
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  document.getElementById("personalInfos").innerHTML += `
    <form id="infoForm">
      <label for="name">Name:</label>
      <input type="text" id="name" required>
      <label for="age">Age:</label>
      <input type="number" id="age" required>
      <label for="weight">Weight (kg):</label>
      <input type="number" id="weight" required>
      <button type="submit">Save</button>
    </form>
    <p id="savedInfo"></p>
  `;

  document.getElementById("infoForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const age = document.getElementById("age").value;
    const weight = document.getElementById("weight").value;

    document.getElementById("savedInfo").textContent = `Saved: ${name}, ${age} years, ${weight} kg`;
  });
});
