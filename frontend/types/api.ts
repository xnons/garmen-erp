/**
 * Tipe entitas inti API (skema blueprint). Dipakai untuk mengganti `any`
 * secara bertahap di modul-modul. Field opsional karena backend kadang
 * mengirim subset (mis. list vs detail) — sesuaikan saat dipakai.
 */

export type ISODate = string; // "2026-08-31"
export type UUID = string;

export interface Partner {
  id: UUID;
  code?: string | null;
  name: string;
  category: string; // BUYER | MAKLUN_SEWING | SUBCON_WASHING | SUBCON_PRINT | SUBCON_EMBROIDERY | SUPPLIER_FABRIC
  address?: string | null;
  phone?: string | null;
  created_at?: string;
}

export interface SalesOrder {
  id: UUID;
  so_number: string;
  buyer_id?: UUID | null;
  buyer_name?: string | null; // di-join oleh backend di beberapa endpoint
  buyer_po_number?: string | null;
  style_name: string;
  item_category?: string;
  color?: string | null;
  fabric_type?: string | null;
  contract_type?: "CMT" | "FOB" | string;
  order_qty: number;
  unit_price?: number;
  total_order_value?: number;
  size_breakdown_target?: Record<string, number>;
  bom_accessories?: { item: string; qty_per_pcs: number }[];
  status: string; // REGISTERED | CUTTING | WIP_SUBCON | SEWING | WASHING | FINISHING | SHIPPED | CLOSED
  order_date: ISODate;
  deadline?: ISODate | null;
  customer_pic_name?: string | null;
  customer_pic_phone?: string | null;
  customer_email?: string | null;
  delivery_address?: string | null;
  special_instructions?: string | null;
  created_at?: string;
}

export interface InventoryItem {
  id: UUID;
  item_code: string;
  description: string;
  item_type: "FABRIC_MAIN" | "PURING" | "INTERLINING" | "TRIMS_ACCESSORY" | string;
  unit: string;
  unit_price: number;
  current_stock: number;
  color_shade_lot?: string | null;
  width_inch?: number;
  gramasi_gsm?: number;
  min_stock_alert?: number;
  rack_location?: string;
}

export interface MaterialReceipt {
  id: UUID;
  item_id: UUID;
  item_description?: string | null;
  supplier_id?: UUID | null;
  receipt_date: ISODate;
  roll_number?: string | null;
  qty_received: number;
  unit?: string;
  contract_type?: string;
  inspection_status?: "PENDING" | "PASSED" | "REJECTED" | string;
  created_at?: string;
}

export interface MaterialAllocation {
  id: UUID;
  so_id: UUID;
  so_number?: string | null;
  item_id: UUID;
  item_description?: string | null;
  dispatch_date: ISODate;
  qty_issued: number;
  surat_jalan_no?: string | null;
  unit?: string;
  created_at?: string;
}

export type WIPStage =
  | "PRINT_MENTAH" | "EMBROIDERY_MENTAH" | "SEWING_INTERNAL" | "SEWING_MAKLUN"
  | "WASHING" | "EMBROIDERY_JADI" | "FINISHING";

export interface WIPMovement {
  id: UUID;
  so_id: UUID;
  so_number?: string | null;
  stage_name: WIPStage | string;
  sequence_order: number;
  partner_id?: UUID | null;
  partner_name?: string | null;
  surat_jalan_no?: string | null;
  dispatch_date: ISODate;
  qty_dispatched: number;
  received_date?: ISODate | null;
  qty_received: number;
  qty_reject: number;
  balance_discrepancy: number;
  status: "IN_PROCESS" | "PARTIAL_RECEIVED" | "COMPLETED" | "DISCREPANCY_FLAG" | string;
  remarks?: string | null;
  created_at?: string;
}

export interface CuttingRecord {
  id: UUID;
  so_id: UUID;
  so_number?: string | null;
  cutting_date: ISODate;
  operator_id?: string | null;
  operator_name?: string | null;
  qty_cut: number;
  size_breakdown_cut?: Record<string, number>;
  main_fabric_used: number;
  puring_used?: number;
  puring_jala_used?: number;
  main_consumption_rate?: number;
  puring_consumption_rate?: number;
  marker_length_yard?: number;
  marker_efficiency_pct?: number;
  gelaran_layers?: number;
  fabric_waste_yards?: number;
  created_at?: string;
}

export interface RejectLog {
  id: UUID;
  wip_movement_id?: UUID | null;
  so_id: UUID;
  so_number?: string | null;
  stage_name: string;
  defect_reason: string;
  qty_reject: number;
  unit_cost_loss: number;
  total_loss: number;
}

export interface Shipment {
  id: UUID;
  so_id: UUID;
  so_number?: string | null;
  surat_jalan_no: string;
  shipment_date: ISODate;
  driver_name?: string | null;
  vehicle_plate_no?: string | null;
  carton_box_count?: number;
  destination_address?: string | null;
  total_qty_shipped: number;
  size_breakdown_shipped?: Record<string, number>;
  unit_price?: number;
  total_billing_amount?: number;
  invoice_number?: string | null;
  remarks?: string | null;
}
