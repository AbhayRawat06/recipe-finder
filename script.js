const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const recipesSection = document.getElementById('recipes-section');

searchBtn.addEventListener('click', async () => {
  const query = searchInput.value.trim();
  if (!query) {
    alert('Please enter a search term!');
    return;
  }

  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;
  recipesSection.innerHTML = `<p>Loading...</p>`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.meals) {
      displayRecipes(data.meals);
    } else {
      recipesSection.innerHTML = `<p>No recipes found for "<strong>${query}</strong>"</p>`;
    }
  } catch (error) {
    recipesSection.innerHTML = `<p>Error fetching recipes. Please try again later.</p>`;
    console.error(error);
  }
});

function displayRecipes(meals) {
  recipesSection.innerHTML = meals.map(meal => `
    <div class="recipe-card">
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
      <div class="recipe-info">
        <h3>${meal.strMeal}</h3>
        <p><strong>Category:</strong> ${meal.strCategory}</p>
        <p><strong>Area:</strong> ${meal.strArea}</p>
        <a href="${meal.strSource || meal.strYoutube}" target="_blank">View Recipe</a>
      </div>
    </div>
  `).join('');
}
