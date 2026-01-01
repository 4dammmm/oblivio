// js/app.js
document.addEventListener('DOMContentLoaded', () => {
  const moviesGrid = document.getElementById('moviesGrid');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const navBtns = document.querySelectorAll('.nav-btn');
  const movieModal = document.getElementById('movieModal');
  const closeModalBtn = document.querySelector('.close');
  const statusBar = document.getElementById('statusBar');
  const detailsDiv = document.getElementById('movieDetails');

  const PLACEHOLDER_POSTER = 'images/placeholder.jpg';

  let currentMode = 'trending';
  let lastQuery = '';
  let lastFocusedEl = null;

  // Init
  loadByMode('trending');

  // Search
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  // Nav
  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      navBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      currentMode = btn.dataset.category;
      lastQuery = '';
      searchInput.value = '';

      loadByMode(currentMode);
    });
  });

  // Modal close
  closeModalBtn.addEventListener('click', hideModal);
  window.addEventListener('click', (e) => {
    if (e.target === movieModal) hideModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && movieModal.getAttribute('aria-hidden') === 'false') {
      hideModal();
    }
  });

  function setStatus(text) {
    statusBar.textContent = text || '';
  }

  function setImageFallback(imgEl) {
    imgEl.addEventListener('error', () => {
      imgEl.src = PLACEHOLDER_POSTER;
    });
  }

  function showModal() {
    lastFocusedEl = document.activeElement;
    movieModal.style.display = 'block';
    movieModal.setAttribute('aria-hidden', 'false');
    closeModalBtn.focus();
  }

  function hideModal() {
    movieModal.style.display = 'none';
    movieModal.setAttribute('aria-hidden', 'true');

    // stop trailer if open
    const player = document.getElementById('trailerPlayer');
    if (player) player.src = '';

    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  }

  async function loadByMode(mode) {
    if (mode === 'trending') return loadTrendingMovies();
    if (mode === 'popular') return loadPopularMovies();
    if (mode === 'top_rated') return loadTopRatedMovies();
  }

  async function loadTrendingMovies() {
    try {
      setStatus('Caricamento trending...');
      const data = await fetchTrendingMovies();
      displayMovies(data?.results || []);
      setStatus('Trending aggiornati.');
    } catch (err) {
      console.error(err);
      displayMovies([]);
      setStatus('Errore nel caricamento dei trending.');
    }
  }

  async function loadPopularMovies() {
    try {
      setStatus('Caricamento popolari...');
      const data = await fetchPopularMovies(1);
      displayMovies(data?.results || []);
      setStatus('Popolari aggiornati.');
    } catch (err) {
      console.error(err);
      displayMovies([]);
      setStatus('Errore nel caricamento dei popolari.');
    }
  }

  async function loadTopRatedMovies() {
    try {
      setStatus('Caricamento top rated...');
      const data = await fetchTopRatedMovies(1);
      displayMovies(data?.results || []);
      setStatus('Top rated aggiornati.');
    } catch (err) {
      console.error(err);
      displayMovies([]);
      setStatus('Errore nel caricamento dei top rated.');
    }
  }

  async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    try {
      setStatus(`Ricerca: "${query}"...`);
      currentMode = 'search';
      lastQuery = query;

      const data = await searchMovies(query, 1);
      displayMovies(data?.results || []);
      setStatus(`Risultati per: "${query}".`);
    } catch (err) {
      console.error(err);
      displayMovies([]);
      setStatus('Errore durante la ricerca.');
    }
  }

  function displayMovies(movies) {
    moviesGrid.innerHTML = '';

    const valid = (movies || []).filter((m) => m?.poster_path);

    if (!valid.length) {
      moviesGrid.innerHTML = `
        <div style="grid-column:1/-1; padding:18px; color:rgba(229,231,235,.75); border:1px dashed rgba(255,255,255,.16); border-radius:16px;">
          Nessun film trovato.
        </div>
      `;
      return;
    }

    valid.forEach((movie) => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.tabIndex = 0;

      const year = movie.release_date?.split('-')?.[0] || 'N/A';
      const title = movie.title || 'Titolo N/A';

      card.innerHTML = `
        <img class="movie-poster" alt="${escapeHtml(title)}" />
        <div class="movie-info">
          <h3 class="movie-title">${escapeHtml(title)}</h3>
          <p class="movie-year">${escapeHtml(year)}</p>
        </div>
      `;

      const img = card.querySelector('img');
      img.src = `${TMDB_IMAGE_BASE}${movie.poster_path}`;
      setImageFallback(img);

      const open = () => showMovieDetails(movie.id);

      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') open();
      });

      moviesGrid.appendChild(card);
    });
  }

  async function showMovieDetails(movieId) {
    try {
      setStatus('Caricamento dettagli...');
      const movie = await getMovieDetails(movieId);
      if (!movie) return;

      const videos = movie.videos?.results || [];
      const trailer =
        videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
        videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser') ||
        videos.find((v) => v.site === 'YouTube');

      const tmdbLink = `https://www.themoviedb.org/movie/${movie.id}`;

      // tmdbId ricavato dalla URL TMDB (come richiesto)
      const tmdbId = tmdbLink.match(/\/movie\/(\d+)/)?.[1] || String(movie.id || movieId);

      // link PLAY richiesto
      const vixLink = `https://vixsrc.to/movie/${tmdbId}`;

      const imdbId = movie.external_ids?.imdb_id;
      const imdbLink = imdbId ? `https://www.imdb.com/title/${imdbId}/` : null;

      const title = movie.title || '';
      const originalTitle = movie.original_title || '';
      const releaseDate = movie.release_date || 'N/A';
      const runtime = movie.runtime ? `${movie.runtime} minuti` : 'N/A';
      const vote = movie.vote_average ? `${movie.vote_average.toFixed(1)}/10` : 'N/A';
      const overview = movie.overview || 'Nessuna descrizione disponibile.';
      const genresHtml =
        movie.genres?.map((g) => `<span class="genre">${escapeHtml(g.name)}</span>`).join('') || '';

      detailsDiv.innerHTML = `
        <div class="movie-detail-header">
          <img class="detail-poster" alt="${escapeHtml(title)}" />

          <div class="detail-info">
            <h2>${escapeHtml(title)}</h2>
            <p><strong>Titolo Originale:</strong> ${escapeHtml(originalTitle)}</p>
            <p><strong>Data di Uscita:</strong> ${escapeHtml(releaseDate)}</p>
            <p><strong>Durata:</strong> ${escapeHtml(runtime)}</p>
            <p><strong>Voto:</strong> ${escapeHtml(vote)}</p>
            <div class="genres">${genresHtml}</div>
          </div>
        </div>

        <div class="movie-detail-body">
          <h3>Trama</h3>
          <p>${escapeHtml(overview)}</p>

          <div class="actions">
            <a class="watch-btn play-btn" href="${vixLink}" target="_blank" rel="noopener">Play</a>
            <a class="watch-btn" href="${tmdbLink}" target="_blank" rel="noopener">TMDB</a>
            ${imdbLink ? `<a class="watch-btn" href="${imdbLink}" target="_blank" rel="noopener">IMDb</a>` : ''}
            ${
              trailer
                ? `<button class="trailer-btn" type="button" data-youtube="${escapeHtml(trailer.key)}">Trailer</button>`
                : ''
            }
          </div>

          ${
            trailer
              ? `
              <div id="trailerContainer" style="display:none; margin-top:14px;">
                <iframe
                  id="trailerPlayer"
                  width="100%"
                  height="400"
                  src=""
                  frameborder="0"
                  allowfullscreen
                ></iframe>
              </div>
            `
              : ''
          }
        </div>
      `;

      // poster (con fallback)
      const posterImg = detailsDiv.querySelector('.detail-poster');
      posterImg.src = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : PLACEHOLDER_POSTER;
      setImageFallback(posterImg);

      // trailer button listener (no onclick inline)
      const trailerBtn = detailsDiv.querySelector('.trailer-btn');
      if (trailerBtn) {
        trailerBtn.addEventListener('click', () => toggleTrailer(trailerBtn.dataset.youtube));
      }

      showModal();
      setStatus('');
    } catch (err) {
      console.error(err);
      setStatus('Errore nel caricamento dei dettagli.');
    }
  }

  function toggleTrailer(youtubeKey) {
    const container = document.getElementById('trailerContainer');
    const player = document.getElementById('trailerPlayer');
    if (!container || !player || !youtubeKey) return;

    const isHidden = container.style.display === 'none' || !container.style.display;

    if (isHidden) {
      player.src = `https://www.youtube.com/embed/${youtubeKey}`;
      container.style.display = 'block';
    } else {
      player.src = '';
      container.style.display = 'none';
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
});
