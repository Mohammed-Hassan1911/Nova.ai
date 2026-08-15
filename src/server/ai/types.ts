export interface JSONSchema {
  type?: string
  description?: string
  enum?: (string | number)[]
  properties?: Record<string, JSONSchema>
  items?: JSONSchema
  required?: string[]
  additionalProperties?: boolean
  [key: string]: unknown
}
