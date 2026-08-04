// Tipos compartidos entre cliente y servidor

export type Role = 'ADMIN' | 'EMPLOYEE' | 'COCINERO' | 'CAMARERO'

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
  protocol?: Protocol | null
  recipes?: ProductRecipe[]
}

export interface RawMaterial {
  id: string
  name: string
  unit: string
  stock: number
  minStock: number
  lastPurchasedAt?: string | null
  critical?: boolean
  // Lista de la compra: si está tachado (comprado hace <24h)
  inShoppingList?: boolean
  shoppingTachado?: boolean
}

export interface ProductRecipe {
  id: string
  productId: string
  rawMaterialId: string
  quantity: number
  rawMaterial?: RawMaterial
}

export interface Purchase {
  id: string
  date: string
  supplier?: string | null
  notes?: string | null
  totalAmount: number
  invoiceUrl?: string | null
  conciliatedAt?: string | null
  source?: string
  items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  purchaseId: string
  rawMaterialId: string
  quantity: number
  unitPrice: number
  subtotal: number
  rawMaterial?: RawMaterial
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

export type SwapStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface ShiftSwap {
  id: string
  originalUserId: string
  replacementUserId: string
  shiftAssignmentId: string
  type: SwapType
  status: SwapStatus
  replacementShiftAssignmentId?: string | null
  seenByOriginal: boolean
  seenByReplacement: boolean
  decidedAt?: string | null
  createdAt: string
  originalUser?: { id: string; name: string; email: string }
  replacementUser?: { id: string; name: string; email: string }
  shiftAssignment?: ShiftAssignment & { shift?: Shift }
  replacementShiftAssignment?: ShiftAssignment & { shift?: Shift } | null
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
  // Gastos en suministros (compras) en el periodo
  totalPurchases: number
  purchasesCount: number
  recentPurchases: { id: string; date: string; supplier?: string | null; totalAmount: number; itemCount: number }[]
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

export interface EmployeeStats {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  // Turnos
  totalShiftsAssigned: number      // total turnos asignados (histórico + futuro)
  upcomingShifts: number           // turnos futuros (date >= today)
  pastShifts: number               // turnos pasados (date < today)
  shiftList: {
    id: string
    date: string
    shiftName: string
    startTime: string
    endTime: string
    role: string
    isPast: boolean
  }[]
  // Intercambios
  swapsRequested: number           // solicitudes enviadas
  swapsReceived: number            // solicitudes recibidas
  swapsApproved: number            // solicitudes recibidas que aprobó
  swapsRejected: number            // solicitudes recibidas que rechazó
  // Roles
  roleCount: {
    CAMARERO: number
    COCINERO: number
  }
  // Ventas
  totalSales: number               // nº de transacciones
  totalItems: number               // items vendidos
  totalRevenue: number             // facturación total en €
  cashRevenue: number
  cardRevenue: number
}

// Ranking de ventas para un turno específico (personas en ese turno)
export interface ShiftSalesRanking {
  userId: string
  userName: string
  role: string
  sales: number        // nº de transacciones
  revenue: number      // facturación
}
