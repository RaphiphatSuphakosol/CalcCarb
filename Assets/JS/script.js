// --- Global Variables ---
let TDD = 0, ICR = 0, ISF = 0;
let selectedFoods = [];
let foodDatabase = {};
let allFoodItems = []; // A flat array for easier searching
let favoriteFoods = [];
let history = [];
let suppressedTdds = []; // ⭐️ NEW: เก็บค่า TDD ที่ผู้ใช้ไม่ต้องการให้เตือน
let currentTddWarningValue = null; // ⭐️ NEW: เก็บค่า TDD ที่กำลังเตือน
const starSVG = `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>`;

let tddWarningResolver = null;
let slideIndex = 1;
// --- Utility Functions ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// --- Page & UI Functions ---
function showPage(pageId, navLink) {
    document.querySelectorAll('.main-page').forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    navLink.classList.add('active');
    window.scrollTo(0, 0);

    const scrollToSummaryBtn = document.getElementById('scroll-to-summary-btn');
    if (scrollToSummaryBtn) {
        if (pageId !== 'calculatorPage') {
            scrollToSummaryBtn.style.display = 'none';
        } else {
            if (document.getElementById('meal-calculation').style.display === 'block') {
                scrollToSummaryBtn.style.display = 'block';
            } else {
                scrollToSummaryBtn.style.display = 'none';
            }
        }
    }

    if (pageId === 'historyPage') {
        renderHistory();
    }
    if (pageId === 'creditsPage') {
        currentSlide(1);
    }
}

function openModal(imageUrl) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const loader = document.getElementById('modal-loader');

    if (modal && modalImg && loader) {
        loader.textContent = 'กำลังโหลดรูปภาพ...';
        loader.style.display = 'block';
        modalImg.style.display = 'none';

        modalImg.onload = () => {
            loader.style.display = 'none';
            modalImg.style.display = 'block';
        };

        modalImg.onerror = () => {
            loader.textContent = 'ไม่สามารถโหลดรูปภาพได้';
        };

        modalImg.src = imageUrl;
        modal.style.display = 'block';
    }
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');

    if (modal && modalImg) {
        modal.style.display = 'none';
        modalImg.src = '';
        modalImg.onload = null;
        modalImg.onerror = null;
    }
}

// ========== START: ฟังก์ชันสำหรับ Custom Warning Modal ==========
function showTddWarningModal(message) {
    const modal = document.getElementById('custom-warning-modal');
    const warningText = document.getElementById('modal-warning-text');
    const suppressCheckbox = document.getElementById('modal-suppress-warning'); // ⭐️ NEW

    warningText.innerHTML = message;
    suppressCheckbox.checked = false; // ⭐️ NEW: รีเซ็ต checkbox ทุกครั้งที่เปิด
    modal.classList.add('visible');

    return new Promise((resolve) => {
        tddWarningResolver = resolve;
    });
}

function handleModalDecision(confirmed) {
    const modal = document.getElementById('custom-warning-modal');
    modal.classList.remove('visible');

    // --- ⭐️ NEW LOGIC START ---
    const suppressCheckbox = document.getElementById('modal-suppress-warning');
    if (confirmed && suppressCheckbox.checked && currentTddWarningValue !== null) {
        // ถ้าผู้ใช้ยืนยัน, ติ๊กถูก, และมีค่า TDD ที่กำลังเตือน
        if (!suppressedTdds.includes(currentTddWarningValue)) {
            suppressedTdds.push(currentTddWarningValue);
            localStorage.setItem('suppressedTddWarnings', JSON.stringify(suppressedTdds));
        }
    }
    currentTddWarningValue = null; // เคลียร์ค่า TDD ที่กำลังเตือนเสมอ
    // --- ⭐️ NEW LOGIC END ---

    setTimeout(() => {
        if (tddWarningResolver) {
            tddWarningResolver(confirmed);
            tddWarningResolver = null;
        }
    }, 300);
}
// ========== END: ฟังก์ชันสำหรับ Custom Warning Modal ==========

function openTab(evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = "none");
    document.querySelectorAll('.tab-link').forEach(link => link.className = link.className.replace(" active", ""));
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

function finalizeFoodSelection() {
    document.querySelectorAll('#food-selection-tables .accordion-content').forEach(item => {
        item.style.maxHeight = null;
    });
    document.querySelector('.selected-h3').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function toggleAccordion(header) {
    const content = header.nextElementSibling;
    const isActive = content.style.maxHeight;
    if (document.getElementById('food-selection-tables').contains(header)) {
        document.querySelectorAll('#food-selection-tables .accordion-content').forEach(item => {
            if (item !== content) item.style.maxHeight = null;
        });
    }
    if (isActive) {
        content.style.maxHeight = null;
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
    }
}

// --- Theme Management ---
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    document.getElementById('theme-toggle').textContent = isDarkMode ? '🌙' : '☀️';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').textContent = '🌙';
    } else {
        document.getElementById('theme-toggle').textContent = '☀️';
    }
}

