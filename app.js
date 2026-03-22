// ==========================================
// MEDOX AI CHATBOT - Real API Integration
// ==========================================

const APP = {
    botName: 'Medox',
    mode: 'friend',
    language: 'english',
    chats: [],
    currentChatId: null,
    currentMessages: [],
    uploadedFile: null,
    isTyping: false,
    openRouterKey: '',
    chatHistory: [] // for Gemini context
};

// DOM Elements
const $ = id => document.getElementById(id);
let sidebar, sidebarToggle, newChatBtn, botNameDisplay, welcomeBotName;
let modeSelector, languageSelector, modeBadge, langBadge, themeToggle;
let messagesContainer, welcomeScreen, messageInput, sendBtn, micBtn;
let fileUpload, imageUpload, filePreviewArea, fileName, removeFileBtn;
let chatHistoryList, settingsBtn, settingsModal, closeSettings, clearAllChats;

document.addEventListener('DOMContentLoaded', () => {
    sidebar = $('sidebar');
    sidebarToggle = $('sidebarToggle');
    newChatBtn = $('newChatBtn');

    botNameDisplay = $('botNameDisplay');
    welcomeBotName = $('welcomeBotName');
    modeSelector = $('modeSelector');
    languageSelector = $('languageSelector');
    modeBadge = $('modeBadge');
    langBadge = $('langBadge');
    themeToggle = $('themeToggle');
    messagesContainer = $('messagesContainer');
    welcomeScreen = $('welcomeScreen');
    messageInput = $('messageInput');
    sendBtn = $('sendBtn');
    micBtn = $('micBtn');
    fileUpload = $('fileUpload');
    imageUpload = $('imageUpload');
    filePreviewArea = $('filePreviewArea');
    fileName = $('fileName');
    removeFileBtn = $('removeFileBtn');
    chatHistoryList = $('chatHistoryList');
    settingsBtn = $('settingsBtn');
    settingsModal = $('settingsModal');
    closeSettings = $('closeSettings');
    clearAllChats = $('clearAllChats');

    try {
        APP.chats = JSON.parse(localStorage.getItem('medox_chats') || '[]');
    } catch(e) { APP.chats = []; }

    loadSettings();
    renderChatHistory();
    setupEventListeners();
    updateUI();
    console.log('Medox initialized successfully!');
});

// ==========================================
// SETTINGS
// ==========================================
function loadSettings() {
    APP.botName = localStorage.getItem('sb_botName') || 'Medox';
    APP.mode = localStorage.getItem('sb_mode') || 'friend';
    APP.language = localStorage.getItem('sb_language') || 'english';
    APP.openRouterKey = localStorage.getItem('sb_openRouterKey') || '';
    const theme = localStorage.getItem('sb_theme') || 'dark';
    if (theme === 'light') document.body.classList.add('light-theme');
}

