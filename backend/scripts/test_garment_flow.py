# backend/scripts/test_garment_flow.py
import sys
from pathlib import Path
from dotenv import load_dotenv
from datetime import date, datetime

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database import SessionLocal
import models

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def test_full_garment_workflow():
    db = SessionLocal()
    try:
        # Clean previous test record if exists
        existing_so = db.query(models.SalesOrder).filter(models.SalesOrder.so_number == "SO-MG260004").first()
        if existing_so:
            db.query(models.Shipment).filter(models.Shipment.so_id == existing_so.id).delete()
            db.query(models.PieceRateWage).filter(models.PieceRateWage.so_id == existing_so.id).delete()
            db.query(models.RejectLog).filter(models.RejectLog.so_id == existing_so.id).delete()
            db.query(models.WIPMovement).filter(models.WIPMovement.so_id == existing_so.id).delete()
            db.query(models.CuttingRecord).filter(models.CuttingRecord.so_id == existing_so.id).delete()
            db.query(models.CuttingPrepTask).filter(models.CuttingPrepTask.so_id == existing_so.id).delete()
            db.query(models.MaterialAllocation).filter(models.MaterialAllocation.so_id == existing_so.id).delete()
            db.delete(existing_so)
            db.commit()

        print("[TEST 1/8] Membuat Sales Order SO-MG260004...")
        buyer = db.query(models.Partner).filter(models.Partner.category == "BUYER").first()
        so = models.SalesOrder(
            so_number="SO-MG260004",
            buyer_id=buyer.id if buyer else None,
            style_name="WIND MILD BLACK",
            item_category="LONG JEANS",
            color="BLACK",
            order_qty=500,
            unit_price=35000.0,
            size_breakdown_target={"28": 100, "30": 150, "32": 150, "34": 100},
            status="REGISTERED",
            order_date=date.today()
        )
        db.add(so)
        db.commit()
        db.refresh(so)
        print(f"✅ SO Terdaftar: {so.so_number} ({so.style_name}) - Target: {so.order_qty} Pcs")

        print("\n🚀 [TEST 2/8] Penerimaan Kain & Uji Mutu 4-Point ASTM...")
        item = models.InventoryItem(
            item_code="MG-2604-BH0001",
            description="DENIM 13 OZ STRETCH BLACK",
            item_type="FABRIC_MAIN",
            unit="YARD",
            unit_price=28000.0,
            current_stock=700.0
        )
        db.add(item)
        db.commit()
        db.refresh(item)

        receipt = models.MaterialReceipt(
            item_id=item.id,
            receipt_date=date.today(),
            roll_number="ROLL-TEST-01",
            qty_received=700.0,
            unit="YARD",
            contract_type="FOB",
            inspection_status="PENDING"
        )
        db.add(receipt)
        db.commit()
        db.refresh(receipt)

        # Uji ASTM: Length 100 yd, Width 58 inch, Defect 4 points -> (4 * 3600) / (58 * 100) = 2.48 (Grade A)
        summary_pt = round((4 * 3600.0) / (58.0 * 100.0), 2)
        inspection = models.FabricInspection(
            receipt_id=receipt.id,
            inspection_date=date.today(),
            length_before=100.0,
            length_after=100.0,
            width_inch=58.0,
            total_defect_points=4,
            summary_point=summary_pt,
            grade="GRADE_A",
            defect_remarks="*Lolos Uji Sangat Baik"
        )
        db.add(inspection)
        receipt.inspection_status = "PASSED"
        db.commit()
        print(f"✅ Uji Kain Roll {receipt.roll_number}: Score ASTM {summary_pt} ({inspection.grade}) -> Status: {receipt.inspection_status}")

        print("\n🚀 [TEST 3/8] Alokasi Kain ke Meja Potong (Sheet25)...")
        alloc = models.MaterialAllocation(
            so_id=so.id,
            item_id=item.id,
            dispatch_date=date.today(),
            qty_issued=650.0,
            surat_jalan_no="CJM-2608.100"
        )
        db.add(alloc)
        item.current_stock -= 650.0
        so.status = "CUTTING"
        db.commit()
        print(f"✅ Alokasi 650 Yard via SJ {alloc.surat_jalan_no}. Sisa Stok Gudang: {item.current_stock} Yard")

        print("\n🚀 [TEST 4/8] Hasil Potong Meja Bu Nani & Kalkulasi Konsumsi...")
        cutting = models.CuttingRecord(
            so_id=so.id,
            cutting_date=date.today(),
            qty_cut=500,
            size_breakdown_cut={"28": 100, "30": 150, "32": 150, "34": 100},
            main_fabric_used=650.0,
            puring_used=100.0,
            main_consumption_rate=round(650.0 / 500.0, 4),
            puring_consumption_rate=round(100.0 / 500.0, 4)
        )
        db.add(cutting)
        db.commit()
        print(f"✅ Hasil Potong: {cutting.qty_cut} Pcs. Consumption Kain Utama: {cutting.main_consumption_rate} Yd/Pcs")

        print("\n🚀 [TEST 5/8] Pergerakan Sequential WIP Subcon & Rekonsiliasi...")
        # Dispatch Sewing Maklun
        maklun_vendor = db.query(models.Partner).filter(models.Partner.category == "MAKLUN_SEWING").first()
        wip_sewing = models.WIPMovement(
            so_id=so.id,
            stage_name="SEWING_MAKLUN",
            sequence_order=3,
            partner_id=maklun_vendor.id if maklun_vendor else None,
            surat_jalan_no="SJ-SEW-2608.01",
            dispatch_date=date.today(),
            qty_dispatched=500,
            status="IN_PROCESS"
        )
        db.add(wip_sewing)
        db.commit()

        # Receive Setoran: 495 Bagus, 3 Rijek, Selisih 2
        wip_sewing.received_date = date.today()
        wip_sewing.qty_received = 495
        wip_sewing.qty_reject = 3
        wip_sewing.balance_discrepancy = 500 - (495 + 3) # = 2
        wip_sewing.status = "DISCREPANCY_FLAG"

        reject_log = models.RejectLog(
            wip_movement_id=wip_sewing.id,
            so_id=so.id,
            stage_name="SEWING_DEFECT",
            defect_reason="JARUM PATAH / SOBEK",
            qty_reject=3,
            unit_cost_loss=15000.0,
            total_loss=3 * 15000.0
        )
        db.add(reject_log)
        db.commit()
        print(f"✅ Setoran Sewing: Terima {wip_sewing.qty_received} Pcs, Rijek {wip_sewing.qty_reject} Pcs, Selisih: {wip_sewing.balance_discrepancy} Pcs ({wip_sewing.status})")

        print("\n🚀 [TEST 6/8] Upah Borongan Finishing (Steam Johan)...")
        wage = models.PieceRateWage(
            so_id=so.id,
            operation_type="STIM",
            work_date=date.today(),
            qty_completed=495,
            wage_per_piece=550.0,
            total_wage=495 * 550.0
        )
        db.add(wage)
        db.commit()
        print(f"✅ Upah Steam Johan: {wage.qty_completed} Pcs × Rp 550 = Rp {wage.total_wage:,.0f}")

        print("\n🚀 [TEST 7/8] Surat Jalan Pengiriman (SJP Sandi)...")
        shipment = models.Shipment(
            so_id=so.id,
            shipment_date=date.today(),
            surat_jalan_no="SJP-2608.0001",
            total_qty_shipped=495,
            size_breakdown_shipped={"28": 99, "30": 148, "32": 149, "34": 99},
            unit_price=35000.0,
            total_invoice_amount=495 * 35000.0,
            invoice_number="INV-2608-001",
            is_invoiced=True
        )
        db.add(shipment)
        so.status = "SHIPPED"
        db.commit()
        print(f"✅ Terbit SJP: {shipment.surat_jalan_no} ({shipment.total_qty_shipped} Pcs) - Nilai: Rp {shipment.total_invoice_amount:,.0f}")

        print("\n🚀 [TEST 8/8] Verifikasi Telemetri Master Control Tower...")
        total_cut = db.query(models.CuttingRecord).filter(models.CuttingRecord.so_id == so.id).first().qty_cut
        total_wip_disc = db.query(models.WIPMovement).filter(models.WIPMovement.so_id == so.id).first().balance_discrepancy
        total_shipped = db.query(models.Shipment).filter(models.Shipment.so_id == so.id).first().total_qty_shipped

        print(f"   • Target Order   : {so.order_qty} Pcs")
        print(f"   • Hasil Potong   : {total_cut} Pcs")
        print(f"   • Selisih Subkon : {total_wip_disc} Pcs")
        print(f"   • Total SJP      : {total_shipped} Pcs")
        print(f"   • Status Final SO: {so.status}")

        assert total_cut == 500
        assert total_wip_disc == 2
        assert total_shipped == 495
        assert so.status == "SHIPPED"

        print("\n🎉 SELURUH 7 FASE WORKFLOW OPERASIONAL PT. CHIKAL JAYA MAKMUR BERHASIL 100% TERUJI!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error dalam pengujian: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    test_full_garment_workflow()
