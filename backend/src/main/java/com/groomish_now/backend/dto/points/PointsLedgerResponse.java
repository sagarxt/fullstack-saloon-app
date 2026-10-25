package com.groomish_now.backend.dto.points;

import lombok.Data;

import java.util.UUID;

@Data
public class PointsLedgerResponse {
    private UUID id;
    private UUID userId;
    private String userName;
    private Integer changeAmount;
    private String reason;
    private String note;
    private UUID relatedId;
    private UUID bookingId;
    private String bookingCode;
    private String serviceName;
    private Double orderAmount;
    private String voucherCode;
    private String voucherTitle;
    private String createdAt;
}