function saveSettings() {
    localStorage.setItem('sb_botName', APP.botName);
    localStorage.setItem('sb_mode', APP.mode);
    localStorage.setItem('sb_language', APP.language);
    localStorage.setItem('sb_openRouterKey', APP.openRouterKey);
    localStorage.setItem('sb_theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

function updateUI() {
    botNameDisplay.textContent = APP.botName;
    welcomeBotName.textContent = APP.botName;
    document.title = APP.botName + ' AI Chatbot';
    const modeIcons = { friend: 'fa-heart', teacher: 'fa-graduation-cap', engine: 'fa-cogs' };
    const modeLabels = { friend: 'Friend Mode', teacher: 'Teacher Mode', engine: 'Engine Mode' };
    modeBadge.innerHTML = '<i class="fas ' + modeIcons[APP.mode] + '"></i> ' + modeLabels[APP.mode];
    const langLabels = { english: 'EN', hindi: 'हि', hinglish: 'Hi-En' };
    langBadge.textContent = langLabels[APP.language];
    document.querySelectorAll('.mode-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.mode === APP.mode);
    });
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.lang === APP.language);
    });
    var icon = themeToggle.querySelector('i');
    icon.className = document.body.classList.contains('light-theme') ? 'fas fa-sun' : 'fas fa-moon';
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });

    newChatBtn.addEventListener('click', startNewChat);


    modeSelector.addEventListener('click', function(e) {
        var btn = e.target.closest('.mode-btn');
        if (btn) { APP.mode = btn.dataset.mode; updateUI(); saveSettings(); }
    });

    languageSelector.addEventListener('click', function(e) {
        var btn = e.target.closest('.lang-btn');
        if (btn) { APP.language = btn.dataset.lang; updateUI(); saveSettings(); }
    });

    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('light-theme');
        updateUI();
        saveSettings();
    });

    sendBtn.addEventListener('click', function() {
        sendMessage();
    });

    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    fileUpload.addEventListener('change', handleFileSelect);
    imageUpload.addEventListener('change', handleFileSelect);
    removeFileBtn.addEventListener('click', clearFile);
    micBtn.addEventListener('click', toggleVoiceInput);

    document.querySelectorAll('.quick-chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
            messageInput.value = chip.dataset.query;
            sendMessage();
        });
    });

    settingsBtn.addEventListener('click', function() { settingsModal.style.display = 'flex'; });
    closeSettings.addEventListener('click', function() { settingsModal.style.display = 'none'; });
    settingsModal.addEventListener('click', function(e) {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
    });

    clearAllChats.addEventListener('click', function() {
        if (confirm('Clear all chat history?')) {
            APP.chats = [];
            APP.currentChatId = null;
            APP.currentMessages = [];
            APP.chatHistory = [];
            localStorage.removeItem('medox_chats');
            renderChatHistory();
            showWelcome();
        }
    });

    var saveKeyBtn = $('saveOpenRouterKey');
    if (saveKeyBtn) {
        saveKeyBtn.addEventListener('click', function() {
            var keyInput = $('openRouterKeyInput');
            APP.openRouterKey = keyInput ? keyInput.value.trim() : '';
            saveSettings();
            alert('API Key saved! The bot will now use OpenRouter AI for responses.');
        });
    }

    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) && e.target !== sidebarToggle) {
            sidebar.classList.remove('open');
        }
    });
}

// ==========================================
// CHAT MANAGEMENT
// ==========================================
function startNewChat() {
    APP.currentChatId = Date.now().toString();
    APP.currentMessages = [];
    APP.chatHistory = [];
    showWelcome();
    sidebar.classList.remove('open');
}

function showWelcome() {
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(welcomeScreen);
    welcomeScreen.style.display = 'flex';
}

function saveCurrentChat() {
    if (!APP.currentChatId || APP.currentMessages.length === 0) return;
    var idx = APP.chats.findIndex(function(c) { return c.id === APP.currentChatId; });
    var title = APP.currentMessages[0] ? APP.currentMessages[0].text.substring(0, 40) : 'New Chat';
    var chatData = { id: APP.currentChatId, title: title, messages: APP.currentMessages, timestamp: Date.now() };
    if (idx >= 0) APP.chats[idx] = chatData; else APP.chats.unshift(chatData);
    if (APP.chats.length > 50) APP.chats = APP.chats.slice(0, 50);
    try { localStorage.setItem('medox_chats', JSON.stringify(APP.chats)); } catch(e) {}
    renderChatHistory();
}

function loadChat(chatId) {
    var chat = APP.chats.find(function(c) { return c.id === chatId; });
    if (!chat) return;
    APP.currentChatId = chatId;
    APP.currentMessages = chat.messages;
    APP.chatHistory = [];
    messagesContainer.innerHTML = '';
    welcomeScreen.style.display = 'none';
    chat.messages.forEach(function(msg) {
        appendMessage(msg.role, msg.text, msg.time, msg.fileInfo, false);
        APP.chatHistory.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.text });
    });
    scrollToBottom();
    sidebar.classList.remove('open');
}