// --- Food Data & Search Functions ---
async function loadFoodData() {
    try {
        const response = await fetch('Assets/Data/foodData.json');
        if (!response.ok) throw new Error('Network response not ok');
        foodDatabase = await response.json();
        initializeFoodList();
        renderFavorites();
    } catch (error) {
        console.error('Error loading food data:', error);
        alert(
            "เกิดข้อผิดพลาดในการโหลดข้อมูลอาหาร 🥑\n\n" +
            "ปัญหานี้มักเกิดจากการเปิดไฟล์ index.html โดยตรง\n\n" +
            "✅ วิธีแก้ไข: กรุณาเปิดโปรเจกต์ผ่านส่วนเสริม 'Live Server' ในโปรแกรม VS Code (คลิกปุ่ม 'Go Live' ที่มุมขวาล่าง) เพื่อให้แอปพลิเคชันทำงานได้อย่างถูกต้องครับ"
        );
    }
}

function initializeFoodList() {
    const categoryContainer = document.getElementById('food-selection-tables');
    categoryContainer.innerHTML = '';
    allFoodItems = [];
    let foodIdCounter = 0;
    for (const category in foodDatabase) {
        const categoryData = foodDatabase[category];
        let accordionHtml = `<div class="accordion-item" data-category-name="${category}">
                               <button class="accordion-header" onclick="toggleAccordion(this)"><span>${category}</span></button>
                               <div class="accordion-content">
                                 <div class="food-list-container">`;
        categoryData.items.forEach(food => {
            const foodUniqueId = `food-item-${foodIdCounter++}`;
            const isFavorited = favoriteFoods.includes(food.name);
            const carbPerServe = food.baseUnits !== undefined ? food.baseUnits * categoryData.carbPerUnitBase : food.carbPerServe;
            allFoodItems.push({ ...food, id: foodUniqueId, category: category, carbPerServe: carbPerServe });

            accordionHtml += `
                <div class="food-item-mobile" id="${foodUniqueId}" data-food-name="${food.name.toLowerCase()}">
                    <div class="fim-header">
                        <span class="fim-name">${food.name}</span>
                        <div class="fim-actions">
                            <button class="fav-btn ${isFavorited ? 'favorited' : ''}" onclick="toggleFavorite(event, '${category}', '${food.name}')">${starSVG} <span class="btn-label">โปรด</span></button>
                            <button class="add-btn" onclick="addFoodToSelection('${category}', '${food.name}')">เพิ่ม</button>
                        </div>
                    </div>
                    <div class="fim-details">
                        <span class="fim-info">
                            ${food.unit} ≈ <strong>${carbPerServe.toFixed(0)} กรัม</strong>
                        </span>
                        ${food.imageUrl ? `<button class="view-image-btn" onclick="openModal('${food.imageUrl}')">📸 <span class="btn-label">ดูรูป</span></button>` : ''}
                    </div>
                </div>`;

        });
        accordionHtml += `</div></div></div>`;
        categoryContainer.innerHTML += accordionHtml;
    }
}

function filterFoodList() {
    const filter = document.getElementById('food-search').value.toLowerCase();
    const searchContainer = document.getElementById('search-results-container');
    const favContainer = document.getElementById('favorite-search-display');
    if (filter.length < 1) {
        searchContainer.innerHTML = '';
        searchContainer.style.display = 'none';
        favContainer.style.display = 'block';
        renderFavorites();
        return;
    }
    searchContainer.style.display = 'block';
    favContainer.style.display = 'none';
    let resultsHtml = '<div class="food-list-container">';
    let hasResults = false;
    allFoodItems.forEach(food => {
        const isSelected = selectedFoods.some(selected => selected.name === food.name);
        if (!isSelected && food.name.toLowerCase().includes(filter)) {
            hasResults = true;
            const isFavorited = favoriteFoods.includes(food.name);

            resultsHtml += `
                <div class="food-item-mobile" id="${food.id}-search" data-food-name="${food.name.toLowerCase()}">
                    <div class="fim-header">
                        <span class="fim-name">${food.name}</span>
                        <div class="fim-actions">
                            <button class="fav-btn ${isFavorited ? 'favorited' : ''}" onclick="toggleFavorite(event, '${food.category}', '${food.name}')">${starSVG} <span class="btn-label">โปรด</span></button>
                            <button class="add-btn" onclick="addFoodToSelection('${food.category}', '${food.name}')">เพิ่ม</button>
                        </div>
                    </div>
                    <div class="fim-details">
                        <span class="fim-info">
                            ${food.unit} ≈ <strong>${food.carbPerServe.toFixed(0)} กรัม</strong>
                        </span>
                        ${food.imageUrl ? `<button class="view-image-btn" onclick="openModal('${food.imageUrl}')">📸 <span class="btn-label">ดูรูป</span></button>` : ''}
                    </div>
                </div>`;
        }
    });
    if (!hasResults) {
        resultsHtml = '<p class="no-selection-msg">ไม่พบรายการอาหารที่ค้นหา</p>';
    } else {
         resultsHtml += '</div>';
    }
    searchContainer.innerHTML = resultsHtml;
}

