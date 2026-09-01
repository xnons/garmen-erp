import api from './api';

export interface DateRange {
  start?: string; // YYYY-MM-DD
  end?: string;
}

export interface ProductionSummary {
  range: { start: string; end: string };
  by_stage: {
    stage: string; label: string; dispatched: number; received: number; reject: number;
  }[];
  cutting_yield: {
    qty_cut: number; fabric_used_yard: number; fabric_waste_yard: number;
    consumption_per_pcs: number; waste_pct: number;
  };
  delivery: { delivered_orders: number; on_time: number; late: number; on_time_pct: number };
  wip_aging: { bucket: string; count: number }[];
}

export interface FinancialSummary {
  range: { start: string; end: string };
  invoice_total: number;
  shipped_qty: number;
  wage_piece_rate: number;
  wage_borongan_approved: number;
  wage_total: number;
  reject_loss: number;
  gross_margin_estimate: number;
  per_sales_order: {
    so_number: string; style_name: string; status: string;
    contract_value: number; invoiced: number; wage_cost: number;
    reject_loss: number; est_margin: number;
  }[];
}

export interface VendorScorecard {
  vendors: {
    partner_id: string; partner_name: string; category: string;
    movements: number; dispatched: number; received: number; reject: number;
    discrepancy: number; on_time: number; completed: number;
    loss_rate_pct: number; reject_rate_pct: number; score: number; risk: string;
  }[];
}

export interface KpiRibbon {
  soActive: number;
  deadlinesWithin7Days: number;
  wipInProcessPcs: number;
  vendorDiscrepancyFlags: number;
  lowStockItems: number;
}

const params = (r: DateRange) => ({ params: { start: r.start, end: r.end } });

export const reportService = {
  productionSummary: (r: DateRange = {}) =>
    api.get<ProductionSummary>('/api/reports/production-summary', params(r)).then((x) => x.data),
  financialSummary: (r: DateRange = {}) =>
    api.get<FinancialSummary>('/api/reports/financial-summary', params(r)).then((x) => x.data),
  vendorScorecard: () =>
    api.get<VendorScorecard>('/api/reports/vendor-scorecard').then((x) => x.data),
  kpiRibbon: () =>
    api.get<KpiRibbon>('/api/dashboard/kpi-ribbon').then((x) => x.data),
};

export default reportService;
