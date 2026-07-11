export function calculateFinancials(shipments: any[], expenses: any[], settings: any, config: any) {
  const currency = settings?.currency || config?.defaults?.currency || 'MGA';
  const totalRevenue = shipments
    .reduce((sum, s) => {
      const amount = s.finalAmount ?? s.basePrice ?? (s.weightKg * (settings?.defaultRatePerKg || 0));
      return sum + (s.paymentStatus === 'Paid' ? amount : (s.initialPayment || 0));
    }, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  return { totalRevenue, totalExpenses, netProfit, currency };
}
