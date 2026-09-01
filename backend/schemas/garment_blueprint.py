# backend/schemas/garment_blueprint.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime

# ===========================================================================
# 1. PARTNERS (BUYERS & SUBCON VENDORS)
# ===========================================================================
class PartnerBase(BaseModel):
    name: str
    category: str # BUYER, SUPPLIER_FABRIC, MAKLUN_SEWING, SUBCON_WASHING, SUBCON_PRINT, SUBCON_EMBROIDERY
    code: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

class PartnerCreate(PartnerBase):
    pass

class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

class PartnerResponse(BaseModel):
    id: str
    name: Optional[str] = "UMUM"
    category: Optional[str] = "BUYER"
    code: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===========================================================================
# 2. PPIC & SALES ORDERS (SO-MG26xxxx)
# ===========================================================================
class SalesOrderBase(BaseModel):
    so_number: Optional[str] = ""
    buyer_id: Optional[str] = None
    buyer_po_number: Optional[str] = None
    customer_pic_name: Optional[str] = None
    customer_pic_phone: Optional[str] = None
    customer_email: Optional[str] = None
    delivery_address: Optional[str] = None
    style_name: Optional[str] = "-"
    item_category: Optional[str] = "LONG JEANS"
    color: Optional[str] = None
    fabric_type: Optional[str] = None
    target_shrinkage_pct: Optional[float] = 0.0
    special_instructions: Optional[str] = None
    contract_type: Optional[str] = "CMT" # CMT / FOB
    order_qty: Optional[int] = 0
    unit_price: Optional[float] = 0.0
    total_order_value: Optional[float] = 0.0
    dp_amount: Optional[float] = 0.0
    payment_terms: Optional[str] = "NET_30"
    tax_ppn_pct: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    size_breakdown_target: Optional[Any] = {}
    bom_accessories: Optional[Any] = []
    order_date: Optional[Any] = None
    deadline: Optional[Any] = None

class SalesOrderCreate(SalesOrderBase):
    pass

class SalesOrderUpdate(BaseModel):
    style_name: Optional[str] = None
    buyer_id: Optional[str] = None
    buyer_po_number: Optional[str] = None
    customer_pic_name: Optional[str] = None
    customer_pic_phone: Optional[str] = None
    customer_email: Optional[str] = None
    delivery_address: Optional[str] = None
    item_category: Optional[str] = None
    color: Optional[str] = None
    fabric_type: Optional[str] = None
    target_shrinkage_pct: Optional[float] = None
    special_instructions: Optional[str] = None
    contract_type: Optional[str] = None
    order_qty: Optional[int] = None
    unit_price: Optional[float] = None
    total_order_value: Optional[float] = None
    dp_amount: Optional[float] = None
    payment_terms: Optional[str] = None
    tax_ppn_pct: Optional[float] = None
    discount_amount: Optional[float] = None
    size_breakdown_target: Optional[Dict[str, int]] = None
    bom_accessories: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    deadline: Optional[date] = None

class SalesOrderResponse(SalesOrderBase):
    id: str
    status: Optional[str] = "REGISTERED"
    created_at: Optional[datetime] = None
    buyer_name: Optional[str] = None

    class Config:
        from_attributes = True


# ===========================================================================
# 3. WAREHOUSE & FABRIC INSPECTION (QC 4-POINT ASTM)
# ===========================================================================
class InventoryItemCreate(BaseModel):
    item_code: str
    description: str
    item_type: str # FABRIC_MAIN, PURING, INTERLINING, TRIMS_ACCESSORY
    unit: Optional[str] = "YARD"
    unit_price: Optional[float] = 0.0
    current_stock: Optional[float] = 0.0
    color_shade_lot: Optional[str] = None
    width_inch: Optional[float] = 58.0
    gramasi_gsm: Optional[float] = 0.0
    min_stock_alert: Optional[float] = 50.0
    rack_location: Optional[str] = "GUDANG_UTAMA"

