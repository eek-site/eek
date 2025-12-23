/**
 * EEK PLATFORM DATA SANITIZER
 * 
 * Sanitizes all data before sending to Power Automate flows to prevent
 * anomalies like corrupted characters, encoding issues, and invalid data.
 * 
 * Examples of issues prevented:
 * - 2025-12-22_LFS832_GlenEdenCarRepairs�M_$737.96 (Unicode replacement char)
 * - Copy-paste artifacts from Word/Excel
 * - Non-printable control characters
 * - Zero-width characters
 * - Invalid UTF-8 sequences
 * 
 * Version: 1.0
 * Last Updated: 2025-12-23
 */

class DataSanitizer {
    constructor() {
        // Characters/patterns to remove or replace
        this.patterns = {
            // Unicode replacement character (appears when encoding fails)
            replacementChar: /\uFFFD/g,
            
            // Zero-width characters (invisible but cause issues)
            zeroWidth: /[\u200B-\u200D\uFEFF\u2060]/g,
            
            // Non-printable control characters (except newline, tab, carriage return)
            controlChars: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
            
            // Soft hyphens and other invisible formatting
            softHyphen: /\u00AD/g,
            
            // Non-breaking spaces variants
            nbspVariants: /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g,
            
            // Private use area characters
            privateUse: /[\uE000-\uF8FF]/g,
            
            // Surrogate pairs that are incomplete (invalid UTF-16)
            invalidSurrogates: /[\uD800-\uDFFF]/g,
            
            // Multiple consecutive spaces
            multipleSpaces: /\s{2,}/g,
            
            // Common copy-paste artifacts from Word
            wordArtifacts: /[\u2018\u2019\u201C\u201D\u2013\u2014\u2026]/g,
            
            // Line separators and paragraph separators
            lineSeparators: /[\u2028\u2029]/g
        };

        // Word artifact replacements (smart quotes to straight quotes, etc.)
        this.wordReplacements = {
            '\u2018': "'",  // Left single quote
            '\u2019': "'",  // Right single quote
            '\u201C': '"',  // Left double quote
            '\u201D': '"',  // Right double quote
            '\u2013': '-',  // En dash
            '\u2014': '-',  // Em dash
            '\u2026': '...', // Ellipsis
            '\u00A0': ' ',  // Non-breaking space
        };
    }

    /**
     * Sanitize a single string value
     * @param {string} value - The string to sanitize
     * @param {Object} options - Sanitization options
     * @returns {string} Sanitized string
     */
    sanitizeString(value, options = {}) {
        if (typeof value !== 'string') {
            return value;
        }

        const {
            preserveNewlines = true,
            maxLength = 10000,
            trimWhitespace = true,
            convertSmartQuotes = true
        } = options;

        let sanitized = value;

        // Remove Unicode replacement characters
        sanitized = sanitized.replace(this.patterns.replacementChar, '');

        // Remove zero-width characters
        sanitized = sanitized.replace(this.patterns.zeroWidth, '');

        // Remove control characters
        sanitized = sanitized.replace(this.patterns.controlChars, '');

        // Remove soft hyphens
        sanitized = sanitized.replace(this.patterns.softHyphen, '');

        // Remove private use area characters
        sanitized = sanitized.replace(this.patterns.privateUse, '');

        // Remove invalid surrogates
        sanitized = sanitized.replace(this.patterns.invalidSurrogates, '');

        // Convert Word artifacts (smart quotes, etc.)
        if (convertSmartQuotes) {
            for (const [from, to] of Object.entries(this.wordReplacements)) {
                sanitized = sanitized.split(from).join(to);
            }
        }

        // Normalize non-breaking spaces to regular spaces
        sanitized = sanitized.replace(this.patterns.nbspVariants, ' ');

        // Handle line separators
        if (preserveNewlines) {
            sanitized = sanitized.replace(this.patterns.lineSeparators, '\n');
        } else {
            sanitized = sanitized.replace(this.patterns.lineSeparators, ' ');
        }

        // Collapse multiple spaces to single space
        sanitized = sanitized.replace(this.patterns.multipleSpaces, ' ');

        // Trim whitespace if requested
        if (trimWhitespace) {
            sanitized = sanitized.trim();
        }

        // Truncate if too long
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
            console.warn(`⚠️ Sanitizer: Truncated string to ${maxLength} characters`);
        }

