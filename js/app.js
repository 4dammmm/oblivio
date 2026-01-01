document.addEventListener('DOMContentLoaded', function () {
  const rowsContainer = document.getElementById('moviesGrid');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const navBtns = document.querySelectorAll('.nav-btn');
  const movieModal = document.getElementById('movieModal');
  const closeModal = document.querySelector('.close');
  const statusBar = document.getElementById('statusBar');

  let currentMode = 'home';
  let lastQuery = '';

  // Init
  loadHome();

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

      if (currentMode === 'home') loadHome();
      if (currentMode === 'trending') loadSingleRow('Trending', () => fetchTrendingMovies());
      if (currentMode === 'popular') loadSingleRow('Popolari', () => fetchPopularMovies(1));
      if (currentMode === 'top_rated') loadSingleRow('Top Rated', () => fetchTopRatedMovies(1));
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
    const player = document.getElementById('trailerPlayer');
    if (player) player.src = '';
  }

  function clearRows() {
    rowsContainer.innerHTML = '';
  }

  function createRow(title, hintText = '') {
    const row = document.createElement('section');
    row.className = 'row';

    row.innerHTML = `
      <div class="row-title">
        <h2>${escapeHtml(title)}</h2>
        ${hintText ? `<span class="hint">${escapeHtml(hintText)}</span>` : ''}
      </div>
      <div class="scroller" aria-label="${escapeHtml(title)}"></div>
    `;

    rowsContainer.appendChild(row);
    return row.querySelector('.scroller');
  }

  function renderCards(scrollerEl, movies) {
    scrollerEl.innerHTML = '';

    const filtered = (movies || []).filter(m => m && m.poster_path);
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.style.padding = '16px';
      empty.style.color = 'rgba(229,231,235,.75)';
      empty.textContent = 'Nessun film trovato.';
      scrollerEl.appendChild(empty);
      return;
    }

    filtered.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.innerHTML = `
        <img class="movie-poster"
             src="${TMDB_IMAGE_BASE}${movie.poster_path}"
             alt="${escapeHtml(movie.title || '')}"
             onerror="this.src='images/placeholder.jpg'">
        <div class="movie-info">
          <h3 class="movie-title">${escapeHtml(movie.title || 'Titolo N/A')}</h3>
          <p class="movie-year">${movie.release_date?.split('-')[0] || 'N/A'}</p>
        </div>
      `;
      card.addEventListener('click', () => showMovieDetails(movie.id));
      scrollerEl.appendChild(card);
    });
  }

  async function loadHome() {
    try {
      clearRows();
      setStatus('Caricamento home...');

      const [trending, popular, topRated] = await Promise.all([
        fetchTrendingMovies(),
        fetchPopularMovies(1),
        fetchTopRatedMovies(1),
      ]);

      renderCards(createRow('Trending', 'Settimana'), trending?.results || []);
      renderCards(createRow('Popolari', 'Oggi'), popular?.results || []);
      renderCards(createRow('Top Rated', 'I migliori votati'), topRated?.results || []);

      setStatus('');
    } catch (e) {
      console.error(e);
      setStatus('Errore nel caricamento della home.');
      clearRows();
      const sc = createRow('Errore');
      renderCards(sc, []);
    }
  }

  async function loadSingleRow(title, fetcher) {
    try {
      clearRows();
      setStatus(`Caricamento ${title.toLowerCase()}...`);
      const data = await fetcher();
      renderCards(createRow(title), data?.results || []);
      setStatus('');
    } catch (e) {
      console.error(e);
      setStatus(`Errore nel caricamento di ${title.toLowerCase()}.`);
      clearRows();
      renderCards(createRow(title), []);
    }
  }

  async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    try {
      setStatus(`Ricerca: "${query}"...`);
      currentMode = 'search';
      lastQuery = query;

      clearRows();
      const data = await searchMovies(query, 1);
      renderCards(createRow(`Risultati per: "${query}"`), data?.results || []);
      setStatus('');
    } catch (e) {
      console.error(e);
      setStatus('Errore durante la ricerca.');
      clearRows();
      renderCards(createRow('Risultati'), []);
    }
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

      const tmdbLink = `https://www.themoviedb.org/movie/${movie.id}`;
      const tmdbId = (tmdbLink.match(/\/movie\/(\d+)/)?.[1]) || String(movie.id || movieId);
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
