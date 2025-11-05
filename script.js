// ===============================
// Recipe Finder 2.1 — Fixed + Enhanced
// ===============================

// DOM Elements
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const recipesSection = document.getElementById('recipes-section');
const loader = document.getElementById('loader'); // optional loading overlay

// Handle click or Enter key
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleSearch();
  }
});

// Main search logic
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    alert('Please enter a search term!');
    searchInput.focus();
    return;
  }

  showLoader(true);
  recipesSection.innerHTML = '';

  try {
    // Try fetching from TheMealDB (main API)
    const data = await fetchFromMealDB(query);

    if (data && data.meals) {
      displayRecipes(data.meals);
    } else {
      // Fallback: fetch Indian dishes
      const indianMeals = await fetchIndianMeals();
      if (indianMeals && indianMeals.length > 0) {
        recipesSection.innerHTML = `
          <p>No exact matches found for "<strong>${query}</strong>", but here are some delicious Indian dishes 🍛</p>
        `;
        displayRecipes(indianMeals);
      } else {
        recipesSection.innerHTML = `<p>No recipes found for "<strong>${query}</strong>". Try another search!</p>`;
      }
    }
  } catch (error) {
    recipesSection.innerHTML = `<p>⚠️ Error fetching recipes. Please try again later.</p>`;
    console.error('Error:', error);
  } finally {
    showLoader(false);
  }
}

// Fetch recipes by query
async function fetchFromMealDB(query) {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;
  const res = await fetch(url);
  return await res.json();
}

// Fetch full Indian recipes (detailed)
async function fetchIndianMeals() {
  const baseUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?a=Indian`;
  const res = await fetch(baseUrl);
  const data = await res.json();

  if (!data.meals) return [];

  // Fetch full details for each Indian meal
  const detailedMeals = await Promise.all(
    data.meals.slice(0, 12).map(async (meal) => {
      const detailUrl = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`;
      const res = await fetch(detailUrl);
      const detailData = await res.json();
      return detailData.meals ? detailData.meals[0] : null;
    })
  );

  return detailedMeals.filter(Boolean);
}

// Display recipes dynamically
function displayRecipes(meals) {
  recipesSection.innerHTML += meals
    .map(
      (meal) => `
      <div class="recipe-card">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
        <div class="recipe-info">
          <h3>${meal.strMeal}</h3>
          ${meal.strCategory ? `<p><strong>Category:</strong> ${meal.strCategory}</p>` : ''}
          ${meal.strArea ? `<p><strong>Area:</strong> ${meal.strArea}</p>` : ''}
          <a href="${meal.strSource || meal.strYoutube || '#'}" target="_blank">View Recipe</a>
        </div>
      </div>
    `
    )
    .join('');
}

// Loader toggle
function showLoader(show) {
  if (loader) loader.style.display = show ? 'block' : 'none';
}