function formatNumber(num) {
    return parseFloat(num.toFixed(2));
}

function calculateActualAmount(unitString, servings) {
    if (!unitString || isNaN(servings) || servings <= 0) {
        return "-";
    }
    const hasNumberInUnit = /\d/.test(unitString);

    if (hasNumberInUnit) {
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        return unitString.replace(/(\d+(\.\d+)?)\s*\/\s*(\d+(\.\d+)?)|(\d+(\.\d+)?)/g, (match) => {
            if (match.includes('/')) {
                const parts = match.split('/');
                const numerator = parseFloat(parts[0].trim());
                const denominator = parseFloat(parts[1].trim());
                if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                    const highPrecisionServings = Math.round(servings * 100);
                    const highPrecisionNum = Math.round(numerator * 100);
                    let newNumerator = highPrecisionServings * highPrecisionNum;
                    let newDenominator = denominator * 100 * 100;
                    const commonDivisor = gcd(newNumerator, newDenominator);
                    let simplifiedNum = newNumerator / commonDivisor;
                    let simplifiedDenom = newDenominator / commonDivisor;
                    if (simplifiedDenom === 1) return simplifiedNum.toString();
                    if (simplifiedNum > simplifiedDenom) {
                         const wholePart = Math.floor(simplifiedNum / simplifiedDenom);
                         const remainder = simplifiedNum % simplifiedDenom;
                         return remainder === 0 ? wholePart.toString() : `${wholePart} ${remainder}/${simplifiedDenom}`;
                    }
                    return `${simplifiedNum}/${simplifiedDenom}`;
                }
            } else {
                const num = parseFloat(match);
                if (!isNaN(num)) {
                    return formatNumber(num * servings).toString();
                }
            }
            return match;
        });
    } else {
        return `${formatNumber(servings)} ${unitString}`;
    }
}

// --- Meal, Favorites, & History Management ---
function addFoodToSelection(categoryName, foodName) {
    const foodData = allFoodItems.find(f => f.name === foodName && f.category === categoryName);
    if (!foodData) return;
    const existingFood = selectedFoods.find(f => f.name === foodName);
    if (existingFood) {
        existingFood.servings = parseFloat(existingFood.servings) + 1;
    } else {
        selectedFoods.push({
            ...foodData,
            id: Date.now(),
            servings: 1,
            itemDomId: foodData.id
        });
    }
    document.querySelectorAll(`[data-food-name="${foodName.toLowerCase()}"]`).forEach(el => el.style.display = 'none');
    renderSelectedFoods();
}

function removeFood(id) {
    const foodIndex = selectedFoods.findIndex(food => food.id == id);
    if (foodIndex > -1) {
        const foodToRemove = selectedFoods.splice(foodIndex, 1)[0];
        if (foodToRemove.itemDomId) {
            document.querySelectorAll(`[data-food-name="${foodToRemove.name.toLowerCase()}"]`).forEach(el => {
                el.style.display = '';
            });
        }
        renderSelectedFoods();
        filterFoodList();
        renderFavorites();
    }
}

function clearMeal() {
    if (confirm('คุณต้องการล้างรายการอาหารและข้อมูลทั้งหมดในมื้อนี้ใช่หรือไม่?')) {
        selectedFoods.forEach(food => {
            if (food.itemDomId) {
                 document.querySelectorAll(`[data-food-name="${food.name.toLowerCase()}"]`).forEach(el => el.style.display = '');
            }
        });
        selectedFoods = [];
        document.getElementById('cbg').value = '';
        document.getElementById('result-card').style.display = 'none';
        document.getElementById('hypo-warning-box').style.display = 'none';
        renderSelectedFoods();
        filterFoodList();
        renderFavorites();
    }
}

