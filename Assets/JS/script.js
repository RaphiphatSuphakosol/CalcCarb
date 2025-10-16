// --- Global Variables ---
let TDD = 0, ICR = 0, ISF = 0;
let selectedFoods = [];
let foodDatabase = {};
let allFoodItems = []; // A flat array for easier searching
let favoriteFoods = [];
let history = [];
const starSVG = `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>`;

const tddRanges = {
    adult: { min: 0.4, max: 0.6, default: 0.5, step: 0.05, text: "0.4 - 0.6" },
    toddler: { min: 0.4, max: 0.6, default: 0.5, step: 0.05, text: "0.4 - 0.6" },
    preteen: { min: 0.7, max: 1.0, default: 0.85, step: 0.05, text: "0.7 - 1.0" },
    teen: { min: 1.0, max: 2.0, default: 1.5, step: 0.1, text: "1.0 - 2.0" }
};

let tddWarningResolver = null; // ตัวแปรสำหรับจัดการการยืนยันใน Modal

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
    if (pageId === 'historyPage') {
        renderHistory();
    }
}

function openModal(imageUrl, caption) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCap = document.getElementById('modalCaption');
    const loader = document.getElementById('modal-loader');

    if (modal && modalImg && modalCap && loader) {
        loader.textContent = 'กำลังโหลดรูปภาพ...';
        loader.style.display = 'block';
        modalImg.style.display = 'none';

        // --- ส่วนที่แก้ไข ---
        // 1. ตรวจสอบว่ามี caption หรือไม่ (ไม่ใช่ undefined, null, หรือค่าว่าง)
        if (caption) {
            modalCap.textContent = caption;
            modalCap.style.display = 'block'; // แสดง element ของ caption
        } else {
            modalCap.textContent = ''; // เคลียร์ค่าทิ้ง
            modalCap.style.display = 'none';  // ซ่อน element ของ caption ไปเลย
        }
        // --- สิ้นสุดส่วนที่แก้ไข ---

        modalImg.onload = () => {
            loader.style.display = 'none';
            modalImg.style.display = 'block';
        };

        modalImg.onerror = () => {
            loader.textContent = 'ไม่สามารถโหลดรูปภาพได้';
        };

        modalImg.src = imageUrl;
        // modalCap.textContent = caption; // <-- บรรทัดนี้ไม่ต้องใช้แล้ว เพราะย้ายไปในเงื่อนไขข้างบน
        modal.style.display = 'block';
    }
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');

    if (modal && modalImg) {
        modal.style.display = 'none';
        // เคลียร์ค่ารูปภาพทิ้งเมื่อปิด Modal เพื่อคืน Memory และป้องกันข้อผิดพลาด
        modalImg.src = '';
        modalImg.onload = null;
        modalImg.onerror = null;
    }
}

// ========== START: ฟังก์ชันใหม่สำหรับ Custom Warning Modal ==========
function showTddWarningModal(message) {
    const modal = document.getElementById('custom-warning-modal');
    const warningText = document.getElementById('modal-warning-text');

    warningText.innerHTML = message; // ใช้ innerHTML เพื่อให้ tag <br> และ <b> ทำงาน
    modal.classList.add('visible');

    // คืนค่า Promise ที่จะถูก resolve เมื่อผู้ใช้กดปุ่ม
    return new Promise((resolve) => {
        tddWarningResolver = resolve;
    });
}

function handleModalDecision(confirmed) {
    const modal = document.getElementById('custom-warning-modal');
    modal.classList.remove('visible');

    // หน่วงเวลาเล็กน้อยเพื่อให้ animation ของ CSS ทำงานจบก่อน
    setTimeout(() => {
        if (tddWarningResolver) {
            tddWarningResolver(confirmed); // ส่งค่า true (ยืนยัน) หรือ false (ยกเลิก) กลับไป
            tddWarningResolver = null; // เคลียร์ค่าทิ้ง
        }
    }, 300);
}
// ========== END: ฟังก์ชันใหม่สำหรับ Custom Warning Modal ==========