function renderChatHistory() {
    chatHistoryList.innerHTML = '';
    APP.chats.forEach(function(chat) {
        var btn = document.createElement('button');
        btn.className = 'history-item' + (chat.id === APP.currentChatId ? ' active' : '');
        btn.innerHTML = '<i class="fas fa-message"></i><span>' + chat.title + '</span>';
        btn.addEventListener('click', function() { loadChat(chat.id); });
        chatHistoryList.appendChild(btn);
    });
}

// ==========================================
// MESSAGING
// ==========================================
function sendMessage() {
    var text = messageInput.value.trim();
    if (!text && !APP.uploadedFile) return;
    if (APP.isTyping) return;
    if (!APP.currentChatId) APP.currentChatId = Date.now().toString();

    welcomeScreen.style.display = 'none';
    var now = new Date();
    var timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var fileInfo = null;

    if (APP.uploadedFile) {
        fileInfo = { 
            name: APP.uploadedFile.name, 
            type: APP.uploadedFile.type, 
            dataUrl: APP.uploadedFile.dataUrl,
            extractedText: APP.uploadedFile.extractedText
        };
    }

    var userMsg = { role: 'user', text: text, time: timeStr, fileInfo: fileInfo };
    APP.currentMessages.push(userMsg);
    APP.chatHistory.push({ role: 'user', content: text });
    appendMessage('user', text, timeStr, fileInfo);
    messageInput.value = '';
    clearFile();
    scrollToBottom();
    showTyping();

    generateResponse(text, fileInfo).then(function(reply) {
        hideTyping();
        var replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        var botMsg = { role: 'bot', text: reply, time: replyTime };
        APP.currentMessages.push(botMsg);
        APP.chatHistory.push({ role: 'assistant', content: reply });
        appendMessage('bot', reply, replyTime);
        scrollToBottom();
        saveCurrentChat();
    }).catch(function(err) {
        hideTyping();
        console.error('Response error:', err);
        var errTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        var errMsg = '⚠️ Oops! Something went wrong. Please try again.';
        appendMessage('bot', errMsg, errTime);
        scrollToBottom();
    });
}

function appendMessage(role, text, time, fileInfo, animate) {
    if (typeof animate === 'undefined') animate = true;
    var div = document.createElement('div');
    div.className = 'message ' + role;
    if (!animate) div.style.animation = 'none';

    var avatarIcon = role === 'bot' ? 'fa-robot' : 'fa-user';
    var fileHTML = '';
    if (fileInfo) {
        if (fileInfo.type && fileInfo.type.startsWith('image/') && fileInfo.dataUrl) {
            fileHTML = '<img src="' + fileInfo.dataUrl + '" class="message-image" alt="Uploaded image">';
        } else if (fileInfo.name) {
            fileHTML = '<div class="message-file-info"><i class="fas fa-file"></i> ' + fileInfo.name + '</div>';
        }
    }

    div.innerHTML =
        '<div class="message-avatar"><i class="fas ' + avatarIcon + '"></i></div>' +
        '<div class="message-content">' +
            fileHTML +
            '<div class="message-bubble">' + formatText(text) + '</div>' +
            '<span class="message-time">' + time + '</span>' +
        '</div>';
    messagesContainer.appendChild(div);
}

function formatText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" style="color:var(--secondary)">$1</a>');
}

function showTyping() {
    APP.isTyping = true;
    var div = document.createElement('div');
    div.className = 'typing-indicator';
    div.id = 'typingIndicator';
    div.innerHTML =
        '<div class="message-avatar" style="background:var(--gradient-primary);color:var(--on-primary);border-radius:var(--radius-md);width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:0.875rem;">' +
            '<i class="fas fa-robot"></i>' +
        '</div>' +
        '<div class="typing-dots"><span></span><span></span><span></span></div>';
    messagesContainer.appendChild(div);
    scrollToBottom();
}

