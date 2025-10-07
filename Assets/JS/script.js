// --- 1. ฐานข้อมูลอาหาร (รองรับ 2 โหมด: Carb Unit และ Direct Carb) ---
const foodDatabase = {
    // ------------------------------------------------------------------------------------------------
    // โหมด 1: CarbUnit (ต้องนำ baseUnits * carbPerUnitBase เพื่อหากรัมคาร์บต่อเสิร์ฟ)
    // ------------------------------------------------------------------------------------------------
    "ข้าว แป้ง และผลิตภัณฑ์": {
        carbPerUnitBase: 18, // 1 หน่วยคาร์บ = 18 กรัมคาร์บ
        mode: "CarbUnit",
        items: [
            // baseUnits คือจำนวนหน่วยคาร์บที่มีใน 1 หน่วยเสิร์ฟ (unit)
            { name: "ข้าวสวย (หุงสุก)", baseUnits: 1, unit: "ทัพพี" },
            { name: "ขนมปังขาว", baseUnits: 1, unit: "แผ่น" },
            { name: "เส้นก๋วยเตี๋ยว (เล็ก/ใหญ่)", baseUnits: 2.5, unit: "ถ้วย" },
            { name: "บะหมี่กึ่งสำเร็จรูป", baseUnits: 2.7, unit: "ห่อ" },
            { name: "มันฝรั่งทอด (เฟรนช์ฟรายส์)", baseUnits: 1.1, unit: "10 ชิ้น" }
        ]
    },
    "ผลไม้": {
        carbPerUnitBase: 18,
        mode: "CarbUnit",
        items: [
            { name: "กล้วยหอม", baseUnits: 1.4, unit: "ลูกกลาง" },
            { name: "แอปเปิ้ลเขียว", baseUnits: 0.8, unit: "ผลเล็ก" },
            { name: "ส้ม", baseUnits: 0.8, unit: "ผลกลาง" },
            { name: "มะม่วงสุก (น้ำดอกไม้)", baseUnits: 1.7, unit: "ครึ่งลูก" }
        ]
    },
    "ผักที่มีแป้ง (ที่ต้องนับคาร์บ)": {
        carbPerUnitBase: 18,
        mode: "CarbUnit",
        items: [
            { name: "ข้าวโพดต้ม", baseUnits: 0.8, unit: "ฝักเล็ก" },
            { name: "มันเทศ/มันสำปะหลัง (ต้ม)", baseUnits: 1.4, unit: "100 กรัม" },
            { name: "ฟักทอง (นึ่ง)", baseUnits: 0.8, unit: "1/2 ถ้วย" },
            { name: "แครอทต้ม", baseUnits: 0.6, unit: "1 ถ้วย" }
        ]
    },
    "ขนมหวานและเบเกอรี่": {
        carbPerUnitBase: 18,
        mode: "CarbUnit",
        items: [
            { name: "เค้กชิ้นเล็ก", baseUnits: 2, unit: "ชิ้น" },
            { name: "ไอศกรีม (วานิลลา)", baseUnits: 1.1, unit: "1 สกู๊ป" },
            { name: "ทองหยิบ/ฝอยทอง", baseUnits: 0.8, unit: "1 ชิ้น" }
        ]
    },
    "อาหารจานเดียว": {
        carbPerUnitBase: 18,
        mode: "CarbUnit",
        items: [
            { name: "ข้าวผัดหมู", baseUnits: 4.5, unit: "จาน" },
            { name: "ก๋วยเตี๋ยว (น้ำ/แห้ง)", baseUnits: 4, unit: "ชาม" },
            { name: "ผัดไทย", baseUnits: 4, unit: "จาน" },
            { name: "โจ๊ก/ข้าวต้ม", baseUnits: 2, unit: "ชาม" }
        ]
    },
    "เครื่องดื่ม": {
        carbPerUnitBase: 18,
        mode: "CarbUnit",
        items: [
            { name: "น้ำอัดลม (มีน้ำตาล)", baseUnits: 2.2, unit: "กระป๋อง" },
            { name: "น้ำผลไม้กล่อง (100%)", baseUnits: 1.7, unit: "กล่อง" },
            { name: "ชา/กาแฟ (หวานน้อย)", baseUnits: 0.6, unit: "แก้ว" }
        ]
    },
    "เครื่องปรุงรส": {
        carbPerUnitBase: 18,
        mode: "CarbUnit",
        items: [
            { name: "น้ำจิ้มไก่/น้ำปลาหวาน", baseUnits: 0.8, unit: "1 ช้อนโต๊ะ" },
            { name: "ซอสมะเขือเทศ", baseUnits: 0.3, unit: "1 ช้อนโต๊ะ" }
        ]
    },

    // ------------------------------------------------------------------------------------------------
    // โหมด 2: DirectCarb (ระบุกรัมคาร์บต่อเสิร์ฟโดยตรง)
    // ------------------------------------------------------------------------------------------------
    "นมและผลิตภัณฑ์จากนม": {
        carbPerUnitBase: 12, // ค่าฐาน 12g/Carb Unit (ใช้สำหรับการอ้างอิงเท่านั้นในโหมดนี้)
        mode: "DirectCarb",
        items: [
            // carbPerServe คือ กรัมคาร์บต่อ 1 หน่วยเสิร์ฟ (unit)
            { name: "นมสดจืด", carbPerServe: 12, unit: "กล่อง/แก้ว (200มล.)" },
            { name: "นมข้นจืด 2%", carbPerServe: 20, unit: "1/2 ถต. (120 มล.)" },
            { name: "โยเกิร์ตรสธรรมชาติ", carbPerServe: 10, unit: "ถ้วยเล็ก" }
        ]
    },
    "อาหารไม่มีคาร์บ": {
        carbPerUnitBase: 0,
        mode: "DirectCarb",
        items: [
            { name: "เนื้อสัตว์ (หมู ไก่ ปลา)", carbPerServe: 0, unit: "100 กรัม" },
            { name: "ไข่ต้ม/ไข่ดาว", carbPerServe: 0, unit: "ฟอง" },
            { name: "ผักใบเขียว (ต้ม/ลวก)", carbPerServe: 5, unit: "1 ถ้วย" }
        ]
    }
};

