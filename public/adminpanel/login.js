// ============= Validation & Error Handling =============
const ErrorMessages = {
    mobile: {
        required: 'لطفا شماره موبایل خود را وارد کنید',
        invalid: 'شماره موبایل باید 11 رقم و با 09 شروع شود',
        format: 'فقط اعداد مجاز هستند'
    },
    username: {
        required: 'لطفا نام کاربری خود را وارد کنید',
        minLength: 'نام کاربری باید حداقل 3 کاراکتر باشد',
        maxLength: 'نام کاربری نباید بیشتر از 20 کاراکتر باشد'
    },
    password: {
        required: 'لطفا رمز عبور خود را وارد کنید',
        minLength: 'رمز عبور باید حداقل 6 کاراکتر باشد',
        weak: 'رمز عبور باید شامل حروف و اعداد باشد'
    },
    otp: {
        required: 'لطفا کد تایید را وارد کنید',
        incomplete: 'لطفا کد 6 رقمی را کامل وارد کنید',
        invalid: 'کد وارد شده معتبر نیست'
    }
};

function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const inputElement = document.getElementById(fieldId + 'Input') || document.querySelector(`#${fieldId}`);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    
    if (inputElement) {
        inputElement.classList.add('error');
    }
}

function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const inputElement = document.getElementById(fieldId + 'Input') || document.querySelector(`#${fieldId}`);
    
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
    
    if (inputElement) {
        inputElement.classList.remove('error');
    }
}

function validateMobile(mobile) {
    if (!mobile || mobile.trim() === '') {
        return { valid: false, message: ErrorMessages.mobile.required };
    }
    
    if (!/^\d+$/.test(mobile)) {
        return { valid: false, message: ErrorMessages.mobile.format };
    }
    
    if (mobile.length !== 11 || !mobile.startsWith('09')) {
        return { valid: false, message: ErrorMessages.mobile.invalid };
    }
    
    return { valid: true };
}

function validateUsername(username) {
    if (!username || username.trim() === '') {
        return { valid: false, message: ErrorMessages.username.required };
    }
    
    if (username.length < 3) {
        return { valid: false, message: ErrorMessages.username.minLength };
    }
    
    if (username.length > 20) {
        return { valid: false, message: ErrorMessages.username.maxLength };
    }
    
    return { valid: true };
}

function validatePassword(password) {
    if (!password || password.trim() === '') {
        return { valid: false, message: ErrorMessages.password.required };
    }
    
    if (password.length < 6) {
        return { valid: false, message: ErrorMessages.password.minLength };
    }
    
    return { valid: true };
}

function validateOTP(otp) {
    if (!otp || otp.trim() === '') {
        return { valid: false, message: ErrorMessages.otp.required };
    }
    
    if (otp.length !== 6) {
        return { valid: false, message: ErrorMessages.otp.incomplete };
    }
    
    if (!/^\d{6}$/.test(otp)) {
        return { valid: false, message: ErrorMessages.otp.invalid };
    }
    
    return { valid: true };
}

// ============= Main App Logic =============
let currentTab = 'mobile';
let timerInterval;

function switchTab(tab) {
    currentTab = tab;
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.closest('.auth-tab').classList.add('active');
    
    const mobileForm = document.getElementById('mobileForm');
    const usernameForm = document.getElementById('usernameForm');
    
    // Clear all errors when switching tabs
    clearError('mobile');
    clearError('username');
    clearError('password');
    
    if (tab === 'mobile') {
        mobileForm.style.display = 'block';
        usernameForm.style.display = 'none';
    } else {
        mobileForm.style.display = 'none';
        usernameForm.style.display = 'block';
    }
}

function togglePassword() {
    const passwordInput = document.getElementById('passwordInput');
    const passwordIcon = document.getElementById('passwordIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.classList.remove('fa-eye');
        passwordIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        passwordIcon.classList.remove('fa-eye-slash');
        passwordIcon.classList.add('fa-eye');
    }
}

// Clear error on input
document.getElementById('mobileInput').addEventListener('input', function() {
    clearError('mobile');
});

document.getElementById('usernameInput').addEventListener('input', function() {
    clearError('username');
});

document.getElementById('passwordInput').addEventListener('input', function() {
    clearError('password');
});

// Mobile Form Submit
document.getElementById('mobileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const mobile = document.getElementById('mobileInput').value.trim();
    
    const validation = validateMobile(mobile);
    
    if (!validation.valid) {
        showError('mobile', validation.message);
        return;
    }
    
    clearError('mobile');
    document.getElementById('displayMobile').textContent = mobile;
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('otpPage').style.display = 'block';
    
    startTimer();
});

// Username Form Submit
document.getElementById('usernameForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    
    let hasError = false;
    
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        showError('username', usernameValidation.message);
        hasError = true;
    } else {
        clearError('username');
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        showError('password', passwordValidation.message);
        hasError = true;
    } else {
        clearError('password');
    }
    
    if (!hasError) {
        // Success - would normally redirect or call API
        console.log('Login successful', { username, password });
        // Simulate success
        window.location.href = '#dashboard';
    }
});

// OTP Input Handling
const otpInputs = document.querySelectorAll('.otp-input');

otpInputs.forEach((input, index) => {
    input.addEventListener('input', function(e) {
        clearError('otp');
        otpInputs.forEach(inp => inp.classList.remove('error'));
        
        // Only allow numbers
        this.value = this.value.replace(/[^0-9]/g, '');
        
        if (this.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && this.value === '' && index > 0) {
            otpInputs[index - 1].focus();
        }
    });
    
    input.addEventListener('paste', function(e) {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const digits = pasteData.replace(/\D/g, '').split('');
        
        clearError('otp');
        otpInputs.forEach(inp => inp.classList.remove('error'));
        
        digits.forEach((digit, i) => {
            if (index + i < otpInputs.length) {
                otpInputs[index + i].value = digit;
            }
        });
        
        if (index + digits.length < otpInputs.length) {
            otpInputs[index + digits.length].focus();
        } else {
            otpInputs[otpInputs.length - 1].focus();
        }
    });
});

// OTP Form Submit
document.getElementById('otpForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let otp = '';
    otpInputs.forEach(input => otp += input.value);
    
    const validation = validateOTP(otp);
    
    if (!validation.valid) {
        showError('otp', validation.message);
        otpInputs.forEach(input => input.classList.add('error'));
        return;
    }
    
    clearError('otp');
    
    // Success - would normally verify OTP with backend
    console.log('OTP verified:', otp);
    window.location.href = '#dashboard';
});

function startTimer() {
    let timeLeft = 120;
    const timerElement = document.getElementById('timer');
    const resendLink = document.getElementById('resendLink');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            resendLink.classList.remove('disabled');
        }
    }, 1000);
}

document.getElementById('resendLink').addEventListener('click', function(e) {
    e.preventDefault();
    if (!this.classList.contains('disabled')) {
        this.classList.add('disabled');
        clearError('otp');
        otpInputs.forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });
        otpInputs[0].focus();
        startTimer();
    }
});

function backToLogin() {
    clearInterval(timerInterval);
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('otpPage').style.display = 'none';
    clearError('otp');
    otpInputs.forEach(input => {
        input.value = '';
        input.classList.remove('error');
    });
}

function toggleDarkMode() {
    // Dark mode functionality to be added
    console.log('Dark mode toggle clicked');
}

// Auto-focus first OTP input when page loads
setTimeout(() => {
    if (document.getElementById('otpPage').style.display === 'block') {
        otpInputs[0].focus();
    }
}, 100);




