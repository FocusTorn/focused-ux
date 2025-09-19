
// Shared utilities: workspace3/src/utils/validation.ts
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/
    return emailRegex.test(email)
}

export const isValidPassword = (password: string): boolean => {
    return password.length >= 8
}

export const sanitizeString = (str: string): string => {
    return str.trim().replace(/[<>]/g, '')
}
