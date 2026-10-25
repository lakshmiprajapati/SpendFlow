
import Notification from "../models/Notification.js";

export const createNotification = async ({
  recipientId,
  actorId = null,
  type,
  title,
  message,
  entityId = null,
}) => {
  if (!recipientId) {
    return null;
  }

  return Notification.create({
    recipientId,
    actorId,
    type,
    title,
    message,
    entityType: "PurchaseRequest",
    entityId,
  });
};
