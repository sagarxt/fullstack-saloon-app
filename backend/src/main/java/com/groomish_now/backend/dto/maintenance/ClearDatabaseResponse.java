package com.groomish_now.backend.dto.maintenance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClearDatabaseResponse {
    private boolean success;
    private String message;
    private Map<String, Integer> clearedCounts;
}
