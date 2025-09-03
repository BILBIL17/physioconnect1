// Self-executing anonymous function to encapsulate the entire application
(function() {
    "use strict";

    // --- STATE & CONFIG ---
    let map, progressChart, aiDetector, aiModel, aiAnimationFrameId, lastDetectedPose;
    let currentLanguage = 'id', currentFacingMode = 'user', currentAiMode = 'exercise';
    let isAiSessionActive = false;
    const rekamMedis = []; // In-memory medical record storage

    // --- DOM ELEMENT REFERENCES ---
    const views = document.querySelectorAll('.view'), navLinks = document.querySelectorAll('.bottom-nav a');
    const drawer = document.getElementById('profileDrawer'), overlay = document.getElementById('overlay');
    const webcamFeed = document.getElementById('webcam-feed'), poseOverlay = document.getElementById('pose-overlay');
    const analysisSection = document.getElementById('analysis-section');
    const rekamMedisList = document.getElementById('rekam-medis-list');
    const reminderModal = document.getElementById('reminder-modal');

    // --- TRANSLATION DATA ---
    const translations = {
        id: {
            appTitle: "Physio Connect",
            welcomeUser: name => `Hai, ${name}!`, welcomeSubtitle: "Mari lihat progres dan jadwal latihanmu.",
            progressTitle: "Progress Terapimu", reminderTitle: "Jadwal Latihan Harian", exerciseNote: "Ketuk latihan untuk mengatur pengingat harian.",
            navHome: "Home", navChat: "Chat", navTerapi: "Rekam Medis", navAi: "Analisis AI", navProfil: "Profil",
            welcomeChat: "Selamat datang! Saya PhysioBot, siap membantu Anda.", chatPlaceholder: "Ketik pesan Anda...",
            medicalRecordTitle: "Rekam Medis Pasien", emptyRecord: "Belum ada catatan medis.", generatePDF: "Buat Laporan PDF",
            jurnalTitle: "Jurnal & Riset", jurnalUMS: "FisioMu (Jurnal UMS)", jurnalJOSPT: "JOSPT",
            aiTitle: "Analisis Postur AI", aiModeGeneral: "Latihan", aiModeFront: "Analisis Depan",
            startSession: "Mulai Sesi Kamera", stopSession: "Hentikan Sesi", captureAndAnalyze: "Potret & Analisis", switchCamera: "Ganti Kamera",
            analysisResultTitle: "Hasil Analisis Postur", analysisNotes: "Catatan klinis tambahan...", saveToRecord: "Simpan ke Rekam Medis",
            drawerTitle: "Profil Pengguna", drawerNameLabel: "Nama Lengkap", drawerEmailLabel: "Email", drawerGenderLabel: "Jenis Kelamin",
            drawerGenderSelect: "Pilih", drawerGenderMale: "Laki-laki", drawerGenderFemale: "Perempuan", drawerAgeLabel: "Usia",
            drawerLogoutBtn: "Logout", drawerSaveBtn: "Simpan",
            setReminderTitle: "Atur Pengingat Harian", cancel: "Batal", save: "Simpan"
        },
        en: {
            appTitle: "Physio Connect",
            welcomeUser: name => `Hi, ${name}!`, welcomeSubtitle: "Let's check your progress and schedule.",
            progressTitle: "Your Therapy Progress", reminderTitle: "Daily Exercise Schedule", exerciseNote: "Tap an exercise to set a daily reminder.",
            navHome: "Home", navChat: "Chat", navTerapi: "Medical Record", navAi: "AI Analysis", navProfil: "Profile",
            welcomeChat: "Welcome! I'm PhysioBot, ready to assist you.", chatPlaceholder: "Type your message...",
            medicalRecordTitle: "Patient Medical Records", emptyRecord: "No medical records yet.", generatePDF: "Generate PDF Report",
            jurnalTitle: "Journals & Research", jurnalUMS: "FisioMu (UMS Journal)", jurnalJOSPT: "JOSPT",
            aiTitle: "AI Posture Analysis", aiModeGeneral: "Exercise", aiModeFront: "Frontal Analysis",
            startSession: "Start Camera Session", stopSession: "Stop Session", captureAndAnalyze: "Capture & Analyze", switchCamera: "Switch Camera",
            analysisResultTitle: "Posture Analysis Results", analysisNotes: "Additional clinical notes...", saveToRecord: "Save to Medical Record",
            drawerTitle: "User Profile", drawerNameLabel: "Full Name", drawerEmailLabel: "Email", drawerGenderLabel: "Gender",
            drawerGenderSelect: "Select", drawerGenderMale: "Male", drawerGenderFemale: "Female", drawerAgeLabel: "Age",
            drawerLogoutBtn: "Logout", drawerSaveBtn: "Save",
            setReminderTitle: "Set Daily Reminder", cancel: "Cancel", save: "Save"
        }
    };

    // --- CORE APP LOGIC ---
    function init() {
        setupEventListeners();
        loadProfile();
        renderExercises();
        changeLanguage('id'); // Set initial language
        switchView('#home-view');
        renderRekamMedis();
        loadModel(); // Start loading AI model in background
    }
    
    function setupEventListeners() {
        navLinks.forEach(link => link.addEventListener('click', handleNavClick));
        overlay.addEventListener('click', closeAllPopups);
        drawer.querySelector('.fa-times').addEventListener('click', closeDrawer);
        document.getElementById('profile-icon').addEventListener('click', openDrawer);
        document.getElementById('drawer-save-btn').addEventListener('click', saveDrawer);
        document.getElementById('drawer-logout-btn').addEventListener('click', logout);
        document.getElementById('language-selector').addEventListener('click', () => changeLanguage(currentLanguage === 'id' ? 'en' : 'id'));
        document.getElementById('send-button').addEventListener('click', handleSend);
        document.getElementById('chat-input').addEventListener('keypress', e => { if (e.key === 'Enter') handleSend(); });
        document.getElementById('start-ai-session-btn').addEventListener('click', toggleAiSession);
        document.getElementById('switch-camera-btn').addEventListener('click', switchCamera);
        document.getElementById('capture-btn').addEventListener('click', captureAndAnalyze);
        document.getElementById('save-analysis-btn').addEventListener('click', saveAnalysisToRecord);
        document.getElementById('generate-pdf-btn').addEventListener('click', generatePdf);
        document.getElementById('exercise-list').addEventListener('click', handleExerciseClick);
        document.getElementById('cancel-reminder-btn').addEventListener('click', closeReminderModal);
        document.getElementById('save-reminder-btn').addEventListener('click', saveReminder);
        document.querySelectorAll('input[name="ai-mode"]').forEach(radio => radio.addEventListener('change', (e) => switchAiMode(e.target.value)));
    }

    function handleNavClick(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        switchView(targetId);
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    }

    function switchView(targetId) {
        if (isAiSessionActive && targetId !== '#ai-view') toggleAiSession();
        views.forEach(v => v.classList.remove('active'));
        const targetView = document.querySelector(targetId);
        if (targetView) targetView.classList.add('active');
        if (targetId === '#terapi-view' && !map) initMap();
        else if (map) setTimeout(() => map.invalidateSize(), 100);
        if (targetId === '#home-view' && !progressChart) initChart();
    }

    function changeLanguage(lang) {
        currentLanguage = lang;
        document.documentElement.lang = lang;
        const t = translations[lang];
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            if (t[key]) el.textContent = typeof t[key] === 'function' ? t[key](localStorage.getItem('user_name') || 'User') : t[key];
        });
        document.querySelectorAll('[data-translate-key-placeholder]').forEach(el => {
            el.placeholder = t[el.dataset.translateKeyPlaceholder] || '';
        });
        document.querySelectorAll('[data-translate-key-title]').forEach(el => {
            el.title = t[el.dataset.translateKeyTitle] || '';
        });
        document.querySelector('.language-flag').textContent = lang.toUpperCase();
        if (progressChart) {
            progressChart.data.datasets[0].label = lang === 'id' ? 'Durasi (menit)' : 'Duration (min)';
            progressChart.update();
        }
    }
    
    // --- Profile & Drawer ---
    function openDrawer() { drawer.classList.add('open'); overlay.classList.add('show'); }
    function closeDrawer() { drawer.classList.remove('open'); overlay.classList.remove('show'); }
    function closeAllPopups() { closeDrawer(); closeReminderModal(); }
    function saveDrawer() {
        localStorage.setItem('user_name', document.getElementById('drawerName').value.trim());
        localStorage.setItem('user_email', document.getElementById('drawerEmail').value.trim());
        localStorage.setItem('user_gender', document.getElementById('drawerGender').value);
        localStorage.setItem('user_age', document.getElementById('drawerAge').value);
        alert('Profil disimpan!'); loadProfile(); closeDrawer();
    }
    function logout() {
        if (confirm('Anda yakin ingin logout?')) {
            localStorage.clear();
            location.reload(); 
        }
    }
    function loadProfile() {
        const userName = localStorage.getItem('user_name') || 'Pengguna';
        document.querySelector('[data-translate-key="welcomeUser"]').textContent = translations[currentLanguage].welcomeUser(userName);
        document.getElementById('drawerName').value = userName;
        document.getElementById('drawerEmail').value = localStorage.getItem('user_email') || '';
        document.getElementById('drawerGender').value = localStorage.getItem('user_gender') || '';
        document.getElementById('drawerAge').value = localStorage.getItem('user_age') || '';
    }

    // --- Components Initialization ---
    function initMap() { map = L.map('map').setView([-6.9932, 110.4207], 13); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map); }
    function initChart() { progressChart = new Chart(document.getElementById('progress-chart'), { type: 'line', data: { labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'], datasets: [{ label: 'Durasi (menit)', data: [20, 25, 22, 30, 28], tension: 0.4, fill: true, borderColor: 'var(--primary-color)', backgroundColor: 'rgba(0,131,143,0.1)' }] }, options: { responsive: true, maintainAspectRatio: false } }); }

    // --- Reminder Logic ---
    const exercises = [ { id: 'sq', title: 'Squat 3x12' }, { id: 'pu', title: 'Push Up 3x10' }, { id: 'pl', title: 'Plank 3x30s' } ];
    let reminders = JSON.parse(localStorage.getItem('exercise_reminders')) || {};
    
    function renderExercises() {
        const listEl = document.getElementById('exercise-list');
        listEl.innerHTML = '';
        exercises.forEach(ex => {
            const time = reminders[ex.id] ? `Reminder: ${reminders[ex.id]}` : 'Tidak ada pengingat';
            const li = document.createElement('li');
            li.dataset.id = ex.id;
            li.innerHTML = `<div class="exercise-item-left"><strong>${ex.title}</strong><small>${time}</small></div> <i class="fas fa-chevron-right"></i>`;
            listEl.appendChild(li);
        });
    }
    
    function handleExerciseClick(e) {
        const li = e.target.closest('li');
        if (li) showReminderModal(li.dataset.id);
    }

    function showReminderModal(exerciseId) {
        const exercise = exercises.find(ex => ex.id === exerciseId);
        reminderModal.querySelector('#reminder-exercise-title').textContent = exercise.title;
        reminderModal.dataset.exerciseId = exerciseId;
        document.getElementById('reminder-time-input').value = reminders[exerciseId] || '';
        reminderModal.classList.add('show');
        overlay.classList.add('show');
    }

    function closeReminderModal() {
        reminderModal.classList.remove('show');
        overlay.classList.remove('show');
    }
    
    function saveReminder() {
        const id = reminderModal.dataset.exerciseId;
        const time = document.getElementById('reminder-time-input').value;
        if (time) reminders[id] = time;
        else delete reminders[id];
        localStorage.setItem('exercise_reminders', JSON.stringify(reminders));
        renderExercises();
        closeReminderModal();
    }

    // --- Rekam Medis & PDF ---
    function renderRekamMedis() {
        rekamMedisList.innerHTML = '';
        if (rekamMedis.length === 0) {
            rekamMedisList.innerHTML = `<p class="empty-state" data-translate-key="emptyRecord">${translations[currentLanguage].emptyRecord}</p>`;
            return;
        }
        rekamMedis.forEach(item => {
            const div = document.createElement('div');
            div.className = 'rekam-item';
            div.innerHTML = `
                <strong>Analisis Postur</strong>
                <small>${new Date(item.date).toLocaleString()}</small>
                <img src="${item.image}" alt="Analisis">
                <p>${item.details.replace(/\n/g, '<br>')}</p>
            `;
            rekamMedisList.appendChild(div);
        });
    }

    async function generatePdf() {
        if (rekamMedis.length === 0) { alert("Rekam medis kosong, tidak ada laporan untuk dibuat."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const userName = localStorage.getItem('user_name') || 'Pasien';
        doc.setFontSize(20); doc.text("Laporan Rekam Medis", 10, 20);
        doc.setFontSize(12); doc.text(`Pasien: ${userName}`, 10, 30);
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString()}`, 10, 37);
        let yPos = 50;
        for (const item of rekamMedis) {
            if (yPos > 250) { doc.addPage(); yPos = 20; }
            doc.setFontSize(14); doc.text('Analisis Postur', 10, yPos); yPos += 7;
            doc.setFontSize(10); doc.text(new Date(item.date).toLocaleString(), 10, yPos); yPos += 7;
            doc.addImage(item.image, 'JPEG', 10, yPos, 80, 60); yPos += 70;
            const textLines = doc.splitTextToSize(item.details, 180); doc.text(textLines, 10, yPos);
            yPos += textLines.length * 5 + 10; doc.line(10, yPos - 5, 200, yPos - 5);
        }
        doc.save(`laporan-medis-${userName}.pdf`);
    }

    // --- AI & Posture Analysis ---
    async function setupAiCamera(facingMode) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
            webcamFeed.srcObject = stream;
            webcamFeed.style.transform = facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
            return new Promise(resolve => webcamFeed.onloadedmetadata = () => { webcamFeed.play(); resolve(true); });
        } catch (error) { alert('Akses kamera diperlukan.'); return false; }
    }

    async function toggleAiSession() {
        const btn = document.getElementById('start-ai-session-btn');
        const captureBtn = document.getElementById('capture-btn');
        if (!isAiSessionActive) {
            if (await setupAiCamera(currentFacingMode)) {
                isAiSessionActive = true;
                btn.textContent = translations[currentLanguage].stopSession;
                captureBtn.disabled = false;
                analysisSection.style.display = 'none';
                poseLoop();
            }
        } else {
            isAiSessionActive = false;
            cancelAnimationFrame(aiAnimationFrameId);
            const stream = webcamFeed.srcObject;
            if (stream) stream.getTracks().forEach(track => track.stop());
            webcamFeed.srcObject = null;
            btn.textContent = translations[currentLanguage].startSession;
            captureBtn.disabled = true;
        }
    }

    async function switchCamera() {
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        if (isAiSessionActive) {
            const stream = webcamFeed.srcObject;
            if (stream) stream.getTracks().forEach(track => track.stop());
            await setupAiCamera(currentFacingMode);
        }
    }
    
    function switchAiMode(mode) { currentAiMode = mode; }

    async function poseLoop() {
        if (!isAiSessionActive) return;
        const estimationConfig = { flipHorizontal: currentFacingMode === 'user' };
        const poses = await aiDetector.estimatePoses(webcamFeed, estimationConfig);
        
        const ctx = poseOverlay.getContext('2d');
        poseOverlay.width = webcamFeed.videoWidth;
        poseOverlay.height = webcamFeed.videoHeight;

        if (poses && poses.length > 0) {
            lastDetectedPose = poses[0];
            drawSkeleton(ctx, lastDetectedPose.keypoints, 0.5);
        }
        requestAnimationFrame(poseLoop);
    }

    function captureAndAnalyze() {
        if (!isAiSessionActive || !lastDetectedPose) { alert("Mulai sesi kamera dan pastikan tubuh terdeteksi."); return; }
        analysisSection.style.display = 'block';
        const canvas = document.getElementById('analysis-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = webcamFeed.videoWidth; canvas.height = webcamFeed.videoHeight;
        if (currentFacingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        ctx.drawImage(webcamFeed, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        drawSkeleton(ctx, lastDetectedPose.keypoints, 0.5);
        const analysisText = calculateAndDrawAnalysis(ctx, lastDetectedPose.keypoints);
        document.getElementById('analysis-results-text').innerText = analysisText;
    }

    function calculateAndDrawAnalysis(ctx, keypoints) {
        const leftShoulder = keypoints.find(p => p.name === 'left_shoulder');
        const rightShoulder = keypoints.find(p => p.name === 'right_shoulder');
        let analysis = "Hasil Analisis:\n";
        if (leftShoulder.score > 0.6 && rightShoulder.score > 0.6) {
            ctx.beginPath(); ctx.moveTo(leftShoulder.x, leftShoulder.y); ctx.lineTo(rightShoulder.x, rightShoulder.y);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'; ctx.lineWidth = 3; ctx.stroke();
            const angle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x) * 180 / Math.PI;
            analysis += `• Kemiringan Bahu: ${angle.toFixed(2)}°\n`;
            analysis += (Math.abs(angle) > 4) ? "  Terdapat indikasi kemiringan signifikan." : "  Posisi bahu relatif seimbang.";
        } else { analysis += "• Bahu tidak terdeteksi dengan jelas."; }
        return analysis;
    }

    function saveAnalysisToRecord() {
        const canvas = document.getElementById('analysis-canvas');
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const details = document.getElementById('analysis-results-text').innerText + "\n\nCatatan: " + document.getElementById('analysis-notes').value;
        rekamMedis.push({ type: 'analysis', date: new Date().toISOString(), image: imageData, details: details });
        alert("Analisis disimpan ke rekam medis!");
        analysisSection.style.display = 'none'; document.getElementById('analysis-notes').value = '';
        renderRekamMedis();
    }
    
    function drawSkeleton(ctx, keypoints, minConfidence) {
        const adjacentPairs = poseDetection.util.getAdjacentPairs(aiDetector.model);
        adjacentPairs.forEach(([i, j]) => {
            const kp1 = keypoints[i], kp2 = keypoints[j];
            if (kp1.score > minConfidence && kp2.score > minConfidence) {
                ctx.beginPath(); ctx.moveTo(kp1.x, kp1.y); ctx.lineTo(kp2.x, kp2.y);
                ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0, 191, 165, 0.8)'; ctx.stroke();
            }
        });
        keypoints.forEach(kp => {
            if (kp.score > minConfidence) {
                ctx.beginPath(); ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
                ctx.fillStyle = 'var(--primary-color)'; ctx.fill();
            }
        });
    }

    async function loadModel() {
        try {
            aiModel = poseDetection.SupportedModels.MoveNet;
            aiDetector = await poseDetection.createDetector(aiModel, { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING });
        } catch (error) { console.error("Error loading model:", error); alert("Gagal memuat model AI."); }
    }
    
    // --- CHAT DUMMY (Function provided for completeness) ---
    function handleSend() {
        const chatInput = document.getElementById('chat-input');
        const chatBox = document.getElementById('chat-box');
        const text = chatInput.value.trim();
        if (!text) return;
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user';
        userMsg.innerHTML = `<div class="bubble">${text}</div>`;
        chatBox.appendChild(userMsg);
        chatInput.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;
        // Bot reply simulation
        setTimeout(() => {
            const botMsg = document.createElement('div');
            botMsg.className = 'chat-message bot';
            botMsg.innerHTML = `<div class="bubble">Terima kasih atas pesan Anda. Untuk nyeri punggung, coba peregangan ringan.</div>`;
            chatBox.appendChild(botMsg);
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1000);
    }
    
    init(); // Start the application
})();