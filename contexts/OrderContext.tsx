import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem } from './CartContext'

export interface OrderFormData {
  fullName: string
  phone: string
  description: string
  referenceUrl?: string
}

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  formData: OrderFormData
  totalPrice: number
  status: 'pending' | 'confirmed' | 'rejected'
  createdAt: string
  updatedAt: string
}

interface OrderContextType {
  orders: Order[]
  isLoading: boolean
  createOrder: (items: CartItem[], formData: OrderFormData, userId: string) => Promise<Order>
  updateOrderStatus: (orderId: string, status: 'confirmed' | 'rejected') => Promise<void>
  getUserOrders: (userId: string) => Order[]
  getAllOrders: () => Order[]
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Загружаем заказы при инициализации
  useEffect(() => {
    // Временно отключаем загрузку с API для устранения ошибок
    setIsLoading(false)
    // Инициализируем пустым массивом
    setOrders([])
  }, [])

  const createOrder = async (items: CartItem[], formData: OrderFormData, userId: string): Promise<Order> => {
    const totalPrice = items.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/\D/g, '')) || 0
      return total + (price * item.quantity)
    }, 0)

    const newOrder: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      items,
      formData,
      totalPrice,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Сохраняем только локально (временно отключаем API)
    setOrders(prev => [...prev, newOrder])
    return newOrder
  }

  const updateOrderStatus = async (orderId: string, status: 'confirmed' | 'rejected'): Promise<void> => {
    // Обновляем только локально (временно отключаем API)
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, status, updatedAt: new Date().toISOString() }
        : order
    ))
  }

  const getUserOrders = (userId: string): Order[] => {
    return orders.filter(order => order.userId === userId)
  }

  const getAllOrders = (): Order[] => {
    return orders
  }

  return (
    <OrderContext.Provider value={{
      orders,
      isLoading,
      createOrder,
      updateOrderStatus,
      getUserOrders,
      getAllOrders
    }}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider')
  }
  return context
}
