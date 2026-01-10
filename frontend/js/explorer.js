document.getElementById("btn-send").addEventListener("click", () => {
  const endpoint = document.getElementById("endpoint").value;
  const query = document.getElementById("query").value;

  let response = {};

  if (endpoint === "/games") {
    response = [
      { id: 1, title: "Elden Ring", genre: "RPG", rating: 4.9 },
      { id: 2, title: "GTA V", genre: "Action", rating: 4.8 }
    ];
  }

  if (endpoint === "/games/1") {
    response = {
      id: 1,
      title: "Elden Ring",
      genre: "RPG",
      rating: 4.9,
      developer: "FromSoftware"
    };
  }

  if (endpoint === "/games/search") {
    response = {
      query,
      results: [
        { title: "The Witcher 3", genre: "RPG" }
      ]
    };
  }

  document.getElementById("response").textContent =
    JSON.stringify(response, null, 2);
});
