// Frontend validation helpers
export const validators = {
  email: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  password: (password) => {
    return password.length >= 6 && 
           /[a-z]/.test(password) && 
           /[A-Z]/.test(password) && 
           /\d/.test(password);
  },

  phone: (phone) => {
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(phone);
  },

  name: (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  },

  amount: (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num < 1000000;
  },

  inviteCode: (code) => {
    return /^[A-Z0-9]{8}$/.test(code);
  }
};

export const errorMessages = {
  email: 'Please enter a valid email address',
  password: 'Password must be at least 6 characters with uppercase, lowercase, and number',
  phone: 'Please enter a valid phone number',
  name: 'Name must be at least 2 characters and contain only letters',
  amount: 'Please enter a valid amount',
  inviteCode: 'Invite code must be 8 characters'
};