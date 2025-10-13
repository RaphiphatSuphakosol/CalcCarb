// --- Global Variables ---
let TDD = 0, ICR = 0, ISF = 0;
let selectedFoods = [];
let foodDatabase = {};
let allFoodItems = []; // A flat array for easier searching
let favoriteFoods = [];
let history = [];
const starSVG = `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>`;

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
    if (modal && modalImg && modalCap) {
        modalImg.src = imageUrl;
        modalCap.textContent = caption;
        modal.style.display = 'block';
    }
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

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
        // ===== ⬇️⬇️ ข้อความแจ้งเตือนที่แก้ไขใหม่ ⬇️⬇️ =====
        alert(
            "เกิดข้อผิดพลาดในการโหลดข้อมูลอาหาร 🥑\n\n" +
            "ปัญหานี้มักเกิดจากการเปิดไฟล์ index.html โดยตรง\n\n" +
            "✅ วิธีแก้ไข: กรุณาเปิดโปรเจกต์ผ่านส่วนเสริม 'Live Server' ในโปรแกรม VS Code (คลิกปุ่ม 'Go Live' ที่มุมขวาล่าง) เพื่อให้แอปพลิเคชันทำงานได้อย่างถูกต้องครับ"
        );
        // ===== ⬆️⬆️ สิ้นสุดส่วนที่แก้ไข ⬆️⬆️ =====
    }
}

