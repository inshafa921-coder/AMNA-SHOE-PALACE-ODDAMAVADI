/* ============================================
   AMNA SHOE PALACE - Complete POS System v2.0
   Oddamavadi, Sri Lanka | Mobile + Desktop
   Features: Barcode Scan, Dark/Light Mode, PDF, Reports, Low Stock
   ============================================ */

// =====================
// DATA STORAGE (Local)
// =====================
const DB = {
    products: JSON.parse(localStorage.getItem('amna_products')) || [],
    bills: JSON.parse(localStorage.getItem('amna_bills')) || [],
    categories: JSON.parse(localStorage.getItem('amna_categories')) || [],
    settings: JSON.parse(localStorage.getItem('amna_settings')) || {
        storeName: 'AMNA SHOE PALACE',
        address: 'Main Street, Oddamavadi, Sri Lanka',
        phone: '+94 76 823 6824',
        email: '',
        password: 'admin123',
        openingHoursWeekdays: 'Mon - Sat: 9:00 AM - 9:00 PM',
        openingHoursSunday: 'Sunday: 10:00 AM - 6:00 PM',
        theme: 'dark'
    }
};

let currentBill = [];

// =====================
// UTILITY FUNCTIONS
// =====================
function saveDB() {
    localStorage.setItem('amna_products', JSON.stringify(DB.products));
    localStorage.setItem('amna_bills', JSON.stringify(DB.bills));
    localStorage.setItem('amna_categories', JSON.stringify(DB.categories));
    localStorage.setItem('amna_settings', JSON.stringify(DB.settings));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function generateBarcodeValue() {
    return 'AMNA' + Date.now().toString().slice(-8);
}

function formatPrice(price) {
    return 'Rs. ' + parseFloat(price).toFixed(2);
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function getWeekStart() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

function getMonthStart() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

function getYearStart() {
    return new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
}

function slugify(text) {
    return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// =====================
// THEME MANAGEMENT
// =====================
function initTheme() {
    const theme = DB.settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    DB.settings.theme = next;
    saveDB();
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    btn.innerHTML = theme === 'dark' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
    btn.title = theme === 'dark' ? 'Switch to Light' : 'Switch to Dark';
}

// =====================
// CATEGORY MANAGEMENT
// =====================
function getCategories() {
    return DB.categories;
}

function addCategory(name) {
    if (!name || name.trim() === '') {
        alert('Category name cannot be empty!');
        return false;
    }
    const trimmed = name.trim();
    const slug = slugify(trimmed);
    if (DB.categories.some(c => c.slug === slug)) {
        alert('Category already exists!');
        return false;
    }
    DB.categories.push({
        id: generateId(),
        name: trimmed,
        slug: slug,
        createdAt: new Date().toISOString()
    });
    saveDB();
    return true;
}

function deleteCategory(id) {
    const category = DB.categories.find(c => c.id === id);
    if (!category) return;
    const productsUsing = DB.products.filter(p => p.category === category.slug);
    if (productsUsing.length > 0) {
        if (!confirm('Warning: ' + productsUsing.length + ' product(s) use this category. They will become uncategorized. Delete anyway?')) {
            return;
        }
        productsUsing.forEach(p => p.category = '');
        saveDB();
    }
    DB.categories = DB.categories.filter(c => c.id !== id);
    saveDB();
}

function editCategory(id, newName) {
    if (!newName || newName.trim() === '') {
        alert('Category name cannot be empty!');
        return false;
    }
    const trimmed = newName.trim();
    const newSlug = slugify(trimmed);
    const category = DB.categories.find(c => c.id === id);
    if (!category) return false;
    if (DB.categories.some(c => c.slug === newSlug && c.id !== id)) {
        alert('Category name already exists!');
        return false;
    }
    const oldSlug = category.slug;
    category.name = trimmed;
    category.slug = newSlug;
    DB.products.forEach(p => {
        if (p.category === oldSlug) p.category = newSlug;
    });
    saveDB();
    return true;
}

// =====================
// MOBILE MENU
// =====================
function toggleMobileMenu() {
    const nav = document.getElementById('mobileNav');
    if (nav) nav.classList.toggle('active');
}

document.addEventListener('click', (e) => {
    const nav = document.getElementById('mobileNav');
    const btn = document.querySelector('.mobile-menu-btn');
    if (nav && btn && !nav.contains(e.target) && !btn.contains(e.target)) {
        nav.classList.remove('active');
    }
});

// =====================
// IMAGE HANDLING
// =====================
function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

function previewPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('uploadPlaceholder').style.display = 'none';
        const preview = document.getElementById('photoPreview');
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function clearPhoto() {
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoPreview').src = '';
    document.getElementById('prodPhoto').value = '';
}

// =====================
// CUSTOMER SIDE
// =====================
function initCustomerPage() {
    initTheme();
    renderCategoryFilters();
    renderProducts('all');
    setupFilters();
    setupSearch();
    updateContactInfo();
}

function renderCategoryFilters() {
    const container = document.getElementById('filterButtons');
    if (!container) return;
    const categories = getCategories();
    let html = '<button class="filter-btn active" data-category="all">All</button>';
    categories.forEach(cat => {
        html += '<button class="filter-btn" data-category="' + cat.slug + '">' + cat.name + '</button>';
    });
    container.innerHTML = html;
}

function renderProducts(category, searchTerm = '') {
    const grid = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    if (!grid) return;
    let products = DB.products;
    if (category !== 'all') {
        products = products.filter(p => p.category === category);
    }
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        products = products.filter(p => 
            p.name.toLowerCase().includes(term) ||
            p.brand.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term)
        );
    }
    if (products.length === 0) {
        grid.innerHTML = '';
        if (noProducts) noProducts.style.display = 'block';
        return;
    }
    if (noProducts) noProducts.style.display = 'none';
    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="showProductDetail('${p.id}')">
            <div class="product-image">
                ${p.photo ? '<img src="' + p.photo + '" alt="' + p.name + '">' : '<i class="fas fa-shoe-prints no-image"></i>'}
                <span class="product-badge">${getCategoryName(p.category)}</span>
            </div>
            <div class="product-info">
                <div class="product-brand">${p.brand || 'No Brand'}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-price">${formatPrice(p.price)}</div>
                <div class="product-stock ${p.stock > 0 ? 'in-stock' : 'out-stock'}">
                    <i class="fas fa-${p.stock > 0 ? 'check-circle' : 'times-circle'}"></i>
                    ${p.stock > 0 ? p.stock + ' in stock' : 'Out of stock'}
                </div>
            </div>
        </div>
    `).join('');
}

function getCategoryName(slug) {
    if (!slug) return 'Uncategorized';
    const cat = DB.categories.find(c => c.slug === slug);
    return cat ? cat.name : slug;
}

function setupFilters() {
    const container = document.getElementById('filterButtons');
    if (!container) return;
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const searchVal = document.getElementById('searchInput')?.value || '';
        renderProducts(btn.dataset.category, searchVal);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const activeBtn = document.querySelector('.filter-btn.active');
        renderProducts(activeBtn ? activeBtn.dataset.category : 'all', e.target.value);
    });
}

function showProductDetail(productId) {
    const product = DB.products.find(p => p.id === productId);
    if (!product) return;
    const modal = document.getElementById('productModal');
    const body = document.getElementById('modalBody');
    body.innerHTML = `
        <div class="modal-product-img">
            ${product.photo ? '<img src="' + product.photo + '" alt="' + product.name + '">' : '<i class="fas fa-shoe-prints no-img"></i>'}
        </div>
        <div class="brand">${product.brand || 'No Brand'}</div>
        <h2>${product.name}</h2>
        <div class="price">${formatPrice(product.price)}</div>
        <p class="desc">${product.description || 'No description available.'}</p>
        <div class="barcode-info">
            <i class="fas fa-barcode"></i>
            <span>Barcode: ${product.barcode || 'N/A'}</span>
        </div>
        <a href="https://wa.me/94768236824?text=Hi, I am interested in ${encodeURIComponent(product.name)} - ${encodeURIComponent(formatPrice(product.price))}" 
           target="_blank" class="whatsapp-btn" style="margin-top:15px;width:100%;justify-content:center;">
            <i class="fab fa-whatsapp"></i> Enquire on WhatsApp
        </a>
    `;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function updateContactInfo() {
    const settings = DB.settings;
    const footerPhone = document.querySelector('.glass-footer p:nth-of-type(2)');
    if (footerPhone && settings.phone) {
        footerPhone.innerHTML = '<i class="fas fa-phone"></i> ' + settings.phone;
    }
    const line1 = document.getElementById('openingHoursLine1');
    const line2 = document.getElementById('openingHoursLine2');
    if (line1 && settings.openingHoursWeekdays) line1.textContent = settings.openingHoursWeekdays;
    if (line2 && settings.openingHoursSunday) line2.textContent = settings.openingHoursSunday;
}

if (document.getElementById('productModal')) {
    document.getElementById('productModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    document.querySelector('#productModal .close-modal')?.addEventListener('click', () => {
        document.getElementById('productModal').classList.remove('active');
        document.body.style.overflow = '';
    });
}

// =====================
// ADMIN AUTH
// =====================
function login() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    if (user === 'admin' && pass === DB.settings.password) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'flex';
        initAdminPage();
    } else {
        alert('Invalid username or password!');
    }
}

function logout() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('adminPass').value = '';
}

// =====================
// ADMIN PAGE
// =====================
function initAdminPage() {
    initTheme();
    setupTabs();
    updateDashboard();
    renderAdminProducts();
    renderBarcodeList();
    loadSettings();
    renderCategorySelect();
    renderAdminCategories();
    renderLowStockAlerts();
    renderReportsTab();
    loadJSPDF();
}

function setupTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById('tab-' + tab)?.classList.add('active');
            if (tab === 'dashboard') { updateDashboard(); renderLowStockAlerts(); }
            if (tab === 'products') renderAdminProducts();
            if (tab === 'barcode') renderBarcodeList();
            if (tab === 'categories') renderAdminCategories();
            if (tab === 'reports') renderReportsTab();
        });
    });
}

// =====================
// DASHBOARD
// =====================
function updateDashboard() {
    const totalProd = document.getElementById('totalProducts');
    const totalSales = document.getElementById('totalSales');
    const totalRev = document.getElementById('totalRevenue');
    const todayBills = document.getElementById('todayBills');
    const totalCat = document.getElementById('totalCategories');
    const lowStock = document.getElementById('lowStockCount');

    if (totalProd) totalProd.textContent = DB.products.length;
    if (totalSales) totalSales.textContent = DB.bills.length;
    const revenue = DB.bills.reduce((sum, b) => sum + (b.total || 0), 0);
    if (totalRev) totalRev.textContent = formatPrice(revenue);
    const today = getTodayDate();
    const tBills = DB.bills.filter(b => b.date === today).length;
    if (todayBills) todayBills.textContent = tBills;
    if (totalCat) totalCat.textContent = DB.categories.length;

    const lowStockItems = DB.products.filter(p => p.lowStockThreshold && p.stock <= p.lowStockThreshold && p.stock > 0).length;
    if (lowStock) lowStock.textContent = lowStockItems;

    renderRecentBills();
}

function renderRecentBills() {
    const tbody = document.getElementById('recentBillsBody');
    if (!tbody) return;
    const recent = [...DB.bills].reverse().slice(0, 10);
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No bills yet</td></tr>';
        return;
    }
    tbody.innerHTML = recent.map(bill => `
        <tr>
            <td>#${bill.billNumber}</td>
            <td>${formatDate(bill.date)}</td>
            <td>${bill.items.length} items</td>
            <td>${formatPrice(bill.total)}</td>
            <td>
                <button class="btn-icon" onclick="viewBill('${bill.id}')" title="View"><i class="fas fa-eye"></i></button>
                <button class="btn-icon" onclick="downloadBillPDF('${bill.id}')" title="PDF"><i class="fas fa-file-pdf"></i></button>
            </td>
        </tr>
    `).join('');
}

// =====================
// LOW STOCK ALERTS
// =====================
function renderLowStockAlerts() {
    const container = document.getElementById('lowStockAlerts');
    if (!container) return;
    const lowItems = DB.products.filter(p => p.lowStockThreshold && p.stock <= p.lowStockThreshold && p.stock > 0);
    if (lowItems.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;"><i class="fas fa-check-circle" style="color:var(--success);"></i> No low stock alerts</p>';
        return;
    }
    container.innerHTML = lowItems.map(p => `
        <div class="low-stock-item">
            <div class="low-stock-info">
                ${p.photo ? '<img src="' + p.photo + '" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">' : '<i class="fas fa-shoe-prints" style="font-size:24px;color:var(--text-muted);"></i>'}
                <div>
                    <div style="font-weight:600;font-size:13px;">${p.name}</div>
                    <div style="font-size:11px;color:var(--text-muted);">${p.brand || 'No Brand'} | ${getCategoryName(p.category)}</div>
                </div>
            </div>
            <div class="low-stock-badge">
                <i class="fas fa-exclamation-triangle"></i> ${p.stock} left
            </div>
        </div>
    `).join('');
}

// =====================
// CATEGORY MANAGEMENT (ADMIN)
// =====================
function renderCategorySelect() {
    const select = document.getElementById('prodCategory');
    if (!select) return;
    const categories = getCategories();
    let html = '<option value="">Select Category</option>';
    categories.forEach(cat => {
        html += '<option value="' + cat.slug + '">' + cat.name + '</option>';
    });
    select.innerHTML = html;
}

function renderAdminCategories() {
    const tbody = document.getElementById('categoriesBody');
    const countEl = document.getElementById('totalCategories');
    if (countEl) countEl.textContent = DB.categories.length;
    if (!tbody) return;
    if (DB.categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">No categories added yet. Add your first category below.</td></tr>';
        return;
    }
    tbody.innerHTML = DB.categories.map(cat => {
        const productCount = DB.products.filter(p => p.category === cat.slug).length;
        return `
        <tr>
            <td><strong>${cat.name}</strong></td>
            <td><code>${cat.slug}</code></td>
            <td>${productCount} product(s)</td>
            <td>
                <button class="btn-icon edit" onclick="editCategoryPrompt('${cat.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete" onclick="deleteCategoryPrompt('${cat.id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
}

function addNewCategory() {
    const input = document.getElementById('newCategoryName');
    if (!input) return;
    const name = input.value.trim();
    if (addCategory(name)) {
        input.value = '';
        renderAdminCategories();
        renderCategorySelect();
        alert('Category added successfully!');
    }
}

function deleteCategoryPrompt(id) {
    const cat = DB.categories.find(c => c.id === id);
    if (!cat) return;
    if (confirm('Delete category "' + cat.name + '"?')) {
        deleteCategory(id);
        renderAdminCategories();
        renderCategorySelect();
    }
}

function editCategoryPrompt(id) {
    const cat = DB.categories.find(c => c.id === id);
    if (!cat) return;
    const newName = prompt('Enter new category name:', cat.name);
    if (newName === null) return;
    if (editCategory(id, newName)) {
        renderAdminCategories();
        renderCategorySelect();
        renderAdminProducts();
        alert('Category updated successfully!');
    }
}

// =====================
// ADD PRODUCT
// =====================
function generateBarcode() {
    document.getElementById('prodBarcode').value = generateBarcodeValue();
}

async function addProduct(event) {
    event.preventDefault();
    const barcode = document.getElementById('prodBarcode').value || generateBarcodeValue();
    const name = document.getElementById('prodName').value;
    const brand = document.getElementById('prodBrand').value;
    const category = document.getElementById('prodCategory').value;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const stock = parseInt(document.getElementById('prodStock').value) || 0;
    const lowStockThreshold = parseInt(document.getElementById('lowStockThreshold')?.value) || 0;
    const description = document.getElementById('prodDesc').value;
    const photoFile = document.getElementById('prodPhoto').files[0];

    let photo = '';
    if (photoFile) photo = await fileToBase64(photoFile);

    const product = {
        id: generateId(),
        barcode,
        name,
        brand,
        category,
        price,
        stock,
        lowStockThreshold: lowStockThreshold > 0 ? lowStockThreshold : 0,
        description,
        photo,
        createdAt: new Date().toISOString()
    };

    DB.products.push(product);
    saveDB();

    if (lowStockThreshold > 0 && stock <= lowStockThreshold) {
        alert('Product added! Warning: Stock level (' + stock + ') is at or below low stock threshold (' + lowStockThreshold + ').');
    } else {
        alert('Product added successfully!');
    }

    document.getElementById('addProductForm').reset();
    clearPhoto();
    document.querySelector('[data-tab="products"]')?.click();
}

// =====================
// ADMIN PRODUCTS TABLE
// =====================
function renderAdminProducts() {
    const tbody = document.getElementById('adminProductsBody');
    const searchTerm = document.getElementById('adminSearch')?.value?.toLowerCase() || '';
    if (!tbody) return;
    let products = DB.products;
    if (searchTerm) {
        products = products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.brand.toLowerCase().includes(searchTerm) ||
            p.barcode.toLowerCase().includes(searchTerm)
        );
    }
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-msg">No products found</td></tr>';
        return;
    }
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${p.photo ? '<img src="' + p.photo + '" class="table-img">' : '<div class="table-img-placeholder"><i class="fas fa-image"></i></div>'}</td>
            <td><code>${p.barcode}</code></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.brand || '-'}</td>
            <td><span class="product-badge" style="position:static;font-size:10px;">${getCategoryName(p.category)}</span></td>
            <td>${formatPrice(p.price)}</td>
            <td>${p.stock} ${p.lowStockThreshold && p.stock <= p.lowStockThreshold && p.stock > 0 ? '<span style="color:var(--danger);font-size:10px;"><i class="fas fa-exclamation-triangle"></i></span>' : ''}</td>
            <td>
                <button class="btn-icon edit" onclick="editProduct('${p.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete" onclick="deleteProduct('${p.id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    DB.products = DB.products.filter(p => p.id !== id);
    saveDB();
    renderAdminProducts();
    updateDashboard();
}

