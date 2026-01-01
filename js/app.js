document.addEventListener('DOMContentLoaded', () => {
  // Elementi DOM
  const heroSection = document.getElementById('heroSection');
  const heroTitle = document.getElementById('heroTitle');
  const heroDescription = document.getElementById('heroDescription');
  const heroPlayBtn = document.querySelector('.btn-play');
  const heroInfoBtn = document.querySelector('.btn-info');
  
  const trendingScroller = document.getElementById('trendingScroller');
  const popularScroller = document.getElementById('popularScroller');
  const topRatedScroller = document.getElementById('topRatedScroller');
  const searchResultsScroller = document.getElementById('searchResultsScroller');
  const searchResultsRow = document.getElementById('searchResultsRow');
  const searchResultsTitle = document.getElementById('searchResultsTitle');
  
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const navLinks = document.querySelectorAll('.nav-left nav a');
  const header = document.querySelector('.netflix-header');
  const movieModal = document.getElementById('movieModal');
  const closeModalBtn = document.querySelector('.close');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const detailsDiv = document.getElementById('movieDetails');

  const PLACEHOLDER_POSTER = 'https://via.placeholder.com/500x750/1a1a1a/ffffff?text=No+Image';
  
  let currentMode = 'trending';
  let lastQuery = '';
  let lastFocusedEl = null;
  let currentHeroMovie = null;
  let isSearchActive = false;

  // Inizializzazione
  initApp();

  // Event Listeners
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      handleNavClick(link);
    });
  });

  // Modal events
  closeModalBtn.addEventListener('click', hideModal);
  window.addEventListener('click', (e) => {
    if (e.target === movieModal) hideModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && movieModal.style.display === 'block') {
      hideModal();
    }
  });

  // Hero buttons events
  heroPlayBtn.addEventListener('click', () => {
    if (currentHeroMovie) {
      showMovieDetails(currentHeroMovie.id);
    }
  });

  heroInfoBtn.addEventListener('click', () => {
    if (currentHeroMovie) {
      showMovieDetails(currentHeroMovie.id);
    }
  });

  // Scroll effect per header
  window.addEventListener('scroll', handleScroll);

  // Inizializzazione app
  async function initApp() {
    showLoading();
    try {
      await Promise.all([
        loadHeroMovie(),
        loadTrendingMovies(),
        loadPopularMovies(),
        loadTopRatedMovies()
      ]);
      
      // Imposta il primo film trending come hero
      const trendingData = await fetchTrendingMovies();
      if (trendingData?.results?.length > 0) {
        currentHeroMovie = trendingData.results[0];
        updateHero(currentHeroMovie);
      }
    } catch (error) {
      console.error('Errore inizializzazione:', error);
      showError('Impossibile caricare i dati. Riprova più tardi.');
    } finally {
      hideLoading();
    }
  }

  // Gestione click navigation
  function handleNavClick(link) {
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    
    currentMode = link.dataset.category;
    isSearchActive = false;
    lastQuery = '';
    searchInput.value = '';
    searchResultsRow.style.display = 'none';
    
    // Mostra tutte le row
    document.querySelectorAll('.row:not(#searchResultsRow)').forEach(row => {
      row.style.display = 'block';
    });
    
    // Scrolling smooth alla row corrispondente
    const targetRow = document.getElementById(`${currentMode}Row`);
    if (targetRow) {
      targetRow.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    
    // Aggiorna hero se siamo in trending
    if (currentMode === 'trending' && trendingScroller.children.length > 0) {
      const firstMovie = trendingScroller.children[0];
      if (firstMovie.dataset.movieId) {
        // Potresti voler aggiornare l'hero con il primo film trending
      }
    }
  }

  // Gestione scroll header
  function handleScroll() {
    if (window.scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  // Funzioni di utilità
  function showLoading() {
    loadingOverlay.classList.add('active');
  }

  function hideLoading() {
    loadingOverlay.classList.remove('active');
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <span>${message}</span>
    `;
    errorDiv.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: #e50914;
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
  }

  function setImageFallback(imgEl) {
    imgEl.addEventListener('error', () => {
      imgEl.src = PLACEHOLDER_POSTER;
      imgEl.style.objectFit = 'cover';
    });
  }

  function showModal() {
    lastFocusedEl = document.activeElement;
    movieModal.style.display = 'block';
    movieModal.setAttribute('aria-hidden', 'false');
    closeModalBtn.focus();
    document.body.style.overflow = 'hidden';
  }

  function hideModal() {
    movieModal.style.display = 'none';
    movieModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
    
    // Ferma il trailer se presente
    const player = document.getElementById('trailerPlayer');
    if (player) {
      player.src = '';
    }
    
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  }

  // Caricamento Hero Movie
  async function loadHeroMovie() {
    try {
      const data = await fetchTrendingMovies();
      const movies = data?.results || [];
      if (movies.length > 0) {
        // Prendi un film casuale per l'hero
        const randomIndex = Math.floor(Math.random() * Math.min(5, movies.length));
        currentHeroMovie = movies[randomIndex];
        updateHero(currentHeroMovie);
      }
    } catch (err) {
      console.error('Errore caricamento hero:', err);
    }
  }

  function updateHero(movie) {
    if (!movie) return;
    
    heroTitle.textContent = movie.title || 'Film in Trend';
    heroDescription.textContent = movie.overview 
      ? (movie.overview.length > 200 ? movie.overview.substring(0, 200) + '...' : movie.overview)
      : 'Scopri i film più popolari del momento. Guarda trailer, leggi trame e trova dove guardarli.';
    
    if (movie.backdrop_path) {
      heroSection.style.backgroundImage = `
        linear-gradient(to right, rgba(20,20,20,0.8), rgba(20,20,20,0.4)),
        url(${TMDB_IMAGE_BASE.replace('w500', 'original')}${movie.backdrop_path})
      `;
    } else if (movie.poster_path) {
      heroSection.style.backgroundImage = `
        linear-gradient(to right, rgba(20,20,20,0.8), rgba(20,20,20,0.4)),
        url(${TMDB_IMAGE_BASE.replace('w500', 'original')}${movie.poster_path})
      `;
    }
    
    heroPlayBtn.onclick = () => {
      if (movie.id) {
        const tmdbId = movie.id;
        const vixLink = `https://vixsrc.to/movie/${tmdbId}`;
        window.open(vixLink, '_blank');
      }
    };
    
    heroInfoBtn.onclick = () => {
      if (movie.id) {
        showMovieDetails(movie.id);
      }
    };
  }

  // Caricamento categorie film
  async function loadTrendingMovies() {
    try {
      const data = await fetchTrendingMovies();
      displayMoviesInScroller(data?.results || [], trendingScroller, 'trending');
    } catch (err) {
      console.error('Errore caricamento trending:', err);
      trendingScroller.innerHTML = '<p class="error-message">Errore nel caricamento dei film in trend</p>';
    }
  }

  async function loadPopularMovies() {
    try {
      const data = await fetchPopularMovies(1);
      displayMoviesInScroller(data?.results || [], popularScroller, 'popular');
    } catch (err) {
      console.error('Errore caricamento popolari:', err);
      popularScroller.innerHTML = '<p class="error-message">Errore nel caricamento dei film popolari</p>';
    }
  }

  async function loadTopRatedMovies() {
    try {
      const data = await fetchTopRatedMovies(1);
      displayMoviesInScroller(data?.results || [], topRatedScroller, 'top_rated');
    } catch (err) {
      console.error('Errore caricamento top rated:', err);
      topRatedScroller.innerHTML = '<p class="error-message">Errore nel caricamento dei top rated</p>';
    }
  }

  function displayMoviesInScroller(movies, scrollerElement, category) {
    scrollerElement.innerHTML = '';
    
    const validMovies = movies.filter(m => m && (m.poster_path || m.backdrop_path));
    
    if (!validMovies.length) {
      scrollerElement.innerHTML = `
        <div class="no-movies">
          <i class="fas fa-film"></i>
          <p>Nessun film trovato</p>
        </div>
      `;
      return;
    }
    
    validMovies.forEach(movie => {
      const movieCard = createMovieCard(movie, category);
      scrollerElement.appendChild(movieCard);
    });
    
    // Aggiungi bottoni di navigazione per lo scroll
    addScrollButtons(scrollerElement);
  }

  function createMovieCard(movie, category) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.movieId = movie.id;
    card.dataset.category = category;
    
    const imageUrl = movie.poster_path 
      ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
      : movie.backdrop_path 
        ? `${TMDB_IMAGE_BASE}${movie.backdrop_path}`
        : PLACEHOLDER_POSTER;
    
    card.innerHTML = `
      <div class="poster-container">
        <img src="${imageUrl}" 
             alt="${escapeHtml(movie.title)}" 
             class="movie-poster"
             loading="lazy">
        <div class="movie-overlay">
          <div class="movie-info">
            <h4>${escapeHtml(movie.title)}</h4>
            <div class="movie-meta">
              <span class="movie-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
              <span class="movie-rating">
                <i class="fas fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
              </span>
            </div>
            <button class="quick-view-btn">
              <i class="fas fa-eye"></i> Anteprima
            </button>
          </div>
        </div>
      </div>
    `;
    
    const img = card.querySelector('.movie-poster');
    setImageFallback(img);
    
    // Event listeners
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.quick-view-btn')) {
        showMovieDetails(movie.id);
      }
    });
    
    const quickViewBtn = card.querySelector('.quick-view-btn');
    quickViewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showMovieDetails(movie.id);
    });
    
    // Hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.05)';
      card.style.zIndex = '10';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)';
      card.style.zIndex = '1';
    });
    
    return card;
  }

  function addScrollButtons(scrollerElement) {
    // Funzionalità di scroll tramite mouse wheel
    scrollerElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      scrollerElement.scrollLeft += e.deltaY;
    });
  }

  // Ricerca film
  async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      // Se la query è vuota, mostra le categorie normali
      isSearchActive = false;
      searchResultsRow.style.display = 'none';
      document.querySelectorAll('.row:not(#searchResultsRow)').forEach(row => {
        row.style.display = 'block';
      });
      return;
    }
    
    showLoading();
    try {
      isSearchActive = true;
      lastQuery = query;
      
      // Nascondi tutte le row tranne i risultati
      document.querySelectorAll('.row:not(#searchResultsRow)').forEach(row => {
        row.style.display = 'none';
      });
      
      searchResultsRow.style.display = 'block';
      searchResultsTitle.textContent = `Risultati per: "${query}"`;
      
      const data = await searchMovies(query, 1);
      displayMoviesInScroller(data?.results || [], searchResultsScroller, 'search');
      
      // Scrolling ai risultati
      searchResultsRow.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } catch (err) {
      console.error('Errore ricerca:', err);
      searchResultsScroller.innerHTML = '<p class="error-message">Errore nella ricerca. Riprova più tardi.</p>';
      showError('Errore nella ricerca');
    } finally {
      hideLoading();
    }
  }

  // Mostra dettagli film
  async function showMovieDetails(movieId) {
    showLoading();
    try {
      const movie = await getMovieDetails(movieId);
      if (!movie) {
        showError('Film non trovato');
        return;
      }
      
      renderMovieDetails(movie);
      showModal();
    } catch (err) {
      console.error('Errore dettagli film:', err);
      showError('Impossibile caricare i dettagli del film');
    } finally {
      hideLoading();
    }
  }

  function renderMovieDetails(movie) {
    const videos = movie.videos?.results || [];
    const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
                   videos.find(v => v.site === 'YouTube' && v.type === 'Teaser') ||
                   videos.find(v => v.site === 'YouTube');
    
    const tmdbLink = `https://www.themoviedb.org/movie/${movie.id}`;
    const tmdbId = movie.id;
    const vixLink = `https://vixsrc.to/movie/${tmdbId}`;
    const imdbId = movie.external_ids?.imdb_id;
    const imdbLink = imdbId ? `https://www.imdb.com/title/${imdbId}/` : null;
    
    const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A';
    
    detailsDiv.innerHTML = `
      <div class="movie-detail-header">
        <img class="detail-poster" 
             src="${movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : PLACEHOLDER_POSTER}" 
             alt="${escapeHtml(movie.title)}" />
        
        <div class="detail-info">
          <h2>${escapeHtml(movie.title)}</h2>
          <p class="movie-tagline">${escapeHtml(movie.tagline || '')}</p>
          
          <div class="detail-meta">
            <span class="meta-item">
              <i class="fas fa-calendar-alt"></i> ${year}
            </span>
            <span class="meta-item">
              <i class="fas fa-clock"></i> ${runtime}
            </span>
            <span class="meta-item">
              <i class="fas fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}/10
            </span>
            <span class="meta-item">
              <i class="fas fa-users"></i> ${movie.vote_count ? movie.vote_count.toLocaleString() : '0'} voti
            </span>
          </div>
          
          <div class="genres">
            ${movie.genres?.map(g => `<span class="genre">${escapeHtml(g.name)}</span>`).join('') || ''}
          </div>
          
          <p class="original-title">
            <strong>Titolo Originale:</strong> ${escapeHtml(movie.original_title)}
          </p>
        </div>
      </div>
      
      <div class="movie-detail-body">
        <h3>Trama</h3>
        <p class="overview">${escapeHtml(movie.overview || 'Nessuna descrizione disponibile.')}</p>
        
        <div class="actions">
          <a class="watch-btn play-btn" href="${vixLink}" target="_blank" rel="noopener">
            <i class="fas fa-play"></i> Guarda ora
          </a>
          <a class="watch-btn" href="${tmdbLink}" target="_blank" rel="noopener">
            <i class="fas fa-external-link-alt"></i> TMDB
          </a>
          ${imdbLink ? `
            <a class="watch-btn" href="${imdbLink}" target="_blank" rel="noopener">
              <i class="fab fa-imdb"></i> IMDb
            </a>
          ` : ''}
          ${trailer ? `
            <button class="trailer-btn" type="button" data-youtube="${escapeHtml(trailer.key)}">
              <i class="fas fa-film"></i> Trailer
            </button>
          ` : ''}
        </div>
        
        ${trailer ? `
          <div id="trailerContainer" style="display:none; margin-top:30px;">
            <div class="trailer-header">
              <h4><i class="fas fa-video"></i> Trailer</h4>
              <button class="close-trailer-btn" type="button">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="trailer-wrapper">
              <iframe
                id="trailerPlayer"
                width="100%"
                height="400"
                src=""
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                title="Trailer del film"
              ></iframe>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    // Aggiungi fallback per l'immagine
    const posterImg = detailsDiv.querySelector('.detail-poster');
    setImageFallback(posterImg);
    
    // Aggiungi listener per il trailer
    const trailerBtn = detailsDiv.querySelector('.trailer-btn');
    if (trailerBtn) {
      trailerBtn.addEventListener('click', () => toggleTrailer(trailerBtn.dataset.youtube));
    }
    
    // Aggiungi listener per chiudere il trailer
    const closeTrailerBtn = detailsDiv.querySelector('.close-trailer-btn');
    if (closeTrailerBtn) {
      closeTrailerBtn.addEventListener('click', () => {
        const container = document.getElementById('trailerContainer');
        const player = document.getElementById('trailerPlayer');
        if (container && player) {
          player.src = '';
          container.style.display = 'none';
        }
      });
    }
  }

  function toggleTrailer(youtubeKey) {
    const container = document.getElementById('trailerContainer');
    const player = document.getElementById('trailerPlayer');
    if (!container || !player || !youtubeKey) return;
    
    const isHidden = container.style.display === 'none' || !container.style.display;
    
    if (isHidden) {
      player.src = `https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1`;
      container.style.display = 'block';
      
      // Scrolling al trailer
      container.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    } else {
      player.src = '';
      container.style.display = 'none';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // Aggiungi stili CSS dinamici
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .movie-card {
      position: relative;
      transition: transform 0.3s ease;
      flex-shrink: 0;
      width: 220px;
      cursor: pointer;
    }
    
    .poster-container {
      position: relative;
      width: 100%;
      height: 330px;
      overflow: hidden;
      border-radius: 4px;
    }
    
    .movie-poster {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .movie-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
      padding: 20px 15px 15px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .movie-card:hover .movie-overlay {
      opacity: 1;
    }
    
    .movie-card:hover .movie-poster {
      transform: scale(1.1);
    }
    
    .movie-info h4 {
      margin: 0 0 5px;
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .movie-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #ccc;
      margin-bottom: 10px;
    }
    
    .movie-rating {
      color: #f5c518;
    }
    
    .quick-view-btn {
      background: rgba(229, 9, 20, 0.9);
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      width: 100%;
      transition: background 0.3s;
    }
    
    .quick-view-btn:hover {
      background: #e50914;
    }
    
    .error-message {
      color: #e50914;
      padding: 20px;
      text-align: center;
      font-size: 14px;
    }
    
    .no-movies {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .no-movies i {
      font-size: 48px;
      margin-bottom: 10px;
      display: block;
    }
    
    .detail-meta {
      display: flex;
      gap: 15px;
      margin: 15px 0;
      flex-wrap: wrap;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #ccc;
      font-size: 14px;
    }
    
    .movie-tagline {
      font-style: italic;
      color: #888;
      margin: 5px 0 15px;
    }
    
    .original-title {
      margin-top: 10px;
      color: #aaa;
    }
    
    .overview {
      line-height: 1.6;
      font-size: 16px;
    }
    
    .trailer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .close-trailer-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 18px;
      padding: 5px;
    }
    
    .trailer-wrapper {
      position: relative;
      padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
      height: 0;
      overflow: hidden;
    }
    
    .trailer-wrapper iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 8px;
    }
  `;
  document.head.appendChild(style);
});