function addCustomFood() {
    const nameInput = document.getElementById('custom-food-name');
    const carbInput = document.getElementById('custom-food-carbs');

    if (validateInput(nameInput, true) && validateInput(carbInput)) {
        selectedFoods.push({
            id: Date.now(),
            name: nameInput.value,
            carbPerServe: parseFloat(carbInput.value),
            unit: 'หน่วย',
            servings: 1,
            itemDomId: null,
            isCustom: true,
        });

        nameInput.value = '';
        carbInput.value = '';

        renderSelectedFoods();
    }
}

function updateServings(id, value) {
    const food = selectedFoods.find(f => f.id == id);
    if (food) food.servings = Math.max(0, parseFloat(value) || 0);
    renderSelectedFoods();
}

function increaseServings(id) {
    const food = selectedFoods.find(f => f.id == id);
    if (food) {
        food.servings = formatNumber(parseFloat(food.servings) + 0.25);
        renderSelectedFoods();
    }
}

function decreaseServings(id) {
    const food = selectedFoods.find(f => f.id == id);
    if (food && food.servings > 0) {
        food.servings = formatNumber(Math.max(0, parseFloat(food.servings) - 0.25));
        renderSelectedFoods();
    }
}

function renderSelectedFoods() {
    const listDiv = document.getElementById('selected-food-list');
    if (selectedFoods.length === 0) {
        listDiv.innerHTML = `
            <div class="empty-state-guide">
                <div class="empty-state-icon">🍽️</div>
                <h3>เริ่มต้นเพิ่มอาหารมื้อนี้</h3>
                <p>ค้นหาจากชื่อ, เลือกจากหมวดหมู่, หรือเพิ่มข้อมูลเองจากแถบด้านบน 👆</p>
            </div>
        `;
        updateTotalCarb();
        return;
    }
    let listHtml = '';
    selectedFoods.forEach((food, index) => {
        const totalCarb = food.servings * food.carbPerServe;
        const calculatedUnitText = calculateActualAmount(food.unit, food.servings);

        let customHintHtml = '';
        if (food.isCustom) {
            customHintHtml = `<div class="sfi-custom-hint">*1 หน่วย คือ 1 รายการที่ท่านกรอก (เช่น 1 ซอง, 1 กล่อง, 1 ผล)</div>`;
        }

        listHtml += `
            <div class="selected-food-item" id="selected-${food.id}">
                <div class="sfi-header">
                    <span class="sfi-name">
                        <span class="sfi-item-number">${index + 1}.</span>
                        ${food.name}
                    </span>
                    <span class="sfi-total-carb">${totalCarb.toFixed(0)} กรัม</span>
                </div>
                <div class="sfi-body">
                    <div class="sfi-top-controls">
                        <div class="sfi-input-group">
                            <label for="servings-${food.id}">จำนวนที่รับประทาน (หน่วย)</label>
                            <div class="sfi-quantity-control">
                                <button class="quantity-btn" onclick="decreaseServings(${food.id})">-</button>
                                <input id="servings-${food.id}" type="number" value="${food.servings}" min="0" step="0.25" oninput="updateServings(${food.id}, this.value)">
                                <button class="quantity-btn" onclick="increaseServings(${food.id})">+</button>
                            </div>
                        </div>
                        <div class="sfi-actions">
                            ${food.imageUrl ? `<button class="view-image-btn" onclick="openModal('${food.imageUrl}')">📸 <span class="btn-label">ดูรูป</span></button>` : ''}
                            <button class="remove-btn" onclick="removeFood(${food.id})">❌ <span class="btn-label">ลบ</span></button>
                        </div>
                    </div>
                    <div class="sfi-calculated-amount">
                        <span class="calculated-amount-label">ปริมาณที่รับประทานจริง</span>
                        <span class="calculated-amount-value">${calculatedUnitText}</span>
                    </div>
                    ${customHintHtml} </div>
            </div>`;
    });
    listDiv.innerHTML = listHtml;
    updateTotalCarb();
}

function updateTotalCarb() {
    const total = selectedFoods.reduce((sum, food) => sum + (food.servings * food.carbPerServe), 0);
    document.getElementById('total-carb-value').textContent = total.toFixed(0);

    const totalCarbBox = document.querySelector('.total-carb-box');
    if (totalCarbBox) {
        totalCarbBox.classList.remove('flash-update');
        void totalCarbBox.offsetWidth;
        totalCarbBox.classList.add('flash-update');
    }
    return total;
}