function hideTyping() {
    APP.isTyping = false;
    var el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

function scrollToBottom() {
    requestAnimationFrame(function() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// ==========================================
// FILE HANDLING
// ==========================================
async function handleFileSelect(e) {
    var file = e.target.files[0];
    if (!file) return;

    fileName.textContent = 'Processing ' + file.name + '...';
    filePreviewArea.style.display = 'block';

    if (file.type.startsWith('image/')) {
        var reader = new FileReader();
        reader.onload = function(ev) {
            APP.uploadedFile = { name: file.name, type: file.type, dataUrl: ev.target.result, extractedText: null };
            fileName.textContent = file.name;
        };
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
        var reader = new FileReader();
        reader.onload = async function(ev) {
            var typedarray = new Uint8Array(ev.target.result);
            try {
                var pdf = await pdfjsLib.getDocument(typedarray).promise;
                var fullText = '';
                for (var i = 1; i <= pdf.numPages; i++) {
                    var page = await pdf.getPage(i);
                    var content = await page.getTextContent();
                    var strings = content.items.map(function(item) { return item.str; });
                    fullText += strings.join(' ') + '\n';
                }
                APP.uploadedFile = { name: file.name, type: file.type, dataUrl: null, extractedText: fullText };
                fileName.textContent = file.name;
            } catch (err) {
                console.error('PDF parsing error', err);
                fileName.textContent = file.name + ' (Failed to read PDF)';
                APP.uploadedFile = { name: file.name, type: file.type, dataUrl: null, extractedText: null };
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        // Text files like TXT, CSV, etc.
        var reader = new FileReader();
        reader.onload = function(ev) {
            APP.uploadedFile = { name: file.name, type: file.type, dataUrl: null, extractedText: ev.target.result };
            fileName.textContent = file.name;
        };
        reader.readAsText(file);
    }
    e.target.value = '';
}

function clearFile() {
    APP.uploadedFile = null;
    filePreviewArea.style.display = 'none';
    fileName.textContent = '';
}

// ==========================================
// VOICE INPUT
// ==========================================
function toggleVoiceInput() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('Voice input not supported in this browser. Try Chrome!');
        return;
    }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SR();
    var langMap = { english: 'en-US', hindi: 'hi-IN', hinglish: 'hi-IN' };
    recognition.lang = langMap[APP.language];
    recognition.interimResults = false;
    micBtn.classList.add('recording');
    recognition.start();
    recognition.onresult = function(e) {
        messageInput.value = e.results[0][0].transcript;
        micBtn.classList.remove('recording');
    };
    recognition.onerror = function() { micBtn.classList.remove('recording'); };
    recognition.onend = function() { micBtn.classList.remove('recording'); };
}

// ==========================================
// REAL API CALLS
// ==========================================

// Fetch real weather from wttr.in (free, no API key)
async function fetchWeather(city) {
    try {
        city = city || 'Delhi';
        var res = await fetch('https://wttr.in/' + encodeURIComponent(city) + '?format=j1');
        var data = await res.json();
        var current = data.current_condition[0];
        return {
            temp: current.temp_C,
            feelsLike: current.FeelsLikeC,
            humidity: current.humidity,
            desc: current.weatherDesc[0].value,
            windSpeed: current.windspeedKmph,
            city: data.nearest_area[0].areaName[0].value,
            country: data.nearest_area[0].country[0].value
        };
    } catch(e) {
        console.error('Weather API error:', e);
        return null;
    }
}

// Fetch real news headlines using RSS feeds via rss2json
async function fetchNews(category) {
    try {
        // Use Google News RSS via rss2json.com (free)
        var feeds = {
            general: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
            sports: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pKVGlnQVAB?hl=en-IN&gl=IN&ceid=IN:en',
            politics: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pKVGlnQVAB?hl=en-IN&gl=IN&ceid=IN:en',
            technology: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pKVGlnQVAB?hl=en-IN&gl=IN&ceid=IN:en'
        };
        var feedUrl = feeds[category] || feeds.general;
        var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feedUrl) + '&count=5';
        var res = await fetch(apiUrl);
        var data = await res.json();
        if (data.status === 'ok' && data.items) {
            return data.items.map(function(item) {
                return { title: item.title, link: item.link, pubDate: item.pubDate, source: item.author || 'Google News' };
            });
        }
        return null;
    } catch(e) {
        console.error('News API error:', e);
        return null;
    }
}

// Call OpenRouter API for AI responses
async function callOpenRouter(prompt, imageData) {
    try {
        var contents = [];
        var systemPrompt = buildSystemPrompt();
        contents.push({ role: 'system', content: systemPrompt });
        
        var historySlice = APP.chatHistory.slice(-10);
        historySlice.forEach(function(msg) {
            contents.push(msg);
        });

        if (imageData) {
            contents.push({
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: imageData } }
                ]
            });
        } else {
            contents.push({ role: 'user', content: prompt });
        }

        var body = {
            model: 'google/gemini-2.5-flash',
            messages: contents,
            temperature: 0.8,
            max_tokens: 1024,
            top_p: 0.95
        };

        var res;
        try {
            // Priority 1: Secure Serverless Vercel function
            res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } catch(e) {
            // Local fallback if no server is running
            res = null;
        }

        if (!res || !res.ok) {
            // Fallback 2: Direct API call using Settings Key (for local file:// testing)
            if (APP.openRouterKey) {
                console.warn('Vercel proxy not found. Using local API key from Settings.');
                res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + APP.openRouterKey,
                        'HTTP-Referer': 'http://localhost:8081',
                        'X-Title': 'Medox Chatbot'
                    },
                    body: JSON.stringify(body)
                });
            } else {
                if (res && res.status === 500) {
                    return "❌ **Server Error:** " + await res.text();
                }
                return "❌ **API Key Required:** To run locally, please add your API Key in the Chatbot Settings! (If on Vercel, check Vercel ENV variables).";
            }
        }
        
        var data = await res.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        }
        if (data.error) {
            console.error('OpenRouter API error:', data.error.message);
            return "❌ **API Error:** " + data.error.message;
        }
        return null;
    } catch(e) {
        console.error('OpenRouter call error:', e);
        return "❌ **Connection Error:** " + e.message;
    }
}