function openTab(evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = "none");
    document.querySelectorAll('.tab-link').forEach(link => link.className = link.className.replace(" active", ""));
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
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
                        ${food.imageUrl ? `<button class="view-image-btn" onclick="openModal('${food.imageUrl}', '${food.caption}')">📸 <span class="btn-label">ดูรูป</span></button>` : ''}
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
                        ${food.imageUrl ? `<button class="view-image-btn" onclick="openModal('${food.imageUrl}', '${food.caption}')">📸 <span class="btn-label">ดูรูป</span></button>` : ''}
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

    // --- ส่วนที่แก้ไข ---
    // ตรวจสอบว่าในหน่วยนั้นมีตัวเลขอยู่หรือไม่ (เช่น "1 ทัพพี" vs "หน่วย")
    const hasNumberInUnit = /\d/.test(unitString);

    if (hasNumberInUnit) {
        // ถ้ามีตัวเลข: ใช้ตรรกะการคำนวณแบบเดิมที่ซับซ้อน
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
        // ถ้าไม่มีตัวเลข (เช่น "หน่วย"): ให้แสดงจำนวนตามด้วยหน่วยตรงๆ เลย
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

        // --- ส่วนที่เพิ่มเข้ามา ---
        // สร้างตัวแปรสำหรับเก็บ HTML ของคำอธิบาย
        let customHintHtml = '';
        // ตรวจสอบว่ามี "ป้าย" isCustom หรือไม่
        if (food.isCustom) {
            customHintHtml = `<div class="sfi-custom-hint">*1 หน่วย คือ 1 รายการที่ท่านกรอก (เช่น 1 ซอง, 1 กล่อง, 1 ผล)</div>`;
        }
        // --- สิ้นสุดส่วนที่เพิ่มเข้ามา ---

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
                            ${food.imageUrl ? `<button class="view-image-btn" onclick="openModal('${food.imageUrl}', '${food.caption}')">📸 <span class="btn-label">ดูรูป</span></button>` : ''}
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
        historyHtml += `
            <div class="history-item">
                <p class="history-date">${entry.date}</p>
                <p>น้ำตาลก่อนอาหาร: <strong>${entry.cbg}</strong> mg/dL, คาร์บรวม: <strong>${entry.totalCarb}</strong> g</p>
                <p>สรุปอินซูลินที่ฉีด: <span class="history-main-value">${entry.totalBolus} ยูนิต</span></p>
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
        ageGroup: document.getElementById('age-group').value,
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
        document.getElementById('age-group').value = settings.ageGroup || 'adult';
        document.getElementById('insulin-type').value = settings.insulinType || '1800';
        document.getElementById('tbg').value = settings.tbg || '120';

        const multiplierInput = document.getElementById('tdd-multiplier');
        const ageGroup = document.getElementById('age-group').value;
        const range = tddRanges[ageGroup];

        if (range) {
            multiplierInput.min = range.min;
            multiplierInput.max = range.max;
            multiplierInput.step = range.step;
            multiplierInput.placeholder = `แนะนำ ${range.default} (ช่วง ${range.text})`;
        }
        multiplierInput.value = settings.tddMultiplier || (range ? range.default : '0.5');
    } else {
        updateTddMultiplier();
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

function updateTddMultiplier() {
    const ageGroup = document.getElementById('age-group').value;
    const multiplierInput = document.getElementById('tdd-multiplier');
    const range = tddRanges[ageGroup];

    if (range) {
        multiplierInput.min = range.min;
        multiplierInput.max = range.max;
        multiplierInput.step = range.step;
        multiplierInput.value = range.default;
        multiplierInput.placeholder = `แนะนำ ${range.default} (ช่วง ${range.text})`;
    }
}

async function calculatePersonalFactors() {
    const weightEl = document.getElementById('weight');
    const multiplierEl = document.getElementById('tdd-multiplier');

    if (!validateInput(weightEl) || !validateInput(multiplierEl)) {
        (validateInput(weightEl) ? multiplierEl : weightEl).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const ageGroupEl = document.getElementById('age-group');
    const ageGroup = ageGroupEl.value;
    const multiplier = parseFloat(multiplierEl.value);
    const range = tddRanges[ageGroup];

    if (range && (multiplier < range.min || multiplier > range.max)) {
        const ageGroupName = ageGroupEl.options[ageGroupEl.selectedIndex].text;
        const cleanAgeGroupName = ageGroupName.split('(')[0].trim();

        const message =
            `ค่า TDD ที่ท่านกรอก <span class="highlight-warning">${multiplier}</span> ไม่ตรงกับช่วงที่แนะนำสำหรับ<b>กลุ่ม${cleanAgeGroupName}</b> ` +
            `โดยมีค่าที่แนะนำคือ <span class="highlight-safe">${range.text} ยูนิต/กิโลกรัม/วัน</span> ` +
            `<br><br>โปรดทราบว่าการใช้ค่าที่ไม่ถูกต้องอาจเป็น<b>อันตรายร้ายแรงได้</b>`;

        const userConfirmed = await showTddWarningModal(message);

        if (!userConfirmed) {
            multiplierEl.focus();
            return;
        }
    }

    savePersonalFactors();

    const weight = parseFloat(weightEl.value);
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

    if (!validateInput(cbgEl) || !validateInput(tbgEl)) {
        cbgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

        // --- ส่วนที่แก้ไข ---
        // เปลี่ยนจากการปัดเศษเป็น .5 มาเป็นจำนวนเต็มที่ใกล้ที่สุด
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
            totalBolus: roundedTotalBolus.toFixed(1)
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

// --- ส่วนที่เพิ่มเข้ามาสำหรับรูปภาพอินซูลิน ---

// 1. สร้าง Object เพื่อจับคู่ค่า value กับ path ของรูปภาพ
const insulinImages = {
    '1800': 'Assets/Images/novorapid.png', // รูปของ Aspart (Novorapid)
    '1500': 'Assets/Images/actrapid.png'   // รูปของ RI (Actrapid)
};

// 2. สร้างฟังก์ชันสำหรับอัปเดตรูปภาพ
function updateInsulinImage() {
    const insulinSelect = document.getElementById('insulin-type');
    const imageDisplay = document.getElementById('insulin-image-display');
    const selectedValue = insulinSelect.value;

    // ตั้งค่า opacity เป็น 0 ก่อนเปลี่ยนรูป เพื่อให้เกิด effect fade
    imageDisplay.style.opacity = 0;

    setTimeout(() => {
        // อัปเดต src ของรูปภาพจาก Object ที่เราสร้างไว้
        imageDisplay.src = insulinImages[selectedValue];
        // คืนค่า opacity เป็น 1 เพื่อให้รูปแสดงผล
        imageDisplay.style.opacity = 1;
    }, 150); // หน่วงเวลาเล็กน้อยเพื่อให้ fade out ทัน
}

// --- App Initialization ---
window.onload = () => {
    loadTheme();
    showPage('calculatorPage', document.querySelector('.nav-link'));
    loadPersonalFactors();
    favoriteFoods = JSON.parse(localStorage.getItem('favoriteFoods')) || [];
    loadHistory();
    loadFoodData();
    setupTooltips();

    // --- เพิ่ม 2 บรรทัดนี้ ---
    updateInsulinImage(); // 1. เรียกใช้ครั้งแรกตอนโหลดหน้าเว็บ
    document.getElementById('insulin-type').addEventListener('change', updateInsulinImage); // 2. ให้เรียกใช้ทุกครั้งที่มีการเปลี่ยนค่า

    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    const searchInput = document.getElementById('food-search');
    searchInput.addEventListener('input', debounce(filterFoodList, 300));

    const ageGroupSelect = document.getElementById('age-group');
    ageGroupSelect.addEventListener('change', updateTddMultiplier);

    document.getElementById('modal-confirm-btn').addEventListener('click', () => handleModalDecision(true));
    document.getElementById('modal-cancel-btn').addEventListener('click', () => handleModalDecision(false));
};