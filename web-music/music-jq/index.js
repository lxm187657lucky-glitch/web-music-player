$(document).ready(function () {
    const baseUrl = 'http://' + window.location.host + '/';
    let currentIndex = 0;
    let musics = [];
    let flag = false;
    let isCommon = false;
    let isCreateMusic = false;
    let currentPlaylistIndex = null;
    let isMusicFiles = false;
    let currentPlaylistSongs = [];
    let isClickFiles = false

    function fetchMusicList() {
        $.ajax({
            type: "get",
            url: 'http://localhost:3000/getList',
            success: function ({ data }) {
                musics = JSON.parse(data);
                renderMusicList(musics);
                renderCommonMusic();
                renderCreatedPlaylists();
            },
            error: function (error) {
                console.error('Error fetching music list:', error);
            }
        });
    }

    function renderMusicList(musics) {
        const musicList = $('#music-list');
        musicList.empty();

        musics.forEach((music, index) => {
            const listItem = $(`
                <li class="item" data-index="${index}">
                    <div class="left">
                        <img src="${baseUrl + 'images/' + music.img}" width="50" />
                        <span>${music.title}</span>
                    </div>
                    <div class="add-to-playlist">
                        <span>加入歌单</span>
                    </div>
                </li>
            `);
            musicList.append(listItem);
        });
    }

    function renderCommonMusic() {
        const commonMusicList = $('#common-music');
        commonMusicList.empty();

        const commonMusics = JSON.parse(localStorage.getItem('commonMusics')) || [];
        commonMusics.forEach((music, index) => {
            const listItem = $(`
                <li class="item" data-index="${index}">
                    <div class="left">
                        <img src="${baseUrl + 'images/' + music.img}" width="50" />
                        <span>${music.title}</span>
                    </div>
                </li>
            `);
            commonMusicList.append(listItem);
        });
    }

    function renderCreatedPlaylists() {
        const createMusicList = $('#create-music-list');
        const createList = $('#create-list');
        createMusicList.empty();
        createList.empty();

        const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
        playlists.forEach((playlist, index) => {
            const listItem = $(`
                <li class="playlist-item" data-index="${index}">
                    <div class="flex-center" style="flex:1">
                        <img src="./assets/icons/music-files.png" width="30" style="margin-right: 10px;" />
                        <span class="playlist-name">${playlist.name}</span>
                        <input class="edit-input" type="text" value="${playlist.name}" style="display:none;">
                    </div>
                    <div>
                        <span class="edit">编辑</span>
                        <span class="confirm" style="display:none;">确认</span>
                        <span class="delete">删除</span>
                    </div>
                </li>
            `);
            createMusicList.append(listItem.clone());
            createList.append(listItem);
        });
    }

    function addToCommonMusic(music) {
        let commonMusics = JSON.parse(localStorage.getItem('commonMusics')) || [];
        commonMusics = commonMusics.filter(m => m.url !== music.url); // 去重
        commonMusics.push(music);
        localStorage.setItem('commonMusics', JSON.stringify(commonMusics));
        renderCommonMusic();
    }

    function addToPlaylist(playlistIndex, music) {
        let playlists = JSON.parse(localStorage.getItem('playlists')) || [];
        if (!playlists[playlistIndex].songs) {
            playlists[playlistIndex].songs = [];
        }
        // Check if the song already exists in the playlist
        const songExists = playlists[playlistIndex].songs.some(song => song.url === music.url);
        if (!songExists) {
            playlists[playlistIndex].songs.push(music);
            localStorage.setItem('playlists', JSON.stringify(playlists));
            $('#playlist-modal').fadeOut();
            $('.shadow').hide();
            alert('添加成功！');
        } else {
            alert('这首歌已经在歌单中了！');
        }
    }

    function showPlaylistSongs(playlistIndex) {
        const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
        const playlist = playlists[playlistIndex];
        $('#modal-title').text(playlist.name);
        $('#playlist-layout').show();
        $('#upload-music').hide();
        $('#playlist-layout').empty();
        $('#create-music').hide();
        currentPlaylistSongs = playlist.songs;
        playlist.songs.forEach((song, index) => {
            const songItem = $(`
                <li data-index="${index}" class="song-item">
                    <img src="${baseUrl + 'images/' + song.img}" width="50" />
                    <span>${song.title}</span>
                </li>
            `);
            $('#playlist-layout').append(songItem);
        });
    }

    $('.shadow').click(function () {
        document.querySelector('.shadow').style.display = 'none';
        $('#playlist-modal').fadeOut();
    });

    $('#close').click(function () {
        if (isCreateMusic) {
            $('#modal-title').text('创建的歌单');
            $('#create-music').css({
                'display': 'block'
            });
            $('#upload-music').css({
                'display': 'none'
            });
            isCreateMusic = false;
        } else {
            document.querySelector('.shadow').style.display = 'none';
            $('#playlist-modal').fadeOut();
        }
    });

    $(window).click(function (event) {
        if ($(event.target).is('#playlist-modal')) {
            $('#playlist-modal').fadeOut();
        }
    });

    $('#music-list').on('click', '.add-to-playlist', function (e) {
        isMusicFiles = true;
        $('#playlist-layout').hide();
        $('#create-music').css({
            'display': 'block'
        });
        $('#upload-music').css({
            'display': 'none'
        });
        e.stopPropagation();
        document.querySelector('.shadow').style.display = 'block';
        event.stopPropagation();
        $('#playlist-modal').fadeIn();
    });

    $('#create-list').on('click', '.playlist-item', function (e) {
        isMusicFiles = true;
        currentPlaylistIndex = $(this).data('index');
        const currentMusic = musics[currentIndex];
        addToPlaylist(currentPlaylistIndex, currentMusic);
    });

    $('#create-music-list').on('click', '.playlist-item', function () {
        isClickFiles = true;
        $('.shadow').fadeIn();
        currentPlaylistIndex = $(this).data('index');
        showPlaylistSongs(currentPlaylistIndex);
        $('#playlist-modal').fadeIn();
    });

    $('#playlist-modal').on('click', '.song-item', function () {
        const songIndex = $(this).closest('li').data('index');
        const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
        const song = playlists[currentPlaylistIndex].songs[songIndex];
        if (song) {
            currentIndex = songIndex;
            playMusicFromCommon(song);
        }
    });

    $('#music-list').on('click', 'li', function () {
        isClickFiles = false
        $('#progress').show();
        document.querySelector('#play-pause').src = "./assets/icons/stop.png";
        flag = true;
        currentIndex = $(this).data('index');
        const currentMusic = musics[currentIndex];
        addToCommonMusic(currentMusic);
        playMusic(currentIndex);
    });

    $('#common-music').on('click', 'li', function () {
        document.querySelector('#play-pause').src = "./assets/icons/stop.png";
        flag = true;
        currentIndex = $(this).data('index');
        const commonMusics = JSON.parse(localStorage.getItem('commonMusics')) || [];
        const currentMusic = commonMusics[currentIndex];
        playMusicFromCommon(currentMusic);
    });

    function playMusic(index) {
        $('#player-controls #current-img').addClass('rotate');
        const audioPlayer = $('#audio-player')[0];
        const currentMusic = musics[index];
        audioPlayer.src = baseUrl + 'music/' + currentMusic.url;
        audioPlayer.play();
        $('#play-pause').text('Pause');
        $('#current-img').attr('src', baseUrl + 'images/' + currentMusic.img).show();
        $('#current-title').text(currentMusic.title).show();
    }

    function playMusicFromCommon(music) {
        $('#player-controls #current-img').addClass('rotate');
        const audioPlayer = $('#audio-player')[0];
        audioPlayer.src = baseUrl + 'music/' + music.url;
        audioPlayer.play();
        $('#play-pause').text('Pause');
        $('#current-img').attr('src', baseUrl + 'images/' + music.img).show();
        $('#current-title').text(music.title).show();
    }

    $('#play-pause').click(function () {
        if (!flag) return;
        const audioPlayer = $('#audio-player')[0];
        if (audioPlayer.paused) {
            audioPlayer.play();
            document.querySelector('#play-pause').src = "./assets/icons/stop.png";
            $('#player-controls #current-img').addClass('rotate');
        } else {
            audioPlayer.pause();
            $('#player-controls #current-img').removeClass('rotate');
            document.querySelector('#play-pause').src = "./assets/icons/play.png";
        }
    });

    $('#prev').click(function () {
        if (isClickFiles) {
            if (currentPlaylistSongs.length > 0) {
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : currentPlaylistSongs.length - 1;
                playMusicFromCommon(currentPlaylistSongs[currentIndex]);
            }
        } else {
            if (musics.length > 0) {
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : musics.length - 1;
                playMusic(currentIndex);
            }
        }
    });

    $('#next').click(function () {
        if (isClickFiles) {
            if (currentPlaylistSongs.length > 0) {
                currentIndex = (currentIndex < currentPlaylistSongs.length - 1) ? currentIndex + 1 : 0;
                playMusicFromCommon(currentPlaylistSongs[currentIndex]);
            }
        } else {
            if (musics.length > 0) {
                currentIndex = (currentIndex < musics.length - 1) ? currentIndex + 1 : 0;
                playMusic(currentIndex);
            }
        }
    });

    $('#audio-player').on('ended', function () {
        if (currentPlaylistSongs.length > 0) {
            currentIndex = (currentIndex < currentPlaylistSongs.length - 1) ? currentIndex + 1 : 0;
            playMusicFromCommon(currentPlaylistSongs[currentIndex]);
        }
    });

    $('#audio-player').on('timeupdate', function () {
        const audioPlayer = this;
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        $('#progress').val(progress);
    });

    $('#progress').on('input', function () {
        const audioPlayer = $('#audio-player')[0];
        const value = $(this).val();
        audioPlayer.currentTime = (value / 100) * audioPlayer.duration;
    });

    $('#volume').on('input', function () {
        $('#audio-player')[0].volume = $(this).val();
    });

    $('.volume-icon').click(function () {
        const audioPlayer = $('#audio-player')[0];
        audioPlayer.muted = !audioPlayer.muted;
        $(this).attr('src', audioPlayer.muted ? '/assets/icons/mute.png' : '/assets/icons/volume.png');
    });

    $('#search').on('input', function () {
        const query = $(this).val().toLowerCase();
        $('#music-list li, #common-music li').filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(query) > -1);
        });
    });

    $('#common-music-icon').click(function () {
        isCommon = !isCommon;
        if (isCommon) {
            $('#list-title').text('推荐列表');
            $('#common-music').css({
                'display': 'block'
            });
            $('#music-list').css({
                'display': 'none'
            });
        } else {
            $('#list-title').text('音乐');
            $('#common-music').css({
                'display': 'none'
            });
            $('#music-list').css({
                'display': 'block'
            });
        }
    });

    // 新建逻辑
    $('#add-music-item').click(function () {
        isCreateMusic = true;
        if (isCreateMusic) {
            $('#modal-title').text('新建歌单');
            $('#create-music').css({
                'display': 'none'
            });
            $('#upload-music').css({
                'display': 'block'
            });
        }
    });

    $('#upload-block button').click(function () {
        const playlistName = $('#upload-input').val().trim();
        if (playlistName) {
            let playlists = JSON.parse(localStorage.getItem('playlists')) || [];
            playlists.push({ name: playlistName, songs: [] });
            localStorage.setItem('playlists', JSON.stringify(playlists));
            renderCreatedPlaylists();
            $('#upload-input').val(''); // 清空输入框
            $('#modal-title').text('创建的歌单');
            $('#create-music').css({
                'display': 'block'
            });
            $('#upload-music').css({
                'display': 'none'
            });
            isCreateMusic = false;
        }
    });

    // 编辑和确认逻辑
    $('#create-music-list, #create-list').on('click', '.edit', function (e) {
        e.stopPropagation();
        const listItem = $(this).closest('.playlist-item');
        listItem.find('.playlist-name').hide();
        listItem.find('.edit-input').show();
        $(this).hide();
        listItem.find('.confirm').show();
    });

    $('#create-music-list, #create-list').on('click', '.confirm', function (e) {
        e.stopPropagation();
        const listItem = $(this).closest('.playlist-item');
        const newName = listItem.find('.edit-input').val().trim();
        if (newName) {
            const index = listItem.data('index');
            let playlists = JSON.parse(localStorage.getItem('playlists')) || [];
            playlists[index].name = newName;
            localStorage.setItem('playlists', JSON.stringify(playlists));
            renderCreatedPlaylists();
        }
    });

    // 删除逻辑
    $('#create-music-list, #create-list').on('click', '.delete', function () {
        const listItem = $(this).closest('.playlist-item');
        const index = listItem.data('index');
        let playlists = JSON.parse(localStorage.getItem('playlists')) || [];
        playlists.splice(index, 1); // 删除对应的歌单
        localStorage.setItem('playlists', JSON.stringify(playlists));
        renderCreatedPlaylists();
    });

    fetchMusicList();
});