function buildSystemPrompt() {
    var modeInstructions = {
        friend: 'You are ' + APP.botName + ', a warm, funny, and caring AI friend. Talk casually, use emojis, be supportive, and keep the conversation fun and engaging. Share opinions, jokes, and be like a real best friend.',
        teacher: 'You are ' + APP.botName + ', a patient and knowledgeable AI teacher. Explain concepts clearly with examples. Break down complex topics. Encourage learning and ask follow-up questions to check understanding.',
        engine: 'You are ' + APP.botName + ', a powerful AI engine/machine. Be precise, technical, and efficient. Provide detailed data, analysis, and systematic answers. Focus on accuracy and completeness.'
    };
    var langInstructions = {
        english: 'Respond in English.',
        hindi: 'Respond in Hindi (Devanagari script). पूरा जवाब हिंदी में दो।',
        hinglish: 'Respond in Hinglish (mix of Hindi and English, written in Roman script). Jaise casual baat karte hain waise reply karo.'
    };
    return modeInstructions[APP.mode] + '\n' + langInstructions[APP.language] +
           '\nKeep responses concise but helpful. You can suggest apps, explain topics, give real-world advice, tell jokes, and be a great companion. Use emojis where appropriate. Format important text with **bold**.';
}

// ==========================================
// MAIN RESPONSE ENGINE (with real APIs)
// ==========================================
async function generateResponse(query, fileInfo) {
    var q = query.toLowerCase().trim();
    var lang = APP.language;

    // --- REAL TIME ---
    if (q.match(/\b(time|samay|kitne baje|waqt|kya baj[ae])\b/)) {
        return getTimeResponse(lang);
    }

    // --- REAL WEATHER from wttr.in ---
    if (q.match(/\b(weather|mausam|temperature|taapmaan|garmi|sardi|barish|temp)\b/)) {
        var city = extractCity(q) || 'Delhi';
        var weather = await fetchWeather(city);
        if (weather) return formatWeatherResponse(weather, lang);
        // fallback to Gemini if weather API fails
    }

    // --- REAL NEWS from Google News RSS ---
    if (q.match(/\b(news|khabar|samachar|headlines|aaj ki taza)\b/)) {
        var newsItems = await fetchNews('general');
        if (newsItems) return formatNewsResponse(newsItems, lang, 'News');
    }

    // --- REAL SPORTS NEWS ---
    if (q.match(/\b(sport|cricket|football|ipl|match|khel|score)\b/)) {
        var sportsNews = await fetchNews('sports');
        if (sportsNews) return formatNewsResponse(sportsNews, lang, 'Sports');
    }

    // --- REAL POLITICS NEWS ---
    if (q.match(/\b(politic|rajniti|sarkar|government|election|modi|parliament)\b/)) {
        var politicsNews = await fetchNews('politics');
        if (politicsNews) return formatNewsResponse(politicsNews, lang, 'Politics');
    }

    // --- FILE / IMAGE with OpenRouter Vision ---
    if (fileInfo && fileInfo.dataUrl) {
        var filePrompt = query || 'Describe this image in detail and tell me what you see.';
        var aiResult = await callOpenRouter(filePrompt, fileInfo.dataUrl);
        if (aiResult) return aiResult;
    }
    
    // --- PDF / TEXT FILES ---
    if (fileInfo && fileInfo.extractedText) {
        var maxChars = 20000; // Limit document size so it doesn't break limits
        var docContext = fileInfo.extractedText.length > maxChars 
                         ? fileInfo.extractedText.substring(0, maxChars) + '... [TRUNCATED]' 
                         : fileInfo.extractedText;
        var textPrompt = (query || 'Please summarize this document:') + '\n\n--- DOCUMENT: ' + fileInfo.name + ' ---\n' + docContext;
        var aiResponse = await callOpenRouter(textPrompt, null);
        if (aiResponse) return aiResponse;
    }

    // --- USE OPENROUTER API for everything else ---
    var aiResponse = await callOpenRouter(query, null);
    if (aiResponse && !aiResponse.includes("API Key Required")) return aiResponse;

    // --- OFFLINE FALLBACKS (no API key) ---
    if (q.match(/^(hi|hello|hey|namaste|namaskar|kaise ho|how are you|sup|yo|hola|kya haal)/))
        return offlineGreeting(lang);
    if (q.match(/\b(thank|shukriya|dhanyavaad|thx|ty)\b/))
        return offlineThanks(lang);
    if (q.match(/\b(bye|alvida|goodbye|tata|see you|milte hain)\b/))
        return offlineBye(lang);
    if (q.match(/\b(who are you|kaun ho|apna naam|your name|tum kaun|kon ho)\b/))
        return offlineIdentity(lang);
    if (q.match(/\b(help|madad|sahayata|kya kar sakte)\b/))
        return offlineHelp(lang);
    if (q.match(/\b(suggest.*app|app.*suggest|recommend.*app|koi app|accha app|best app)\b/))
        return offlineAppSuggest(lang);
    if (q.match(/\b(joke|mazak|funny|hasa|hasao)\b/))
        return offlineJoke(lang);

    // Default: prompt user to add Gemini API key
    return offlineDefault(query, lang);
}

