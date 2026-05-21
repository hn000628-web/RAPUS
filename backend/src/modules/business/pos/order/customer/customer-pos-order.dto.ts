import {
  CustomerOrderFlowType,
  CustomerOrderSource,
} from './customer-pos-order.types'

export class CustomerOrderBootstrapQueryDto {
  readonly providerChannelCode!: string
  readonly orderFlowType?: CustomerOrderFlowType
  readonly locationId?: number
  readonly tableCode?: string
}

export class CreateCustomerOrderItemOptionDto {
  readonly productOptionId!: number
  readonly productOptionValueId!: number
  readonly quantity?: number
}

export class CreateCustomerOrderItemDto {
  readonly posProductId!: number
  readonly quantity!: number
  readonly requestMemo?: string
  readonly options?: CreateCustomerOrderItemOptionDto[]
}

export class CustomerOrderFulfillmentDto {
  readonly deliveryAddress?: string
  readonly deliveryDetailAddress?: string
  readonly deliveryPhone?: string
  readonly deliveryMemo?: string
  readonly pickupExpectedAt?: string
  readonly reservationExpectedAt?: string
  readonly customerRequestMemo?: string
  readonly qrCodeValue?: string
}

export class CreateCustomerOrderDto {
  readonly providerChannelCode!: string
  readonly orderSource!: CustomerOrderSource
  readonly orderFlowType!: CustomerOrderFlowType
  readonly locationId?: number
  readonly tableCode?: string
  readonly customerProfileId?: number
  readonly customerChannelCode?: string
  readonly customerName?: string
  readonly customerPhone?: string
  readonly memo?: string
  readonly fulfillment?: CustomerOrderFulfillmentDto
  readonly items!: CreateCustomerOrderItemDto[]
}

export class CustomerOrderDetailQueryDto {
  readonly providerChannelCode!: string
  readonly revisionCode?: string
  readonly customerChannelCode?: string
}

export class CancelCustomerOrderDto {
  readonly providerChannelCode!: string
  readonly revisionCode?: string
  readonly customerChannelCode?: string
  readonly reason?: string
}