function initializeFoodList() {
    const categoryContainer = document.getElementById('food-selection-tables');
    categoryContainer.innerHTML = '';
    allFoodItems = [];

    let foodIdCounter = 0;

    for (const category in foodDatabase) {
        const categoryData = foodDatabase[category];
        let accordionHtml = `<div class="accordion-item" data-category-name="${category}"><button class="accordion-header" onclick="toggleAccordion(this)"><span>${category}</span></button><div class="accordion-content"><table class="food-table"><thead><tr><th style="width: 35%;">รายการอาหาร</th><th style="width: 20%;">คาร์บ</th><th style="width: 15%;">หน่วย</th><th style="width: 10%;">ดูรูป</th><th style="width: 20%;" class="cell-right">เพิ่ม</th></tr></thead><tbody>`;

        categoryData.items.forEach(food => {
            const foodUniqueId = `food-item-${foodIdCounter++}`;
            const isFavorited = favoriteFoods.includes(food.name);
            const carbPerServe = food.baseUnits !== undefined ? food.baseUnits * categoryData.carbPerUnitBase : food.carbPerServe;
            const displayValue = food.baseUnits !== undefined ? `${food.baseUnits.toFixed(1)} CU` : `${carbPerServe.toFixed(0)} g`;
            let imageButtonHtml = food.imageUrl ? `<button class="view-image-btn" onclick="openModal('${food.imageUrl}', '${food.caption}')">📸</button>` : '';

            allFoodItems.push({ ...food, id: foodUniqueId, category: category, carbPerServe: carbPerServe, displayValue: displayValue });

            accordionHtml += `
                <tr id="${foodUniqueId}" data-food-name="${food.name.toLowerCase()}">
                    <td data-label="รายการ">${food.name}</td>
                    <td data-label="คาร์บ">${displayValue}</td>
                    <td data-label="หน่วย">${food.unit}</td>
                    <td data-label="ดูรูป">${imageButtonHtml}</td>
                    <td data-label="เพิ่ม">
                        <div class="add-controls">
                            <button class="fav-btn ${isFavorited ? 'favorited' : ''}" onclick="toggleFavorite(event, '${category}', '${food.name}')">${starSVG}</button>
                            <button class="add-btn" onclick="addFoodToSelection('${category}', '${food.name}')">เพิ่ม</button>
                        </div>
                    </td>
                </tr>`;
        });

        accordionHtml += `</tbody></table></div></div>`;
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

    let resultsHtml = '<table class="food-table"><thead><tr><th style="width: 40%;">รายการอาหาร</th><th style="width: 20%;">คาร์บ</th><th style="width: 15%;">หน่วย</th><th style="width: 10%;">ดูรูป</th><th style="width: 15%;" class="cell-right">เพิ่ม</th></tr></thead><tbody>';
    let hasResults = false;

    allFoodItems.forEach(food => {
        const isSelected = selectedFoods.some(selected => selected.name === food.name);
        if (!isSelected && food.name.toLowerCase().includes(filter)) {
            hasResults = true;
            let imageButtonHtml = food.imageUrl ? `<button class="view-image-btn" onclick="openModal('${food.imageUrl}', '${food.caption}')">📸</button>` : '';
            const isFavorited = favoriteFoods.includes(food.name);

            resultsHtml += `
                <tr id="${food.id}-search" data-food-name="${food.name.toLowerCase()}">
                    <td data-label="รายการ">${food.name}</td>
                    <td data-label="คาร์บ">${food.displayValue}</td>
                    <td data-label="หน่วย">${food.unit}</td>
                    <td data-label="ดูรูป">${imageButtonHtml}</td>
                    <td data-label="เพิ่ม">
                        <div class="add-controls">
                            <button class="fav-btn ${isFavorited ? 'favorited' : ''}" onclick="toggleFavorite(event, '${food.category}', '${food.name}')">${starSVG}</button>
                            <button class="add-btn" onclick="addFoodToSelection('${food.category}', '${food.name}')">เพิ่ม</button>
                        </div>
                    </td>
                </tr>`;
        }
    });

    if (!hasResults) {
        resultsHtml = '<p class="no-selection-msg">ไม่พบรายการอาหารที่ค้นหา</p>';
    } else {
         resultsHtml += '</tbody></table>';
    }

    searchContainer.innerHTML = resultsHtml;
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
        document.getElementById('bolus-results').style.display = 'none';
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
            unit: 'ครั้ง',
            servings: 1,
            itemDomId: null
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

function renderSelectedFoods() {
    const listDiv = document.getElementById('selected-food-list');
    if (selectedFoods.length === 0) {
        listDiv.innerHTML = '<p class="no-selection-msg">ยังไม่ได้เลือกอาหาร</p>';
        updateTotalCarb();
        return;
    }
    let tableHtml = `<table class="selection-table"><thead><tr><th style="width: 40%;">รายการอาหาร</th><th class="cell-center" style="width: 25%;">จำนวน</th><th class="cell-center" style="width: 15%;">คาร์บรวม (g)</th><th class="cell-center" style="width: 10%;">ดูรูป</th><th class="cell-center" style="width: 10%;">ลบ</th></tr></thead><tbody>`;
    selectedFoods.forEach(food => {
        const totalCarb = food.servings * food.carbPerServe;
        let imageButtonHtml = '';
        if (food.imageUrl) {
            imageButtonHtml = `<button class="view-image-btn" onclick="openModal('${food.imageUrl}', '${food.caption}')">📸</button>`;
        }
        tableHtml += `<tr><td data-label="รายการ">${food.name} (${food.carbPerServe.toFixed(0)}g / ${food.unit})</td><td data-label="จำนวน" class="cell-center"><div class="cell-content"><div class="servings-input-wrapper"><input type="number" value="${food.servings}" min="0" step="0.25" oninput="updateServings(${food.id}, this.value)"><span class="unit-label">${food.unit}</span></div></div></td><td data-label="คาร์บรวม" class="cell-center"><div class="cell-content"><span>${totalCarb.toFixed(0)}</span></div></td><td data-label="ดูรูป" class="cell-center"><div class="cell-content">${imageButtonHtml}</div></td><td data-label="ลบ" class="cell-center"><div class="cell-content"><button class="remove-btn" onclick="removeFood(${food.id})">X</button></div></td></tr>`;
    });
    listDiv.innerHTML = tableHtml + `</tbody></table>`;
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

    const buttons = document.querySelectorAll(`tr[data-food-name="${foodName.toLowerCase()}"] .fav-btn`);
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

    let favHtml = `<h3 class="carb-h3">⭐ รายการโปรด</h3><table class="food-table"><thead><tr><th style="width: 40%;">รายการอาหาร</th><th style="width: 20%;">คาร์บ</th><th style="width: 15%;">หน่วย</th><th style="width: 10%;">ดูรูป</th><th style="width: 15%;" class="cell-right">เพิ่ม</th></tr></thead><tbody>`;
    allFoodItems.forEach(food => {
        if (favoriteFoods.includes(food.name)) {
            const isSelected = selectedFoods.some(sf => sf.name === food.name);
            let imageButtonHtml = food.imageUrl ? `<button class="view-image-btn" onclick="openModal('${food.imageUrl}', '${food.caption}')">📸</button>` : '';

            favHtml += `
                <tr data-food-name="${food.name.toLowerCase()}" style="${isSelected ? 'display: none;' : ''}">
                    <td data-label="รายการ">${food.name}</td>
                    <td data-label="คาร์บ">${food.displayValue}</td>
                    <td data-label="หน่วย">${food.unit}</td>
                    <td data-label="ดูรูป">${imageButtonHtml}</td>
                    <td data-label="เพิ่ม">
                        <div class="add-controls">
                            <button class="fav-btn favorited" onclick="toggleFavorite(event, '${food.category}', '${food.name}')">${starSVG}</button>
                            <button class="add-btn" onclick="addFoodToSelection('${food.category}', '${food.name}')">เพิ่ม</button>
                        </div>
                    </td>
                </tr>`;
        }
    });
    favHtml += '</tbody></table>';
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
        tbg: document.getElementById('tbg').value
    };
    localStorage.setItem('insulinCalcSettings', JSON.stringify(settings));
}

function loadPersonalFactors() {
    const savedSettings = localStorage.getItem('insulinCalcSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        document.getElementById('weight').value = settings.weight || '60';
        document.getElementById('age-group').value = settings.ageGroup || '0.5';
        document.getElementById('insulin-type').value = settings.insulinType || '1800';
        document.getElementById('tbg').value = settings.tbg || '120';
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

function calculatePersonalFactors() {
    const weightEl = document.getElementById('weight');
    if (!validateInput(weightEl)) {
        weightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    savePersonalFactors();

    const weight = parseFloat(weightEl.value);
    const multiplier = parseFloat(document.getElementById('age-group').value);
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
    const resultsBox = document.getElementById('bolus-results');

    resultsBox.style.display = 'none';
    resultsBox.classList.remove('hypo-warning');

    if (!validateInput(cbgEl) || !validateInput(tbgEl)) {
        cbgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const CBG = parseFloat(cbgEl.value);
    const TBG = parseFloat(tbgEl.value);
    const totalCarb = updateTotalCarb();

    if (CBG < 70) {
        resultsBox.innerHTML = `<div class="hypo-title">🚨 ระดับน้ำตาลต่ำ! (${CBG} mg/dL)</div><hr><div class="hypo-advice"><strong>ไม่ควรฉีดอินซูลินในตอนนี้</strong><p>โปรดจัดการภาวะน้ำตาลต่ำตามคำแนะนำของแพทย์ (เช่น ทานของหวาน 15-20 กรัมคาร์บ)</p></div>`;
        resultsBox.classList.add('hypo-warning');
    } else {
        const carbBolus = ICR > 0 ? (totalCarb / ICR) : 0;
        const correctionBolus = (CBG > TBG && ISF > 0) ? (CBG - TBG) / ISF : 0;
        const totalBolus = Math.max(0, carbBolus) + Math.max(0, correctionBolus);
        const roundedTotalBolus = Math.round(totalBolus * 2) / 2;

        resultsBox.innerHTML = `<p>ส่วนที่ 1: อินซูลินสำหรับคุมอาหาร: <span class="result-value">${Math.max(0, carbBolus).toFixed(1)}</span> ยูนิต</p><p>ส่วนที่ 2: อินซูลินสำหรับแก้ไขน้ำตาลสูง: <span class="result-value">${Math.max(0, correctionBolus).toFixed(1)}</span> ยูนิต</p><hr><div class="total-dose">สรุปแล้ว มื้อนี้คุณต้องฉีด:</div><div class="final-display"><span class="final-dose-value">${roundedTotalBolus.toFixed(1)}</span><span class="unit-text">ยูนิต</span></div>`;

        saveToHistory({
            date: new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short'}),
            cbg: CBG,
            totalCarb: totalCarb,
            totalBolus: roundedTotalBolus.toFixed(1)
        });
    }

    resultsBox.style.display = 'block';
    resultsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --- App Initialization ---
window.onload = () => {
    loadTheme();
    showPage('calculatorPage', document.querySelector('.nav-link'));
    loadPersonalFactors();
    favoriteFoods = JSON.parse(localStorage.getItem('favoriteFoods')) || [];
    loadHistory();
    loadFoodData();

    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    const searchInput = document.getElementById('food-search');
    searchInput.addEventListener('input', debounce(filterFoodList, 300));
};