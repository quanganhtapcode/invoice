/**
 * Invoice Request App - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const form = document.getElementById('invoice-form');
    const formView = document.getElementById('form-view');
    const successView = document.getElementById('success-view');

    // Form inputs
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const mstInput = document.getElementById('mst');
    const companyNameInput = document.getElementById('companyName');
    const companyAddressInput = document.getElementById('companyAddress');
    const representativeInput = document.getElementById('representative');

    // Company info section
    const companyInfoSection = document.getElementById('company-info');
    const mstLoader = document.getElementById('mst-loader');

    // Image upload elements
    const fileInput = document.getElementById('invoice-file');
    const cameraBtn = document.getElementById('camera-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadArea = document.getElementById('upload-area');
    const previewArea = document.getElementById('preview-area');
    const previewImage = document.getElementById('preview-image');
    const changeImageBtn = document.getElementById('change-image-btn');

    // UI elements
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const submitBtn = document.getElementById('submit-btn');
    const resetBtn = document.getElementById('reset-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // State
    let currentImageFile = null;
    let isSubmitting = false;
    let mstLookupTimeout = null;

    // Initialize
    init();

    function init() {
        setupEventListeners();
        checkTelegramConfig();
    }

    function setupEventListeners() {
        // MST input - auto lookup
        mstInput.addEventListener('input', handleMSTInput);

        // Camera button
        cameraBtn.addEventListener('click', () => {
            fileInput.setAttribute('capture', 'environment');
            fileInput.click();
        });

        // Upload button
        uploadBtn.addEventListener('click', () => {
            fileInput.removeAttribute('capture');
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', handleFileSelect);

        // Change image button
        changeImageBtn.addEventListener('click', () => {
            currentImageFile = null;
            previewArea.classList.add('hidden');
            uploadArea.classList.remove('hidden');
        });

        // Form submit
        form.addEventListener('submit', handleSubmit);

        // Reset button
        resetBtn.addEventListener('click', resetForm);

        // Phone input - only numbers
        phoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
        });
    }

    function checkTelegramConfig() {
        if (!TelegramBot.isConfigured()) {
            console.warn('Telegram Bot chưa được cấu hình. Vui lòng cập nhật js/config.js');
        }
    }

    // ============ MST Lookup ============

    function handleMSTInput(e) {
        const value = e.target.value.replace(/\D/g, '').slice(0, 14);
        e.target.value = value;

        // Clear previous timeout
        if (mstLookupTimeout) {
            clearTimeout(mstLookupTimeout);
        }

        // Hide company info if MST is too short
        if (value.length < 10) {
            companyInfoSection.classList.add('hidden');
            return;
        }

        // Debounce lookup
        mstLookupTimeout = setTimeout(() => {
            lookupMST(value);
        }, 500);
    }

    async function lookupMST(mst) {
        showMSTLoader(true);
        hideError();

        try {
            const response = await fetch(`${CONFIG.ESGOO_API_URL}${mst}.htm`);
            const data = await response.json();

            if (data.error === 0 && data.data) {
                // Fill company info
                companyNameInput.value = data.data.ten || '';
                companyAddressInput.value = data.data.dc || '';
                representativeInput.value = data.data.daidien || '';

                // Show company info section with animation
                companyInfoSection.classList.remove('hidden');

                showToast('Đã tìm thấy thông tin doanh nghiệp');
            } else {
                showError('Không tìm thấy thông tin doanh nghiệp với MST này');
                companyInfoSection.classList.add('hidden');
            }
        } catch (error) {
            console.error('MST lookup error:', error);
            showError('Lỗi kết nối API. Vui lòng thử lại sau');
        } finally {
            showMSTLoader(false);
        }
    }

    function showMSTLoader(show) {
        if (show) {
            mstLoader.classList.add('active');
        } else {
            mstLoader.classList.remove('active');
        }
    }

    // ============ File Handling ============

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showError('Vui lòng chọn file ảnh');
            return;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB');
            return;
        }

        currentImageFile = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            uploadArea.classList.add('hidden');
            previewArea.classList.remove('hidden');
        };
        reader.readAsDataURL(file);

        hideError();
    }

    // ============ Form Submission ============

    async function handleSubmit(e) {
        e.preventDefault();

        if (isSubmitting) return;

        // Validate
        if (!validateForm()) return;

        isSubmitting = true;
        setSubmitLoading(true);
        hideError();

        // Collect form data
        const invoiceData = {
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            email: emailInput.value.trim(),
            mst: mstInput.value.trim(),
            companyName: companyNameInput.value.trim(),
            companyAddress: companyAddressInput.value.trim(),
            representative: representativeInput.value.trim()
        };

        try {
            // Save to localStorage first
            const invoiceId = Storage.saveInvoice(invoiceData);
            console.log('Invoice saved locally:', invoiceId);

            // Send to Telegram
            if (TelegramBot.isConfigured()) {
                await TelegramBot.sendInvoiceRequest(invoiceData, currentImageFile);
                console.log('Invoice sent to Telegram');
            } else {
                console.warn('Telegram not configured, skipping...');
            }

            // Show success
            showSuccessView();

        } catch (error) {
            console.error('Submit error:', error);
            showError('Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            isSubmitting = false;
            setSubmitLoading(false);
        }
    }

    function validateForm() {
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const mst = mstInput.value.trim();

        // Optional name
        // if (!name) {
        //     showError('Vui lòng nhập họ và tên');
        //     nameInput.focus();
        //     return false;
        // }

        if (!phone || !CONFIG.VALIDATION.PHONE_PATTERN.test(phone)) {
            showError('Số điện thoại không hợp lệ');
            phoneInput.focus();
            return false;
        }

        if (!email || !CONFIG.VALIDATION.EMAIL_PATTERN.test(email)) {
            showError('Email không hợp lệ');
            emailInput.focus();
            return false;
        }

        if (!mst || mst.length < CONFIG.VALIDATION.MST_MIN_LENGTH) {
            showError('Mã số thuế phải có ít nhất 10 số');
            mstInput.focus();
            return false;
        }

        if (!currentImageFile) {
            showError('Vui lòng chụp hoặc tải lên ảnh hóa đơn');
            return false;
        }

        return true;
    }

    function setSubmitLoading(loading) {
        if (loading) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        } else {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    // ============ UI Helpers ============

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');

        // Scroll to error
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.add('visible');

        setTimeout(() => {
            toast.classList.remove('visible');
        }, 3000);
    }

    function showSuccessView() {
        formView.classList.add('hidden');
        successView.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetForm() {
        // Reset all inputs
        form.reset();

        // Clear company info
        companyNameInput.value = '';
        companyAddressInput.value = '';
        representativeInput.value = '';
        companyInfoSection.classList.add('hidden');

        // Clear image
        currentImageFile = null;
        previewArea.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        fileInput.value = '';

        // Hide error
        hideError();

        // Show form view
        successView.classList.add('hidden');
        formView.classList.remove('hidden');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
