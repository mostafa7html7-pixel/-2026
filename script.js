// تحميل واجهة برمجة تطبيقات يوتيوب (YouTube IFrame API) بشكل بسيط وواضح
let ytPlayer;
let isPlayerReady = false;
let currentVideoId = 'ndfYFIoJnCs'; // الفيديو الافتراضي عند الفتح
let progressSaverInterval;
let lastLoadedVideoId = '';

// إضافة سكريبت YouTube للصفحة
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// متغير السلايدر
let slideInterval;

function startSlider() {
    const slides = document.querySelectorAll('.intro-slider .slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        slideInterval = setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 3000); // 3 ثواني لكل صورة
    }
}

// الدالة الأساسية لبدء تشغيل الفيديو الأولي وإخفاء السلايدر
window.playInitialVideo = function() {
    clearInterval(slideInterval);
    const slider = document.getElementById('intro-slider');
    if(slider) slider.style.display = 'none';
    
    if (ytPlayer && ytPlayer.playVideo) {
        ytPlayer.playVideo();
    }
};

// الدالة الأساسية التي يستدعيها يوتيوب لبدء المشغل
function onYouTubeIframeAPIReady() {
    lastLoadedVideoId = currentVideoId;
    let savedTime = localStorage.getItem('vid_progress_' + currentVideoId) || 0;

    ytPlayer = new YT.Player('yt-player-container', {
        height: '100%',
        width: '100%',
        videoId: currentVideoId,
        playerVars: {
            'playsinline': 1,
            'controls': 1, // تفعيل أزرار يوتيوب الأصلية بالكامل كما طلبت
            'rel': 0, // عدم إظهار فيديوهات من قنوات أخرى
            'modestbranding': 1,
            'iv_load_policy': 3, // إخفاء البطاقات التوضيحية للفيديو
            'start': Math.floor(parseFloat(savedTime)) // بدء المقطع من حيث توقف
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    isPlayerReady = true;
    updateVideoInfo();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        updateVideoInfo();
        
        // حفظ الوقت باستمرار كل 3 ثواني
        clearInterval(progressSaverInterval);
        progressSaverInterval = setInterval(() => {
            if (ytPlayer && ytPlayer.getCurrentTime && lastLoadedVideoId) {
                let currentTime = ytPlayer.getCurrentTime();
                if (currentTime > 2) { // لتجنب حفظ الصفر في بداية التحميل
                    localStorage.setItem('vid_progress_' + lastLoadedVideoId, currentTime);
                }
            }
        }, 3000);
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        clearInterval(progressSaverInterval);
        if (ytPlayer && ytPlayer.getCurrentTime && lastLoadedVideoId) {
             localStorage.setItem('vid_progress_' + lastLoadedVideoId, ytPlayer.getCurrentTime());
        }
    } else if (event.data === YT.PlayerState.CUED) {
        updateVideoInfo();
    }
}

function updateVideoInfo() {
    if (!ytPlayer || !ytPlayer.getVideoData) return;
    
    try {
        const videoData = ytPlayer.getVideoData();
        const duration = ytPlayer.getDuration();
        
        // تحديث العنوان
        const titleElem = document.getElementById('info-title');
        if (videoData && videoData.title && titleElem) {
            titleElem.innerText = videoData.title;
        }
        
        // تحديث الكاتب/المعلم
        const authorElem = document.getElementById('info-author');
        if (videoData && videoData.author && authorElem) {
            authorElem.style.display = 'block';
            authorElem.innerHTML = `<i class="fa-solid fa-user-tie"></i> ${videoData.author}`;
        } else if (authorElem) {
            authorElem.style.display = 'none';
        }
        
        // تحديث مدة الفيديو
        const durationElem = document.getElementById('info-duration');
        if (duration && durationElem) {
            durationElem.style.display = 'block';
            const h = Math.floor(duration / 3600);
            const m = Math.floor((duration % 3600) / 60);
            const s = Math.floor(duration % 60).toString().padStart(2, '0');
            
            let timeString = '';
            if (h > 0) {
                timeString = `${h}:${m.toString().padStart(2, '0')}:${s}`;
            } else {
                timeString = `${m}:${s}`;
            }
            durationElem.innerHTML = `<i class="fa-regular fa-clock"></i> ${timeString} دقيقة`;
        } else if (durationElem) {
            durationElem.style.display = 'none';
        }
    } catch(e) {
        console.log("Waiting for player data...");
    }
}

// دالة تفاعلية لتغيير الفيديو من القائمة
window.changeVideo = function(videoId, title, description, element) {
    lastLoadedVideoId = videoId;
    
    // تحديث شريط يٌعرض الآن
    const nowPlayingText = document.getElementById('now-playing-text');
    if(nowPlayingText) nowPlayingText.innerText = title;

    // تحديث العناوين في الواجهة
    document.getElementById('info-title').innerText = title;
    document.getElementById('info-desc').innerText = description;
    
    // تغيير التنشيط في القائمة
    document.querySelectorAll('.lesson-item').forEach(item => item.classList.remove('active'));
    if(element) element.classList.add('active');

    // إغلاق القائمة تلقائياً في الموبايل عند اختيار فيديو
    if (window.innerWidth <= 900) {
        togglePlaylistCompact();
    }

    // إخفاء السلايدر إذا كان يعمل
    const slider = document.getElementById('intro-slider');
    if(slider && slider.style.display !== 'none') {
        clearInterval(slideInterval);
        slider.style.display = 'none';
    }

    // تحميل وتشغيل الفيديو الجديد في يوتيوب من اخر نقطة توقف
    if (isPlayerReady && ytPlayer && ytPlayer.loadVideoById) {
        let savedTime = localStorage.getItem('vid_progress_' + videoId) || 0;
        ytPlayer.loadVideoById({
            videoId: videoId,
            startSeconds: parseFloat(savedTime)
        });
    }
};

// إظهار قائمة الفيديوهات لمادة معينة
window.showSubject = function(subjectId, subjectName) {
    document.getElementById('subjects-list').style.display = 'none';
    document.getElementById('videos-list').style.display = 'flex';
    document.getElementById('playlist-title').innerHTML = `<i class="fa-solid fa-book"></i> ${subjectName}`;
    document.getElementById('back-to-subjects').style.display = 'block';
    
    // إخفاء جميع الفيديوهات وعرض الخاصة بالمادة فقط
    const allVideos = document.querySelectorAll('.video-item');
    let hasVideos = false;
    
    allVideos.forEach(item => {
        if (item.classList.contains('subject-' + subjectId)) {
            item.style.display = 'flex';
            hasVideos = true;
        } else {
            item.style.display = 'none';
        }
    });

    // معالجة المواد التي لا تحتوي على فيديوهات (مثل الفرنسي)
    const videosList = document.getElementById('videos-list');
    let emptyMsg = document.getElementById('empty-msg');
    
    if (!emptyMsg) {
        emptyMsg = document.createElement('div');
        emptyMsg.id = 'empty-msg';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.padding = '3rem 1rem';
        emptyMsg.style.color = 'var(--vintage-dark)';
        emptyMsg.style.fontFamily = "'Amiri', serif";
        emptyMsg.style.fontSize = "1.2rem";
        videosList.appendChild(emptyMsg);
    }
    
    if (!hasVideos) {
        emptyMsg.style.display = 'block';
        emptyMsg.innerHTML = '<i class="fa-solid fa-clock-rotate-left" style="font-size:3rem; margin-bottom:1rem; opacity:0.8; display:block;"></i>عذراً، جاري تجهيز المراجعات الخاصة بهذه المادة وإضافتها قريباً.';
    } else {
        emptyMsg.style.display = 'none';
    }
};

// العودة لقائمة المواد
window.backToSubjects = function() {
    document.getElementById('subjects-list').style.display = 'flex';
    document.getElementById('videos-list').style.display = 'none';
    document.getElementById('playlist-title').innerHTML = '<i class="fa-solid fa-list"></i> المواد الدراسية';
    document.getElementById('back-to-subjects').style.display = 'none';
};

// طي وفتح قائمة المواد
window.togglePlaylistCompact = function() {
    const container = document.querySelector('.app-container');
    const isClosed = container.classList.toggle('playlist-closed');
    
    // تحديث نص الزر بناءً على الحالة الجديدة
    const btnSpan = document.querySelector('#smart-toggle-btn span');
    if (btnSpan) {
        if (isClosed) {
            btnSpan.innerText = 'إظهار قائمة المواد والدروس';
        } else {
            btnSpan.innerText = 'إخفاء قائمة المواد والدروس';
        }
    }
};

// تبديل الوضع الداكن والفاتح
window.toggleTheme = function() {
    const body = document.body;
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    
    // حفظ التفضيل
    localStorage.setItem('abqareeno_theme_2026', isDark ? 'dark' : 'light');
    
    // تعديل الأيقونة
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        if (isDark) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
};

// استعادة الوضع عند التحميل وبدء السلايدر
document.addEventListener('DOMContentLoaded', () => {
    // بدء السلايدر
    startSlider();

    // الوضع الداكن والفاتح
    const savedTheme = localStorage.getItem('abqareeno_theme_2026');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }
});         