// --- 2. ตัวแปรสำหรับจัดเก็บค่าที่คำนวณได้ ---
let TDD = 0;
let ICR = 0;
let ISF = 0;
let selectedFoods = [];
const allFoodItems = [];


// --- 3. ฟังก์ชันเริ่มต้น: สร้างรายการอาหารในรูปแบบ Accordion และ Datalist ---
function initializeFoodList() {
    const foodListDiv = document.getElementById('food-selection-tables');
    foodListDiv.innerHTML = '';

    let foodIdCounter = 0;

    for (const category in foodDatabase) {
        const categoryData = foodDatabase[category];
        const foodItems = categoryData.items;
        const carbPerUnitBase = categoryData.carbPerUnitBase;
        const mode = categoryData.mode || "CarbUnit";

        // สร้าง Header ตาม Mode
        let headerNote = "";
        let displayHeader = "";

        if (mode === "CarbUnit") {
             headerNote = `1 คาร์บยูนิต = ${carbPerUnitBase.toFixed(0)}g คาร์บ`;
             displayHeader = 'หน่วยคาร์บ/หน่วยเสิร์ฟ';
        } else {
             headerNote = `ระบุกรัมคาร์บต่อหน่วยเสิร์ฟ`;
             displayHeader = 'คาร์บ/หน่วยเสิร์ฟ (g)';
        }

        let accordionHtml = `
            <div class="accordion-item" id="cat-${category.replace(/[^a-zA-Z0-9]/g, '')}">
                <button class="accordion-header" onclick="toggleAccordion(this)">
                    <div class="header-content">
                        <span class="category-name">${category}</span>
                        <span class="header-note">(${headerNote})</span>
                    </div>
                    <span class="icon">+</span>
                </button>
                <div class="accordion-content">
                    <table class="food-table">
                        <thead>
                            <tr>
                                <th style="width: 40%;">รายการอาหาร</th>
                                <th style="width: 20%;">${displayHeader}</th>
                                <th style="width: 20%;">หน่วยเสิร์ฟ</th>
                                <th style="width: 20%;">เพิ่มรายการ</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        foodItems.forEach((food) => {
            const foodUniqueId = `food-item-${foodIdCounter++}`;
            let carbPerServe = 0;
            let displayValue = "";

            if (mode === "CarbUnit") {
                // โหมด CarbUnit: คำนวณ carbPerServe จาก baseUnits * carbPerUnitBase
                carbPerServe = food.baseUnits * carbPerUnitBase;
                displayValue = `${food.baseUnits.toFixed(1)} คาร์บยูนิต`;
            } else {
                // โหมด DirectCarb: ใช้ carbPerServe ที่ระบุมาโดยตรง
                carbPerServe = food.carbPerServe;
                displayValue = `${food.carbPerServe.toFixed(0)} กรัม`;
            }


            allFoodItems.push({
                name: food.name,
                carbPerServe: carbPerServe, // g คาร์บ/หน่วยเสิร์ฟ (มาตรฐานเดียว)
                unit: food.unit,
                category: category,
                itemLabel: `${category} - ${food.name} (${carbPerServe.toFixed(0)}g / ${food.unit})`,
                itemValue: `${food.name}|${carbPerServe}|${food.unit}|${foodUniqueId}`
            });

            accordionHtml += `
                <tr id="${foodUniqueId}">
                    <td data-label="รายการ" class="food-name-cell">${food.name}</td>
                    <td data-label="${displayHeader}">${displayValue}</td>
                    <td data-label="หน่วยเสิร์ฟ">${food.unit}</td>
                    <td data-label="เพิ่ม">
                        <button class="add-btn"
                                onclick="addFoodToSelection('${food.name}', ${carbPerServe}, '${food.unit}', '${foodUniqueId}')">
                            เพิ่ม
                        </button>
                    </td>
                </tr>
            `;
        });

        accordionHtml += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        foodListDiv.insertAdjacentHTML('beforeend', accordionHtml);
    }
    initializeSearchDatalist();
    document.querySelectorAll('.accordion-content').forEach(item => {
        item.style.maxHeight = null;
    });
}

// ฟังก์ชันสร้าง Options สำหรับ Datalist
function initializeSearchDatalist() {
    const foodDatalist = document.getElementById('food-options');
    foodDatalist.innerHTML = '';

    allFoodItems.forEach(food => {
        const option = document.createElement('option');
        option.value = food.itemLabel;
        option.setAttribute('data-value', food.itemValue);
        foodDatalist.appendChild(option);
    });
}


// ฟังก์ชันเปิด-ปิด Accordion
function toggleAccordion(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.icon');

    document.querySelectorAll('.accordion-content').forEach(item => {
        if (item !== content) {
            item.style.maxHeight = null;
            const otherIcon = item.previousElementSibling.querySelector('.icon');
            if(otherIcon) otherIcon.textContent = '+';
        }
    });

    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        icon.textContent = '+';
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
        icon.textContent = '–';
    }

    document.getElementById('food-search').value = '';
    filterFoodList();
}

// ฟังก์ชันค้นหารายการอาหาร (กรอง Accordion เมื่อพิมพ์)
function filterFoodList() {
    const searchInput = document.getElementById('food-search');
    const filter = searchInput.value.toLowerCase();
    const tableRows = document.querySelectorAll('#food-selection-tables .food-table tbody tr');
    const datalistOptions = document.querySelectorAll('#food-options option');

    tableRows.forEach(row => {
        const foodName = row.querySelector('.food-name-cell').textContent.toLowerCase();
        const isSelected = selectedFoods.some(food => food.itemDomId === row.id);

        if (!isSelected && (filter.length === 0 || foodName.includes(filter))) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    // 🔴 แก้ไข: การจัดการ Datalist Options
    // แสดงเฉพาะตัวที่ยังไม่ได้เลือกและมีค่าตรงกับที่พิมพ์
    datalistOptions.forEach(option => {
        const itemValue = option.getAttribute('data-value');
        const itemDomId = itemValue.split('|')[3];
        const foodName = option.value.toLowerCase();

        const isSelected = selectedFoods.some(food => food.itemDomId === itemDomId);

        if (isSelected || (filter.length > 0 && !foodName.includes(filter))) {
             option.style.display = 'none';
        } else {
             option.style.display = '';
        }
    });
}


// ฟังก์ชันเพิ่มอาหารจากการเลือก Dropdown (Datalist)
function addFoodByDatalist(inputElement) {
    const selectedLabel = inputElement.value;
    inputElement.value = '';

    if (!selectedLabel) return;

    const foodDatalist = document.getElementById('food-options');
    const selectedOption = Array.from(foodDatalist.options).find(option => option.value === selectedLabel);

    if (!selectedOption) return;

    const itemValue = selectedOption.getAttribute('data-value');
    if (!itemValue) return;

    // รับ 4 ค่า: name, carbPerServe (กรัมคาร์บ), unit, itemDomId
    const [name, carbPerServeStr, unit, itemDomId] = itemValue.split('|');
    const carbPerServe = parseFloat(carbPerServeStr);

    addFoodToSelection(name, carbPerServe, unit, itemDomId);

    // หลังเพิ่มแล้ว ให้ซ่อน/กรองรายการนั้นๆ ทั้งใน datalist และตาราง
    filterFoodList();
}


// --- 4. ฟังก์ชันเพิ่มรายการอาหารที่ถูกเลือกเข้าสู่ Selected List (หลัก) ---
function addFoodToSelection(name, carbPerServe, unit, itemDomId) {
    const existingFood = selectedFoods.find(food => food.itemDomId === itemDomId);

    if (existingFood) {
        existingFood.servings += 1;
    } else {
        const uniqueId = Date.now();
        selectedFoods.push({
            id: uniqueId,
            name: name,
            carbPerServe: carbPerServe, // g คาร์บต่อ 1 หน่วยเสิร์ฟ
            unit: unit,
            servings: 1,
            itemDomId: itemDomId // ใช้สำหรับอ้างอิงกลับไปยัง DOM ต้นฉบับ
        });

        // ซ่อนรายการที่ถูกเลือกแล้วในตาราง
        hideFoodItem(itemDomId, true);
    }

    renderSelectedFoods();
    updateTotalCarb();
    filterFoodList();
}


// ฟังก์ชันซ่อน/แสดงแถวอาหารในตารางหลัก
function hideFoodItem(domId, shouldHide) {
    const item = document.getElementById(domId);
    if (item) {
        item.style.display = shouldHide ? 'none' : '';
    }
}


// --- 5. ฟังก์ชันลบรายการอาหารที่ถูกเลือก ---
function removeFood(id) {
    const foodToRemove = selectedFoods.find(food => food.id === id);
    if (foodToRemove) {
        // แสดงรายการอาหารนั้นกลับคืนในตารางหลัก
        hideFoodItem(foodToRemove.itemDomId, false);
    }

    selectedFoods = selectedFoods.filter(food => food.id !== id);
    renderSelectedFoods();
    updateTotalCarb();

    // กรองรายการ datalist/ตารางใหม่
    filterFoodList();
}


// อัปเดตการคำนวณคาร์บรวมของรายการนั้นๆ ในตารางแบบ Real-time
function updateServings(id, inputElement) {
    const servings = parseFloat(inputElement.value) || 0;
    const foodIndex = selectedFoods.findIndex(food => food.id === id);
    if (foodIndex !== -1) {
        selectedFoods[foodIndex].servings = servings;

        // คำนวณคาร์บรวม: จำนวนเสิร์ฟ x g คาร์บ/หน่วยเสิร์ฟ
        const totalCarbElement = inputElement.closest('tr').querySelector('.carb-per-item');
        if (totalCarbElement) {
             const totalCarbForFood = (servings * selectedFoods[foodIndex].carbPerServe);
             totalCarbElement.textContent = totalCarbForFood.toFixed(0);
        }
    }
    updateTotalCarb();
}


// แสดงผล g คาร์บ/หน่วยเสิร์ฟ
function renderSelectedFoods() {
    const selectedListDiv = document.getElementById('selected-food-list');
    if (selectedFoods.length === 0) {
        selectedListDiv.innerHTML = '<p class="no-selection-msg">ยังไม่ได้เลือกอาหาร โปรดเลือกจากตารางด้านบน</p>';
        return;
    }
    let listHtml = `
        <table class="selection-table">
            <thead>
                <tr>
                    <th style="width: 40%;">รายการอาหาร</th>
                    <th style="width: 25%;">จำนวน (หน่วยเสิร์ฟ)</th>
                    <th style="width: 20%;">คาร์บรวม (g)</th>
                    <th style="width: 15%;">ลบ</th>
                </tr>
            </thead>
            <tbody>
    `;
    selectedFoods.forEach(food => {
        // คำนวณคาร์บรวม: จำนวนเสิร์ฟ x g คาร์บ/หน่วยเสิร์ฟ
        const totalCarbForFood = (food.servings * food.carbPerServe);

        // แสดงปริมาณ g คาร์บต่อหน่วยในวงเล็บ
        listHtml += `
            <tr>
                <td data-label="รายการ">${food.name} (${food.carbPerServe.toFixed(0)}g/${food.unit})</td>
                <td data-label="จำนวน">
                    <input type="number"
                           value="${food.servings}"
                           min="0" step="0.5"
                           oninput="updateServings(${food.id}, this)">
                </td>
                <td data-label="คาร์บรวม">
                    <span class="carb-per-item">${totalCarbForFood.toFixed(0)}</span>
                </td>
                <td data-label="ลบ">
                    <button class="remove-btn" onclick="removeFood(${food.id})">X</button>
                </td>
            </tr>
        `;
    });
    listHtml += `</tbody></table>`;
    selectedListDiv.innerHTML = listHtml;
}


// คำนวณคาร์บรวมใหม่
function updateTotalCarb() {
    let totalCarb = 0;
    selectedFoods.forEach(food => {
        totalCarb += food.servings * food.carbPerServe;
    });
    document.getElementById('total-carb-value').textContent = totalCarb.toFixed(0);
    return totalCarb;
}

// --- 6. ฟังก์ชันคำนวณอินซูลิน ---
function calculatePersonalFactors() {
    const weight = parseFloat(document.getElementById('weight').value);
    const multiplier = parseFloat(document.getElementById('age-group').value);
    const insulinRule = parseFloat(document.getElementById('insulin-type').value);
    if (isNaN(weight) || weight <= 0) {
        alert("กรุณากรอกน้ำหนักตัวให้ถูกต้อง");
        return;
    }
    TDD = weight * multiplier;
    // ICR (Insulin to Carb Ratio) = 500 / TDD
    ICR = 500 / TDD;
    // ISF (Insulin Sensitivity Factor) = 1800 หรือ 1500 / TDD
    ISF = insulinRule / TDD;
    document.getElementById('tdd-value').textContent = TDD.toFixed(1);
    document.getElementById('icr-value').textContent = ICR.toFixed(1);
    document.getElementById('isf-value').textContent = ISF.toFixed(1);
    document.getElementById('meal-calculation').style.display = 'block';
}

function calculateBolus() {
    if (TDD === 0) {
        alert("กรุณาคำนวณค่าส่วนตัว (ICR และ ISF) ก่อนในขั้นตอนที่ 1");
        return;
    }
    const CBG = parseFloat(document.getElementById('cbg').value);
    const totalCarb = updateTotalCarb();
    const TBG = parseFloat(document.getElementById('tbg').value);
    const carbBolus = totalCarb / ICR;
    let correctionBolus = 0;
    if (CBG > TBG) {
        correctionBolus = (CBG - TBG) / ISF;
    }
    const totalBolus = carbBolus + correctionBolus;
    // ปัดเศษให้เป็นครึ่งยูนิตที่ใกล้ที่สุด
    const roundedTotalBolus = Math.round(totalBolus * 2) / 2;
    document.getElementById('carb-bolus-value').textContent = carbBolus.toFixed(1);
    document.getElementById('correction-bolus-value').textContent = correctionBolus.toFixed(1);
    document.getElementById('total-bolus-value').textContent = roundedTotalBolus.toFixed(1);
}


// --- 7. Setup (Load & Event Listeners) ---
function setupSearchHandlers() {
    const searchInput = document.getElementById('food-search');

    searchInput.addEventListener('focus', () => {
        // เมื่อ focus ที่ช่องค้นหา ให้แสดง datalist option ที่ยังไม่ถูกเลือกทั้งหมด
        filterFoodList();
    });
}

window.onload = () => {
    initializeFoodList();
    // 🔴 แก้ไข: เรียก filterFoodList เพื่อกรองรายการที่ซ่อนไว้เริ่มต้น
    filterFoodList();
    setupSearchHandlers();
};