// ==========================================
// RESPONSE FORMATTERS (Real Data)
// ==========================================
function getTimeResponse(lang) {
    var now = new Date();
    var t = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var d = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (lang === 'hindi') return '🕐 अभी समय है **' + t + '**\n📅 आज की तारीख: **' + d + '**';
    if (lang === 'hinglish') return '🕐 Abhi time hai **' + t + '**\n📅 Aaj ki date: **' + d + '**';
    return '🕐 The current time is **' + t + '**\n📅 Today\'s date: **' + d + '**';
}

function formatWeatherResponse(w, lang) {
    if (lang === 'hindi') {
        return '🌡️ **' + w.city + ', ' + w.country + ' का मौसम**\n\n' +
            '🌡️ तापमान: **' + w.temp + '°C** (महसूस: ' + w.feelsLike + '°C)\n' +
            '☁️ स्थिति: **' + w.desc + '**\n' +
            '💧 नमी: **' + w.humidity + '%**\n' +
            '💨 हवा: **' + w.windSpeed + ' km/h**\n\n' +
            '📡 *यह रियल-टाइम डेटा wttr.in से है*';
    }
    if (lang === 'hinglish') {
        return '🌡️ **' + w.city + ', ' + w.country + ' ka Weather**\n\n' +
            '🌡️ Temperature: **' + w.temp + '°C** (Feels like: ' + w.feelsLike + '°C)\n' +
            '☁️ Condition: **' + w.desc + '**\n' +
            '💧 Humidity: **' + w.humidity + '%**\n' +
            '💨 Wind: **' + w.windSpeed + ' km/h**\n\n' +
            '📡 *Ye real-time data hai wttr.in se*';
    }
    return '🌡️ **Weather in ' + w.city + ', ' + w.country + '**\n\n' +
        '🌡️ Temperature: **' + w.temp + '°C** (Feels like: ' + w.feelsLike + '°C)\n' +
        '☁️ Condition: **' + w.desc + '**\n' +
        '💧 Humidity: **' + w.humidity + '%**\n' +
        '💨 Wind: **' + w.windSpeed + ' km/h**\n\n' +
        '📡 *Real-time data from wttr.in*';
}

