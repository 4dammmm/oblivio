const hero = document.getElementById("hero");
const rows = document.getElementById("rows");

// DEMO DATA (sostituisci con TMDB)
const movies = [
  {
    title:"Film di esempio",
    overview:"Descrizione stile Netflix, lunga e cinematografica.",
    backdrop:"https://image.tmdb.org/t/p/w1280/9n2tJBplPbgR2ca05hS5CKXwP2c.jpg",
    poster:"https://image.tmdb.org/t/p/w500/9O1Iy9od7ZP3JjvQd6C1G2W0ZkF.jpg"
  }
];

function renderHero(movie){
  hero.style.backgroundImage = `url(${movie.backdrop})`;
  hero.innerHTML = `
    <div class="hero-content">
      <h1>${movie.title}</h1>
      <p>${movie.overview}</p>
      <div class="hero-buttons">
        <button class="btn btn-play">▶ Play</button>
        <button class="btn btn-info">ℹ Info</button>
      </div>
    </div>
  `;
}

function renderRow(title){
  const row = document.createElement("div");
  row.className="row";
  row.innerHTML=`<h2>${title}</h2><div class="scroller"></div>`;
  const scroller = row.querySelector(".scroller");

  movies.forEach(m=>{
    const p=document.createElement("div");
    p.className="poster";
    p.style.backgroundImage=`url(${m.poster})`;
    scroller.appendChild(p);
  });

  rows.appendChild(row);
}

renderHero(movies[0]);
renderRow("Trending ora");
renderRow("Popolari su Netflix");
renderRow("Top Rated");