class InventoryItemResponse(BaseModel):
    id: str
    item_code: Optional[str] = ""
    description: Optional[str] = ""
    item_type: Optional[str] = "FABRIC_MAIN"
    unit: Optional[str] = "YARD"
    unit_price: Optional[float] = 0.0
    current_stock: Optional[float] = 0.0
    color_shade_lot: Optional[str] = None
    width_inch: Optional[float] = 58.0
    gramasi_gsm: Optional[float] = 0.0
    min_stock_alert: Optional[float] = 50.0
    rack_location: Optional[str] = "GUDANG_UTAMA"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MaterialReceiptCreate(BaseModel):
    item_id: str
    supplier_id: Optional[str] = None
    receipt_date: date
    roll_number: Optional[str] = None
    qty_received: float
    unit: Optional[str] = "YARD"
    contract_type: Optional[str] = "FOB" # FOB / CMT

class MaterialReceiptUpdate(BaseModel):
    item_id: Optional[str] = None
    supplier_id: Optional[str] = None
    receipt_date: Optional[date] = None
    roll_number: Optional[str] = None
    qty_received: Optional[float] = None
    unit: Optional[str] = None
    contract_type: Optional[str] = None

class MaterialReceiptResponse(BaseModel):
    id: str
    item_id: Optional[str] = None
    supplier_id: Optional[str] = None
    receipt_date: Optional[date] = None
    roll_number: Optional[str] = None
    qty_received: Optional[float] = 0.0
    unit: Optional[str] = "YARD"
    contract_type: Optional[str] = "FOB"
    inspection_status: Optional[str] = "PENDING"
    item_description: Optional[str] = None
    supplier_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FabricInspectionCreate(BaseModel):
    receipt_id: str
    inspection_date: date
    lot_number: Optional[str] = None
    length_before: float
    length_after: float
    width_inch: float
    total_defect_points: int = 0
    defect_remarks: Optional[str] = None

class FabricInspectionUpdate(BaseModel):
    lot_number: Optional[str] = None
    length_before: Optional[float] = None
    length_after: Optional[float] = None
    width_inch: Optional[float] = None
    total_defect_points: Optional[int] = None
    defect_remarks: Optional[str] = None

class FabricInspectionResponse(BaseModel):
    id: str
    receipt_id: Optional[str] = None
    inspector_id: Optional[str] = None
    inspector_name: Optional[str] = None
    inspection_date: Optional[date] = None
    lot_number: Optional[str] = None
    length_before: Optional[float] = 0.0
    length_after: Optional[float] = 0.0
    width_inch: Optional[float] = 0.0
    total_defect_points: Optional[int] = 0
    summary_point: Optional[float] = 0.0
    grade: Optional[str] = "GRADE_A"
    defect_remarks: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MaterialAllocationCreate(BaseModel):
    so_id: str
    item_id: str
    dispatch_date: date
    qty_issued: float
    surat_jalan_no: Optional[str] = None

class MaterialAllocationResponse(BaseModel):
    id: str
    so_id: Optional[str] = None
    item_id: Optional[str] = None
    dispatch_date: Optional[date] = None
    qty_issued: Optional[float] = 0.0
    surat_jalan_no: Optional[str] = None
    so_number: Optional[str] = None
    item_description: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===========================================================================
# 4. CUTTING, CONSUMPTION & PREPARATION WAGES
# ===========================================================================
class CuttingRecordCreate(BaseModel):
    so_id: str
    operator_id: Optional[str] = None
    cutting_date: date
    qty_cut: int
    size_breakdown_cut: Optional[Dict[str, int]] = {}
    main_fabric_used: float
    puring_used: Optional[float] = 0.0
    puring_jala_used: Optional[float] = 0.0
    marker_length_yard: Optional[float] = 0.0
    marker_efficiency_pct: Optional[float] = 0.0
    gelaran_layers: Optional[int] = 1
    fabric_waste_yards: Optional[float] = 0.0

class CuttingRecordUpdate(BaseModel):
    operator_id: Optional[str] = None
    cutting_date: Optional[date] = None
    qty_cut: Optional[int] = None
    size_breakdown_cut: Optional[Dict[str, int]] = None
    main_fabric_used: Optional[float] = None
    puring_used: Optional[float] = None
    puring_jala_used: Optional[float] = None
    marker_length_yard: Optional[float] = None
    marker_efficiency_pct: Optional[float] = None
    gelaran_layers: Optional[int] = None
    fabric_waste_yards: Optional[float] = None

