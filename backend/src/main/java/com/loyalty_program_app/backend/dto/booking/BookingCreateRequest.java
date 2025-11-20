package com.loyalty_program_app.backend.dto.booking;

// package com.loyalty_program_app.backend.dto.booking;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class BookingCreateRequest {
    private UUID serviceId;
    private String note;
    // send from frontend as "yyyy-MM-dd'T'HH:mm" (datetime-local)
    private LocalDateTime scheduledAt;
}
