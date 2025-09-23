import crypto from "crypto";
import mongoose from "mongoose";

const { Schema } = mongoose;

const passengerSchema = new Schema(
        {
                fullName: { type: String, required: true },
                documentId: String,
                email: String,
                phone: String,
                notes: String,
        },
        { _id: false }
);

const extraSchema = new Schema(
        {
                name: { type: String, required: true },
                quantity: { type: Number, default: 1 },
                price: { type: Number, default: 0 },
                description: String,
        },
        { _id: false }
);

const discountSchema = new Schema(
        {
                code: String,
                description: String,
                amount: { type: Number, default: 0 },
                percentage: Number,
        },
        { _id: false }
);

const totalsSchema = new Schema(
        {
                baseAmount: { type: Number, default: 0 },
                extrasAmount: { type: Number, default: 0 },
                discountAmount: { type: Number, default: 0 },
                grandTotal: { type: Number, default: 0 },
                currency: { type: String, default: "CLP" },
        },
        { _id: false }
);

const statusHistorySchema = new Schema(
        {
                status: { type: String, required: true },
                updatedAt: { type: Date, default: Date.now },
                updatedBy: { type: String, default: "system" },
                notes: String,
        },
        { _id: false }
);

const auditTrailSchema = new Schema(
        {
                action: { type: String, required: true },
                performedBy: { type: String, default: "system" },
                performedAt: { type: Date, default: Date.now },
                notes: String,
                metadata: Schema.Types.Mixed,
        },
        { _id: false }
);

const bookingSchema = new Schema(
        {
                reference: {
                        type: String,
                        default: () =>
                                `BK-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
                        unique: true,
                        index: true,
                },
                trip: {
                        origin: { type: String, required: true },
                        destination: { type: String, required: true },
                        departure: { type: Date, required: true },
                        return: Date,
                        vehicleType: { type: String, required: true },
                        vehicleCapacity: Number,
                        estimatedDurationMinutes: Number,
                        pickupInstructions: String,
                        dropoffInstructions: String,
                },
                extras: [extraSchema],
                passengers: [passengerSchema],
                totals: totalsSchema,
                paymentStatus: {
                        type: String,
                        enum: ["pending", "approved", "rejected", "refunded", "cancelled"],
                        default: "pending",
                        index: true,
                },
                lifecycleStatus: {
                        type: String,
                        enum: [
                                "draft",
                                "pending",
                                "confirmed",
                                "in_progress",
                                "completed",
                                "cancelled",
                        ],
                        default: "pending",
                        index: true,
                },
                discounts: [discountSchema],
                contact: {
                        name: String,
                        email: String,
                        phone: String,
                        company: String,
                },
                assignedDriver: {
                        name: String,
                        email: String,
                        phone: String,
                        vehicleIdentifier: String,
                },
                notes: String,
                statusHistory: [statusHistorySchema],
                auditTrail: [auditTrailSchema],
                selfServiceToken: {
                        type: String,
                        default: () => crypto.randomBytes(16).toString("hex"),
                        index: true,
                },
                metadata: Schema.Types.Mixed,
        },
        {
                timestamps: true,
        }
);

bookingSchema.index({ "trip.vehicleType": 1, "trip.departure": 1 });
bookingSchema.index({ lifecycleStatus: 1, paymentStatus: 1 });

bookingSchema.virtual("passengerCount").get(function () {
        return this.passengers ? this.passengers.length : 0;
});

bookingSchema.set("toJSON", { virtuals: true });
bookingSchema.set("toObject", { virtuals: true });

bookingSchema.methods.recordStatus = function (status, options = {}) {
        this.statusHistory.push({
                status,
                updatedAt: options.at || new Date(),
                updatedBy: options.updatedBy || options.performedBy || "system",
                notes: options.notes,
        });
};

bookingSchema.methods.recordAudit = function (action, options = {}) {
        this.auditTrail.push({
                action,
                performedBy: options.performedBy || "system",
                performedAt: options.at || new Date(),
                notes: options.notes,
                metadata: options.metadata,
        });
};

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
