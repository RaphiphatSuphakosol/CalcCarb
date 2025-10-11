let TDD = 0, ICR = 0, ISF = 0;
let selectedFoods = [];
const allFoodItems = [];
let foodDatabase = {};

function showPage(pageId, navLink) {
    document.querySelectorAll('.main-page').forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    navLink.classList.add('active');
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
    document.querySelectorAll('.accordion-content').forEach(item => item.style.maxHeight = null);
    document.querySelectorAll('.accordion-header .icon').forEach(icon => icon.textContent = '+');
    if (!isActive) {
        content.style.maxHeight = content.scrollHeight + "px";
        header.querySelector('.icon').textContent = '–';
    }
}

async function loadFoodData() {
    try {
        const response = await fetch('Assets/Data/foodData.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        foodDatabase = await response.json();
        initializeFoodList();
    } catch (error) {
        console.error('Error loading food data:', error);
        alert('ไม่สามารถโหลดฐานข้อมูลอาหารได้ โปรดลองอีกครั้ง');
    }
}

function initializeFoodList() {
    const foodListDiv = document.getElementById('food-selection-tables');
    const foodDatalist = document.getElementById('food-options');
    foodListDiv.innerHTML = '';
    foodDatalist.innerHTML = '';
    let foodIdCounter = 0;

    for (const category in foodDatabase) {
        const categoryData = foodDatabase[category];
        let accordionHtml = `<div class="accordion-item"><button class="accordion-header" onclick="toggleAccordion(this)"><span>${category}</span><span class="icon">+</span></button><div class="accordion-content"><table class="food-table"><thead><tr><th style="width:35%">รายการ</th><th style="width:20%">คาร์บ</th><th style="width:15%">หน่วย</th><th style="width:15%">ดูรูป</th><th style="width:15%">เพิ่ม</th></tr></thead><tbody>`;

        categoryData.items.forEach(food => {
            const foodUniqueId = `food-item-${foodIdCounter++}`;
            const carbPerServe = categoryData.mode === "CarbUnit" ? food.baseUnits * categoryData.carbPerUnitBase : food.carbPerServe;
            const displayValue = categoryData.mode === "CarbUnit" ? `${food.baseUnits.toFixed(1)} CU` : `${carbPerServe.toFixed(0)} g`;
            
            let imageButtonHtml = '';
            if (food.imageUrl) {
                imageButtonHtml = `<button class="view-image-btn" onclick="openModal('${food.imageUrl}', '${food.caption}')">📸</button>`;
            }

            allFoodItems.push({ name: food.name, carbPerServe, unit: food.unit, itemDomId: foodUniqueId, imageUrl: food.imageUrl, caption: food.caption });
            
            const option = document.createElement('option');
            option.value = `${food.name} (${carbPerServe.toFixed(0)}g / ${food.unit})`;
            option.dataset.value = `${food.name}|${carbPerServe}|${food.unit}|${foodUniqueId}|${food.imageUrl || ''}|${food.caption || ''}`;
            foodDatalist.appendChild(option);

            accordionHtml += `<tr id="${foodUniqueId}"><td data-label="รายการ">${food.name}</td><td data-label="คาร์บ">${displayValue}</td><td data-label="หน่วย">${food.unit}</td><td data-label="ดูรูป">${imageButtonHtml}</td><td data-label="เพิ่ม"><button class="add-btn" onclick="addFoodToSelection('${food.name}', ${carbPerServe}, '${food.unit}', '${foodUniqueId}', '${food.imageUrl || ''}', '${food.caption || ''}')">เพิ่ม</button></td></tr>`;
        });
        accordionHtml += `</tbody></table></div></div>`;
        foodListDiv.insertAdjacentHTML('beforeend', accordionHtml);
    }
}

function addFoodByDatalist(inputElement) {
    const selectedLabel = inputElement.value;
    if (!selectedLabel) return;
    const selectedOption = Array.from(document.getElementById('food-options').options).find(opt => opt.value === selectedLabel);
    if (selectedOption) {
        const [name, carb, unit, id, imageUrl, caption] = selectedOption.dataset.value.split('|');
        addFoodToSelection(name, parseFloat(carb), unit, id, imageUrl, caption);
    }
    inputElement.value = '';
}

function addFoodToSelection(name, carbPerServe, unit, itemDomId, imageUrl, caption) {
    const existingFood = selectedFoods.find(food => food.itemDomId === itemDomId && itemDomId !== null);
    if (existingFood) {
        existingFood.servings += 1;
    } else {
        selectedFoods.push({ id: Date.now(), name, carbPerServe, unit, servings: 1, itemDomId, imageUrl, caption });
    }
    if (itemDomId) document.getElementById(itemDomId).style.display = 'none';
    renderSelectedFoods();
}

function addCustomFood() {
    const nameInput = document.getElementById('custom-food-name');
    const carbInput = document.getElementById('custom-food-carbs');
    if (validateInput(nameInput, true) && validateInput(carbInput)) {
        addFoodToSelection(nameInput.value, parseFloat(carbInput.value), 'ครั้ง', null, null, null);
        nameInput.value = '';
        carbInput.value = '';
    }
}

function removeFood(id) {
    const foodIndex = selectedFoods.findIndex(food => food.id === id);
    if (foodIndex > -1) {
        const foodToRemove = selectedFoods[foodIndex];
        if (foodToRemove.itemDomId) {
            document.getElementById(foodToRemove.itemDomId).style.display = '';
        }
        selectedFoods.splice(foodIndex, 1);
        renderSelectedFoods();
    }
}

function updateServings(id, value) {
    const food = selectedFoods.find(f => f.id === id);
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

    const weight = parseFloat(weightEl.value);
    const multiplier = parseFloat(document.getElementById('age-group').value);
    const insulinRule = parseFloat(document.getElementById('insulin-type').value);

    TDD = weight * multiplier;
    ICR = TDD > 0 ? 500 / TDD : 0;
    ISF = TDD > 0 ? insulinRule / TDD : 0;

    document.getElementById('tdd-value').textContent = TDD.toFixed(1);
    document.getElementById('icr-value').textContent = ICR.toFixed(1);
    document.getElementById('isf-value').textContent = ISF.toFixed(1);

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

    if (!validateInput(cbgEl)) {
        cbgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (!validateInput(tbgEl)) {
        tbgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const CBG = parseFloat(cbgEl.value);
    const TBG = parseFloat(tbgEl.value);
    const totalCarb = updateTotalCarb();

    if (CBG < 70) {
        resultsBox.classList.add('hypo-warning');
        resultsBox.innerHTML = `<div class="hypo-title">🚨 ระดับน้ำตาลต่ำ! (${CBG} mg/dL)</div><hr><div class="hypo-advice"><strong>ไม่ควรฉีดอินซูลินในตอนนี้</strong><p>โปรดจัดการภาวะน้ำตาลต่ำตามคำแนะนำของแพทย์ (เช่น ทานของหวาน 15-20 กรัมคาร์บ)</p></div>`;
    } else {
        const carbBolus = ICR > 0 ? (totalCarb / ICR) : 0;
        const correctionBolus = (CBG > TBG && ISF > 0) ? (CBG - TBG) / ISF : 0;
        const totalBolus = Math.max(0, carbBolus) + Math.max(0, correctionBolus);
        const roundedTotalBolus = Math.round(totalBolus * 2) / 2;

        resultsBox.innerHTML = `<p>ส่วนที่ 1: อินซูลินสำหรับคุมอาหาร: <span class="result-value">${Math.max(0, carbBolus).toFixed(1)}</span> ยูนิต</p><p>ส่วนที่ 2: อินซูลินสำหรับแก้ไขน้ำตาลสูง: <span class="result-value">${Math.max(0, correctionBolus).toFixed(1)}</span> ยูนิต</p><hr><div class="total-dose">สรุปแล้ว มื้อนี้คุณต้องฉีด:</div><div class="final-display"><span class="final-dose-value">${roundedTotalBolus.toFixed(1)}</span><span class="unit-text">ยูนิต</span></div>`;
    }

    resultsBox.style.display = 'block';
    resultsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

window.onload = () => {
    showPage('calculatorPage', document.querySelector('.nav-link'));
    loadFoodData();
};