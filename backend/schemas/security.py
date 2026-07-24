from pydantic import BaseModel, Field


# 🟢 1. Schema untuk Request Verifikasi PIN (/verify-pin)
class PinVerifySchema(BaseModel):
    pin: str = Field(..., min_length=4, max_length=6, description="PIN Security Gate 4-6 digit")


# 🟢 2. Schema untuk Request Ubah PIN (/update-pin)
class PinUpdateSchema(BaseModel):
    old_pin: str = Field(..., min_length=4, max_length=6, description="PIN Master saat ini")
    new_pin: str = Field(..., min_length=4, max_length=6, description="PIN Master baru (4-6 digit)")


# 🔗 Alias agar jika ada file lain memanggil UpdatePinSchema tetap bisa jalan
UpdatePinSchema = PinUpdateSchema