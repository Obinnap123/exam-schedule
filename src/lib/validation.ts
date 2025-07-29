export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Minimum length check
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  // Maximum length check
  if (password.length > 50) {
    errors.push("Password must be less than 50 characters long");
  }

  // Contains number check
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Contains uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Contains lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Contains special character check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: "Please enter a valid email address"
    };
  }

  // Check email length
  if (email.length > 255) {
    return {
      isValid: false,
      error: "Email address is too long"
    };
  }

  return {
    isValid: true
  };
}

export function validateName(name: string): {
  isValid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: "Name is required"
    };
  }

  if (name.length > 50) {
    return {
      isValid: false,
      error: "Name must be less than 50 characters"
    };
  }

  // Allow letters, spaces, and some special characters commonly found in names
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return {
      isValid: false,
      error: "Name can only contain letters, spaces, hyphens, and apostrophes"
    };
  }

  return {
    isValid: true
  };
}