class CuttingRecordResponse(BaseModel):
    id: str
    so_id: Optional[str] = None
    operator_id: Optional[str] = None
    operator_name: Optional[str] = None
    cutting_date: Optional[date] = None
    qty_cut: Optional[int] = 0
    size_breakdown_cut: Optional[Dict[str, int]] = {}
    main_fabric_used: Optional[float] = 0.0
    puring_used: Optional[float] = 0.0
    puring_jala_used: Optional[float] = 0.0
    marker_length_yard: Optional[float] = 0.0
    marker_efficiency_pct: Optional[float] = 0.0
    gelaran_layers: Optional[int] = 1
    fabric_waste_yards: Optional[float] = 0.0
    main_consumption_rate: Optional[float] = 0.0
    puring_consumption_rate: Optional[float] = 0.0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CuttingPrepTaskCreate(BaseModel):
    so_id: str
    operator_id: str = Field(..., min_length=1)  # wajib — divalidasi lebih lanjut oleh resolve_worker()
    task_type: str # NUMBERING / PRESS_INTERLINING
    task_date: date
    qty_done: int = Field(..., gt=0)
    size_breakdown: Optional[Dict[str, int]] = {}
    piece_rate: float = Field(0.0, ge=0)

class CuttingPrepTaskUpdate(BaseModel):
    operator_id: Optional[str] = None
    task_type: Optional[str] = None
    task_date: Optional[date] = None
    qty_done: Optional[int] = None
    size_breakdown: Optional[Dict[str, int]] = None
    piece_rate: Optional[float] = None

class CuttingPrepTaskResponse(BaseModel):
    id: str
    so_id: Optional[str] = None
    operator_id: Optional[str] = None
    operator_name: Optional[str] = None
    task_type: Optional[str] = "NUMBERING"
    task_date: Optional[date] = None
    qty_done: Optional[int] = 0
    size_breakdown: Optional[Dict[str, int]] = {}
    piece_rate: Optional[float] = 0.0
    total_wage: Optional[float] = 0.0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===========================================================================
# 5. SEQUENTIAL WIP SUBCON MOVEMENTS & RECONCILIATION
# ===========================================================================
class WIPDispatchCreate(BaseModel):
    so_id: str
    stage_name: str # PRINT_MENTAH, EMBROIDERY_MENTAH, SEWING_INTERNAL, SEWING_MAKLUN, WASHING, EMBROIDERY_JADI, FINISHING
    sequence_order: Optional[int] = 1
    partner_id: Optional[str] = None # Subcon vendor ID jika maklun
    surat_jalan_no: Optional[str] = None
    dispatch_date: date
    qty_dispatched: int
    size_breakdown_dispatched: Optional[Dict[str, int]] = {}
    remarks: Optional[str] = None

class WIPReceiveCreate(BaseModel):
    received_date: date
    qty_received: int
    qty_reject: Optional[int] = 0
    size_breakdown_received: Optional[Dict[str, int]] = {}
    defect_reason: Optional[str] = None
    remarks: Optional[str] = None
    is_partial: Optional[bool] = False  # True = sisa barang menyusul (bukan selisih hilang)

class WIPMovementUpdate(BaseModel):
    surat_jalan_no: Optional[str] = None
    partner_id: Optional[str] = None
    qty_dispatched: Optional[int] = None
    size_breakdown_dispatched: Optional[Dict[str, int]] = None
    qty_received: Optional[int] = None
    qty_reject: Optional[int] = None
    size_breakdown_received: Optional[Dict[str, int]] = None
    remarks: Optional[str] = None
    status: Optional[str] = None

class WIPMovementResponse(BaseModel):
    id: str
    so_id: str
    so_number: Optional[str] = None
    style_name: Optional[str] = None
    stage_name: Optional[str] = "SEWING"
    sequence_order: Optional[int] = 1
    partner_id: Optional[str] = None
    partner_name: Optional[str] = None
    supervisor_id: Optional[str] = None
    supervisor_name: Optional[str] = None
    surat_jalan_no: Optional[str] = None
    dispatch_date: Optional[date] = None
    qty_dispatched: Optional[int] = 0
    size_breakdown_dispatched: Optional[Dict[str, int]] = {}
    received_date: Optional[date] = None
    qty_received: Optional[int] = 0
    qty_reject: Optional[int] = 0
    size_breakdown_received: Optional[Dict[str, int]] = {}
    balance_discrepancy: Optional[int] = 0
    status: Optional[str] = "IN_PROCESS"
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===========================================================================
# 6. FINISHING BORONGAN, SHIPPING & BILLING FORM WI
# ===========================================================================
class PieceRateWageCreate(BaseModel):
    so_id: str
    operator_id: str = Field(..., min_length=1)  # wajib — divalidasi lebih lanjut oleh resolve_worker()
    operation_type: str # JAHIT_SEWING, OBRAS, STIM, LUBANG_KANCING, PASANG_KANCING, BUANG_BENANG, LIPAT, PACKING, PRESS_INTERLINING, POTONG_POLA
    work_date: date
    qty_completed: int = Field(..., gt=0)
    qty_reject: int = Field(0, ge=0)
    size_breakdown: Optional[dict] = {}
    wage_per_piece: float = Field(..., ge=0)  # e.g. 550 or 2500
    notes: Optional[str] = None