function toggleFavorite(event, categoryName, foodName) {
    event.stopPropagation();
    const favIndex = favoriteFoods.indexOf(foodName);
    if (favIndex > -1) {
        favoriteFoods.splice(favIndex, 1);
    } else {
        favoriteFoods.push(foodName);
    }
    localStorage.setItem('favoriteFoods', JSON.stringify(favoriteFoods));
    const buttons = document.querySelectorAll(`[data-food-name="${foodName.toLowerCase()}"] .fav-btn`);
    buttons.forEach(btn => btn.classList.toggle('favorited', favIndex === -1));
    if (document.getElementById('food-search').value.length < 1) {
        renderFavorites();
    }
}

function renderFavorites() {
    const container = document.getElementById('favorite-search-display');
    container.innerHTML = '';
    if (favoriteFoods.length === 0) {
        container.innerHTML = '<p class="no-selection-msg">คุณยังไม่มีรายการโปรด กด ⭐ เพื่อเพิ่ม</p>';
        return;
    }
    let favHtml = `<h3 class="carb-h3">⭐ รายการโปรด</h3><div class="food-list-container">`;
    allFoodItems.forEach(food => {
        if (favoriteFoods.includes(food.name)) {
            const isSelected = selectedFoods.some(sf => sf.name === food.name);

            favHtml += `
                <div class="food-item-mobile" data-food-name="${food.name.toLowerCase()}" style="${isSelected ? 'display: none;' : ''}">
                    <div class="fim-header">
                        <span class="fim-name">${food.name}</span>
                        <div class="fim-actions">
                            <button class="fav-btn favorited" onclick="toggleFavorite(event, '${food.category}', '${food.name}')">${starSVG} <span class="btn-label">โปรด</span></button>
                            <button class="add-btn" onclick="addFoodToSelection('${food.category}', '${food.name}')">เพิ่ม</button>
                        </div>
                    </div>
                    <div class="fim-details">
                         <span class="fim-info">
                            ${food.unit} ≈ <strong>${food.carbPerServe.toFixed(0)} กรัม</strong>
                        </span>
                        ${food.imageUrl ? `<button class="view-image-btn" onclick="openModal('${food.imageUrl}', '${food.caption}')">📸 <span class="btn-label">ดูรูป</span></button>` : ''}
                    </div>
                </div>`;
        }
    });
    favHtml += '</div>';
    container.innerHTML = favHtml;
}

function saveToHistory(entry) {
    history.unshift(entry);
    if (history.length > 50) { history.pop(); }
    localStorage.setItem('calcHistory', JSON.stringify(history));
}

function loadHistory() {
    const savedHistory = localStorage.getItem('calcHistory');
    history = savedHistory ? JSON.parse(savedHistory) : [];
}

function renderHistory() {
    const container = document.getElementById('history-list-container');
    if (history.length === 0) {
        container.innerHTML = '<p class="no-selection-msg">ยังไม่มีประวัติการคำนวณ</p>';
        return;
    }
    let historyHtml = '';
    history.forEach(entry => {
        const totalBolusDisplay = typeof entry.totalBolus === 'number'
            ? entry.totalBolus.toFixed(1)
            : entry.totalBolus;

        historyHtml += `
            <div class="history-item">
                <p class="history-date">${entry.date}</p>
                <p>น้ำตาลก่อนอาหาร: <strong>${entry.cbg}</strong> mg/dL, คาร์บรวม: <strong>${entry.totalCarb}</strong> g</p>
                <p>สรุปอินซูลินที่ฉีด: <span class="history-main-value">${totalBolusDisplay} ยูนิต</span></p>
            </div>`;
    });
    container.innerHTML = historyHtml;
}

