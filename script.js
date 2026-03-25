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
    
    // إظهار مشغل يوتيوب
    const playerContainer = document.getElementById('yt-player-container');
    if(playerContainer) playerContainer.style.display = 'block';
    
    // تحديث زر غلق الفيديو
    const closeBtn = document.getElementById('close-video-btn');
    if(closeBtn) closeBtn.style.display = 'inline-flex';
    
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
            authorElem.innerHTML = `<i class="fa-solid fa-user-tie"></i> ${videoData.author}`;
        }
        
        // تحديث مدة الفيديو
        const durationElem = document.getElementById('info-duration');
        if (duration && durationElem) {
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
        }
    } catch(e) {
        console.log("Waiting for player data...");
    }
}

// دالة تفاعلية لتغيير الفيديو من القائمة
window.changeVideo = function(videoId, title, description, element) {
    // حفظ تقدم الفيديو الحالي قبل التبديل
    if (lastLoadedVideoId && ytPlayer && ytPlayer.getCurrentTime) {
        try {
            let currentTime = ytPlayer.getCurrentTime();
            if (currentTime > 2) {
                localStorage.setItem('vid_progress_' + lastLoadedVideoId, currentTime);
            }
        } catch(e) {}
    }
    
    lastLoadedVideoId = videoId;
    
    // تحديث شريط يٌعرض الآن
    const nowPlayingText = document.getElementById('now-playing-text');
    if(nowPlayingText) nowPlayingText.innerText = title;

    // تحديث العناوين في الواجهة
    document.getElementById('info-title').innerText = title;
    
    // معالجة الوصف لو كان يحتوي على تاجات أو معلومات إضافية
    const tagsElem = document.getElementById('info-tags');
    if (tagsElem && description) {
        // لو الوصف طويل أو يحتوي على فواصل، يمكن تقسيمه لتاجات أو عرضه كنص
        tagsElem.innerHTML = `<span class="tag-text">${description}</span>`;
    }
    
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

// طي وفتح قائمة المواد مع تحسين الموبايل
window.togglePlaylistCompact = function() {
    const container = document.querySelector('.app-container');
    const isClosed = container.classList.toggle('playlist-closed');
    
    // تحديث نص الزر الداخلي
    const btnSpan = document.querySelector('#smart-toggle-btn span');
    const btnIcon = document.querySelector('#smart-toggle-btn i');
    if (btnSpan) {
        if (isClosed) {
            btnSpan.innerText = 'إظهار قائمة المواد والدروس';
            if (btnIcon) btnIcon.className = 'fa-solid fa-layer-group';
        } else {
            btnSpan.innerText = 'إخفاء قائمة المواد والدروس';
            if (btnIcon) btnIcon.className = 'fa-solid fa-xmark';
        }
    }
    
    // تحديث زر الموبايل العائم (FAB)
    const fab = document.getElementById('mobile-fab');
    if (fab) {
        const fabSpan = fab.querySelector('span');
        const fabIcon = fab.querySelector('i');
        if (isClosed) {
            if (fabSpan) fabSpan.innerText = 'تصفح المواد والدروس';
            if (fabIcon) fabIcon.className = 'fa-solid fa-layer-group';
            fab.classList.remove('fab-hidden');
        } else {
            if (fabSpan) fabSpan.innerText = 'إغلاق القائمة';
            if (fabIcon) fabIcon.className = 'fa-solid fa-xmark';
        }
    }
    
    // تحسين تجربة الموبايل: النزول تلقائياً للقائمة عند فتحها
    if (!isClosed && window.innerWidth <= 900) {
        setTimeout(() => {
            const playlist = document.querySelector('.playlist-section');
            if (playlist) {
                playlist.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 350); // تأخير مناسب لانتهاء الانيميشن
    }
};

// تبديل الخطوط ديناميكياً
window.changeFont = function(fontClass) {
    const fonts = ['font-reem-kufi', 'font-cairo', 'font-almarai', 'font-tajawal', 'font-readex-pro'];
    // إضافة الكلاس الجديد وحذف القديم
    fonts.forEach(f => document.body.classList.remove(f));
    document.body.classList.add(fontClass);
    
    // حفظ التفضيل
    localStorage.setItem('abqareeno_font_2026', fontClass);
    
    // تحديث الحالة النشطة في القائمة
    document.querySelectorAll('.font-option').forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('onclick').includes(fontClass));
    });
};

