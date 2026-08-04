// Tipos compartidos entre cliente y servidor

export type Role = 'ADMIN' | 'EMPLOYEE' | 'COCINERO' | 'ANOTADOR'

export type ProtocolType = 'APERTURA' | 'CIERRE' | 'COCINA' | 'PRODUCTO'

export type PaymentMethod = 'cash' | 'card'

export type SaleItemStatus = 'PENDING' | 'DELIVERED'

export type SwapType = 'swap' | 'substitute'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
}

export interface Product {
  id: string
  name: string
  price: number
  tags: string[]
  imageUrl?: string | null
  description?: string | null
  isActive: boolean
  customFields: Record<string, string>
  inventory?: Inventory | null
  protocol?: Protocol | null
}

export interface Inventory {
  id: string
  productId: string
  stock: number
  minStock: number
  unit: string
  customFields: Record<string, string>
  product?: {
    id: string
    name: string
    price: number
    tags: string[] | string
    imageUrl?: string | null
    description?: string | null
    isActive: boolean
    customFields: Record<string, string> | string
  } | null
}

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  daysOfWeek: string
  openingProtocol: string[]
  closingProtocol: string[]
}

export interface ShiftAssignment {
  id: string
  shiftId: string
  userId: string
  date: string
  role: string
  shift?: Shift
  user?: { id: string; name: string; email: string; role: string }
}

export interface ShiftSwap {
  id: string
  originalUserId: string
  replacementUserId: string
  shiftAssignmentId: string
  type: SwapType
  createdAt: string
}

export interface ShiftDebt {
  id: string
  userId: string
  reason: string
  isPaid: boolean
  createdAt: string
  user?: { id: string; name: string; email: string }
}

export interface SaleTransaction {
  id: string
  turnoId: number
  employeeId?: string | null
  total: number
  paymentMethod: PaymentMethod
  createdAt: string
  items?: SaleItem[]
  employee?: { id: string; name: string } | null
}

export interface SaleItem {
  id: string
  saleId: string
  productId?: string | null
  productName: string
  price: number
  quantity: number
  priority: number
  status: SaleItemStatus
  createdAt: string
}

export interface Protocol {
  id: string
  type: ProtocolType
  name: string
  description?: string | null
  steps: string[]
  productId?: string | null
}

export interface DashboardStats {
  totalSales: number
  totalTransactions: number
  totalProductsSold: number
  starProduct?: { name: string; quantity: number } | null
  criticalStock: { id: string; name: string; stock: number; minStock: number; unit: string }[]
  topEmployees: { id: string; name: string; sales: number; total: number }[]
  hourlySales: { hour: string; cash: number; card: number; total: number; transactions: number }[]
  paymentMethods: { cash: number; card: number; cashPct: number; cardPct: number }
  topProducts: { id: string; name: string; quantity: number; revenue: number }[]
  swaps: ShiftSwap[]
  pendingDebts: ShiftDebt[]
}

export interface MyStats {
  totalSales: number
  totalItems: number
  cashTotal: number
  cardTotal: number
  shifts: {
    date: string
    shiftName: string
    startTime: string
    endTime: string
    role: string
    sales: number
    total: number
  }[]
  hourlySales: {
    hour: string
    total: number
    cash: number
    card: number
    transactions: number
    items: { name: string; qty: number; price: number }[]
  }[]
}