function formatNewsResponse(items, lang, category) {
    var header = '';
    if (lang === 'hindi') header = '📰 **ताज़ा ' + category + ' खबरें (Google News से)**\n\n';
    else if (lang === 'hinglish') header = '📰 **Latest ' + category + ' News (Google News se)**\n\n';
    else header = '📰 **Latest ' + category + ' Headlines (from Google News)**\n\n';

    var body = '';
    items.forEach(function(item, i) {
        body += (i + 1) + '. **' + item.title + '**\n   🔗 ' + item.link + '\n\n';
    });

    if (lang === 'hindi') body += '📡 *रियल-टाइम डेटा Google News RSS से*';
    else if (lang === 'hinglish') body += '📡 *Real-time data Google News RSS se*';
    else body += '📡 *Real-time data from Google News RSS*';

    return header + body;
}

function extractCity(query) {
    var cityPatterns = ['weather in (\\w+)', 'mausam (\\w+)', 'temperature in (\\w+)', 'weather of (\\w+)', '(\\w+) ka mausam', '(\\w+) weather'];
    for (var i = 0; i < cityPatterns.length; i++) {
        var match = query.match(new RegExp(cityPatterns[i], 'i'));
        if (match && match[1]) {
            var skip = ['the', 'in', 'of', 'ka', 'ki', 'ke', 'hai', 'kya', 'like', 'today', 'now', 'current', 'aaj'];
            if (skip.indexOf(match[1].toLowerCase()) === -1) return match[1];
        }
    }
    return null;
}

// ==========================================
// OFFLINE FALLBACKS (when no API key)
// ==========================================
function offlineGreeting(lang) {
    var greets = {
        english: ['Hey there! 😊 What\'s up?', 'Hello friend! 🎉 How\'s your day going?', 'Hi! 👋 Great to see you!'],
        hindi: ['अरे! 😊 कैसे हो दोस्त?', 'नमस्ते! 🎉 आज कैसा दिन है?', 'हाय! 👋 बताओ क्या हाल?'],
        hinglish: ['Hey! 😊 Kaise ho yaar?', 'Hello dost! 🎉 Kya scene hai?', 'Hi! 👋 Batao kya chal raha?']
    };
    var arr = greets[lang] || greets.english;
    return arr[Math.floor(Math.random() * arr.length)];
}

function offlineThanks(lang) {
    if (lang === 'hindi') return 'आपका स्वागत है! 😊 और कुछ मदद चाहिए तो बताइए!';
    if (lang === 'hinglish') return 'Welcome yaar! 😊 Aur kuch help chahiye toh batao!';
    return 'You\'re welcome! 😊 Feel free to ask anything else!';
}

function offlineBye(lang) {
    if (lang === 'hindi') return 'अलविदा! 👋 अपना ख्याल रखना! 💜';
    if (lang === 'hinglish') return 'Bye bye! 👋 Apna khayal rakhna! 💜';
    return 'Goodbye! 👋 Take care! 💜';
}