// فتح/إغلاق قائمة الخطوط
window.toggleFontMenu = function() {
    const menu = document.getElementById('font-menu');
    menu.classList.toggle('show');
};

// معالجة اختيار الخط وإغلاق القائمة
window.handleFontChange = function(fontClass, element) {
    changeFont(fontClass);
    const menu = document.getElementById('font-menu');
    menu.classList.remove('show');
};

// إغلاق القوائم عند الضغط خارجها
document.addEventListener('click', (e) => {
    const fontMenu = document.getElementById('font-menu');
    const fontBtn = document.getElementById('font-btn');
    if (fontMenu && fontBtn && !fontMenu.contains(e.target) && !fontBtn.contains(e.target)) {
        fontMenu.classList.remove('show');
    }
});

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

// إغلاق الفيديو وإرجاع السلايدر
window.closeVideo = function() {
    // إيقاف الفيديو
    if (ytPlayer && ytPlayer.pauseVideo) {
        ytPlayer.pauseVideo();
    }
    
    // إخفاء مشغل يوتيوب وإظهار السلايدر
    const playerContainer = document.getElementById('yt-player-container');
    if(playerContainer) playerContainer.style.display = 'none';
    
    const slider = document.getElementById('intro-slider');
    if(slider) {
        slider.style.display = 'block';
        startSlider();
    }
    
    // تحديث الزر ليصبح "شغل الفيديو"
    const closeBtn = document.getElementById('close-video-btn');
    if(closeBtn) {
        closeBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i> شغل الفيديو';
        closeBtn.onclick = reopenVideo;
    }
    
    // تحديث شريط يُعرض الآن
    const nowPlayingText = document.getElementById('now-playing-text');
    if(nowPlayingText) nowPlayingText.innerText = 'عرض الصور';
};

// إعادة تشغيل الفيديو من السلايدر
window.reopenVideo = function() {
    clearInterval(slideInterval);
    
    const slider = document.getElementById('intro-slider');
    if(slider) slider.style.display = 'none';
    
    const playerContainer = document.getElementById('yt-player-container');
    if(playerContainer) playerContainer.style.display = 'block';
    
    if (ytPlayer && ytPlayer.playVideo) {
        ytPlayer.playVideo();
    }
    
    // تحديث الزر ليرجع "غلق الفيديو"
    const closeBtn = document.getElementById('close-video-btn');
    if(closeBtn) {
        closeBtn.innerHTML = '<i class="fa-solid fa-circle-stop"></i> غلق الفيديو';
        closeBtn.onclick = closeVideo;
    }
    
    // تحديث شريط يُعرض الآن
    const nowPlayingText = document.getElementById('now-playing-text');
    if(nowPlayingText) {
        const titleElem = document.getElementById('info-title');
        nowPlayingText.innerText = titleElem ? titleElem.innerText : 'فيديو';
    }
};

// استعادة الوضع عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    // لا نبدأ السلايدر - الفيديو يعمل مباشرة

    // الخط المفضل
    const savedFont = localStorage.getItem('abqareeno_font_2026');
    if (savedFont) {
        changeFont(savedFont);
    } else {
        // افتراضي ريم الكوفي
        document.body.classList.add('font-reem-kufi');
    }

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

    // فتح القائمة تلقائياً على الموبايل لسهولة الوصول
    if (window.innerWidth < 992) {
        setTimeout(() => {
            const container = document.querySelector('.app-container');
            if (container && container.classList.contains('playlist-closed')) {
                togglePlaylistCompact();
            }
        }, 500); // تأخير بسيط لضمان تحميل المحتوى
    }
});
