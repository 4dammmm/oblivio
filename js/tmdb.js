const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0Y2FlMTU4Y2MwOTYxN2VmYmJmZGMwMjMxOGVkNjBjMSIsIm5iZiI6MTc2NzI4MTAwOC43OTksInN1YiI6IjY5NTY5MTcwMWY3ZjU1ODA0NWU0MjgxZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.bHGX-pUWkdSSu7UaxkEXG3X3fNfPWLWunolDuVU3iN8';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json;charset=utf-8',
    },
  });

  if (!res.ok) {
    // prova a leggere il body (TMDB spesso ritorna JSON con status_message)
    let detail = '';
    try { detail = JSON.stringify(await res.json()); } catch {}
    throw new Error(`TMDB error ${res.status}: ${res.statusText} ${detail}`);
  }

  return res.json();
}

export async function fetchTrendingMovies() {
  try {
    return await tmdbFetch('/trending/movie/week', { language: 'it-IT' });
  } catch (e) {
    console.error('Errore:', e);
    return null;
  }
}

export async function searchMovies(query) {
  try {
    return await tmdbFetch('/search/movie', {
      language: 'it-IT',
      query,
      include_adult: false,
      page: 1,
    });
  } catch (e) {
    console.error('Errore:', e);
    return null;
  }
}

export async function getMovieDetails(movieId) {
  try {
    return await tmdbFetch(`/movie/${movieId}`, {
      language: 'it-IT',
      append_to_response: 'videos',
    });
  } catch (e) {
    console.error('Errore:', e);
    return null;
  }
}
