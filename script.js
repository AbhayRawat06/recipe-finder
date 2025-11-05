/* DishDive — enhanced script.js
   - Keeps core IDs intact: #search-input, #search-btn, #recipes-section, #loader
   - Adds: theme toggle (localStorage), cuisine filter, alphabetical sorting, Enter support
   - Uses TheMealDB and lookup.php to fetch details for area-filter results
*/

// DOM refs
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const recipesSection = document.getElementById('recipes-section');
const loader = document.getElementById('loader');

const cuisineSelect = document.getElementById('cuisine-select'); // new filter select
const sortSelect = document.getElementById('sort-select'); // new sort select
const themeToggle = document.getElementById('theme-toggle');

const THEME_KEY = 'dishdive_theme';

// initialize
initTheme();
bindEvents();

// ---------- event binding ----------
function bindEvents() {
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }
  });

  cuisineSelect.addEventListener('change', handleFilterChange);
  sortSelect.addEventListener('change', applySortToExistingCards);
  themeToggle.addEventListener('click', toggleTheme);
}

// ---------- theme ----------
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  setTheme(saved);
}
function setTheme(mode) {
  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme','dark');
    themeToggle.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.textContent = '🌙';
  }
  localStorage.setItem(THEME_KEY, mode);
}
function toggleTheme() {
  const current = localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

// ---------- main search handler ----------
async function handleSearch() {
  const query = searchInput.value.trim();
  const selectedCuisine = cuisineSelect.value;
  showLoader(true);
  recipesSection.innerHTML = '';

  try {
    // Case 1: user typed a query -> search.php
    if (query) {
      const searchResp = await fetchFromMealDB(query);

      if (searchResp && searchResp.meals) {
        // if a cuisine is selected other than All, filter client-side by area (if available)
        let meals = searchResp.meals;
        if (selectedCuisine && selectedCuisine !== 'All') {
          meals = meals.filter(m => (m.strArea || '').toLowerCase() === selectedCuisine.toLowerCase());
        }

        if (meals.length > 0) {
          renderMeals(meals);
          applySort();
          return;
        }
      }

      // Nothing found for query -> fallback to cuisine browsing if selected, else show Indian fallback
      if (selectedCuisine && selectedCuisine !== 'All') {
        const areaMeals = await fetchAreaMeals(selectedCuisine);
        if (areaMeals && areaMeals.length) {
          recipesSection.innerHTML = `<p>No exact matches for "<strong>${query}</strong>". Showing ${selectedCuisine} dishes.</p>`;
          renderMeals(areaMeals);
          applySort();
          return;
        }
      }

      // fallback generic: show Indian dishes
      const indian = await fetchAreaMeals('Indian');
      if (indian.length) {
        recipesSection.innerHTML = `<p>No exact matches for "<strong>${query}</strong>". Here are popular Indian dishes:</p>`;
        renderMeals(indian);
        applySort();
        return;
      }

      recipesSection.innerHTML = `<p>No recipes found for "<strong>${query}</strong>". Try another search or choose a cuisine.</p>`;
      return;
    }

    // Case 2: no query, user selected a cuisine -> browse that cuisine
    if (selectedCuisine && selectedCuisine !== 'All') {
      const areaMeals = await fetchAreaMeals(selectedCuisine);
      if (areaMeals.length) {
        recipesSection.innerHTML = `<p>Browsing <strong>${selectedCuisine}</strong> dishes:</p>`;
        renderMeals(areaMeals);
        applySort();
        return;
      } else {
        recipesSection.innerHTML = `<p>No dishes found for <strong>${selectedCuisine}</strong>.</p>`;
        return;
      }
    }

    // Case 3: nothing chosen -> a friendly prompt or show trending (we'll show Indian preview)
    const defaultMeals = await fetchAreaMeals('Indian');
    if (defaultMeals.length) {
      recipesSection.innerHTML = `<p>Showing popular <strong>Indian</strong> dishes by default. Try searching or choosing a cuisine.</p>`;
      renderMeals(defaultMeals);
      applySort();
      return;
    }
    recipesSection.innerHTML = `<p>Start by entering an ingredient or choosing a cuisine.</p>`;
  } catch (err) {
    console.error(err);
    recipesSection.innerHTML = `<p>⚠️ Error fetching recipes. Try again later.</p>`;
  } finally {
    showLoader(false);
  }
}

// ---------- API helpers ----------
async function fetchFromMealDB(query) {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  return await res.json();
}

// For area-based lists, we first call filter.php?a=Area which gives idMeal, then lookup details
async function fetchAreaMeals(area) {
  const url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(area)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.meals) return [];

  // Limit results to top 18 for performance
  const slice = data.meals.slice(0, 18);

  const detailed = await Promise.all(slice.map(async (m) => {
    const lookup = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`;
    const r = await fetch(lookup);
    const dd = await r.json();
    return dd.meals ? dd.meals[0] : null;
  }));

  return detailed.filter(Boolean);
}

// ---------- rendering ----------
function renderMeals(meals) {
  // Convert meal objects to normalized array for sorting later
  const html = meals.map(mealCardHTML).join('');
  recipesSection.innerHTML += html;
}

// returns HTML string for individual card
function mealCardHTML(meal) {
  // safe values
  const title = escapeHtml(meal.strMeal || 'Untitled');
  const thumb = meal.strMealThumb || '';
  const category = meal.strCategory || '';
  const area = meal.strArea || '';
  const source = meal.strSource || meal.strYoutube || '#';

  return `
    <article class="recipe-card" data-title="${title}">
      <img src="${thumb}" alt="${title}" loading="lazy" />
      <div class="recipe-info">
        <h3>${title}</h3>
        ${category ? `<p><strong>Category:</strong> ${escapeHtml(category)}</p>` : ''}
        ${area ? `<p><strong>Area:</strong> ${escapeHtml(area)}</p>` : ''}
        <div class="actions">
          <a class="action" href="${source}" target="_blank" rel="noopener">View Recipe</a>
          <a class="link-plain" href="${meal.strYoutube || '#'}" target="_blank" rel="noopener">${meal.strYoutube ? 'Watch Video' : ''}</a>
        </div>
      </div>
    </article>
  `;
}

// ---------- sorting ----------
function applySortToExistingCards() {
  // re-sort currently displayed items
  applySort();
}

function applySort() {
  const method = sortSelect.value;
  if (method === 'relevance') return; // do nothing

  // gather cards
  const cards = Array.from(recipesSection.querySelectorAll('.recipe-card'));
  if (!cards.length) return;

  const sorted = cards.sort((a,b) => {
    const aTitle = a.getAttribute('data-title')?.toLowerCase() || '';
    const bTitle = b.getAttribute('data-title')?.toLowerCase() || '';
    if (method === 'az') return aTitle.localeCompare(bTitle);
    if (method === 'za') return bTitle.localeCompare(aTitle);
    return 0;
  });

  // re-append in order
  sorted.forEach(card => recipesSection.appendChild(card));
}

// ---------- small utilities ----------
function showLoader(show) {
  if (!loader) return;
  loader.style.display = show ? 'block' : 'none';
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

// ---------- filter change short-circuit ----------
async function handleFilterChange() {
  // If user changes filter while results visible, re-run search logic with the new filter
  await handleSearch();
}

// Optional: initial show on load (you can comment this out if undesired)
document.addEventListener('DOMContentLoaded', () => {
  // show a default cuisine preview (Indian)
  // handleSearch(); // uncomment to auto-load on page open
});