function editProduct(id) {
    const p = DB.products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('prodBarcode').value = p.barcode;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodBrand').value = p.brand;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodStock').value = p.stock;
    if (document.getElementById('lowStockThreshold')) {
        document.getElementById('lowStockThreshold').value = p.lowStockThreshold || '';
    }
    document.getElementById('prodDesc').value = p.description || '';
    if (p.photo) {
        document.getElementById('uploadPlaceholder').style.display = 'none';
        document.getElementById('photoPreview').src = p.photo;
        document.getElementById('photoPreview').style.display = 'block';
    }
    DB.products = DB.products.filter(x => x.id !== id);
    saveDB();
    document.querySelector('[data-tab="add-product"]')?.click();
}

if (document.getElementById('adminSearch')) {
    document.getElementById('adminSearch').addEventListener('input', renderAdminProducts);
}

function exportProducts() {
    const dataStr = JSON.stringify(DB.products, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amna_products.json';
    a.click();
    URL.revokeObjectURL(url);
}

// =====================
// BILLING / POS
// =====================
function handleScan(event) {
    if (event.key === 'Enter') searchProductForBill();
}

function searchProductForBill() {
    const input = document.getElementById('scanInput').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('scanResults');
    if (!input) { resultsDiv.innerHTML = ''; return; }

    const matches = DB.products.filter(p => 
        p.barcode.toLowerCase() === input ||
        p.name.toLowerCase().includes(input) ||
        p.brand.toLowerCase().includes(input)
    );

    if (matches.length === 0) {
        resultsDiv.innerHTML = '<p style="color:var(--text-muted);padding:10px;">No products found</p>';
        return;
    }

    resultsDiv.innerHTML = matches.map(p => `
        <div class="scan-result-item" onclick="addToBill('${p.id}')">
            ${p.photo ? '<img src="' + p.photo + '">' : '<div style="width:36px;height:36px;background:rgba(255,255,255,0.1);border-radius:6px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-shoe-prints" style="color:var(--text-muted);font-size:14px;"></i></div>'}
            <div class="info">
                <div class="name">${p.name}</div>
                <div class="price">${formatPrice(p.price)} | Stock: ${p.stock}</div>
            </div>
            <i class="fas fa-plus-circle" style="color:var(--primary);"></i>
        </div>
    `).join('');
}

function addToBill(productId) {
    const product = DB.products.find(p => p.id === productId);
    if (!product) return;
    if (product.stock <= 0) { alert('Product is out of stock!'); return; }

    const existing = currentBill.find(item => item.productId === productId);
    if (existing) {
        if (existing.qty >= product.stock) { alert('Not enough stock!'); return; }
        existing.qty++;
    } else {
        currentBill.push({ productId: product.id, name: product.name, price: product.price, qty: 1, photo: product.photo });
    }
    document.getElementById('scanInput').value = '';
    document.getElementById('scanResults').innerHTML = '';
    renderBillItems();
}

function renderBillItems() {
    const tbody = document.getElementById('billItemsBody');
    if (!tbody) return;
    if (currentBill.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Add items to bill</td></tr>';
        calculateTotal();
        return;
    }
    tbody.innerHTML = currentBill.map((item, index) => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    ${item.photo ? '<img src="' + item.photo + '" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">' : '<i class="fas fa-shoe-prints" style="color:var(--text-muted);"></i>'}
                    <span style="font-size:13px;">${item.name}</span>
                </div>
            </td>
            <td><input type="number" value="${item.qty}" min="1" onchange="updateQty(${index}, this.value)"></td>
            <td>${formatPrice(item.price)}</td>
            <td>${formatPrice(item.price * item.qty)}</td>
            <td><i class="fas fa-times remove-btn" onclick="removeFromBill(${index})"></i></td>
        </tr>
    `).join('');
    calculateTotal();
}

function updateQty(index, value) {
    const qty = parseInt(value);
    if (qty < 1) return;
    const product = DB.products.find(p => p.id === currentBill[index].productId);
    if (product && qty > product.stock) { alert('Not enough stock! Available: ' + product.stock); return; }
    currentBill[index].qty = qty;
    renderBillItems();
}

function removeFromBill(index) {
    currentBill.splice(index, 1);
    renderBillItems();
}

function calculateTotal() {
    const subtotal = currentBill.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const grandTotal = subtotal - discountAmount;
    const subEl = document.getElementById('subtotal');
    const discEl = document.getElementById('discountAmount');
    const grandEl = document.getElementById('grandTotal');
    if (subEl) subEl.textContent = formatPrice(subtotal);
    if (discEl) discEl.textContent = formatPrice(discountAmount);
    if (grandEl) grandEl.innerHTML = '<strong>' + formatPrice(grandTotal) + '</strong>';
}

function clearBill() {
    if (currentBill.length > 0 && !confirm('Clear all items?')) return;
    currentBill = [];
    document.getElementById('discountPercent').value = 0;
    renderBillItems();
}

function generateBill() {
    if (currentBill.length === 0) { alert('Add items to generate bill!'); return; }

    const subtotal = currentBill.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const grandTotal = subtotal - discountAmount;
    const paymentMode = document.getElementById('paymentMode').value;
    const billNumber = String(DB.bills.length + 1).padStart(4, '0');
    const billId = generateId();

    const bill = {
        id: billId,
        billNumber,
        date: getTodayDate(),
        time: new Date().toLocaleTimeString('en-IN'),
        items: [...currentBill],
        subtotal,
        discountPercent,
        discountAmount,
        total: grandTotal,
        paymentMode
    };

    DB.bills.push(bill);
    currentBill.forEach(item => {
        const product = DB.products.find(p => p.id === item.productId);
        if (product) product.stock -= item.qty;
    });

    saveDB();
    showBillModal(bill);
    currentBill = [];
    document.getElementById('discountPercent').value = 0;
    renderBillItems();
    updateDashboard();
}

// =====================
// BILL MODAL & PRINT
// =====================
function showBillModal(bill) {
    const modal = document.getElementById('billModal');
    const area = document.getElementById('billPrintArea');
    const settings = DB.settings;
    if (!modal || !area) return;

    area.innerHTML = `
        <div class="bill-print" id="printableBill">
            <div class="bill-header">
                <div class="bill-logo"><i class="fas fa-shoe-prints"></i></div>
                <h2>${settings.storeName || 'AMNA SHOE PALACE'}</h2>
                <p class="bill-subtitle">Premium Footwear & Accessories</p>
                <p>${settings.address || ''}</p>
                <p>Phone: ${settings.phone || ''}</p>
                <p style="margin-top:10px;"><strong>Bill #${bill.billNumber}</strong></p>
                <p>${bill.date} | ${bill.time}</p>
            </div>
            <table class="bill-items-table">
                <thead>
                    <tr>
                        <th style="text-align:left;">Item</th>
                        <th style="text-align:center;">Qty</th>
                        <th style="text-align:right;">Rate</th>
                        <th style="text-align:right;">Amt</th>
                    </tr>
                </thead>
                <tbody>
                    ${bill.items.map(item => `
                        <tr>
                            <td style="text-align:left;">${item.name}</td>
                            <td style="text-align:center;">${item.qty}</td>
                            <td style="text-align:right;">${formatPrice(item.price)}</td>
                            <td style="text-align:right;">${formatPrice(item.price * item.qty)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="bill-total">
                <div class="total-row"><span>Subtotal:</span><span>${formatPrice(bill.subtotal)}</span></div>
                ${bill.discountPercent > 0 ? '<div class="total-row"><span>Discount (' + bill.discountPercent + '%):</span><span>-' + formatPrice(bill.discountAmount) + '</span></div>' : ''}
                <div class="total-row grand-total"><span>GRAND TOTAL:</span><span>${formatPrice(bill.total)}</span></div>
                <div class="total-row payment-mode"><span>Payment Mode:</span><span>${bill.paymentMode.toUpperCase()}</span></div>
            </div>
            <div class="bill-footer">
                <p class="thank-you">Thank you for shopping with us!</p>
                <p>Goods once sold will not be taken back</p>
                <p>Visit Again</p>
            </div>
        </div>
    `;
    modal.classList.add('active');
}

function closeBillModal() {
    document.getElementById('billModal')?.classList.remove('active');
}

function printBill() {
    window.print();
}

function viewBill(billId) {
    const bill = DB.bills.find(b => b.id === billId);
    if (bill) showBillModal(bill);
}

// =====================
// PDF GENERATION
// =====================
function loadJSPDF() {
    if (typeof window.jspdf !== 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => console.log('jsPDF loaded');
    document.head.appendChild(script);
}

function generateBillPDF(bill) {
    const settings = DB.settings;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 200] });

    let y = 10;
    const center = 40;

    doc.setFontSize(14);
    doc.text(settings.storeName || 'AMNA SHOE PALACE', center, y, { align: 'center' });
    y += 6;
    doc.setFontSize(9);
    doc.text('Premium Footwear & Accessories', center, y, { align: 'center' });
    y += 5;
    doc.text(settings.address || '', center, y, { align: 'center' });
    y += 4;
    doc.text('Phone: ' + (settings.phone || ''), center, y, { align: 'center' });
    y += 6;
    doc.setFontSize(10);
    doc.text('Bill #' + bill.billNumber, center, y, { align: 'center' });
    y += 4;
    doc.setFontSize(8);
    doc.text(bill.date + ' | ' + bill.time, center, y, { align: 'center' });
    y += 6;

    doc.setLineWidth(0.3);
    doc.line(5, y, 75, y);
    y += 4;

    doc.setFontSize(8);
    doc.text('Item', 5, y);
    doc.text('Qty', 45, y, { align: 'center' });
    doc.text('Rate', 55, y, { align: 'right' });
    doc.text('Amt', 75, y, { align: 'right' });
    y += 4;
    doc.line(5, y, 75, y);
    y += 4;

    doc.setFontSize(8);
    bill.items.forEach(item => {
        doc.text(item.name.substring(0, 20), 5, y);
        doc.text(String(item.qty), 45, y, { align: 'center' });
        doc.text(parseFloat(item.price).toFixed(2), 55, y, { align: 'right' });
        doc.text(parseFloat(item.price * item.qty).toFixed(2), 75, y, { align: 'right' });
        y += 4;
    });

    y += 2;
    doc.line(5, y, 75, y);
    y += 5;

    doc.setFontSize(9);
    doc.text('Subtotal:', 5, y);
    doc.text(parseFloat(bill.subtotal).toFixed(2), 75, y, { align: 'right' });
    y += 4;

    if (bill.discountPercent > 0) {
        doc.text('Discount (' + bill.discountPercent + '%):', 5, y);
        doc.text('-' + parseFloat(bill.discountAmount).toFixed(2), 75, y, { align: 'right' });
        y += 4;
    }

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('GRAND TOTAL:', 5, y);
    doc.text(parseFloat(bill.total).toFixed(2), 75, y, { align: 'right' });
    doc.setFont(undefined, 'normal');
    y += 5;

    doc.setFontSize(8);
    doc.text('Payment: ' + bill.paymentMode.toUpperCase(), 5, y);
    y += 6;

    doc.line(5, y, 75, y);
    y += 5;
    doc.setFontSize(9);
    doc.text('Thank you for shopping with us!', center, y, { align: 'center' });
    y += 4;
    doc.setFontSize(7);
    doc.text('Goods once sold will not be taken back', center, y, { align: 'center' });
    y += 4;
    doc.text('Visit Again', center, y, { align: 'center' });

    return doc;
}

function downloadBillPDF(billId) {
    const bill = DB.bills.find(b => b.id === billId);
    if (!bill) return;

    if (typeof window.jspdf === 'undefined') {
        alert('PDF library loading... Please try again in a moment.');
        loadJSPDF();
        return;
    }

    const doc = generateBillPDF(bill);
    doc.save('AMNA_Bill_' + bill.billNumber + '_' + bill.date + '.pdf');
}

function downloadCurrentBillPDF() {
    if (currentBill.length === 0) { alert('No items to generate PDF!'); return; }

    const subtotal = currentBill.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;
    const paymentMode = document.getElementById('paymentMode').value;
    const billNumber = String(DB.bills.length + 1).padStart(4, '0');

    const bill = {
        billNumber,
        date: getTodayDate(),
        time: new Date().toLocaleTimeString('en-IN'),
        items: [...currentBill],
        subtotal,
        discountPercent,
        discountAmount,
        total,
        paymentMode
    };

    if (typeof window.jspdf === 'undefined') {
        alert('PDF library loading... Please try again in a moment.');
        loadJSPDF();
        return;
    }

    const doc = generateBillPDF(bill);
    doc.save('AMNA_Bill_' + billNumber + '_' + bill.date + '.pdf');
}

// =====================
// REPORTS
// =====================
function renderReportsTab() {
    renderSalesReport('daily');
}

function renderSalesReport(period) {
    const container = document.getElementById('reportResults');
    if (!container) return;

    let startDate, endDate;
    const today = getTodayDate();

    switch(period) {
        case 'daily':
            startDate = today;
            endDate = today;
            break;
        case 'weekly':
            startDate = getWeekStart();
            endDate = today;
            break;
        case 'monthly':
            startDate = getMonthStart();
            endDate = today;
            break;
        case 'yearly':
            startDate = getYearStart();
            endDate = today;
            break;
        default:
            startDate = today;
            endDate = today;
    }

    const filteredBills = DB.bills.filter(b => b.date >= startDate && b.date <= endDate);
    const totalSales = filteredBills.length;
    const totalRevenue = filteredBills.reduce((sum, b) => sum + (b.total || 0), 0);
    const totalItems = filteredBills.reduce((sum, b) => sum + b.items.length, 0);

    const productSales = {};
    filteredBills.forEach(bill => {
        bill.items.forEach(item => {
            if (!productSales[item.name]) {
                productSales[item.name] = { qty: 0, revenue: 0 };
            }
            productSales[item.name].qty += item.qty;
            productSales[item.name].revenue += (item.price * item.qty);
        });
    });

    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 5);

    container.innerHTML = `
        <div class="report-summary">
            <div class="report-card">
                <i class="fas fa-shopping-cart"></i>
                <div>
                    <h4>${totalSales}</h4>
                    <p>Total Bills</p>
                </div>
            </div>
            <div class="report-card">
                <i class="fas fa-rupee-sign"></i>
                <div>
                    <h4>${formatPrice(totalRevenue)}</h4>
                    <p>Total Revenue</p>
                </div>
            </div>
            <div class="report-card">
                <i class="fas fa-box"></i>
                <div>
                    <h4>${totalItems}</h4>
                    <p>Items Sold</p>
                </div>
            </div>
        </div>

        <div class="report-table-wrapper">
            <h4><i class="fas fa-list"></i> Bill Details</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Bill #</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredBills.length === 0 ? '<tr><td colspan="5" class="empty-msg">No bills found for this period</td></tr>' : 
                    filteredBills.map(b => `
                        <tr>
                            <td>#${b.billNumber}</td>
                            <td>${b.date} ${b.time}</td>
                            <td>${b.items.length}</td>
                            <td>${formatPrice(b.total)}</td>
                            <td>${b.paymentMode.toUpperCase()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${topProducts.length > 0 ? `
        <div class="report-top-products">
            <h4><i class="fas fa-trophy"></i> Top Selling Products</h4>
            <div class="top-products-list">
                ${topProducts.map(([name, data], i) => `
                    <div class="top-product-item">
                        <span class="rank">${i + 1}</span>
                        <span class="name">${name}</span>
                        <span class="qty">${data.qty} sold</span>
                        <span class="revenue">${formatPrice(data.revenue)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;
}

function downloadReportPDF(period) {
    if (typeof window.jspdf === 'undefined') {
        alert('PDF library loading... Please try again.');
        loadJSPDF();
        return;
    }

    let startDate, endDate, title;
    const today = getTodayDate();

    switch(period) {
        case 'daily': startDate = today; endDate = today; title = 'Daily Report'; break;
        case 'weekly': startDate = getWeekStart(); endDate = today; title = 'Weekly Report'; break;
        case 'monthly': startDate = getMonthStart(); endDate = today; title = 'Monthly Report'; break;
        case 'yearly': startDate = getYearStart(); endDate = today; title = 'Yearly Report'; break;
    }

    const filteredBills = DB.bills.filter(b => b.date >= startDate && b.date <= endDate);
    const totalRevenue = filteredBills.reduce((sum, b) => sum + (b.total || 0), 0);
    const totalItems = filteredBills.reduce((sum, b) => sum + b.items.length, 0);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('AMNA SHOE PALACE', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(title, 105, 28, { align: 'center' });
    doc.text(startDate + ' to ' + endDate, 105, 34, { align: 'center' });

    doc.setFontSize(10);
    doc.text('Total Bills: ' + filteredBills.length, 20, 45);
    doc.text('Total Revenue: Rs. ' + totalRevenue.toFixed(2), 20, 51);
    doc.text('Items Sold: ' + totalItems, 20, 57);

    let y = 70;
    if (filteredBills.length > 0) {
        doc.setFontSize(11);
        doc.text('Bill Details:', 20, y);
        y += 8;

        doc.setFontSize(9);
        doc.text('Bill #', 20, y);
        doc.text('Date', 50, y);
        doc.text('Items', 90, y);
        doc.text('Total', 110, y);
        doc.text('Payment', 140, y);
        y += 6;

        filteredBills.forEach(b => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text('#' + b.billNumber, 20, y);
            doc.text(b.date, 50, y);
            doc.text(String(b.items.length), 95, y);
            doc.text('Rs. ' + b.total.toFixed(2), 110, y);
            doc.text(b.paymentMode.toUpperCase(), 140, y);
            y += 6;
        });
    }

    doc.save('AMNA_' + title.replace(' ', '_') + '_' + today + '.pdf');
}

// =====================
// BARCODE GENERATOR
// =====================
function generateBarcodeImage() {
    const value = document.getElementById('barcodeValue').value.trim();
    const display = document.getElementById('barcodeDisplay');
    const actions = document.getElementById('barcodeActions');
    if (!value) { alert('Enter a barcode value'); return; }

    display.innerHTML = '<svg id="barcodeSvg"></svg>';
    try {
        JsBarcode("#barcodeSvg", value, {
            format: "CODE128",
            width: 2,
            height: 80,
            displayValue: true,
            fontSize: 14,
            lineColor: "#000",
            textMargin: 8
        });
        if (actions) actions.style.display = 'flex';
    } catch (e) {
        display.innerHTML = '<p style="color:red;">Error generating barcode</p>';
        if (actions) actions.style.display = 'none';
    }
}

function printBarcode() {
    const svg = document.getElementById('barcodeSvg');
    if (!svg) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html><head><title>Barcode</title></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            ${svg.outerHTML}
        </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function downloadBarcode() {
    const svg = document.getElementById('barcodeSvg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const a = document.createElement('a');
        a.download = 'barcode.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
}

function renderBarcodeList() {
    const grid = document.getElementById('barcodeGrid');
    if (!grid) return;
    if (DB.products.length === 0) {
        grid.innerHTML = '<p class="empty-msg" style="grid-column:1/-1;">No products available</p>';
        return;
    }
    grid.innerHTML = DB.products.map(p => {
        const safeId = 'bc_' + p.id.replace(/[^a-zA-Z0-9]/g, '');
        setTimeout(() => {
            try {
                JsBarcode('#' + safeId, p.barcode || p.id, {
                    format: "CODE128", width: 1.5, height: 50,
                    displayValue: true, fontSize: 11, margin: 5
                });
            } catch(e) {}
        }, 100);
        return `
            <div class="barcode-card">
                <p style="font-weight:600;margin-bottom:5px;font-size:12px;">${p.name}</p>
                <p style="font-size:10px;">${p.barcode || p.id}</p>
                <svg id="${safeId}"></svg>
            </div>
        `;
    }).join('');
}

// =====================
// SETTINGS
// =====================
function loadSettings() {
    const s = DB.settings;
    const fields = {
        'storeName': 'storeName',
        'storeAddress': 'address',
        'storePhone': 'phone',
        'storeEmail': 'email'
    };
    Object.entries(fields).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.value = s[key] || '';
    });
    if (document.getElementById('openingHoursWeekdays')) document.getElementById('openingHoursWeekdays').value = s.openingHoursWeekdays || 'Mon - Sat: 9:00 AM - 9:00 PM';
    if (document.getElementById('openingHoursSunday')) document.getElementById('openingHoursSunday').value = s.openingHoursSunday || 'Sunday: 10:00 AM - 6:00 PM';
}

function saveSettings() {
    const fields = {
        'storeName': 'storeName',
        'storeAddress': 'address',
        'storePhone': 'phone',
        'storeEmail': 'email',
        'openingHoursWeekdays': 'openingHoursWeekdays',
        'openingHoursSunday': 'openingHoursSunday'
    };

    Object.entries(fields).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) DB.settings[key] = el.value;
    });

    saveDB();
    alert('Settings saved!');
}

function changePassword() {
    const current = document.getElementById('currentPass').value;
    const newPass = document.getElementById('newPass').value;
    const confirm = document.getElementById('confirmPass').value;

    if (current !== DB.settings.password) { alert('Current password is incorrect!'); return; }
    if (newPass.length < 4) { alert('Password must be at least 4 characters!'); return; }
    if (newPass !== confirm) { alert('Passwords do not match!'); return; }

    DB.settings.password = newPass;
    saveDB();
    alert('Password updated!');
    document.getElementById('currentPass').value = '';
    document.getElementById('newPass').value = '';
    document.getElementById('confirmPass').value = '';
}

function clearAllData() {
    if (!confirm('WARNING: This will delete ALL data! Are you sure?')) return;
    if (!confirm('This action cannot be undone. Continue?')) return;

    DB.products = [];
    DB.bills = [];
    DB.categories = [];
    saveDB();
    alert('All data cleared!');
    updateDashboard();
    renderAdminProducts();
    renderAdminCategories();
    renderCategorySelect();
}

function exportAllData() {
    const data = {
        products: DB.products,
        bills: DB.bills,
        categories: DB.categories,
        settings: DB.settings,
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amna_backup_' + getTodayDate() + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function restoreData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.products) DB.products = data.products;
            if (data.bills) DB.bills = data.bills;
            if (data.categories) DB.categories = data.categories;
            if (data.settings) DB.settings = data.settings;
            saveDB();
            alert('Data restored successfully!');
            updateDashboard();
            renderAdminProducts();
            renderAdminCategories();
            renderCategorySelect();
        } catch (err) {
            alert('Invalid backup file!');
        }
    };
    reader.readAsText(file);
}

// =====================
// INITIALIZATION
// =====================
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.customer-page')) {
        initCustomerPage();
    }
});
