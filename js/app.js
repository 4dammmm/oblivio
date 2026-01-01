// js/app.js
document.addEventListener('DOMContentLoaded', function () {
  const moviesGrid = document.getElementById('moviesGrid');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const navBtns = document.querySelectorAll('.nav-btn');
  const movieModal = document.getElementById('movieModal');
  const closeModal = document.querySelector('.close');
  const statusBar = document.getElementById('statusBar');

  let currentMode = 'trending';
  let lastQuery = '';

  // Init
  loadTrendingMovies();

  // Search
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  // Nav
  navBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      navBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      currentMode = this.dataset.category;
      lastQuery = '';
      searchInput.value = '';

      if (currentMode === 'trending') loadTrendingMovies();
      if (currentMode === 'popular') loadPopularMovies();
      if (currentMode === 'top_rated') loadTopRatedMovies();
    });
  });

  // Close modal
  closeModal.addEventListener('click', () => hideModal());
  window.addEventListener('click', (e) => {
    if (e.target === movieModal) hideModal();
  });

  function setStatus(text) {
    statusBar.textContent = text || '';
  }

  function hideModal() {
    movieModal.style.display = 'none';
    movieModal.setAttribute('aria-hidden', 'true');

    // stop trailer if open
    const player = document.getElementById('trailerPlayer');
    if (player) player.src = '';
  }

  async function loadTrendingMovies() {
    try {
      setStatus('Caricamento trending...');
      const data = await fetchTrendingMovies();
      displayMovies(data?.results || []);
      setStatus('Trending aggiornati.');
    } catch (e) {
      console.error(e);
      setStatus('Errore nel caricamento dei trending.');
      displayMovies([]);
    }
  }

  async function loadPopularMovies() {
    try {
      setStatus('Caricamento popolari...');
      const data = await fetchPopularMovies(1);
      displayMovies(data?.results || []);
      setStatus('Popolari aggiornati.');
    } catch (e) {
      console.error(e);
      setStatus('Errore nel caricamento dei popolari.');
      displayMovies([]);
    }
  }

  async function loadTopRatedMovies() {
    try {
      setStatus('Caricamento top rated...');
      const data = await fetchTopRatedMovies(1);
      displayMovies(data?.results || []);
      setStatus('Top rated aggiornati.');
    } catch (e) {
      console.error(e);
      setStatus('Errore nel caricamento dei top rated.');
      displayMovies([]);
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
    } catch (e) {
      console.error(e);
      setStatus('Errore durante la ricerca.');
      displayMovies([]);
    }
  }

  function displayMovies(movies) {
    moviesGrid.innerHTML = '';

    if (!movies.length) {
      moviesGrid.innerHTML = `
        <div style="grid-column:1/-1; padding:18px; color:rgba(229,231,235,.75); border:1px dashed rgba(255,255,255,.16); border-radius:16px;">
          Nessun film trovato.
        </div>
      `;
      return;
    }

    movies.forEach(movie => {
      if (!movie.poster_path) return;

      const movieCard = document.createElement('div');
      movieCard.className = 'movie-card';
      movieCard.innerHTML = `
        <img src="${TMDB_IMAGE_BASE}${movie.poster_path}"
             alt="${escapeHtml(movie.title || '')}"
             class="movie-poster"
             onerror="this.src='images/placeholder.jpg'">
        <div class="movie-info">
          <h3 class="movie-title">${escapeHtml(movie.title || 'Titolo N/A')}</h3>
          <p class="movie-year">${movie.release_date?.split('-')[0] || 'N/A'}</p>
        </div>
      `;

      // movie.id = tmdbId del film cliccato
      movieCard.addEventListener('click', () => showMovieDetails(movie.id));
      moviesGrid.appendChild(movieCard);
    });
  }

  async function showMovieDetails(movieId) {
    try {
      setStatus('Caricamento dettagli...');
      const movie = await getMovieDetails(movieId);
      if (!movie) return;

      const detailsDiv = document.getElementById('movieDetails');

      const videos = movie.videos?.results || [];
      const trailer =
        videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
        videos.find(v => v.site === 'YouTube' && v.type === 'Teaser') ||
        videos.find(v => v.site === 'YouTube');

      // Link TMDB del film
      const tmdbLink = `https://www.themoviedb.org/movie/${movie.id}`;

      // ✅ ricavo tmdbId dalla URL TMDB (come richiesto)
      // es: https://www.themoviedb.org/movie/12345  -> 12345
      const tmdbId = (tmdbLink.match(/\/movie\/(\d+)/)?.[1]) || String(movie.id || movieId);

      // ✅ link PLAY richiesto
      const vixLink = `https://vixsrc.to/movie/${tmdbId}`;

      const imdbId = movie.external_ids?.imdb_id;
      const imdbLink = imdbId ? `https://www.imdb.com/title/${imdbId}/` : null;

      detailsDiv.innerHTML = `
        <div class="movie-detail-header">
          <img src="${TMDB_IMAGE_BASE}${movie.poster_path}"
               alt="${escapeHtml(movie.title || '')}"
               class="detail-poster"
               onerror="this.src='images/placeholder.jpg'">

          <div class="detail-info">
            <h2>${escapeHtml(movie.title || '')}</h2>
            <p><strong>Titolo Originale:</strong> ${escapeHtml(movie.original_title || '')}</p>
            <p><strong>Data di Uscita:</strong> ${movie.release_date || 'N/A'}</p>
            <p><strong>Durata:</strong> ${movie.runtime ? movie.runtime + ' minuti' : 'N/A'}</p>
            <p><strong>Voto:</strong> ${movie.vote_average ? movie.vote_average.toFixed(1) + '/10' : 'N/A'}</p>
            <div class="genres">
              ${movie.genres?.map(g => `<span class="genre">${escapeHtml(g.name)}</span>`).join('') || ''}
            </div>
          </div>
        </div>

        <div class="movie-detail-body">
          <h3>Trama</h3>
          <p>${escapeHtml(movie.overview || 'Nessuna descrizione disponibile.')}</p>

          <div class="actions">
            <!-- ✅ Bottone PLAY nel popup: https://vixsrc.to/movie/{tmdbId} -->
            <a class="watch-btn play-btn" href="${vixLink}" target="_blank" rel="noopener">Play</a>

            <a class="watch-btn" href="${tmdbLink}" target="_blank" rel="noopener">TMDB</a>
            ${imdbLink ? `<a class="watch-btn" href="${imdbLink}" target="_blank" rel="noopener">IMDb</a>` : ''}
            ${trailer ? `
              <button class="trailer-btn" type="button" onclick="playTrailer('${trailer.key}')">
                Trailer
              </button>
            ` : ''}
          </div>

          ${trailer ? `
            <div id="trailerContainer" style="display:none; margin-top:14px;">
              <iframe id="trailerPlayer" width="100%" height="400"
                      src="" frameborder="0" allowfullscreen></iframe>
            </div>
          ` : ''}
        </div>
      `;

      movieModal.style.display = 'block';
      movieModal.setAttribute('aria-hidden', 'false');
      setStatus('');
    } catch (e) {
      console.error(e);
      setStatus('Errore nel caricamento dei dettagli.');
    }
  }

  // globale per click inline del bottone trailer
  window.playTrailer = function (youtubeKey) {
    const container = document.getElementById('trailerContainer');
    const player = document.getElementById('trailerPlayer');
    if (!container || !player) return;

    const isHidden = container.style.display === 'none' || !container.style.display;
    if (isHidden) {
      player.src = `https://www.youtube.com/embed/${youtubeKey}`;
      container.style.display = 'block';
    } else {
      player.src = '';
      container.style.display = 'none';
    }
  };

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
});
