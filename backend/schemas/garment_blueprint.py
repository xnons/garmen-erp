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

class PartnerResponse(PartnerBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===========================================================================
# 2. PPIC & SALES ORDERS (SO-MG26xxxx)
# ===========================================================================
class SalesOrderBase(BaseModel):
    so_number: str
    buyer_id: Optional[str] = None
    style_name: str
    item_category: Optional[str] = "LONG JEANS"
    color: Optional[str] = None
    order_qty: int
    unit_price: Optional[float] = 0.0
    size_breakdown_target: Optional[Dict[str, int]] = {}
    bom_accessories: Optional[List[Dict[str, Any]]] = []
    order_date: Optional[date] = None
    deadline: Optional[date] = None

class SalesOrderCreate(SalesOrderBase):
    pass

class SalesOrderUpdate(BaseModel):
    style_name: Optional[str] = None
    item_category: Optional[str] = None
    color: Optional[str] = None
    order_qty: Optional[int] = None
    unit_price: Optional[float] = None
    size_breakdown_target: Optional[Dict[str, int]] = None
    bom_accessories: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    deadline: Optional[date] = None

class SalesOrderResponse(SalesOrderBase):
    id: str
    status: str
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

class InventoryItemResponse(InventoryItemCreate):
    id: str
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

class MaterialReceiptResponse(MaterialReceiptCreate):
    id: str
    inspection_status: str
    item_description: Optional[str] = None
    supplier_name: Optional[str] = None
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

class FabricInspectionResponse(BaseModel):
    id: str
    receipt_id: str
    inspector_id: Optional[str] = None
    inspector_name: Optional[str] = None
    inspection_date: date
    lot_number: Optional[str] = None
    length_before: float
    length_after: float
    width_inch: float
    total_defect_points: int
    summary_point: float
    grade: str # GRADE_A, GRADE_B, GRADE_C
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

class MaterialAllocationResponse(MaterialAllocationCreate):
    id: str
    so_number: Optional[str] = None
    item_description: Optional[str] = None
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

class CuttingRecordResponse(CuttingRecordCreate):
    id: str
    operator_id: Optional[str] = None
    operator_name: Optional[str] = None
    main_consumption_rate: float
    puring_consumption_rate: float
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class CuttingPrepTaskCreate(BaseModel):
    so_id: str
    operator_id: Optional[str] = None
    task_type: str # NUMBERING / PRESS_INTERLINING
    task_date: date
    qty_done: int
    size_breakdown: Optional[Dict[str, int]] = {}
    piece_rate: Optional[float] = 0.0

class CuttingPrepTaskResponse(CuttingPrepTaskCreate):
    id: str
    operator_id: Optional[str] = None
    operator_name: Optional[str] = None
    total_wage: float
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

class WIPMovementResponse(BaseModel):
    id: str
    so_id: str
    so_number: Optional[str] = None
    style_name: Optional[str] = None
    stage_name: str
    sequence_order: int
    partner_id: Optional[str] = None
    partner_name: Optional[str] = None
    supervisor_id: Optional[str] = None
    supervisor_name: Optional[str] = None
    surat_jalan_no: Optional[str] = None
    dispatch_date: date
    qty_dispatched: int
    size_breakdown_dispatched: Optional[Dict[str, int]] = {}
    received_date: Optional[date] = None
    qty_received: int
    qty_reject: int
    size_breakdown_received: Optional[Dict[str, int]] = {}
    balance_discrepancy: int
    status: str
    remarks: Optional[str] = None
    class Config:
        from_attributes = True


# ===========================================================================
# 6. FINISHING BORONGAN, SHIPPING & BILLING FORM WI
# ===========================================================================
class PieceRateWageCreate(BaseModel):
    so_id: str
    operator_id: Optional[str] = None
    operation_type: str # JAHIT_SEWING, OBRAS, STIM, LUBANG_KANCING, PASANG_KANCING, BUANG_BENANG, LIPAT, PACKING, PRESS_INTERLINING, POTONG_POLA
    work_date: date
    qty_completed: int
    qty_reject: Optional[int] = 0
    size_breakdown: Optional[dict] = {}
    wage_per_piece: float # e.g. 550 or 2500
    notes: Optional[str] = None

class PieceRateWageResponse(PieceRateWageCreate):
    id: str
    operator_id: Optional[str] = None
    operator_name: Optional[str] = None
    total_wage: float
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

class ShipmentResponse(ShipmentCreate):
    id: str
    total_invoice_amount: float
    is_invoiced: bool
    class Config:
        from_attributes = True


# ===========================================================================
# 7. MASTER CONTROL TOWER (LIVE WIP MATRIX TELEMETRY)
# ===========================================================================
class WIPMatrixRow(BaseModel):
    so_id: str
    so_number: str
    buyer_name: str
    style_name: str
    item_category: str
    order_qty: int
    qty_cutting: int
    qty_print_mentah: int
    qty_bordir_mentah: int
    qty_kirim_jahit: int
    qty_setor_jahit: int
    qty_washing: int
    qty_finishing: int
    qty_shipped: int
    qty_reject_total: int
    balance_discrepancy_total: int
    status_wip: str