        return sanitized;
    }

    /**
     * Sanitize a phone number
     * @param {string} phone - Phone number to sanitize
     * @returns {string} Sanitized phone number
     */
    sanitizePhone(phone) {
        if (typeof phone !== 'string') {
            return phone;
        }

        // First apply general string sanitization
        let sanitized = this.sanitizeString(phone);

        // Remove all non-digit characters except + at the start
        const startsWithPlus = sanitized.startsWith('+');
        sanitized = sanitized.replace(/[^\d]/g, '');
        
        if (startsWithPlus && sanitized.length > 0) {
            sanitized = '+' + sanitized;
        }

        return sanitized;
    }

    /**
     * Sanitize an email address
     * @param {string} email - Email to sanitize
     * @returns {string} Sanitized email
     */
    sanitizeEmail(email) {
        if (typeof email !== 'string') {
            return email;
        }

        // First apply general string sanitization
        let sanitized = this.sanitizeString(email);

        // Remove any spaces (common copy-paste error)
        sanitized = sanitized.replace(/\s/g, '');

        // Convert to lowercase
        sanitized = sanitized.toLowerCase();

        return sanitized;
    }

    /**
     * Sanitize a vehicle registration
     * @param {string} rego - Registration to sanitize
     * @returns {string} Sanitized registration
     */
    sanitizeRego(rego) {
        if (typeof rego !== 'string') {
            return rego;
        }

        // First apply general string sanitization
        let sanitized = this.sanitizeString(rego);

        // Remove spaces and convert to uppercase
        sanitized = sanitized.replace(/\s/g, '').toUpperCase();

        // Only allow alphanumeric characters
        sanitized = sanitized.replace(/[^A-Z0-9]/g, '');

        return sanitized;
    }

    /**
     * Sanitize a price/currency value
     * @param {string|number} price - Price to sanitize
     * @returns {string} Sanitized price as string
     */
    sanitizePrice(price) {
        if (typeof price === 'number') {
            return price.toFixed(2);
        }

        if (typeof price !== 'string') {
            return price;
        }

        // First apply general string sanitization
        let sanitized = this.sanitizeString(price);

        // Remove currency symbols and non-numeric chars except decimal point
        sanitized = sanitized.replace(/[^0-9.]/g, '');

        // Ensure only one decimal point
        const parts = sanitized.split('.');
        if (parts.length > 2) {
            sanitized = parts[0] + '.' + parts.slice(1).join('');
        }

        return sanitized;
    }

    /**
     * Sanitize a date string and format as NZ standard (DD/MM/YYYY)
     * @param {string} dateStr - Date string to sanitize
     * @returns {string} Sanitized date string in DD/MM/YYYY format
     */
    sanitizeDate(dateStr) {
        if (typeof dateStr !== 'string') {
            return dateStr;
        }

        // First apply general string sanitization (removes corrupted chars)
        let sanitized = this.sanitizeString(dateStr);

        // If it's already in NZ format (DD/MM/YYYY), keep it
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(sanitized)) {
            return sanitized;
        }

        // Try to parse and convert to NZ format (DD/MM/YYYY)
        try {
            const date = new Date(sanitized);
            if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            }
        } catch (e) {
            // If parsing fails, return the sanitized string
        }

        return sanitized;
    }

    /**
     * Sanitize a name (person or business)
     * @param {string} name - Name to sanitize
     * @returns {string} Sanitized name
     */
    sanitizeName(name) {
        if (typeof name !== 'string') {
            return name;
        }

        // Apply general string sanitization
        let sanitized = this.sanitizeString(name);

        // Remove any numbers (usually not in names)
        // But keep them for business names - so we'll just clean special chars
        sanitized = sanitized.replace(/[^\w\s\-'.&]/g, '');

        return sanitized;
    }

    /**
     * Sanitize an address
     * @param {string} address - Address to sanitize
     * @returns {string} Sanitized address
     */
    sanitizeAddress(address) {
        if (typeof address !== 'string') {
            return address;
        }

        // Apply general string sanitization
        let sanitized = this.sanitizeString(address);

        // Remove unusual characters but keep common address chars
        sanitized = sanitized.replace(/[^\w\s\-'.,#\/]/g, '');

        return sanitized;
    }

    /**
     * Recursively sanitize an entire object
     * @param {Object} obj - Object to sanitize
     * @param {Object} fieldMappings - Optional mappings of field names to sanitization functions
     * @returns {Object} Sanitized object
     */
    sanitizeObject(obj, fieldMappings = {}) {
        if (!obj || typeof obj !== 'object') {
            if (typeof obj === 'string') {
                return this.sanitizeString(obj);
            }
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item, fieldMappings));
        }

        const sanitized = {};

        for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();

            // Check for specific field mappings
            if (fieldMappings[key]) {
                sanitized[key] = fieldMappings[key](value);
            }
            // Auto-detect field types by name
            else if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('tel')) {
                sanitized[key] = this.sanitizePhone(value);
            }
            else if (lowerKey.includes('email')) {
                sanitized[key] = this.sanitizeEmail(value);
            }
            else if (lowerKey.includes('rego') || lowerKey === 'vehiclerego' || lowerKey === 'registration') {
                sanitized[key] = this.sanitizeRego(value);
            }
            else if (lowerKey.includes('price') || lowerKey.includes('amount') || lowerKey.includes('cost') || lowerKey.includes('fee')) {
                sanitized[key] = this.sanitizePrice(value);
            }
            else if (lowerKey.includes('date') || lowerKey.includes('time') || lowerKey === 'timestamp') {
                sanitized[key] = this.sanitizeDate(value);
            }
            else if (lowerKey.includes('name') && !lowerKey.includes('filename')) {
                sanitized[key] = this.sanitizeName(value);
            }
            else if (lowerKey.includes('address') || lowerKey.includes('location') && typeof value === 'string') {
                sanitized[key] = this.sanitizeAddress(value);
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value, fieldMappings);
            }
            else if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            }
            else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Sanitize a payload specifically for Power Automate flows
     * This is the main method to call before sending any data to a flow
     * @param {Object} payload - The payload to sanitize
     * @returns {Object} Sanitized payload safe for Power Automate
     */
    sanitizeForFlow(payload) {
        console.log('🧹 Sanitizing payload for flow...');
        
        const sanitized = this.sanitizeObject(payload);
        
        // Log any significant changes
        const originalJson = JSON.stringify(payload);
        const sanitizedJson = JSON.stringify(sanitized);
        
        if (originalJson !== sanitizedJson) {
            console.log('🧹 Sanitization made changes to payload');
            
            // Check for specific issues that were fixed
            if (originalJson.includes('\uFFFD')) {
                console.warn('⚠️ Removed Unicode replacement characters (�) from payload');
            }
        }
        
        return sanitized;
    }

    /**
     * Quick check if a string contains problematic characters
     * @param {string} str - String to check
     * @returns {boolean} True if string contains issues
     */
    hasProblematicChars(str) {
        if (typeof str !== 'string') return false;
        
        return (
            this.patterns.replacementChar.test(str) ||
            this.patterns.zeroWidth.test(str) ||
            this.patterns.controlChars.test(str) ||
            this.patterns.privateUse.test(str) ||
            this.patterns.invalidSurrogates.test(str)
        );
    }

    /**
     * Get a diagnostic report of problematic characters in a string
     * @param {string} str - String to analyze
     * @returns {Object} Report of issues found
     */
    diagnose(str) {
        if (typeof str !== 'string') {
            return { hasIssues: false, issues: [] };
        }

        const issues = [];

        if (this.patterns.replacementChar.test(str)) {
            issues.push('Unicode replacement character (�)');
        }
        if (this.patterns.zeroWidth.test(str)) {
            issues.push('Zero-width characters');
        }
        if (this.patterns.controlChars.test(str)) {
            issues.push('Control characters');
        }
        if (this.patterns.privateUse.test(str)) {
            issues.push('Private use area characters');
        }
        if (this.patterns.invalidSurrogates.test(str)) {
            issues.push('Invalid surrogate pairs');
        }

        return {
            hasIssues: issues.length > 0,
            issues: issues,
            original: str,
            sanitized: this.sanitizeString(str)
        };
    }
}

// Create global singleton instance
window.dataSanitizer = new DataSanitizer();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataSanitizer;
}



