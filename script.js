// ===============================
// Recipe Finder 2.0 — Enhanced JS
// ===============================

// DOM Elements
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const recipesSection = document.getElementById('recipes-section');
const loader = document.getElementById('loader'); // optional loading overlay

// Handle search button click or "Enter" press
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});

// Core search handler
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    alert('Please enter a search term!');
    searchInput.focus();
    return;
  }

  // Show loader or message
  showLoader(true);
  recipesSection.innerHTML = '';

  try {
    // Primary API — TheMealDB Search
    const data = await fetchRecipesFromTheMealDB(query);

    if (data && data.meals) {
      displayRecipes(data.meals);
    } else {
      // Fallback: fetch Indian dishes if no results found
      const indianData = await fetchIndianRecipes();
      if (indianData && indianData.meals) {
        recipesSection.innerHTML = `
          <p>No exact matches found for "<strong>${query}</strong>", but here are some delicious Indian dishes 🍛</p>
        `;
        displayRecipes(indianData.meals);
      } else {
        recipesSection.innerHTML = `<p>No recipes found for "<strong>${query}</strong>". Try another search!</p>`;
      }
    }
  } catch (error) {
    recipesSection.innerHTML = `<p>⚠️ Error fetching recipes. Please try again later.</p>`;
    console.error('Fetch Error:', error);
  } finally {
    showLoader(false);
  }
}

// Fetch from TheMealDB
async function fetchRecipesFromTheMealDB(query) {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;
  const res = await fetch(url);
  return await res.json();
}

// Fetch fallback Indian recipes
async function fetchIndianRecipes() {
  const url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=Indian`;
  const res = await fetch(url);
  return await res.json();
}

// Display recipes dynamically
function displayRecipes(meals) {
  const html = meals
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

  recipesSection.innerHTML += html;
}

// Simple loader toggle (optional)
function showLoader(show) {
  if (loader) loader.style.display = show ? 'block' : 'none';
}
