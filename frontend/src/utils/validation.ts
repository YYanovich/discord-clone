export function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid format of email";
  return null;
}
export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/[A-Z]/.test(password))
    return "Password must include at least one uppercase letter";
  if (!/[0-9]/.test(password))
    return "Password must include at least one number";
  return null;
}

export function validateUsername(username: string): string | null {
  if (!username) return "Username is required";
  if (username.length < 3) return "Username must be at least 3 characters long";
  if (username.length > 32) return "Username cannot exceed 32 characters";
  if (!/^[a-z0-9_-]+$/.test(username))
    return "Username can only contain lowercase letters, numbers, underscores, and hyphens";
  return null;
}
