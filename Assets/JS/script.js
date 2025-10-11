// --- ฐานข้อมูลอาหาร (ไม่มีการเปลี่ยนแปลง) ---
const foodDatabase = {"ข้าว แป้ง และผลิตภัณฑ์":{carbPerUnitBase:18,mode:"CarbUnit",items:[{name:"ข้าวสวย (หุงสุก)",baseUnits:1,unit:"ทัพพี"},{name:"ขนมปังขาว",baseUnits:1,unit:"แผ่น"},{name:"เส้นก๋วยเตี๋ยว (เล็ก/ใหญ่)",baseUnits:2.5,unit:"ถ้วย"},{name:"บะหมี่กึ่งสำเร็จรูป",baseUnits:2.7,unit:"ห่อ"},{name:"มันฝรั่งทอด (เฟรนช์ฟรายส์)",baseUnits:1.1,unit:"10 ชิ้น"}]},"ผลไม้":{carbPerUnitBase:18,mode:"CarbUnit",items:[{name:"กล้วยหอม",baseUnits:1.4,unit:"ลูกกลาง"},{name:"แอปเปิ้ลเขียว",baseUnits:0.8,unit:"ผลเล็ก"},{name:"ส้ม",baseUnits:0.8,unit:"ผลกลาง"},{name:"มะม่วงสุก (น้ำดอกไม้)",baseUnits:1.7,unit:"ครึ่งลูก"}]},"ผักที่มีแป้ง (ที่ต้องนับคาร์บ)":{carbPerUnitBase:18,mode:"CarbUnit",items:[{name:"ข้าวโพดต้ม",baseUnits:0.8,unit:"ฝักเล็ก"},{name:"มันเทศ/มันสำปะหลัง (ต้ม)",baseUnits:1.4,unit:"100 กรัม"},{name:"ฟักทอง (นึ่ง)",baseUnits:0.8,unit:"1/2 ถ้วย"},{name:"แครอทต้ม",baseUnits:0.6,unit:"1 ถ้วย"}]},"ขนมหวานและเบเกอรี่":{carbPerUnitBase:18,mode:"CarbUnit",items:[{name:"เค้กชิ้นเล็ก",baseUnits:2,unit:"ชิ้น"},{name:"ไอศกรีม (วานิลลา)",baseUnits:1.1,unit:"1 สกู๊ป"},{name:"ทองหยิบ/ฝอยทอง",baseUnits:0.8,unit:"1 ชิ้น"}]},"อาหารจานเดียว":{carbPerUnitBase:18,mode:"CarbUnit",items:[{name:"ข้าวผัดหมู",baseUnits:4.5,unit:"จาน"},{name:"ก๋วยเตี๋ยว (น้ำ/แห้ง)",baseUnits:4,unit:"ชาม"},{name:"ผัดไทย",baseUnits:4,unit:"จาน"},{name:"โจ๊ก/ข้าวต้ม",baseUnits:2,unit:"ชาม"}]},"เครื่องดื่ม":{carbPerUnitBase:18,mode:"CarbUnit",items:[{name:"น้ำอัดลม (มีน้ำตาล)",baseUnits:2.2,unit:"กระป๋อง"},{name:"น้ำผลไม้กล่อง (100%)",baseUnits:1.7,unit:"กล่อง"},{name:"ชา/กาแฟ (หวานน้อย)",baseUnits:0.6,unit:"แก้ว"}]},"เครื่องปรุงรส":{carbPerUnitBase:18,mode:"CarbUnit",items:[{name:"น้ำจิ้มไก่/น้ำปลาหวาน",baseUnits:0.8,unit:"1 ช้อนโต๊ะ"},{name:"ซอสมะเขือเทศ",baseUnits:0.3,unit:"1 ช้อนโต๊ะ"}]},"นมและผลิตภัณฑ์จากนม":{carbPerUnitBase:12,mode:"DirectCarb",items:[{name:"นมสดจืด",carbPerServe:12,unit:"กล่อง/แก้ว (200มล.)"},{name:"นมข้นจืด 2%",carbPerServe:20,unit:"1/2 ถต. (120 มล.)"},{name:"โยเกิร์ตรสธรรมชาติ",carbPerServe:10,unit:"ถ้วยเล็ก"}]},"อาหารไม่มีคาร์บ":{carbPerUnitBase:0,mode:"DirectCarb",items:[{name:"เนื้อสัตว์ (หมู ไก่ ปลา)",carbPerServe:0,unit:"100 กรัม"},{name:"ไข่ต้ม/ไข่ดาว",carbPerServe:0,unit:"ฟอง"},{name:"ผักใบเขียว (ต้ม/ลวก)",carbPerServe:5,unit:"1 ถ้วย"}]}};