class PieceRateWageUpdate(BaseModel):
    operator_id: Optional[str] = None
    operation_type: Optional[str] = None
    work_date: Optional[date] = None
    qty_completed: Optional[int] = None
    qty_reject: Optional[int] = None
    size_breakdown: Optional[dict] = None
    wage_per_piece: Optional[float] = None
    notes: Optional[str] = None

class PieceRateWageResponse(BaseModel):
    id: str
    so_id: Optional[str] = None
    operator_id: Optional[str] = None
    operator_name: Optional[str] = None
    operation_type: Optional[str] = "STIM"
    work_date: Optional[date] = None
    qty_completed: Optional[int] = 0
    qty_reject: Optional[int] = 0
    size_breakdown: Optional[dict] = {}
    wage_per_piece: Optional[float] = 0.0
    total_wage: Optional[float] = 0.0
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ShipmentCreate(BaseModel):
    so_id: str
    shipment_date: date
    surat_jalan_no: str # SJP-2608.0001
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    vehicle_plate_no: Optional[str] = None
    carton_box_count: Optional[int] = 0
    destination_address: Optional[str] = None
    total_qty_shipped: int
    size_breakdown_shipped: Optional[Dict[str, int]] = {}
    unit_price: float
    invoice_number: Optional[str] = None
    remarks: Optional[str] = None

class ShipmentUpdate(BaseModel):
    shipment_date: Optional[date] = None
    surat_jalan_no: Optional[str] = None
    driver_name: Optional[str] = None
    vehicle_plate_no: Optional[str] = None
    carton_box_count: Optional[int] = None
    destination_address: Optional[str] = None
    total_qty_shipped: Optional[int] = None
    size_breakdown_shipped: Optional[Dict[str, int]] = None
    unit_price: Optional[float] = None
    invoice_number: Optional[str] = None
    remarks: Optional[str] = None

class ShipmentResponse(BaseModel):
    id: str
    so_id: Optional[str] = None
    shipment_date: Optional[date] = None
    surat_jalan_no: Optional[str] = "-"
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    vehicle_plate_no: Optional[str] = None
    carton_box_count: Optional[int] = 0
    destination_address: Optional[str] = None
    total_qty_shipped: Optional[int] = 0
    size_breakdown_shipped: Optional[Dict[str, int]] = {}
    unit_price: Optional[float] = 0.0
    total_invoice_amount: Optional[float] = 0.0
    invoice_number: Optional[str] = None
    is_invoiced: Optional[bool] = False
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===========================================================================
# 7. MASTER CONTROL TOWER (LIVE WIP MATRIX TELEMETRY)
# ===========================================================================
class WIPMatrixRow(BaseModel):
    so_id: str
    so_number: str
    buyer_name: Optional[str] = "UMUM"
    style_name: Optional[str] = "-"
    item_category: Optional[str] = "LONG JEANS"
    order_qty: Optional[int] = 0
    qty_cutting: Optional[int] = 0
    qty_print_mentah: Optional[int] = 0
    qty_bordir_mentah: Optional[int] = 0
    qty_kirim_jahit: Optional[int] = 0
    qty_setor_jahit: Optional[int] = 0
    qty_washing: Optional[int] = 0
    qty_finishing: Optional[int] = 0
    qty_shipped: Optional[int] = 0
    qty_reject_total: Optional[int] = 0
    balance_discrepancy_total: Optional[int] = 0
    status_wip: Optional[str] = "REGISTERED"

    class Config:
        from_attributes = True