function clearHistory() {
    if (confirm('คุณต้องการล้างประวัติการคำนวณทั้งหมดใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
        history = [];
        localStorage.removeItem('calcHistory');
        renderHistory();
    }
}

// --- Calculation & Data Persistence ---

function savePersonalFactors() {
    const settings = {
        weight: document.getElementById('weight').value,
        height: document.getElementById('height').value,
        age: document.getElementById('age').value,
        insulinType: document.getElementById('insulin-type').value,
        tddMultiplier: document.getElementById('tdd-multiplier').value,
        tbg: document.getElementById('tbg').value
    };
    localStorage.setItem('insulinCalcSettings', JSON.stringify(settings));
}

function loadPersonalFactors() {
    const savedSettings = localStorage.getItem('insulinCalcSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        document.getElementById('weight').value = settings.weight || '60';
        document.getElementById('height').value = settings.height || '160';
        document.getElementById('age').value = settings.age || '30';
        document.getElementById('insulin-type').value = settings.insulinType || '1800';
        document.getElementById('tbg').value = settings.tbg || '120';
        document.getElementById('tdd-multiplier').value = settings.tddMultiplier || '';
    }

    updateTddRecommendations();

    if (savedSettings && JSON.parse(savedSettings).tddMultiplier) {
         document.getElementById('tdd-multiplier').value = JSON.parse(savedSettings).tddMultiplier;
    }
}

function validateInput(element, allowText = false) {
    element.classList.remove('input-error');
    const value = allowText ? element.value.trim() : parseFloat(element.value);
    if (allowText ? value === '' : (isNaN(value) || value <= 0)) {
        element.classList.add('input-error');
        return false;
    }
    return true;
}

/**
 * คำนวณ BMI จากน้ำหนัก (kg) และส่วนสูง (cm)
 */
function calculateBMI(weight, heightCm) {
    if (!weight || !heightCm || heightCm <= 0) {
        return 0;
    }
    const heightM = heightCm / 100;
    return weight / (heightM * heightM);
}

/**
 * ดึงช่วง TDD ที่แนะนำตามเกณฑ์ใหม่
 */
function getTddRange(age, isObese) {
    let range;
    let categoryName = "";

    if (age >= 13) {
        // --- 1. วัยรุ่นหรือผู้ใหญ่ ---
        if (isObese) {
            // 1.1 อ้วน
            if (age >= 15) {
                range = { min: 0.9, max: 1.0, default: 0.95, step: 0.05, text: "0.9 – 1.0" };
                categoryName = "วัยรุ่น/ผู้ใหญ่ (อ้วน, อายุ ≥ 15)";
            } else {
                range = { min: 0.8, max: 0.9, default: 0.85, step: 0.05, text: "0.8 – 0.9" };
                categoryName = "วัยรุ่น (อ้วน, อายุ 13-14)";
            }
        } else {
            // 1.2 ไม่อ้วน
            if (age >= 15) {
                range = { min: 0.8, max: 0.9, default: 0.85, step: 0.05, text: "0.8 – 0.9" };
                categoryName = "วัยรุ่น/ผู้ใหญ่ (ไม่อ้วน, อายุ ≥ 15)";
            } else {
                range = { min: 0.75, max: 0.8, default: 0.75, step: 0.05, text: "0.75 – 0.8" };
                categoryName = "วัยรุ่น (ไม่อ้วน, อายุ 13-14)";
            }
        }
    } else {
        // --- 2. วัยก่อนวัยรุ่น (อายุ < 13 ปี) ---
        if (isObese) {
            // 2.1 อ้วน
            if (age >= 7) {
                range = { min: 0.6, max: 0.75, default: 0.7, step: 0.05, text: "0.6 – 0.75" };
                categoryName = "วัยก่อนวัยรุ่น (อ้วน, อายุ 7-12)";
            } else {
                range = { min: 0.5, max: 0.6, default: 0.55, step: 0.05, text: "0.5 – 0.6" };
                categoryName = "วัยเด็ก (อ้วน, อายุ < 7)";
            }
        } else {
            // 2.2 ไม่อ้วน
            if (age >= 6) {
                range = { min: 0.5, max: 0.6, default: 0.55, step: 0.05, text: "0.5 – 0.6" };
                categoryName = "วัยก่อนวัยรุ่น (ไม่อ้วน, อายุ 6-12)";
            } else if (age >= 3) {
                range = { min: 0.4, max: 0.5, default: 0.45, step: 0.05, text: "0.4 – 0.5" };
                categoryName = "วัยเด็ก (ไม่อ้วน, อายุ 3-5)";
            } else {
                range = { min: 0.3, max: 0.4, default: 0.35, step: 0.05, text: "0.3 – 0.4" };
                categoryName = "วัยเด็ก (ไม่อ้วน, อายุ < 3)";
            }
        }
    }
    return { ...range, categoryName };
}

/**
 * อัปเดตช่อง TDD Multiplier ตามข้อมูล น้ำหนัก, ส่วนสูง, อายุ
 */
function updateTddRecommendations() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const age = parseFloat(document.getElementById('age').value);
    const multiplierInput = document.getElementById('tdd-multiplier');
    const bmiDisplay = document.getElementById('bmi-info-display');

    if (!weight || !height || !age) {
        bmiDisplay.innerHTML = "กรุณากรอกน้ำหนัก, ส่วนสูง และอายุ";
        return;
    }

    const bmi = calculateBMI(weight, height);
    const isObese = bmi >= 25;
    const range = getTddRange(age, isObese);

    multiplierInput.min = range.min;
    multiplierInput.max = range.max;
    multiplierInput.step = range.step;
    multiplierInput.value = range.default;
    multiplierInput.placeholder = `แนะนำ ${range.default} (ช่วง ${range.text})`;

    bmiDisplay.innerHTML = `
        คำนวณ BMI: <strong>${bmi.toFixed(1)}</strong>
        (กลุ่ม: <strong>${range.categoryName}</strong>)
        <br>⚠️ โปรดกรอกค่า TDD ตามคำแนะนำของแพทย์
    `;
}