function offlineIdentity(lang) {
    if (lang === 'hindi') return 'मैं **' + APP.botName + '** हूं! 🤖 आपका AI दोस्त, शिक्षक और सहायक।\n\n💡 **Tip:** Settings में OpenRouter API Key डालें तो मैं और स्मार्ट हो जाऊंगा!';
    if (lang === 'hinglish') return 'Main **' + APP.botName + '** hoon! 🤖 Tumhara AI dost.\n\n💡 **Tip:** Settings mein OpenRouter API Key daalo toh main aur smart ho jaunga!';
    return 'I\'m **' + APP.botName + '**! 🤖 Your AI friend, teacher & assistant.\n\n💡 **Tip:** Add your OpenRouter API Key in Settings to unlock my full AI power!';
}

function offlineHelp(lang) {
    var helpText = '🆘 **I can do these things:**\n\n' +
        '🕐 Tell the time (works offline)\n' +
        '🌤️ **Real weather** from wttr.in (live data!)\n' +
        '📰 **Real news** from Google News (live data!)\n' +
        '⚽ **Real sports news** (live data!)\n' +
        '🏛️ **Real politics news** (live data!)\n' +
        '📁 Understand files & images\n' +
        '💬 Chat in English, Hindi, Hinglish\n\n' +
        '🔑 **For full AI power:** Add your OpenRouter API Key in ⚙️ Settings!\n' +
        'Get a free key at: https://openrouter.ai/keys';
    return helpText;
}

function offlineAppSuggest(lang) {
    return '📱 **App Suggestions:**\n\n' +
        '1. **Notion** - All-in-one workspace\n' +
        '2. **Todoist** - Smart task manager\n' +
        '3. **Canva** - Design anything\n' +
        '4. **Duolingo** - Learn languages\n\n' +
        '💡 Add OpenRouter API Key in Settings for personalized recommendations!';
}

function offlineJoke(lang) {
    var jokes = {
        english: ['Why do programmers prefer dark mode? Because light attracts bugs! 🐛😄', 'What did the ocean say to the beach? Nothing, it just waved! 🌊😂'],
        hindi: ['टीचर: तुम स्कूल क्यों नहीं आए?\nछात्र: सपने में देखा कि स्कूल बंद है! 😂'],
        hinglish: ['Teacher: Homework kyu nahi kiya?\nStudent: WiFi nahi tha sir! 😂']
    };
    var arr = jokes[lang] || jokes.english;
    return arr[Math.floor(Math.random() * arr.length)];
}

function offlineDefault(query, lang) {
    var msg = '';
    if (lang === 'hindi') {
        msg = '🤔 "**' + query + '**" - अच्छा सवाल है!\n\n' +
            '⚠️ मैं अभी ऑफलाइन मोड में हूं। पूरी AI शक्ति के लिए:\n' +
            '1. ⚙️ Settings खोलें\n' +
            '2. OpenRouter API Key डालें\n' +
            '3. फ्री key यहाँ मिलेगी: https://openrouter.ai/keys\n\n' +
            '📌 बिना key के भी मैं **time, weather, news, sports** बता सकता हूं!';
    } else if (lang === 'hinglish') {
        msg = '🤔 "**' + query + '**" - interesting question!\n\n' +
            '⚠️ Main abhi offline mode mein hoon. Full AI power ke liye:\n' +
            '1. ⚙️ Settings kholo\n' +
            '2. OpenRouter API Key daalo\n' +
            '3. Free key yahan milegi: https://openrouter.ai/keys\n\n' +
            '📌 Bina key ke bhi main **time, weather, news, sports** bata sakta hoon!';
    } else {
        msg = '🤔 "**' + query + '**" - Good question!\n\n' +
            '⚠️ I\'m in offline mode right now. For full AI power:\n' +
            '1. Open ⚙️ Settings\n' +
            '2. Add your OpenRouter API Key\n' +
            '3. Get a free key at: https://openrouter.ai/keys\n\n' +
            '📌 Even without a key, I can show **real-time weather, news, & sports**!';
    }
    return msg;
}
