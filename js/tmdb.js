const TMDB_API_KEY = '4cae158cc09617efbbfdc02318ed60c1';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function fetchTrendingMovies() {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=it-IT`
        );
        return await response.json();
    } catch (error) {
        console.error('Errore:', error);
        return null;
    }
}

async function searchMovies(query) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=it-IT&query=${encodeURIComponent(query)}`
        );
        return await response.json();
    } catch (error) {
        console.error('Errore:', error);
        return null;
    }
}

async function getMovieDetails(movieId) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=it-IT&append_to_response=videos`
        );
        return await response.json();
    } catch (error) {
        console.error('Errore:', error);
        return null;
    }
}
