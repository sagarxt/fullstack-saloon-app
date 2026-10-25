package com.groomish_now.backend.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyMetricDto {
    private String date; // YYYY-MM-DD
    private String label; // e.g. "Mon, 12 Oct"
    private long bookingsCount;
    private long completedCount;
    private long cancelledCount;
    private double revenue;
}
