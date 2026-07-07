export function mapShipment(row: any) {
  return {
    id: row.id,
    trackingNumber: row.tracking_number,
    customerId: row.customer_id,
    origin: row.origin,
    destination: row.destination,
    category: row.category,
    weightKg: row.weight_kg,
    quantity: row.quantity,
    description: row.description,
    status: row.status,
    date: row.date,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    receiptSent: row.receipt_sent,
    pickupDate: row.pickup_date,
    expectedArrival: row.expected_arrival,
    insurance: row.insurance,
    specialInstructions: row.special_instructions,
    internalNotes: row.internal_notes,
    photos: row.photos,
    basePrice: row.base_price,
    discountAmount: row.discount_amount,
    finalAmount: row.final_amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customer: row.customer ? {
      id: row.customer.id,
      name: row.customer.name,
      phone: row.customer.phone,
      email: row.customer.email,
      address: row.customer.address,
      photo: row.customer.photo,
      totalKgSent: row.customer.total_kg_sent,
      active: row.customer.active
    } : undefined
  };
}
