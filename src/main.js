/**
 * do database song
 * Render song
 * Scroll top
 *  Play/  pause / seek
 *  CD router
 *  Next / Pre song
 *  randomize
 *  Next / Repeat when song ends
 *  Active songs
 *  Scroll active song into view
 *  Play songs when clicked
 * todo: add favorite song
 */
import data from "../assets/db/songs.js";
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PLAYER_STORAGE_KEY = "FURRY_PLAYER";
const songs = data.songs;

const player = $(".player");
const heading = $("header h2");
const cd = $(".cd");
const cdThumb = $(".cd-thumb");
const audio = $("#audio");
const progress = $("#progress");
const playBtn = $(".btn-toggle-play");
const nextBtn = $(".btn-next");
const prevBtn = $(".btn-prev");
const randomBtn = $(".btn-random");
const repeatBtn = $(".btn-repeat");
const playList = $(".playlist");
const app = {
  
  currentIndex: 0,
  isRandom: false,
  isRepeat: false,

  config:JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
  songs,

  // *Khi đã load trang
  init: function (key,value) {
    this.config[key] = value;
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
    
  },

  // *Render function
  render: function () {
    const htmls = this.songs.map((song,index) => {
      return `
            <div class="song-node ">
                <div class="song ${index === this.currentIndex ? 'active' : ''}" data-index=${index}>
                        <div class="thumb" style="background-image: url('${song.image}')"></div>
                        <div class="body">
                            <h3 class="title">${song.name}</h3>
                            <p class="author">${song.singer}</p>
                        </div>
                        <div class="favorite">
                            <i class="fas fa-heart"></i>
                        </div>
                </div>
            </div>
            `;
    });
    $(".playlist").innerHTML = htmls.join("");
  },
  defineProperties: function () {
    Object.defineProperty(this, "currentSong", {
      get: () => this.songs[this.currentIndex],
      enumerable: true,
    });
  },
  handerEvent: function () {
    const _this = this;
    // ? Hàm để khi user lăn chuột xuống , cd sẽ tự động thu nhỏ dần
    const cdWidth = cd.offsetWidth;
    document.addEventListener("scroll", () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const newWidth = cdWidth - scrollTop;

      // * đảm bảo rằng chiều rộng của phần tử cd không trở thành giá trị âm
      cd.style.width = newWidth > 0 ? newWidth + "px" : 0;
      cd.style.opacity = newWidth / cdWidth;
    });
    // ? thêm chức năng quay cd `
    // ? XỬ lí khi click play
    playBtn.addEventListener("click", () => {
      if (audio.paused) {
        // * playing ....
        audio.play();
        player.classList.add("playing");
        cdThumb.classList.add("rotate");
      } else {
        // *paused ....
        audio.pause();
        player.classList.remove("playing");
        cdThumb.classList.remove("rotate");
      }
    });

    // ? Xử lí quá trình chạy thanh tiến trình âm nhạc

    // *Cập nhật tối đa của thanh tiến trình dựa trên thời lượng của bài hát
    audio.addEventListener("loadedmetadata", () => {
      progress.max = audio.duration;
    });
    // *Cập nhật giá trị của thanh tiến trình dựa trên thời gian phát nhạc hiện tại
    audio.addEventListener("timeupdate", () => {
      progress.value = audio.currentTime;
    });

    // *Khi người dùng kéo thanh tiến trình, phát nhạc từ vị trí được chọn
    progress.addEventListener("input", () => {
      const seekTime = progress.value;
      audio.currentTime = seekTime;
    });

    // // *Khi nhạc kết thúc, đặt thanh trượt về 0 và nút về trạng thái pause
    // audio.addEventListener("ended", () => {
    //   progress.value = 0; // Đặt lại thanh trượt về 0
    //   player.classList.remove("playing"); // Cập nhật nút sang trạng thái pause
    //   cdThumb.classList.remove("rotate"); // dừng quay cd
    // });

    // * Xử lí khi click vào một bài hát
    playList.addEventListener("click", (event) => {
      const songNode = event.target.closest(".song:not(.active)");
      const option = event.target.closest(".option");
      if (songNode || option){
        if (songNode){
          _this.currentIndex = parseInt(songNode.dataset.index);
          _this.loadCurrentSong();
          audio.play();
          app.render();
          _this.scrollToActiveSong();
        }
        if (option){
         
        }
      }
      
    })

    // * Xử lí khi click vào next bài hát
    nextBtn.addEventListener("click", () => {
      if (_this.isRandom) {
        _this.playRandomSong();
      } else {
        _this.nextSong();
        cdThumb.classList.remove("rotate");
        player.classList.remove("playing");

        setTimeout(() => {
            player.classList.add("playing");
            cdThumb.classList.add("rotate");
          }, 100);
      }
      audio.play();
      app.render();
      app.scrollToActiveSong();
    });
    // * Xử lí khi click vào prev bài hát
    prevBtn.addEventListener("click", () => {
      if (_this.isRandom) {
        _this.playRandomSong();
      } else {
        _this.prevSong();
      }
      audio.play();
      app.render();
    });

    // * Xử lí khi click vào random bài hát
    randomBtn.addEventListener("click", () => {
     app.isRandom = !app.isRandom;
     app.init('isRandom',app.isRandom);
      randomBtn.classList.toggle("active", app.isRandom);
    });

    
    // * Xử lí khi click vào repeat bài hát
    repeatBtn.addEventListener("click", () => {
      _this.isRepeat =!_this.isRepeat;
      app.init('isRepeat',app.isRepeat);
      repeatBtn.classList.toggle("active", _this.isRepeat);
    });
    // *Xử lí sự kiện Next khi kết thúc player
    audio.addEventListener("ended", () => {
        if (_this.isRepeat) {
          audio.play();
          cdThumb.classList.remove("rotate");
        player.classList.remove("playing");

        setTimeout(() => {
            player.classList.add("playing");
            cdThumb.classList.add("rotate");
          }, 100);
        } else {
            
          nextBtn.click();
        }
      });
  },
  loadCurrentSong: function () {
    heading.textContent = this.currentSong.name;
    cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
    audio.src = this.currentSong.path;
  },
  loadConfig: function(){
    
    this.isRandom = this.config.isRandom;
    this.isRandom = this.config.isRandom;

  },
  nextSong: function () {
    this.currentIndex++;
    if (this.currentIndex >= this.songs.length) {
      this.currentIndex = 0;
    }
    this.loadCurrentSong();
  },
  prevSong: function () {
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.songs.length - 1;
    }
    this.loadCurrentSong();
  },
  playRandomSong: function () {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.songs.length);
    } while (newIndex === this.currentIndex);
    this.currentIndex = newIndex;
    this.loadCurrentSong();
  },
  // *Lăn đến bài hát đang chạy
  scrollToActiveSong: function () {
    setTimeout(() => {
      $('.song.active').scrollIntoView({
        behavior:'smooth',
        block:'center',
      });
    }, 300);
  },
  start: function () {
    // ! gắn cấu hình từ config vào app 
    this.loadConfig();
    // ! địng nghĩa các thuộc tính cho object
    this.defineProperties();
    // ! Lắng nghe các sự kiện
    this.handerEvent();
    // ! Tải thông tin bài hát đầu tiên lên UI khi vô app đầu tiên
    this.loadCurrentSong();
    this.render();

    randomBtn.classList.toggle("active", app.isRandom);

      repeatBtn.classList.toggle("active", _this.isRepeat);
  },
};

// ? Gán app vào window để có thể truy cập từ console
window.app = app;
app.start();