async function calculatePersonalFactors() {
    // 1. Validate inputs
    const weightEl = document.getElementById('weight');
    const heightEl = document.getElementById('height');
    const ageEl = document.getElementById('age');
    const multiplierEl = document.getElementById('tdd-multiplier');

    const inputsToValidate = [weightEl, heightEl, ageEl, multiplierEl];
    let firstInvalidEl = null;

    for (const el of inputsToValidate) {
        if (!validateInput(el)) {
            if (!firstInvalidEl) firstInvalidEl = el;
        }
    }

    if (firstInvalidEl) {
        firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // 2. รับค่าและคำนวณ Range ที่ถูกต้อง
    const weight = parseFloat(weightEl.value);
    const height = parseFloat(heightEl.value);
    const age = parseFloat(ageEl.value);
    const multiplier = parseFloat(multiplierEl.value);

    const bmi = calculateBMI(weight, height);
    const isObese = bmi >= 25;
    const range = getTddRange(age, isObese);

    // 3. ตรวจสอบ TDD
    if (multiplier < range.min || multiplier > range.max) {

        // --- ⭐️ NEW LOGIC START ---
        // 3.1 ตรวจสอบว่าค่​​านี้ถูกระงับการเตือนไว้หรือไม่
        if (suppressedTdds.includes(multiplier)) {
            // ถ้าถูกระงับไว้ (suppressed) ให้ข้ามการเตือนไปเลย
        } else {
            // 3.2 ถ้ายังไม่ถูกระงับ ให้แสดง modal เตือน
            currentTddWarningValue = multiplier; // ⭐️ NEW: บันทึกค่าที่กำลังจะเตือน

            const message =
                `ค่า TDD ที่ท่านกรอก <span class="highlight-warning">${multiplier}</span> ไม่ตรงกับช่วงที่แนะนำสำหรับกลุ่ม <b>${range.categoryName}</b> ` +
                `ซึ่งแนะนำ <span class="highlight-safe">${range.text}</span> ` +
                `<br><br>โปรดทราบว่าการใช้ค่าที่ไม่ถูกต้องอาจเป็น<b>อันตรายร้ายแรงได้</b>`;

            const userConfirmed = await showTddWarningModal(message);

            if (!userConfirmed) {
                multiplierEl.focus();
                return; // จบการทำงานถ้าผู้ใช้กดยกเลิก
            }
            // ถ้า userConfirmed เป็น true (กดยืนยัน) โค้ดจะทำงานต่อไปยังขั้นตอนที่ 4
        }
        // --- ⭐️ NEW LOGIC END ---
    }

    // 4. บันทึกและคำนวณ
    savePersonalFactors();

    const insulinRule = parseFloat(document.getElementById('insulin-type').value);

    TDD = weight * multiplier;
    ICR = TDD > 0 ? 500 / TDD : 0;
    ISF = TDD > 0 ? insulinRule / TDD : 0;

    document.getElementById('tdd-wrapper').innerHTML = `<span class="result-value">${TDD.toFixed(1)}</span> ยูนิต`;
    document.getElementById('icr-wrapper').innerHTML = `1 ยูนิต ต่อ <span class="result-value">${ICR.toFixed(1)}</span> กรัมคาร์บ`;
    document.getElementById('isf-wrapper').innerHTML = `1 ยูนิต ลดน้ำตาลได้ <span class="result-value">${ISF.toFixed(1)}</span> mg/dL`;

    const factorsDisplay = document.getElementById('factors-display');
    factorsDisplay.style.display = 'block';
    document.getElementById('meal-calculation').style.display = 'block';
    factorsDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('scroll-to-summary-btn').style.display = 'block';
}

function calculateBolus() {
    if (TDD === 0) {
        alert("กรุณาคำนวณ 'ค่าเฉพาะตัว' ในขั้นตอนที่ 1 ก่อน");
        document.getElementById('settings').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    const cbgEl = document.getElementById('cbg');
    const tbgEl = document.getElementById('tbg');

    const resultsCard = document.getElementById('result-card');
    const hypoBox = document.getElementById('hypo-warning-box');
    const donutChart = document.getElementById('donut-chart');

    resultsCard.style.display = 'none';
    hypoBox.style.display = 'none';

    const isCbgValid = validateInput(cbgEl);
    const isTbgValid = validateInput(tbgEl);

    if (!isCbgValid || !isTbgValid) {
        (isCbgValid ? tbgEl : cbgEl).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const CBG = parseFloat(cbgEl.value);
    const TBG = parseFloat(tbgEl.value);
    const totalCarb = updateTotalCarb();

    if (CBG < 70) {
        hypoBox.innerHTML = `<div class="hypo-title">🚨 ระดับน้ำตาลต่ำ! (${CBG} mg/dL)</div><hr><div class="hypo-advice"><strong>ไม่ควรฉีดอินซูลินในตอนนี้</strong><p>โปรดจัดการภาวะน้ำตาลต่ำตามคำแนะนำของแพทย์</p></div>`;
        hypoBox.style.display = 'block';
        hypoBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        const carbBolus = ICR > 0 ? (totalCarb / ICR) : 0;
        const correctionBolus = (CBG > TBG && ISF > 0) ? (CBG - TBG) / ISF : 0;
        const totalBolus = Math.max(0, carbBolus) + Math.max(0, correctionBolus);

        const roundedTotalBolus = Math.round(totalBolus);

        document.getElementById('carb-bolus-value').textContent = `${Math.max(0, carbBolus).toFixed(1)} ยูนิต`;
        document.getElementById('correction-bolus-value').textContent = `${Math.max(0, correctionBolus).toFixed(1)} ยูนิต`;
        document.getElementById('total-bolus-value').textContent = roundedTotalBolus.toFixed(1);

        const safeTotalBolus = totalBolus > 0 ? totalBolus : 1;
        const carbPercent = (carbBolus / safeTotalBolus) * 100;

        donutChart.style.background = `conic-gradient(
            var(--secondary-color) 0% ${carbPercent}%,
            var(--accent-color) ${carbPercent}% 100%
        )`;

        saveToHistory({
            date: new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short'}),
            cbg: CBG,
            totalCarb: totalCarb,
            totalBolus: roundedTotalBolus
        });

        resultsCard.style.display = 'grid';
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function closeAllTooltips() {
    document.querySelectorAll('.tooltip-container.active').forEach(activeTooltip => {
        activeTooltip.classList.remove('active');
    });
}

function setupTooltips() {
    const tooltips = document.querySelectorAll('.tooltip-container');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('click', (event) => {
            event.stopPropagation();
            const isActive = tooltip.classList.contains('active');
            closeAllTooltips();
            if (!isActive) {
                tooltip.classList.add('active');
            }
        });
    });
    document.addEventListener('click', () => {
        closeAllTooltips();
    });
}

// --- Insulin Image Functions ---
const insulinImages = {
    '1800': 'Assets/Images/novorapid.png',
    '1500': 'Assets/Images/actrapid.png'
};

function updateInsulinImage() {
    const insulinSelect = document.getElementById('insulin-type');
    const imageDisplay = document.getElementById('insulin-image-display');
    const selectedValue = insulinSelect.value;

    imageDisplay.style.opacity = 0;

    setTimeout(() => {
        imageDisplay.src = insulinImages[selectedValue];
        imageDisplay.style.opacity = 1;
    }, 150);
}

// --- App Initialization ---
window.onload = () => {
    loadTheme();
    showPage('calculatorPage', document.querySelector('.nav-link'));
    loadPersonalFactors();
    favoriteFoods = JSON.parse(localStorage.getItem('favoriteFoods')) || [];
    loadHistory();
    suppressedTdds = JSON.parse(localStorage.getItem('suppressedTddWarnings')) || []; // ⭐️ NEW: โหลดค่าที่เคยระงับ
    loadFoodData();
    setupTooltips();

    updateInsulinImage();
    document.getElementById('insulin-type').addEventListener('change', updateInsulinImage);

    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    const searchInput = document.getElementById('food-search');
    searchInput.addEventListener('input', debounce(filterFoodList, 300));

    document.getElementById('weight').addEventListener('input', updateTddRecommendations);
    document.getElementById('height').addEventListener('input', updateTddRecommendations);
    document.getElementById('age').addEventListener('input', updateTddRecommendations);

    document.getElementById('modal-confirm-btn').addEventListener('click', () => handleModalDecision(true));
    document.getElementById('modal-cancel-btn').addEventListener('click', () => handleModalDecision(false));
};

// --- Slideshow Functions ---
function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("slide");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";
}