// --- ตัวแปร Global ---
let TDD = 0, ICR = 0, ISF = 0;
let selectedFoods = [];
const allFoodItems = [];

// --- ฟังก์ชันจัดการ UI (Tabs, Accordion) ---
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

// --- ฟังก์ชันเริ่มต้นและจัดการข้อมูลอาหาร ---
function initializeFoodList() {
    const foodListDiv = document.getElementById('food-selection-tables');
    const foodDatalist = document.getElementById('food-options');
    foodListDiv.innerHTML = '';
    foodDatalist.innerHTML = '';
    let foodIdCounter = 0;

    for (const category in foodDatabase) {
        const categoryData = foodDatabase[category];
        let accordionHtml = `<div class="accordion-item"><button class="accordion-header" onclick="toggleAccordion(this)"><span>${category}</span><span class="icon">+</span></button><div class="accordion-content"><table class="food-table"><thead><tr><th>รายการ</th><th>คาร์บ</th><th>หน่วย</th><th>เพิ่ม</th></tr></thead><tbody>`;

        categoryData.items.forEach(food => {
            const foodUniqueId = `food-item-${foodIdCounter++}`;
            const carbPerServe = categoryData.mode === "CarbUnit" ? food.baseUnits * categoryData.carbPerUnitBase : food.carbPerServe;
            const displayValue = categoryData.mode === "CarbUnit" ? `${food.baseUnits.toFixed(1)} CU` : `${carbPerServe.toFixed(0)} g`;

            allFoodItems.push({ name: food.name, carbPerServe, unit: food.unit, itemDomId: foodUniqueId });

            const option = document.createElement('option');
            option.value = `${food.name} (${carbPerServe.toFixed(0)}g / ${food.unit})`;
            option.dataset.value = `${food.name}|${carbPerServe}|${food.unit}|${foodUniqueId}`;
            foodDatalist.appendChild(option);

            accordionHtml += `<tr id="${foodUniqueId}"><td data-label="รายการ">${food.name}</td><td data-label="คาร์บ">${displayValue}</td><td data-label="หน่วย">${food.unit}</td><td data-label="เพิ่ม"><button class="add-btn" onclick="addFoodToSelection('${food.name}', ${carbPerServe}, '${food.unit}', '${foodUniqueId}')">เพิ่ม</button></td></tr>`;
        });
        accordionHtml += `</tbody></table></div></div>`;
        foodListDiv.insertAdjacentHTML('beforeend', accordionHtml);
    }
}

// --- ฟังก์ชันจัดการรายการอาหารที่เลือก ---
function addFoodByDatalist(inputElement) {
    const selectedLabel = inputElement.value;
    if (!selectedLabel) return;
    const selectedOption = Array.from(document.getElementById('food-options').options).find(opt => opt.value === selectedLabel);
    if (selectedOption) {
        const [name, carb, unit, id] = selectedOption.dataset.value.split('|');
        addFoodToSelection(name, parseFloat(carb), unit, id);
    }
    inputElement.value = '';
}

function addFoodToSelection(name, carbPerServe, unit, itemDomId) {
    const existingFood = selectedFoods.find(food => food.itemDomId === itemDomId && itemDomId !== null);
    if (existingFood) {
        existingFood.servings += 1;
    } else {
        selectedFoods.push({ id: Date.now(), name, carbPerServe, unit, servings: 1, itemDomId });
    }
    if (itemDomId) document.getElementById(itemDomId).style.display = 'none';
    renderSelectedFoods();
}

