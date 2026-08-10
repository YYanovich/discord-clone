export declare enum OutboxStatus {
    PENDING = "PENDING",
    PUBLISHED = "PUBLISHED",
    FAILED = "FAILED"
}
export declare class OutboxEvent {
    id: string;
    topic: string;
    payload: Record<string, unknown>;
    status: OutboxStatus;
    errorMessage: string | null;
    createdAt: Date;
    publishedAt: Date | null;
}
