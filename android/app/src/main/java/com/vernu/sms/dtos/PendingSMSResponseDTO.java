package com.vernu.sms.dtos;

import com.vernu.sms.models.SMSPayload;
import java.util.List;

public class PendingSMSResponseDTO {
    public PendingSMSData data;

    public static class PendingSMSData {
        public int count;
        public List<SMSPayload> messages;
    }
}