function addCustomFood() {
    const nameInput = document.getElementById('custom-food-name');
    const carbInput = document.getElementById('custom-food-carbs');
    if (validateInput(nameInput, true) && validateInput(carbInput)) {
        addFoodToSelection(nameInput.value, parseFloat(carbInput.value), 'กำหนดเอง', null);
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
    let tableHtml = `<table class="selection-table"><thead><tr><th>รายการอาหาร</th><th>จำนวน</th><th>คาร์บรวม (g)</th><th>ลบ</th></tr></thead><tbody>`;
    selectedFoods.forEach(food => {
        const totalCarb = food.servings * food.carbPerServe;
        tableHtml += `<tr><td data-label="รายการ">${food.name} (${food.carbPerServe.toFixed(0)}g / ${food.unit})</td><td data-label="จำนวน"><input type="number" value="${food.servings}" min="0" step="0.25" oninput="updateServings(${food.id}, this.value)"></td><td data-label="คาร์บรวม">${totalCarb.toFixed(0)}</td><td data-label="ลบ"><button class="remove-btn" onclick="removeFood(${food.id})">X</button></td></tr>`;
    });
    listDiv.innerHTML = tableHtml + `</tbody></table>`;
    updateTotalCarb();
}

function updateTotalCarb() {
    const total = selectedFoods.reduce((sum, food) => sum + (food.servings * food.carbPerServe), 0);
    document.getElementById('total-carb-value').textContent = total.toFixed(0);
    return total;
}

// --- ฟังก์ชันการคำนวณหลัก ---
function validateInput(element, allowText = false) {
    element.classList.remove('input-error');
    const value = allowText ? element.value.trim() : parseFloat(element.value);
    if (allowText ? value === '' : isNaN(value) || value <= 0) {
        element.classList.add('input-error');
        return false;
    }
    return true;
}

function calculatePersonalFactors() {
    const weightEl = document.getElementById('weight');
    if (!validateInput(weightEl)) return;

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
        return;
    }
    const cbgEl = document.getElementById('cbg');
    const tbgEl = document.getElementById('tbg');
    const warningBox = document.getElementById('safety-warning');
    const resultsBox = document.getElementById('bolus-results');

    resultsBox.style.display = 'none';
    warningBox.style.display = 'none';

    if (!validateInput(cbgEl) || !validateInput(tbgEl)) return;

    const CBG = parseFloat(cbgEl.value);
    const TBG = parseFloat(tbgEl.value);
    const totalCarb = updateTotalCarb();

    // 🚨 ระบบความปลอดภัย: ตรวจสอบภาวะน้ำตาลต่ำ
    if (CBG < 70) {
        warningBox.innerHTML = `<strong>🚨 ระดับน้ำตาลต่ำ! (${CBG} mg/dL)</strong><br>ไม่ควรฉีดอินซูลินในตอนนี้ โปรดจัดการภาวะน้ำตาลต่ำตามคำแนะนำของแพทย์ (เช่น ทานของหวาน 15-20 กรัมคาร์บ)`;
        warningBox.style.display = 'block';
        return;
    }

    const carbBolus = ICR > 0 ? (totalCarb / ICR) : 0;
    const correctionBolus = (CBG > TBG && ISF > 0) ? (CBG - TBG) / ISF : 0;

    const totalBolus = Math.max(0, carbBolus) + Math.max(0, correctionBolus);
    // ปัดเศษให้ใกล้เคียง 0.5 ที่สุด (เช่น 1.2 -> 1.0, 1.3 -> 1.5, 1.7 -> 1.5, 1.8 -> 2.0)
    const roundedTotalBolus = Math.round(totalBolus * 2) / 2;

    document.getElementById('carb-bolus-value').textContent = Math.max(0, carbBolus).toFixed(1);
    document.getElementById('correction-bolus-value').textContent = Math.max(0, correctionBolus).toFixed(1);
    document.getElementById('total-bolus-value').textContent = roundedTotalBolus.toFixed(1);

    resultsBox.style.display = 'block';
    resultsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --- เริ่มต้นการทำงานเมื่อโหลดหน้าเว็บ ---
window.onload = () => {
    initializeFoodList();
};