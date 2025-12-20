/**
 * Validation Utilities
 * Server-side validation functions for API requests
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export class Validator {
  /**
   * Validate required fields
   */
  static required(value: any, fieldName: string): string | null {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`
    }
    return null
  }

  /**
   * Validate email format
   */
  static email(value: string): string | null {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Invalid email format'
    }
    return null
  }

  /**
   * Validate string length
   */
  static validateLength(
    value: string,
    min?: number,
    max?: number,
    fieldName: string = 'Field'
  ): string | null {
    if (min !== undefined && value.length < min) {
      return `${fieldName} must be at least ${min} characters`
    }
    if (max !== undefined && value.length > max) {
      return `${fieldName} must be at most ${max} characters`
    }
    return null
  }

  /**
   * Validate number range
   */
  static numberRange(
    value: number,
    min?: number,
    max?: number,
    fieldName: string = 'Field'
  ): string | null {
    if (min !== undefined && value < min) {
      return `${fieldName} must be at least ${min}`
    }
    if (max !== undefined && value > max) {
      return `${fieldName} must be at most ${max}`
    }
    return null
  }

  /**
   * Validate date range
   */
  static dateRange(
    from: Date | string,
    to: Date | string,
    fieldName: string = 'Date range'
  ): string | null {
    const fromDate = typeof from === 'string' ? new Date(from) : from
    const toDate = typeof to === 'string' ? new Date(to) : to

    if (fromDate > toDate) {
      return `${fieldName}: start date must be before end date`
    }
    return null
  }

  /**
   * Validate array length
   */
  static arrayLength(
    value: any[],
    min?: number,
    max?: number,
    fieldName: string = 'Array'
  ): string | null {
    if (min !== undefined && value.length < min) {
      return `${fieldName} must have at least ${min} items`
    }
    if (max !== undefined && value.length > max) {
      return `${fieldName} must have at most ${max} items`
    }
    return null
  }

  /**
   * Validate object structure
   */
  static object(
    value: any,
    requiredFields: string[],
    fieldName: string = 'Object'
  ): string | null {
    if (typeof value !== 'object' || value === null) {
      return `${fieldName} must be an object`
    }

    for (const field of requiredFields) {
      if (!(field in value)) {
        return `${fieldName} is missing required field: ${field}`
      }
    }

    return null
  }

  /**
   * Validate multiple rules
   */
  static validate(
    value: any,
    rules: Array<(val: any) => string | null>
  ): string[] {
    const errors: string[] = []
    for (const rule of rules) {
      const error = rule(value)
      if (error) {
        errors.push(error)
      }
    }
    return errors
  }

  /**
   * Validate invoice data
   */
  static validateInvoice(data: any): ValidationResult {
    const errors: string[] = []

    // Required fields
    const requiredFields = [
      'invoiceId',
      'projectNumber',
      'projectName',
      'status',
      'issueDate',
    ]

    for (const field of requiredFields) {
      const error = this.required(data[field], field)
      if (error) errors.push(error)
    }

    // Numeric validations
    if (data.billedTonnage !== undefined) {
      const error = this.numberRange(data.billedTonnage, 0, undefined, 'Billed Tonnage')
      if (error) errors.push(error)
    }

    if (data.totalAmountBilled !== undefined) {
      const error = this.numberRange(data.totalAmountBilled, 0, undefined, 'Total Amount')
      if (error) errors.push(error)
    }

    // Status validation
    const validStatuses = ['Paid', 'Unpaid', 'Due Date Expected']
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

