import EventEmitter from "events";
import logger from "../utils/logger.js";
import {
        notifyDrivers,
        sendVoucherAndInvoice,
        sendPaymentStatusNotification,
        sendReminderNotifications,
        syncWithOperationalSystems,
        syncWithCRM,
} from "./notificationService.js";

class TaskQueue extends EventEmitter {
        constructor() {
                super();
                this.queue = [];
                this.handlers = new Map();
                this.processing = false;
        }

        register(type, handler) {
                this.handlers.set(type, handler);
        }

        enqueue(type, payload) {
                this.queue.push({
                        type,
                        payload,
                        enqueuedAt: new Date(),
                });
                this.processNext();
        }

        async processNext() {
                if (this.processing) {
                        return;
                }

                this.processing = true;
                while (this.queue.length > 0) {
                        const task = this.queue.shift();
                        const handler = this.handlers.get(task.type);

                        if (!handler) {
                                logger.warn({ task }, "No existe handler para la tarea");
                                continue;
                        }

                        try {
                                this.emit("task:start", task);
                                await handler(task.payload);
                                this.emit("task:success", task);
                        } catch (error) {
                                this.emit("task:error", { task, error });
                        }
                }
                this.processing = false;
        }
}

const taskQueue = new TaskQueue();

taskQueue.on("task:start", (task) => {
        logger.debug({ type: task.type }, "Procesando tarea interna");
});

taskQueue.on("task:success", (task) => {
        logger.debug({ type: task.type }, "Tarea interna completada");
});

taskQueue.on("task:error", ({ task, error }) => {
        logger.error({ type: task.type, error }, "Error ejecutando tarea interna");
});

const registerDefaultHandlers = () => {
        taskQueue.register("NOTIFY_DRIVER", notifyDrivers);
        taskQueue.register("SYNC_OPERATIONS", syncWithOperationalSystems);
        taskQueue.register("SYNC_CRM", syncWithCRM);
        taskQueue.register("SEND_VOUCHER", sendVoucherAndInvoice);
        taskQueue.register("SEND_PAYMENT_UPDATE", sendPaymentStatusNotification);
        taskQueue.register("SEND_REMINDER", sendReminderNotifications);
};

registerDefaultHandlers();

export const enqueueInternalTask = (type, payload) => taskQueue.enqueue(type, payload);

export default taskQueue;
