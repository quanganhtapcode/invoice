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
        // Allow numbers and hyphen
        let value = e.target.value.replace(/[^0-9-]/g, '');

        // Auto-insert hyphen after 10th digit if typing more
        const pureNumbers = value.replace(/-/g, '');
        if (pureNumbers.length > 10 && !value.includes('-')) {
            value = pureNumbers.slice(0, 10) + '-' + pureNumbers.slice(10);
        }

        e.target.value = value;

        // Clear previous timeout
        if (mstLookupTimeout) {
            clearTimeout(mstLookupTimeout);
        }

        // Clean MST for checking length (remove hyphens)
        const cleanMst = value.replace(/-/g, '');

        // Hide company info if MST is too short
        if (cleanMst.length < 10) {
            companyInfoSection.classList.add('hidden');
            // Remove success class/style if any
            return;
        }

        // Only lookup if length is valid (10 or 13 digits commonly)
        if (cleanMst.length === 10 || cleanMst.length >= 13) {
            // Debounce lookup
            mstLookupTimeout = setTimeout(() => {
                lookupMST(value); // Pass original value with potential hyphens
            }, 500);
        }
    }

    async function lookupMST(mst) {
        showMSTLoader(true);
        hideError();

        // Ensure section is visible while loading? No, keep hidden until success to avoid empty boxes
        // But if refreshing, existing data might layout weirdly.

        try {
            // Esgoo API works best with clean numeric string usually, or standard format
            const response = await fetch(`${CONFIG.ESGOO_API_URL}${mst}.htm`);

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            if (data.error === 0 && data.data) {
                // Fill company info
                companyNameInput.value = data.data.ten || '';
                companyAddressInput.value = data.data.dc || '';
                representativeInput.value = data.data.daidien || '';

                // Format Address if name is too long?

                // Show company info section with animation
                companyInfoSection.classList.remove('hidden');

                // Add visual success indicator to MST input
                mstInput.parentElement.classList.add('success');

                showToast('Đã tìm thấy thông tin doanh nghiệp');
            } else {
                // If API returns error (not found)
                // Only show error if user has stopped typing meaningful length
                console.warn('MST Lookup failed:', data);
                // Don't hide section immediately if user is just correcting?
                // But data is invalid, so resetting or hiding is safer
                // companyInfoSection.classList.add('hidden'); // Optional: hide if not found
                showError('Không tìm thấy thông tin doanh nghiệp. Vui lòng kiểm tra lại MST.');
            }
        } catch (error) {
            console.error('MST Lookup Error:', error);
            // Silent fail or show generic error?
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
