const PhimleController = require("./PhimleController");
const PhimboController = require("./PhimboController");
const PhimmoiController = require("./PhimmoiController");
const { console, url } = require("inspector");
const path = require("path");
const fs = require("fs").promises;
class HomeController {
  static async banner() {
    const filePath = path.join(__dirname, "../../resources/data/banner.json");
    try {
      const data = await fs.readFile(filePath, "utf8");
      const banner = JSON.parse(data).backdrops;
      const bannerRandom = banner[Math.floor(Math.random() * banner.length)];
      return bannerRandom; // Return the backdrops array
    } catch (error) {
      console.error("Error fetching banner:", error);
      return []; // Return an empty array on error
    }
  }
  static index(req, res) {
    Promise.all([
      PhimmoiController.phimmoi(),
      PhimleController.phimle(),
      PhimboController.phimbo(),
      HomeController.banner(),
    ])
      .then(([movies, odd_Movies, seri_Movies, banner_Movies]) => {
        console.log("Baner: ", banner_Movies.logo_url);
        console.log("Movies:", movies); // Log movies data
        // console.log("Odd Movies:", odd_Movies); // Log odd movies data
        res.render("home", { movies, odd_Movies, seri_Movies, banner_Movies });
      })
      .catch((error) => {
        console.error("Error fetching movies:", error);
        res.render("home", {
          movies: [],
          odd_Movies: [],
          seri_Movies: [],
          banner_Movies: [],
        });
      });
  }
  static async slug(req, res) {
    const slug = req.params.slug;
    const apiUrl = `https://phim.nguonc.com/api/film/${slug}`;
  
    try {
      const [phimmoi, phimle, phimbo] = await Promise.all([
        PhimmoiController.phimmoi(),
        PhimleController.phimle(),
        PhimboController.phimbo(),
      ]);
  
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const contentType = response.headers.get("Content-Type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON, but got: ${contentType}`);
      }
  
      const data = await response.json();
      if (data.status === "success") {
        const movie = data.movie;
        const movieNation = movie.category;
  
        // Thêm thuộc tính isEpisode cho từng item trong moviePractice
        const moviePractice = movie.episodes[0].items.map(item => ({
          ...item,
          isEpisode: item.slug.startsWith('tap-') // Kiểm tra slug để xác định là tập phim hay không
        }));
        res.render("movie/details", {
          movieId: movie.id,
          movie,
          movieNation,
          moviePractice, // Sử dụng moviePractice đã cập nhật
          movieEmbed: moviePractice.length > 0 ? moviePractice[0].embed : null, // Lấy embed của tập đầu tiên nếu có
          phimmoi,
          phimle,
          phimbo,
        });
      } else {
        res.render("movie/details", { movie: null });
      }
    } catch (error) {
      console.error("Lỗi mạng:", error.message);
      res.render("movie/details", { movie: null });
    }
  }
  static async tap(req, res) {
    const slug = req.params.slug;
    const tap = req.params.name;  
    const apiUrl = `https://phim.nguonc.com/api/film/${slug}`;
  
    try {
      const [phimmoi, phimle, phimbo] = await Promise.all([
        PhimmoiController.phimmoi(),
        PhimleController.phimle(),
        PhimboController.phimbo(),
      ]);
  
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const contentType = response.headers.get("Content-Type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON, but got: ${contentType}`);
      }
  
      const data = await response.json();
      if (data.status === "success") {
        const movie = data.movie;
        const episodes = movie.episodes[0].items.map(item => ({
          ...item,
          isEpisode: item.slug.startsWith('tap-') // Thêm thuộc tính isEpisode
        }));
  
        const currentEpisode = episodes.find((item) => item.slug === tap);
        let movieEmbed = null;
        if (currentEpisode) {
          movieEmbed = currentEpisode.embed;
        }
  
        res.render("movie/details", {
          movieId: movie.id,
          movie,
          movieNation: movie.category,
          moviePractice: episodes, // Sử dụng episodes đã cập nhật
          movieEmbed,
          phimmoi,
          phimle,
          phimbo,
        });
      } else {
        res.render("movie/details", { movie: null, phimmoi, phimle, phimbo });
      }
    } catch (error) {
      console.error("Lỗi mạng:", error.message);
      res.render("movie/details", { movie: null, phimmoi, phimle, phimbo });
    }
  }
  static search(req, res) {
    const key = req.query.keyword.replace(/ /g, "+");
    const apiUrl = `https://phim.nguonc.com/api/films/search?keyword=${key}`;
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get("Content-Type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Expected JSON, but got: ${contentType}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.status === "success") {
          // Log the movie data
          if (data.items.length == 0) {
            res.render("movie/listmovie", {
              alert: "Không tìm thấy kết quả nào",
            });
          }
          res.render("movie/listmovie", {
            movies: data.items,
          });
        } else {
          res.render("movie/listmovie", { movies: null });
        }
      })
      .catch((error) => {
        console.error("Lỗi mạng:", error.message);
        res.render("movie/listmoive", { movies: null });
      });
  }
  static theloai(req, res) {
    const slug = req.params.slug;
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 18;
    const maxPagesToShow = 3; 

    const apiUrl = `https://phim.nguonc.com/api/films/the-loai/${slug}?page=${page}`;
    Promise.all([
      fetch(apiUrl),
      fetch(
        `https://phim.nguonc.com/api/films/the-loai/${slug}?page=${page + 1}`
      ),
    ])
      .then((responses) => {
        // Check if all requests are successful
        responses.forEach((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        });

        return Promise.all(responses.map((response) => response.json()));
      })
      .then((dataArray) => {
        const data1 = dataArray[0];
        const data2 = dataArray[1];

        // Merge items from both pages
        const allMovies = [...(data1.items || []), ...(data2.items || [])];
        console.log(allMovies);
        // Calculate total items and total pages
        const totalItems = allMovies.length; 
        const totalPages = page + 1; 
        const pagination = [];

        // Create pagination array
        const startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
        const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        for (let i = startPage; i <= endPage; i++) {
          pagination.push(i);
        }

        // Render the view with merged data and pagination
        res.render("movie/listmovie", {
          movies: allMovies.slice(0, itemsPerPage),
          currentPage: page,
          totalPages: totalPages,
          pagination: pagination, // Pass the pagination array
        });
      })
      .catch((error) => {
        console.error("Network error:", error.message);
        res.render("movie/listmovie", { movies: null });
      });
  }
}

module.exports = HomeController; // Ensure this export is correct
